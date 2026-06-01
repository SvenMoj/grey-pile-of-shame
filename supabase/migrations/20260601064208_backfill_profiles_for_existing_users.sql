-- Backfill profiles for users who signed up before the handle_new_user trigger existed.
insert into public.profiles (id)
select id from auth.users
where id not in (select id from public.profiles);
