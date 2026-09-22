create or replace function public.replace_technician_offer(
  _technician_id uuid,
  _available boolean,
  _zone_ids uuid[],
  _specialties jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  specialty jsonb;
  appliance_id uuid;
  all_brands boolean;
  brand_ids uuid[];
begin
  if not exists (
    select 1 from public.users u
    join public.technician_profiles p on p.id = u.id
    where u.id = _technician_id and u.role = 'technician' and u.status = 'ACTIVE'
  ) then
    raise exception 'Active technician profile required';
  end if;

  if _available is null or _zone_ids is null or _specialties is null
    or jsonb_typeof(_specialties) <> 'array' then
    raise exception 'Invalid technician offer';
  end if;

  if exists (select 1 from unnest(_zone_ids) as selected_zone(zone_id)
             where selected_zone.zone_id is null or not exists
               (select 1 from public.zones z where z.id = selected_zone.zone_id)) then
    raise exception 'Unknown zone';
  end if;

  for specialty in select value from jsonb_array_elements(_specialties) loop
    appliance_id := (specialty ->> 'applianceTypeId')::uuid;
    all_brands := (specialty ->> 'supportsAllBrands')::boolean;
    if appliance_id is null or all_brands is null or
       not exists (select 1 from public.appliance_types a where a.id = appliance_id) then
      raise exception 'Invalid appliance specialty';
    end if;
    if jsonb_typeof(specialty -> 'brandIds') <> 'array' then
      raise exception 'Invalid brand selection';
    end if;
    select coalesce(array_agg(distinct value::uuid), '{}')
      into brand_ids from jsonb_array_elements_text(specialty -> 'brandIds');
    if (all_brands and cardinality(brand_ids) > 0) or
       (not all_brands and cardinality(brand_ids) = 0) or
       exists (select 1 from unnest(brand_ids) as selected_brand(brand_id)
               where not exists (select 1 from public.brands b where b.id = selected_brand.brand_id)) then
      raise exception 'Invalid brand selection';
    end if;
  end loop;

  delete from public.technician_brand_specialties where technician_id = _technician_id;
  delete from public.technician_appliance_specialties where technician_id = _technician_id;
  delete from public.technician_coverage_zones where technician_id = _technician_id;

  insert into public.technician_coverage_zones (technician_id, zone_id)
  select _technician_id, selected_zone.zone_id
  from unnest(_zone_ids) as selected_zone(zone_id)
  group by selected_zone.zone_id;

  for specialty in select value from jsonb_array_elements(_specialties) loop
    appliance_id := (specialty ->> 'applianceTypeId')::uuid;
    all_brands := (specialty ->> 'supportsAllBrands')::boolean;
    insert into public.technician_appliance_specialties
      (technician_id, appliance_type_id, supports_all_brands)
    select _technician_id, appliance_id, all_brands
    where not exists (
      select 1 from public.technician_appliance_specialties
      where technician_id = _technician_id and appliance_type_id = appliance_id
    );
    if not all_brands then
      insert into public.technician_brand_specialties
        (technician_id, appliance_type_id, brand_id)
      select _technician_id, appliance_id, selected_brand.brand_id_text::uuid
      from jsonb_array_elements_text(specialty -> 'brandIds') as selected_brand(brand_id_text)
      on conflict (technician_id, appliance_type_id, brand_id) do nothing;
    end if;
  end loop;

  update public.technician_profiles set available = _available where id = _technician_id;
end;
$$;

revoke all on function public.replace_technician_offer(uuid, boolean, uuid[], jsonb) from public, anon, authenticated;
grant execute on function public.replace_technician_offer(uuid, boolean, uuid[], jsonb) to service_role;

create or replace function public.search_public_technician_profiles(
  _zone_slug text,
  _appliance_type_slug text,
  _available boolean default null
)
returns table (
  public_slug text, bio text, rating numeric, rating_count integer,
  available boolean, verified_at timestamptz, created_at timestamptz
)
language sql stable security invoker set search_path = public
as $$
  select tp.public_slug, tp.bio, tp.rating, tp.rating_count,
         tp.available, tp.verified_at, tp.created_at
  from public.technician_profiles tp
  join public.users u on u.id = tp.id
  where u.role = 'technician' and u.status = 'ACTIVE' and tp.available = true
    and (_available is null or _available = true)
    and exists (
      select 1 from public.technician_coverage_zones tcz
      join public.zones z on z.id = tcz.zone_id
      where tcz.technician_id = tp.id and z.slug = _zone_slug
    )
    and exists (
      select 1 from public.technician_appliance_specialties tas
      join public.appliance_types a on a.id = tas.appliance_type_id
      where tas.technician_id = tp.id and a.slug = _appliance_type_slug
    )
  order by tp.rating desc, tp.rating_count desc, tp.created_at desc;
$$;
