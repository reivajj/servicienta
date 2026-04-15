create table if not exists public.technician_profiles (
  id uuid primary key references public.users (id) on delete cascade,
  bio text,
  rating numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  available boolean not null default true,
  base_address_text text,
  base_lat numeric(9, 6),
  base_lng numeric(9, 6),
  service_radius_km numeric(6, 2),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint technician_profiles_rating_non_negative check (rating >= 0),
  constraint technician_profiles_rating_count_non_negative check (rating_count >= 0),
  constraint technician_profiles_service_radius_non_negative check (
    service_radius_km is null or service_radius_km >= 0
  )
);

create table if not exists public.appliance_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint appliance_types_name_not_empty check (length(trim(name)) > 0),
  constraint appliance_types_slug_not_empty check (length(trim(slug)) > 0)
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint brands_name_not_empty check (length(trim(name)) > 0),
  constraint brands_slug_not_empty check (length(trim(slug)) > 0)
);

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint zones_name_not_empty check (length(trim(name)) > 0),
  constraint zones_slug_not_empty check (length(trim(slug)) > 0)
);

create table if not exists public.technician_appliance_specialties (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles (id) on delete cascade,
  appliance_type_id uuid references public.appliance_types (id) on delete set null,
  supports_all_brands boolean not null default true,
  free_text text,
  created_at timestamptz not null default now(),
  constraint technician_appliance_specialties_payload_check check (
    appliance_type_id is not null
    or (free_text is not null and length(trim(free_text)) > 0)
  )
);

