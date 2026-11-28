-- Diloul Chess: initial schema for phase 0 (SPEC §13).
-- Only the tables the guest → account migration needs now; games, puzzles, reports, etc.
-- arrive with their phases. RLS is on for every table: each player reads and writes only
-- their own rows. Roles cannot be changed by players.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text check (username is null or char_length(username) between 2 and 40),
  locale text not null default 'ar' check (locale in ('ar', 'fr')),
  timezone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  onboarding_level text check (onboarding_level in ('none', 'rules', 'r800', 'r1200', 'r1600')),
  onboarded_at timestamptz,
  basics_chapter smallint check (basics_chapter between 1 and 9),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per player, created automatically on sign-up.';

-- A profile row is created for every new auth user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Players may edit their profile but never their role.
create function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and current_user in ('authenticated', 'anon') then
    raise exception 'role cannot be changed by the player';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Used by admin policies (SPEC §19.4). security definer so it can read profiles under RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- linked chess accounts (SPEC §11.1)
-- ---------------------------------------------------------------------------
create table public.linked_accounts (
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('chesscom', 'lichess')),
  username text not null check (username ~ '^[A-Za-z0-9_-]{2,30}$'),
  last_synced_at timestamptz,
  primary key (user_id, provider)
);

-- ---------------------------------------------------------------------------
-- ranks per area (SPEC §5.2)
-- ---------------------------------------------------------------------------
create table public.area_ranks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  area text not null check (area in ('openings', 'endgames', 'puzzles')),
  rank smallint not null default 0 check (rank between 0 and 6),
  updated_at timestamptz not null default now(),
  primary key (user_id, area)
);

-- ---------------------------------------------------------------------------
-- completed path nodes: basics ('basics'), openings ('opening:{id}'), endgames ('endgame')
-- (one table instead of basics_progress + course_progress in the SPEC sketch)
-- ---------------------------------------------------------------------------
create table public.course_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course text not null check (char_length(course) between 1 and 80),
  node_id text not null check (char_length(node_id) between 1 and 120),
  stars smallint not null default 0 check (stars between 0 and 3),
  completed_at timestamptz not null default now(),
  primary key (user_id, course, node_id)
);

-- ---------------------------------------------------------------------------
-- spaced repetition cards (SPEC §10)
-- ---------------------------------------------------------------------------
create table public.srs_cards (
  id text not null check (char_length(id) between 1 and 200),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('opening', 'mistake')),
  ref text not null,
  fen text not null,
  answer_uci text not null check (answer_uci ~ '^[a-h][1-8][a-h][1-8][qrbn]?$'),
  fsrs jsonb not null default '{}'::jsonb,
  due timestamptz not null default now(),
  last_review timestamptz,
  primary key (user_id, id)
);

create index srs_cards_user_due on public.srs_cards (user_id, due);

-- ---------------------------------------------------------------------------
-- puzzle rating (SPEC §9.4), Glicko-2 values
-- ---------------------------------------------------------------------------
create table public.puzzle_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  rating real not null default 800 check (rating between 100 and 3500),
  rd real not null default 350,
  vol real not null default 0.06,
  solved integer not null default 0 check (solved >= 0),
  streak_best integer not null default 0 check (streak_best >= 0)
);

-- ---------------------------------------------------------------------------
-- daily activity for the streak (SPEC §12.4), day in the player's time zone
-- ---------------------------------------------------------------------------
create table public.daily_activity (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  actions integer not null default 0 check (actions >= 0),
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------------
-- Row Level Security: own rows only; admins may read profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.linked_accounts enable row level security;
alter table public.area_ranks enable row level security;
alter table public.course_progress enable row level security;
alter table public.srs_cards enable row level security;
alter table public.puzzle_stats enable row level security;
alter table public.daily_activity enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: admins read all" on public.profiles
  for select to authenticated using ((select public.is_admin()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- No insert policy: rows come from the sign-up trigger. No delete: deleting the auth user cascades.

-- Same four policies for every per-player table.
do $$
declare
  t text;
begin
  foreach t in array array['linked_accounts', 'area_ranks', 'course_progress', 'srs_cards', 'puzzle_stats', 'daily_activity']
  loop
    execute format('create policy "%1$s: read own" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: insert own" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: update own" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: delete own" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- Anonymous visitors (guests) never touch these tables: guest progress lives in the browser.
revoke all on public.profiles, public.linked_accounts, public.area_ranks, public.course_progress,
  public.srs_cards, public.puzzle_stats, public.daily_activity from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.linked_accounts, public.area_ranks, public.course_progress,
  public.srs_cards, public.puzzle_stats, public.daily_activity to authenticated;
