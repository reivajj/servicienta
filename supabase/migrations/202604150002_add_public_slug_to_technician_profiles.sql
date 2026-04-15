create or replace function public.generate_public_technician_slug()
returns text
language plpgsql
as $$
declare
  generated_slug text;
begin
  loop
    generated_slug := 'tech-' || replace(substring(gen_random_uuid()::text from 1 for 8), '-', '');

    exit when not exists (
      select 1
      from public.technician_profiles
      where public_slug = generated_slug
    );
  end loop;

  return generated_slug;
end;
$$;

alter table public.technician_profiles
  add column if not exists public_slug text;

alter table public.technician_profiles
  alter column public_slug set default public.generate_public_technician_slug();

update public.technician_profiles
set public_slug = public.generate_public_technician_slug()
where public_slug is null or length(trim(public_slug)) = 0;

alter table public.technician_profiles
  alter column public_slug set not null;

create unique index if not exists idx_technician_profiles_public_slug
  on public.technician_profiles (public_slug);

drop view if exists public.public_technician_profiles;

create view public.public_technician_profiles
with (security_invoker = true)
as
select
  technician_profiles.public_slug,
  technician_profiles.bio,
  technician_profiles.rating,
  technician_profiles.rating_count,
  technician_profiles.available,
  technician_profiles.verified_at,
  technician_profiles.created_at
from public.technician_profiles;

grant select on public.public_technician_profiles to anon, authenticated;
