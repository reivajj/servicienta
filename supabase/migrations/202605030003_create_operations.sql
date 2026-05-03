create table if not exists public.operations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  technician_id uuid not null references public.technician_profiles (id) on delete cascade,
  status text not null default 'confirmed',
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operations_status_check check (
    status in ('pending', 'confirmed', 'completed', 'cancelled')
  )
);

create index if not exists idx_operations_order_id
  on public.operations (order_id);

create index if not exists idx_operations_technician_id
  on public.operations (technician_id);

create index if not exists idx_operations_status
  on public.operations (status);

create index if not exists idx_operations_created_at
  on public.operations (created_at desc);

drop trigger if exists set_operations_updated_at on public.operations;

create trigger set_operations_updated_at
  before update on public.operations
  for each row execute procedure public.set_updated_at();

alter table public.operations enable row level security;

drop policy if exists "clients can read own operations" on public.operations;
create policy "clients can read own operations"
  on public.operations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = operations.order_id
        and orders.client_id = auth.uid()
    )
  );

drop policy if exists "clients can insert own operations" on public.operations;
create policy "clients can insert own operations"
  on public.operations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.orders
      where orders.id = operations.order_id
        and orders.client_id = auth.uid()
    )
  );

drop policy if exists "technicians can read own operations" on public.operations;
create policy "technicians can read own operations"
  on public.operations
  for select
  to authenticated
  using (technician_id = auth.uid());

drop policy if exists "technicians can update own operations" on public.operations;
create policy "technicians can update own operations"
  on public.operations
  for update
  to authenticated
  using (technician_id = auth.uid())
  with check (technician_id = auth.uid());
