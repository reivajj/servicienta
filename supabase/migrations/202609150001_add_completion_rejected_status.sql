alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.operations
  drop constraint if exists operations_status_check;

alter table public.orders
  add constraint orders_status_check check (
    status in (
      'pending',
      'accepted',
      'cancelled',
      'in_progress',
      'completed_tech',
      'completion_rejected',
      'completed'
    )
  );

alter table public.operations
  add constraint operations_status_check check (
    status in (
      'pending',
      'scheduled',
      'completed_tech',
      'completion_rejected',
      'completed',
      'cancelled'
    )
  );
