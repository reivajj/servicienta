-- Read-only computed fields for the technician's operational order lists.
create or replace function public.order_next_visit_at(public.orders)
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    min(visit.scheduled_at) filter (where visit.scheduled_at >=
      (date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires') at time zone 'America/Argentina/Buenos_Aires')),
    max(visit.scheduled_at)
  )
  from public.operations as visit
  where visit.order_id = ($1).id
    and visit.technician_id = ($1).technician_id
    and visit.status = 'scheduled'
    and ($1).status not in ('completed', 'cancelled');
$$;

create or replace function public.order_worklist(public.orders)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when ($1).status in ('completed', 'cancelled') then 'history'
    when ($1).status = 'pending' then 'pending'
    when ($1).status in ('completed_tech', 'completion_rejected') then 'waiting'
    when exists (
      select 1 from public.operations as visit
      where visit.order_id = ($1).id
        and visit.technician_id = ($1).technician_id
        and visit.status = 'scheduled'
        and visit.scheduled_at <
          (date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires') at time zone 'America/Argentina/Buenos_Aires')
    ) then 'waiting'
    else 'main'
  end;
$$;

revoke all on function public.order_next_visit_at(public.orders) from public, anon, authenticated;
revoke all on function public.order_worklist(public.orders) from public, anon, authenticated;
grant execute on function public.order_next_visit_at(public.orders) to service_role;
grant execute on function public.order_worklist(public.orders) to service_role;

comment on function public.order_next_visit_at(public.orders) is
  'Gateway worklist date: nearest scheduled visit today or later; otherwise last overdue scheduled visit.';
comment on function public.order_worklist(public.orders) is
  'Gateway worklist group: pending acceptance, waiting for action, active main list or terminal history.';
notify pgrst, 'reload schema';
