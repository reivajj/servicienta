alter table public.technician_reviews
  add column if not exists operation_id uuid;

update public.technician_reviews
set operation_id = operations.id
from public.operations
where technician_reviews.operation_id is null
  and technician_reviews.order_id = operations.order_id
  and technician_reviews.technician_id = operations.technician_id;

do $$
begin
  if exists (
    select 1
    from public.technician_reviews
    where operation_id is null
  ) then
    raise exception 'Cannot migrate technician_reviews to operation_id: some reviews do not match an operation by order_id and technician_id';
  end if;
end;
$$;

alter table public.technician_reviews
  alter column operation_id set not null;

alter table public.technician_reviews
  drop constraint if exists technician_reviews_operation_id_fkey;

alter table public.technician_reviews
  add constraint technician_reviews_operation_id_fkey
  foreign key (operation_id)
  references public.operations (id)
  on delete cascade;

create unique index if not exists idx_technician_reviews_operation_unique
  on public.technician_reviews (operation_id);

drop index if exists public.idx_technician_reviews_order;

alter table public.technician_reviews
  drop column if exists order_id;

drop policy if exists "clients and technicians can read related reviews" on public.technician_reviews;
create policy "clients and technicians can read related reviews"
  on public.technician_reviews
  for select
  to authenticated
  using (
    auth.uid() = client_id
    or auth.uid() = technician_id
  );

drop policy if exists "clients can create own reviews" on public.technician_reviews;
create policy "clients can create own reviews"
  on public.technician_reviews
  for insert
  to authenticated
  with check (
    auth.uid() = client_id
    and exists (
      select 1
      from public.operations
      join public.orders on orders.id = operations.order_id
      where operations.id = technician_reviews.operation_id
        and operations.technician_id = technician_reviews.technician_id
        and orders.client_id = auth.uid()
    )
  );
