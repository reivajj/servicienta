create table if not exists public.client_profiles (
  id uuid primary key references public.users (id) on delete cascade,
  phone text,
  whatsapp_phone text,
  default_address_text text,
  default_lat numeric(9, 6),
  default_lng numeric(9, 6),
  address_notes text,
  preferred_contact_channel text not null default 'phone',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_profiles_preferred_contact_channel_check check (
    preferred_contact_channel in ('phone', 'whatsapp')
  ),
  constraint client_profiles_phone_not_empty check (
    phone is null or length(trim(phone)) > 0
  ),
  constraint client_profiles_whatsapp_phone_not_empty check (
    whatsapp_phone is null or length(trim(whatsapp_phone)) > 0
  ),
  constraint client_profiles_default_address_text_not_empty check (
    default_address_text is null or length(trim(default_address_text)) > 0
  ),
  constraint client_profiles_address_notes_not_empty check (
    address_notes is null or length(trim(address_notes)) > 0
  )
);

create index if not exists idx_client_profiles_phone
  on public.client_profiles (phone);

create index if not exists idx_client_profiles_whatsapp_phone
  on public.client_profiles (whatsapp_phone);

create index if not exists idx_client_profiles_preferred_contact_channel
  on public.client_profiles (preferred_contact_channel);

drop trigger if exists set_client_profiles_updated_at on public.client_profiles;

create trigger set_client_profiles_updated_at
  before update on public.client_profiles
  for each row execute procedure public.set_updated_at();

create or replace function public.ensure_client_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'client' then
    insert into public.client_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_client_profile_on_user_insert_or_role_change on public.users;

create trigger ensure_client_profile_on_user_insert_or_role_change
  after insert or update of role on public.users
  for each row execute procedure public.ensure_client_profile_for_user();

insert into public.client_profiles (id)
select users.id
from public.users
where users.role = 'client'
on conflict (id) do nothing;

drop view if exists public.admin_client_profiles;

create view public.admin_client_profiles
with (security_invoker = true)
as
select
  users.id,
  users.email,
  users.name,
  users.surname,
  users.status,
  users.deleted_at,
  users.created_at as user_created_at,
  client_profiles.phone,
  client_profiles.whatsapp_phone,
  client_profiles.default_address_text,
  client_profiles.default_lat,
  client_profiles.default_lng,
  client_profiles.address_notes,
  client_profiles.preferred_contact_channel,
  client_profiles.created_at,
  client_profiles.updated_at
from public.users
inner join public.client_profiles
  on client_profiles.id = users.id
where users.role = 'client';

alter table public.client_profiles enable row level security;

drop policy if exists "clients can read own profile" on public.client_profiles;
create policy "clients can read own profile"
  on public.client_profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "clients can update own profile" on public.client_profiles;
create policy "clients can update own profile"
  on public.client_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
