create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  surname text,
  role text not null default 'client' check (role in ('admin', 'client', 'technician')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    name,
    surname,
    role
  )
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'surname'), ''),
    case
      when new.raw_user_meta_data ->> 'role' in ('admin', 'client', 'technician')
        then new.raw_user_meta_data ->> 'role'
      else 'client'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_auth_user_created();

insert into public.users (
  id,
  email,
  name,
  surname,
  role
)
select
  auth_user.id,
  auth_user.email,
  nullif(trim(auth_user.raw_user_meta_data ->> 'name'), ''),
  nullif(trim(auth_user.raw_user_meta_data ->> 'surname'), ''),
  case
    when auth_user.raw_user_meta_data ->> 'role' in ('admin', 'client', 'technician')
      then auth_user.raw_user_meta_data ->> 'role'
    else 'client'
  end
from auth.users as auth_user
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users can read own profile'
  ) then
    create policy "users can read own profile"
      on public.users
      for select
      to authenticated
      using (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users can update own profile'
  ) then
    create policy "users can update own profile"
      on public.users
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end
$$;
