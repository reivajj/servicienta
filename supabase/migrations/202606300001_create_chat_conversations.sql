create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null default 'order',
  order_id uuid references public.orders (id) on delete cascade,
  status text not null default 'open',
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  constraint chat_conversations_type_check check (
    conversation_type in ('order', 'direct')
  ),
  constraint chat_conversations_status_check check (
    status in ('open', 'closed', 'archived')
  ),
  constraint chat_conversations_order_type_requires_order check (
    conversation_type <> 'order' or order_id is not null
  )
);

create unique index if not exists idx_chat_conversations_order_unique
  on public.chat_conversations (order_id)
  where conversation_type = 'order' and order_id is not null;

create index if not exists idx_chat_conversations_type
  on public.chat_conversations (conversation_type);

create index if not exists idx_chat_conversations_last_message
  on public.chat_conversations (last_message_at desc nulls last);

drop trigger if exists set_chat_conversations_updated_at on public.chat_conversations;
create trigger set_chat_conversations_updated_at
  before update on public.chat_conversations
  for each row execute procedure public.set_updated_at();

create table if not exists public.chat_conversation_participants (
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  participant_role text not null,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id),
  constraint chat_conversation_participants_role_check check (
    participant_role in ('admin', 'technician', 'client')
  )
);

create index if not exists idx_chat_participants_user
  on public.chat_conversation_participants (user_id);

create index if not exists idx_chat_participants_conversation
  on public.chat_conversation_participants (conversation_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  sender_id uuid references public.users (id) on delete set null,
  message_type text not null default 'text',
  body text not null,
  action_type text,
  action_payload jsonb,
  related_order_id uuid references public.orders (id) on delete set null,
  related_operation_id uuid references public.operations (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint chat_messages_type_check check (
    message_type in ('text', 'system', 'action')
  ),
  constraint chat_messages_body_not_empty check (length(trim(body)) > 0)
);

create index if not exists idx_chat_messages_conversation_created
  on public.chat_messages (conversation_id, created_at desc);

create index if not exists idx_chat_messages_sender
  on public.chat_messages (sender_id);

create or replace function public.touch_chat_conversation_from_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_conversations
  set last_message_at = new.created_at,
      updated_at = new.created_at
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists touch_chat_conversation_on_message on public.chat_messages;
create trigger touch_chat_conversation_on_message
  after insert on public.chat_messages
  for each row execute procedure public.touch_chat_conversation_from_message();

alter table public.chat_conversations enable row level security;
alter table public.chat_conversation_participants enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chat participants can read conversations" on public.chat_conversations;
create policy "chat participants can read conversations"
  on public.chat_conversations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_conversation_participants participants
      where participants.conversation_id = chat_conversations.id
        and participants.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

drop policy if exists "chat participants can read participants" on public.chat_conversation_participants;
create policy "chat participants can read participants"
  on public.chat_conversation_participants
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

drop policy if exists "chat participants can read messages" on public.chat_messages;
create policy "chat participants can read messages"
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_conversation_participants participants
      where participants.conversation_id = chat_messages.conversation_id
        and participants.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
end;
$$;
