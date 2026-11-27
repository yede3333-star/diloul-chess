-- RLS checks (SPEC §13): run after auth_stub.sql + migrations. Any failed check raises an error.
\set ON_ERROR_STOP 1

insert into auth.users values
  ('11111111-1111-1111-1111-111111111111', 'a@x'),
  ('22222222-2222-2222-2222-222222222222', 'b@x'),
  ('33333333-3333-3333-3333-333333333333', 'admin@x');
update public.profiles set role = 'admin' where id = '33333333-3333-3333-3333-333333333333';

do $$ begin
  assert (select count(*) from public.profiles) = 3, 'sign-up trigger must create a profile per user';
end $$;

-- Player A writes own rows; every forbidden write must fail.
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
insert into public.area_ranks (user_id, area, rank) values ('11111111-1111-1111-1111-111111111111', 'openings', 2);
insert into public.course_progress (user_id, course, node_id, stars) values ('11111111-1111-1111-1111-111111111111', 'opening:london', 'n1', 3);
update public.profiles set locale = 'fr' where id = '11111111-1111-1111-1111-111111111111';
do $$ begin
  begin
    insert into public.area_ranks (user_id, area, rank) values ('22222222-2222-2222-2222-222222222222', 'openings', 6);
    raise exception 'FAIL: wrote a row for another player';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111';
    raise exception 'FAIL: player changed own role';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  begin
    insert into public.srs_cards (id, user_id, kind, ref, fen, answer_uci) values ('c', '11111111-1111-1111-1111-111111111111', 'opening', 'x', 'x', 'e2e9');
    raise exception 'FAIL: invalid UCI accepted';
  exception when check_violation then null; end;
  assert (select count(*) from public.profiles) = 1, 'player must see only own profile';
  assert (select role from public.profiles) = 'user', 'role must be unchanged';
end $$;
reset role;

-- Player B sees and changes nothing of A.
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
update public.area_ranks set rank = 6;
do $$ begin
  assert (select count(*) from public.area_ranks) = 0, 'B must not see A ranks';
  assert (select count(*) from public.course_progress) = 0, 'B must not see A progress';
end $$;
reset role;
do $$ begin
  assert (select rank from public.area_ranks where user_id = '11111111-1111-1111-1111-111111111111') = 2, 'B must not change A ranks';
end $$;

-- Admin reads all profiles but not other players' progress.
set role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
do $$ begin
  assert (select count(*) from public.profiles) = 3, 'admin must read all profiles';
  assert (select count(*) from public.area_ranks) = 0, 'admin must not read others progress';
end $$;
reset role;

-- Anonymous visitors: no access at all.
set role anon;
do $$ begin
  perform 1 from public.profiles;
  raise exception 'FAIL: anon can read profiles';
exception when insufficient_privilege then null; end $$;
reset role;

-- Deleting the account deletes all its data (SPEC §19.6).
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
do $$ begin
  assert (select count(*) from public.area_ranks) = 0, 'cascade must delete ranks';
  assert (select count(*) from public.course_progress) = 0, 'cascade must delete progress';
end $$;

select 'RLS tests passed' as result;
