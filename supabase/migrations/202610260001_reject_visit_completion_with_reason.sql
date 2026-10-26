alter table public.operations
  add column completion_rejection_reason text,
  add column completion_rejected_at timestamptz,
  add constraint operations_rejection_reason_length check (
    completion_rejection_reason is null or
    length(btrim(completion_rejection_reason)) between 1 and 2000
  );

-- One transaction for rejection, order state, authored chat event and audit.
create or replace function public.reject_operation_completion(
  _operation_id uuid,
  _client_id uuid,
  _reason text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  _visit record;
  _conversation_id uuid;
  _message_id uuid;
  _rejected_at timestamptz := now();
  _clean_reason text := regexp_replace(coalesce(_reason, ''), '^[[:space:]]+|[[:space:]]+$', '', 'g');
begin
  if length(_clean_reason) < 1 or length(_clean_reason) > 2000 then
    raise exception using errcode = '22023', message = 'Explicá por qué rechazás la finalización (hasta 2000 caracteres)';
  end if;
  if not exists (select 1 from public.users where id = _client_id and role = 'client') then
    raise exception using errcode = '42501', message = 'Solo el cliente puede rechazar la finalización';
  end if;

  select visit.id, visit.order_id, visit.technician_id, visit.status,
         visit.completion_rejection_reason
  into _visit
  from public.operations as visit
  join public.orders as parent_order on parent_order.id = visit.order_id
  where visit.id = _operation_id and parent_order.client_id = _client_id
  for update of visit;
  if not found then
    raise exception using errcode = 'P0002', message = 'No se encontró la visita';
  end if;

  -- Retrying the same confirmed request must not create a second message.
  if _visit.status = 'completion_rejected' and _visit.completion_rejection_reason = _clean_reason then
    return _visit.id;
  end if;
  if _visit.status <> 'completed_tech' then
    raise exception using errcode = '22023', message = 'Solo se puede rechazar la finalización informada por el técnico';
  end if;

  perform 1 from public.orders where id = _visit.order_id for update;

  insert into public.chat_conversations (conversation_type, order_id, created_by)
  values ('order', _visit.order_id, _client_id)
  on conflict (order_id) where conversation_type = 'order' and order_id is not null
  do update set order_id = excluded.order_id
  returning id into _conversation_id;

  insert into public.chat_conversation_participants (conversation_id, user_id, participant_role)
  values (_conversation_id, _client_id, 'client'), (_conversation_id, _visit.technician_id, 'technician')
  on conflict (conversation_id, user_id) do update set participant_role = excluded.participant_role;

  update public.operations
  set status = 'completion_rejected', completion_rejection_reason = _clean_reason,
      completion_rejected_at = _rejected_at, updated_at = _rejected_at
  where id = _visit.id;
  update public.orders
  set status = 'completion_rejected', updated_at = _rejected_at
  where id = _visit.order_id;

  insert into public.chat_messages (
    conversation_id, sender_id, message_type, body, action_type, action_payload,
    related_order_id, related_operation_id, created_at
  ) values (
    _conversation_id, _client_id, 'action',
    E'Rechacé la finalización de la visita.\nMotivo: ' || _clean_reason,
    'operation.reject_completed', jsonb_build_object('reason', _clean_reason),
    _visit.order_id, _visit.id, _rejected_at
  ) returning id into _message_id;

  insert into public.activity_events (actor_id, entity_type, entity_id, event_type, payload, created_at)
  values (_client_id, 'operation', _visit.id, 'operation.completion_rejected_by_client',
    jsonb_build_object('order_id', _visit.order_id, 'reason', _clean_reason,
      'rejected_at', _rejected_at, 'chat_message_id', _message_id), _rejected_at);

  return _visit.id;
end;
$$;

revoke all on function public.reject_operation_completion(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.reject_operation_completion(uuid, uuid, text) to service_role;
comment on column public.operations.completion_rejection_reason is 'Client explanation for rejecting technician completion; separate from technical notes.';
notify pgrst, 'reload schema';
