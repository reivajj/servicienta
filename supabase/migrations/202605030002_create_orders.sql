create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'open',
  flow_type text not null,
  description text not null,
  service_address_text text not null,
  service_lat numeric(9, 6),
  service_lng numeric(9, 6),
  address_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (
    status in ('open', 'in_progress', 'en_garantia', 'closed')
  ),
  constraint orders_flow_type_check check (
    flow_type in ('client_selects', 'tech_applies')
  ),
  constraint orders_description_not_empty check (length(trim(description)) > 0),
  constraint orders_service_address_text_not_empty check (
    length(trim(service_address_text)) > 0
  ),
  constraint orders_address_notes_not_empty check (
    address_notes is null or length(trim(address_notes)) > 0
  )
);

create index if not exists idx_orders_client_id
  on public.orders (client_id);

create index if not exists idx_orders_status
  on public.orders (status);

create index if not exists idx_orders_flow_type
  on public.orders (flow_type);

create index if not exists idx_orders_created_at
  on public.orders (created_at desc);

drop trigger if exists set_orders_updated_at on public.orders;

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

alter table public.orders enable row level security;

drop policy if exists "clients can read own orders" on public.orders;
create policy "clients can read own orders"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = client_id);

drop policy if exists "clients can insert own orders" on public.orders;
create policy "clients can insert own orders"
  on public.orders
  for insert
  to authenticated
  with check (auth.uid() = client_id);

drop policy if exists "clients can update own orders" on public.orders;
create policy "clients can update own orders"
  on public.orders
  for update
  to authenticated
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);