create table if not exists public.technician_brand_specialties (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles (id) on delete cascade,
  appliance_type_id uuid not null references public.appliance_types (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint technician_brand_specialties_unique unique (
    technician_id,
    appliance_type_id,
    brand_id
  )
);

create table if not exists public.technician_coverage_zones (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles (id) on delete cascade,
  zone_id uuid not null references public.zones (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint technician_coverage_zones_unique unique (technician_id, zone_id)
);

create table if not exists public.technician_reviews (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles (id) on delete cascade,
  order_id uuid not null,
  client_id uuid not null references public.users (id) on delete cascade,
  rating integer not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint technician_reviews_rating_range check (rating between 1 and 5)
);

create table if not exists public.technician_documents (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles (id) on delete cascade,
  document_type text not null,
  storage_key text not null,
  title text not null,
  description text,
  is_public boolean not null default false,
  uploaded_at timestamptz not null default now(),
  constraint technician_documents_document_type_not_empty check (length(trim(document_type)) > 0),
  constraint technician_documents_storage_key_not_empty check (length(trim(storage_key)) > 0),
  constraint technician_documents_title_not_empty check (length(trim(title)) > 0)
);

create index if not exists idx_technician_profiles_available
  on public.technician_profiles (available);

create index if not exists idx_technician_profiles_rating
  on public.technician_profiles (rating desc);

create index if not exists idx_technician_appliance_specialties_technician
  on public.technician_appliance_specialties (technician_id);

create index if not exists idx_technician_appliance_specialties_appliance_type
  on public.technician_appliance_specialties (appliance_type_id);

create index if not exists idx_technician_brand_specialties_technician
  on public.technician_brand_specialties (technician_id);

create index if not exists idx_technician_brand_specialties_appliance_type
  on public.technician_brand_specialties (appliance_type_id);

create index if not exists idx_technician_brand_specialties_brand
  on public.technician_brand_specialties (brand_id);

create index if not exists idx_technician_coverage_zones_technician
  on public.technician_coverage_zones (technician_id);

create index if not exists idx_technician_coverage_zones_zone
  on public.technician_coverage_zones (zone_id);

create index if not exists idx_technician_reviews_technician
  on public.technician_reviews (technician_id);

create index if not exists idx_technician_reviews_client
  on public.technician_reviews (client_id);

create index if not exists idx_technician_reviews_order
  on public.technician_reviews (order_id);

create index if not exists idx_technician_documents_technician
  on public.technician_documents (technician_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_technician_profiles_updated_at on public.technician_profiles;

create trigger set_technician_profiles_updated_at
  before update on public.technician_profiles
  for each row execute procedure public.set_updated_at();

create or replace function public.ensure_technician_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'technician' then
    insert into public.technician_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.refresh_technician_profile_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_technician_id uuid;
begin
  if tg_op = 'DELETE' then
    target_technician_id = old.technician_id;
  else
    target_technician_id = new.technician_id;
  end if;

  update public.technician_profiles
  set
    rating = coalesce((
      select round(avg(technician_reviews.rating)::numeric, 2)
      from public.technician_reviews
      where technician_reviews.technician_id = target_technician_id
    ), 0),
    rating_count = (
      select count(*)
      from public.technician_reviews
      where technician_reviews.technician_id = target_technician_id
    )
  where id = target_technician_id;

  return null;
end;
$$;

drop trigger if exists ensure_technician_profile_on_user_insert_or_role_change on public.users;

create trigger ensure_technician_profile_on_user_insert_or_role_change
  after insert or update of role on public.users
  for each row execute procedure public.ensure_technician_profile_for_user();

drop trigger if exists refresh_technician_profile_rating_on_review_change on public.technician_reviews;

create trigger refresh_technician_profile_rating_on_review_change
  after insert or update or delete on public.technician_reviews
  for each row execute procedure public.refresh_technician_profile_rating();

insert into public.technician_profiles (id)
select users.id
from public.users
where users.role = 'technician'
on conflict (id) do nothing;

alter table public.technician_profiles enable row level security;
alter table public.appliance_types enable row level security;
alter table public.brands enable row level security;
alter table public.zones enable row level security;
alter table public.technician_appliance_specialties enable row level security;
alter table public.technician_brand_specialties enable row level security;
alter table public.technician_coverage_zones enable row level security;
alter table public.technician_reviews enable row level security;
alter table public.technician_documents enable row level security;

drop policy if exists "technicians can read own profile" on public.technician_profiles;
create policy "technicians can read own profile"
  on public.technician_profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "technicians can update own profile" on public.technician_profiles;
create policy "technicians can update own profile"
  on public.technician_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "public can read appliance types" on public.appliance_types;
create policy "public can read appliance types"
  on public.appliance_types
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public can read brands" on public.brands;
create policy "public can read brands"
  on public.brands
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public can read zones" on public.zones;
create policy "public can read zones"
  on public.zones
  for select
  to anon, authenticated
  using (true);

drop policy if exists "technicians can manage own appliance specialties" on public.technician_appliance_specialties;
create policy "technicians can manage own appliance specialties"
  on public.technician_appliance_specialties
  for all
  to authenticated
  using (auth.uid() = technician_id)
  with check (auth.uid() = technician_id);

drop policy if exists "technicians can manage own brand specialties" on public.technician_brand_specialties;
create policy "technicians can manage own brand specialties"
  on public.technician_brand_specialties
  for all
  to authenticated
  using (auth.uid() = technician_id)
  with check (auth.uid() = technician_id);

drop policy if exists "technicians can manage own coverage zones" on public.technician_coverage_zones;
create policy "technicians can manage own coverage zones"
  on public.technician_coverage_zones
  for all
  to authenticated
  using (auth.uid() = technician_id)
  with check (auth.uid() = technician_id);

drop policy if exists "technicians can manage own documents" on public.technician_documents;
create policy "technicians can manage own documents"
  on public.technician_documents
  for all
  to authenticated
  using (auth.uid() = technician_id)
  with check (auth.uid() = technician_id);

drop policy if exists "authenticated can read public technician documents" on public.technician_documents;
create policy "authenticated can read public technician documents"
  on public.technician_documents
  for select
  to authenticated
  using (is_public = true);

drop policy if exists "clients and technicians can read related reviews" on public.technician_reviews;
create policy "clients and technicians can read related reviews"
  on public.technician_reviews
  for select
  to authenticated
  using (auth.uid() = client_id or auth.uid() = technician_id);

drop policy if exists "clients can create own reviews" on public.technician_reviews;
create policy "clients can create own reviews"
  on public.technician_reviews
  for insert
  to authenticated
  with check (auth.uid() = client_id);

create or replace view public.public_technician_profiles
with (security_invoker = true)
as
select
  technician_profiles.bio,
  technician_profiles.rating,
  technician_profiles.rating_count,
  technician_profiles.available,
  technician_profiles.verified_at,
  technician_profiles.created_at
from public.technician_profiles;

grant select on public.public_technician_profiles to anon, authenticated;
