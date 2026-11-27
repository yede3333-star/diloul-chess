-- Minimal stand-in for Supabase's auth schema and roles, to test migrations on plain Postgres (CI).
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  -- Supabase Auth inserts sign-ups into auth.users with this role (fires our sign-up trigger).
  if not exists (select from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin nologin; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role, supabase_auth_admin;
grant select, insert, delete on auth.users to supabase_auth_admin;
grant execute on function auth.uid() to anon, authenticated, service_role;
-- No grants on schema public here: like a project with "automatic grants" OFF, the migrations
-- must grant everything themselves.
revoke all on schema public from public;
