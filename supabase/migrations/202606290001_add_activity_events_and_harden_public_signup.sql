create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.users (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now(),
  constraint activity_events_entity_type_not_empty check (
    length(trim(entity_type)) > 0
  ),
  constraint activity_events_event_type_not_empty check (
    length(trim(event_type)) > 0
  )
);

create index if not exists idx_activity_events_actor_id
  on public.activity_events (actor_id);

create index if not exists idx_activity_events_entity
  on public.activity_events (entity_type, entity_id);

create index if not exists idx_activity_events_event_type
  on public.activity_events (event_type);

create index if not exists idx_activity_events_created_at
  on public.activity_events (created_at desc);

alter table public.activity_events enable row level security;

drop policy if exists "users can read own activity events" on public.activity_events;
create policy "users can read own activity events"
  on public.activity_events
  for select
  to authenticated
  using (auth.uid() = actor_id);

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    name,
    surname,
    role
  )
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'surname'), ''),
    'client'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
