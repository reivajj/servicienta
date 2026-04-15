create index if not exists idx_technician_coverage_zones_zone_technician
  on public.technician_coverage_zones (zone_id, technician_id);

create index if not exists idx_technician_appliance_specialties_appliance_technician
  on public.technician_appliance_specialties (appliance_type_id, technician_id);

create or replace function public.search_public_technician_profiles(
  _zone_slug text,
  _appliance_type_slug text,
  _available boolean default null
)
returns table (
  public_slug text,
  bio text,
  rating numeric,
  rating_count integer,
  available boolean,
  verified_at timestamptz,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    tp.public_slug,
    tp.bio,
    tp.rating,
    tp.rating_count,
    tp.available,
    tp.verified_at,
    tp.created_at
  from public.technician_profiles tp
  where (_available is null or tp.available = _available)
    and exists (
      select 1
      from public.technician_coverage_zones tcz
      inner join public.zones z
        on z.id = tcz.zone_id
      where tcz.technician_id = tp.id
        and z.slug = _zone_slug
    )
    and exists (
      select 1
      from public.technician_appliance_specialties tas
      inner join public.appliance_types at
        on at.id = tas.appliance_type_id
      where tas.technician_id = tp.id
        and at.slug = _appliance_type_slug
    )
  order by tp.rating desc, tp.rating_count desc, tp.created_at desc;
$$;

grant execute on function public.search_public_technician_profiles(text, text, boolean)
to anon, authenticated;
