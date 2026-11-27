-- Explicit privileges for projects where "Grant API access to new tables automatically" is OFF
-- (diloul-dev and diloul-prod). With that setting off, Supabase grants nothing by default, so every
-- table and function used by the API must be granted here. RLS stays enabled on every table: grants
-- decide which roles may reach a table at all, RLS decides which rows they see.
--
-- Rule for every future migration: create table → enable RLS → policies → explicit GRANTs (below).
-- All statements are idempotent, so this file is safe on a database where the init migration ran.

-- Schema access for the API roles.
grant usage on schema public to anon, authenticated, service_role;

-- Signed-in players: own rows only (enforced by RLS policies in the init migration).
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on
  public.linked_accounts,
  public.area_ranks,
  public.course_progress,
  public.srs_cards,
  public.puzzle_stats,
  public.daily_activity
to authenticated;

-- Guests (anon) never read or write these tables: their progress lives in the browser.
revoke all on
  public.profiles,
  public.linked_accounts,
  public.area_ranks,
  public.course_progress,
  public.srs_cards,
  public.puzzle_stats,
  public.daily_activity
from anon;

-- service_role: server-side admin scripts only (never shipped to the browser). It bypasses RLS
-- but still needs table privileges when automatic grants are off.
grant select, insert, update, delete on
  public.profiles,
  public.linked_accounts,
  public.area_ranks,
  public.course_progress,
  public.srs_cards,
  public.puzzle_stats,
  public.daily_activity
to service_role;

-- Functions: only what the API roles actually call.
-- is_admin() is evaluated inside RLS policies for signed-in players.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
-- Trigger functions run with their owner's rights; nobody calls them directly through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;
