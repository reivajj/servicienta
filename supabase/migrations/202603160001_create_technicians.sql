create extension if not exists pgcrypto;

create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  specialty text not null,
  city text not null,
  bio text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.technicians enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'technicians'
      and policyname = 'public can read technicians'
  ) then
    create policy "public can read technicians"
      on public.technicians
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

insert into public.technicians (
  full_name,
  specialty,
  city,
  bio,
  is_available
)
values
  (
    'Carlos Gomez',
    'Electricidad',
    'Buenos Aires',
    'Instalaciones electricas domiciliarias y tableros.',
    true
  ),
  (
    'Lucia Fernandez',
    'Plomeria',
    'Cordoba',
    'Reparaciones de perdidas, canillas y termotanques.',
    true
  ),
  (
    'Martin Ruiz',
    'Aire acondicionado',
    'Rosario',
    'Mantenimiento e instalacion de equipos split.',
    false
  )
on conflict do nothing;
