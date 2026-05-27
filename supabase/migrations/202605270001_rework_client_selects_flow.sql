alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.operations
  drop constraint if exists operations_status_check;

alter table public.orders
  add column if not exists technician_id uuid references public.technician_profiles (id) on delete set null,
  add column if not exists zone_slug text,
  add column if not exists appliance_type_slug text;

alter table public.operations
  add column if not exists description text,
  add column if not exists technician_completed_at timestamptz;

update public.orders
set status = case status
  when 'open' then 'pending'
  when 'en_garantia' then 'completed_tech'
  when 'closed' then 'completed'
  else status
end
where status in ('open', 'en_garantia', 'closed');

update public.orders
set technician_id = operations.technician_id
from public.operations
where operations.order_id = orders.id
  and orders.technician_id is null;

update public.operations
set status = case status
  when 'confirmed' then 'pending'
  else status
end
where status = 'confirmed';

update public.operations
set technician_completed_at = completed_at
where status = 'completed'
  and completed_at is not null
  and technician_completed_at is null;

alter table public.orders
  alter column status set default 'pending';

alter table public.operations
  alter column status set default 'pending';

alter table public.orders
  add constraint orders_status_check check (
    status in (
      'pending',
      'accepted',
      'cancelled',
      'in_progress',
      'completed_tech',
      'completed'
    )
  );

alter table public.operations
  add constraint operations_status_check check (
    status in (
      'pending',
      'scheduled',
      'completed_tech',
      'completed',
      'cancelled'
    )
  );

alter table public.operations
  drop constraint if exists operations_description_not_empty,
  add constraint operations_description_not_empty check (
    description is null or length(trim(description)) > 0
  );

alter table public.orders
  drop constraint if exists orders_zone_slug_not_empty,
  add constraint orders_zone_slug_not_empty check (
    zone_slug is null or length(trim(zone_slug)) > 0
  );

alter table public.orders
  drop constraint if exists orders_appliance_type_slug_not_empty,
  add constraint orders_appliance_type_slug_not_empty check (
    appliance_type_slug is null or length(trim(appliance_type_slug)) > 0
  );

create index if not exists idx_orders_technician_id
  on public.orders (technician_id);

create index if not exists idx_orders_zone_slug
  on public.orders (zone_slug);

create index if not exists idx_orders_appliance_type_slug
  on public.orders (appliance_type_slug);

create index if not exists idx_operations_technician_completed_at
  on public.operations (technician_completed_at);
