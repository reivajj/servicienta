alter table public.users
  add column if not exists status text;

alter table public.users
  add column if not exists deleted_at timestamptz;

update public.users
set status = 'ACTIVE'
where status is null;

alter table public.users
  alter column status set default 'ACTIVE';

alter table public.users
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_status_check'
  ) then
    alter table public.users
      add constraint users_status_check
      check (status in ('ACTIVE', 'DELETED'));
  end if;
end
$$;

drop policy if exists "users can read own profile" on public.users;

create policy "users can read own profile"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id and status = 'ACTIVE');

drop policy if exists "users can update own profile" on public.users;

create policy "users can update own profile"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id and status = 'ACTIVE')
  with check (auth.uid() = id and status = 'ACTIVE');
