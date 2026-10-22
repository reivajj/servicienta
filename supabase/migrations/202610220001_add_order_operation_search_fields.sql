-- Virtual PostgREST fields: filter the same joined text in lists and exact counts.
-- Unnamed row arguments keep these functions out of the /rpc API.
create or replace function public.order_search_text(public.orders)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select concat_ws(' ',
    ($1).description,
    ($1).address_notes,
    ($1).service_address_text,
    client.name,
    client.surname,
    zone.name,
    replace(replace(($1).zone_slug, '-', ' '), '_', ' '),
    appliance.name,
    replace(replace(($1).appliance_type_slug, '-', ' '), '_', ' ')
  )
  from public.users as client
  left join public.zones as zone on zone.slug = ($1).zone_slug
  left join public.appliance_types as appliance on appliance.slug = ($1).appliance_type_slug
  where client.id = ($1).client_id;
$$;

create or replace function public.operation_search_text(public.operations)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select concat_ws(' ', ($1).description, public.order_search_text(parent_order))
  from public.orders as parent_order
  where parent_order.id = ($1).order_id;
$$;

revoke all on function public.order_search_text(public.orders) from public, anon, authenticated;
revoke all on function public.operation_search_text(public.operations) from public, anon, authenticated;
grant execute on function public.order_search_text(public.orders) to service_role;
grant execute on function public.operation_search_text(public.operations) to service_role;

comment on function public.order_search_text(public.orders) is
  'Gateway-only computed field: order notes, address, client full name, zone and appliance.';
comment on function public.operation_search_text(public.operations) is
  'Gateway-only computed field: visit notes plus the related order search text.';

notify pgrst, 'reload schema';
