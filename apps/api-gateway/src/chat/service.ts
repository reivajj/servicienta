import type {
  ChatConversation,
  ChatConversationOrder,
  ChatMessage,
  ListChatMessagesInput,
  ListCurrentChatConversationsInput,
  PaginatedChatConversations,
  PaginatedChatMessages,
  ScheduleOperationFromChatInput,
} from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../core/errors.js';
import type { RequestAuth } from '../core/http.js';
import { recordActivityEvent } from '../activity-events/service.js';
import { scheduleOperation } from '../operations/service.js';
import {
  mapChatConversationRow,
  mapChatMessageRow,
  mapChatMessagePreviewRow,
} from './mapper.js';
import type {
  ChatConversationRow,
  ChatConversationOrderRow,
  ChatMessageRow,
  ChatOrderRow,
} from './types.js';
import {
  validateCreateChatMessageInput,
  validateScheduleOperationFromChatInput,
} from './validators.js';

const CHAT_CONVERSATION_SELECT =
  'id, conversation_type, order_id, status, created_by, created_at, updated_at, last_message_at';

const CHAT_MESSAGE_SELECT = `
  id,
  conversation_id,
  sender_id,
  message_type,
  body,
  action_type,
  action_payload,
  related_order_id,
  related_operation_id,
  created_at,
  sender:users!chat_messages_sender_id_fkey(
    email,
    name,
    surname,
    role
  )
`;

export async function listCurrentChatConversations(
  supabase: SupabaseClient,
  auth: RequestAuth,
  input: ListCurrentChatConversationsInput,
): Promise<PaginatedChatConversations> {
  const rows =
    auth.role === 'admin'
      ? await listAdminConversations(supabase)
      : await listParticipantConversations(supabase, auth.id);

  const hydratedItems = await Promise.all(
    rows.map((row) => hydrateConversation(supabase, auth, row)),
  );
  const filteredItems = hydratedItems.filter((conversation) =>
    matchesConversationFilters(conversation, auth, input),
  );
  const total = filteredItems.length;
  const from = (input.page - 1) * input.pageSize;
  const items = filteredItems.slice(from, from + input.pageSize);

  return {
    items,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
  };
}

export async function getOrCreateOrderChatConversation(
  supabase: SupabaseClient,
  auth: RequestAuth,
  orderId: string,
): Promise<ChatConversation> {
  const order = await getAuthorizedOrder(supabase, auth, orderId);
  let conversation = await findOrderConversation(supabase, order.id);

  if (!conversation) {
    conversation = await createOrderConversation(supabase, auth.id, order.id);
  }

  await ensureOrderParticipants(supabase, conversation.id, order);

  return hydrateConversation(supabase, auth, conversation);
}

export async function listChatMessages(
  supabase: SupabaseClient,
  auth: RequestAuth,
  conversationId: string,
  input: ListChatMessagesInput,
): Promise<PaginatedChatMessages> {
  await getAuthorizedConversation(supabase, auth, conversationId);
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;
  const { data, error, count } = await supabase
    .from('chat_messages')
    .select(CHAT_MESSAGE_SELECT, { count: 'exact' })
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const items = ((data ?? []) as ChatMessageRow[])
    .map((row) => mapChatMessageRow(row, auth.role))
    .reverse();
  const total = count ?? 0;

  return {
    items,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
  };
}

export async function createChatMessage(
  supabase: SupabaseClient,
  auth: RequestAuth,
  conversationId: string,
  input: { body: string },
): Promise<ChatMessage> {
  const payload = validateCreateChatMessageInput(input);
  const conversation = await getAuthorizedConversation(
    supabase,
    auth,
    conversationId,
  );

  if (auth.role === 'admin') {
    await announceAdminOnFirstMessage(supabase, auth, conversation);
  }

  const message = await insertChatMessage(supabase, {
    conversationId: conversation.id,
    senderId: auth.id,
    messageType: 'text',
    body: payload.body,
    relatedOrderId: conversation.order_id,
    viewerRole: auth.role,
  });

  await recordActivityEvent(supabase, {
    actorId: auth.id,
    entityType: 'chat_message',
    entityId: message.id,
    eventType: 'chat.message_created',
    payload: {
      conversation_id: conversation.id,
      order_id: conversation.order_id,
    },
  });

  return message;
}

export async function markChatConversationRead(
  supabase: SupabaseClient,
  auth: RequestAuth,
  conversationId: string,
): Promise<ChatConversation> {
  const conversation = await getAuthorizedConversation(
    supabase,
    auth,
    conversationId,
  );
  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from('chat_conversation_participants')
    .upsert(
      {
        conversation_id: conversation.id,
        user_id: auth.id,
        participant_role: auth.role,
        last_read_at: readAt,
      },
      { onConflict: 'conversation_id,user_id' },
    );

  if (error) throw new Error(error.message);

  return hydrateConversation(supabase, auth, conversation);
}

export async function scheduleOperationFromChat(
  supabase: SupabaseClient,
  auth: RequestAuth,
  conversationId: string,
  input: ScheduleOperationFromChatInput,
) {
  const payload = validateScheduleOperationFromChatInput(input);
  const conversation = await getAuthorizedConversation(
    supabase,
    auth,
    conversationId,
  );

  if (!conversation.order_id) {
    throw new ValidationError('La conversación no está vinculada a un pedido');
  }

  const { data: operation, error: operationError } = await supabase
    .from('operations')
    .select('id, order_id')
    .eq('id', payload.operation_id)
    .eq('order_id', conversation.order_id)
    .maybeSingle();

  if (operationError) throw new Error(operationError.message);
  if (!operation) throw new NotFoundError('No se encontró la visita');

  await scheduleOperation(supabase, auth, payload.operation_id, {
    scheduled_at: payload.scheduled_at,
    description: payload.description,
  });

  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(payload.scheduled_at));
  const message = await insertChatMessage(supabase, {
    conversationId: conversation.id,
    senderId: auth.id,
    messageType: 'action',
    body: `Visita agendada para ${formattedDate}.`,
    actionType: 'operation.schedule',
    actionPayload: {
      scheduled_at: payload.scheduled_at,
      description: payload.description,
    },
    relatedOrderId: conversation.order_id,
    relatedOperationId: payload.operation_id,
    viewerRole: auth.role,
  });

  await recordActivityEvent(supabase, {
    actorId: auth.id,
    entityType: 'chat_conversation',
    entityId: conversation.id,
    eventType: 'chat.operation_scheduled_from_chat',
    payload: {
      order_id: conversation.order_id,
      operation_id: payload.operation_id,
      scheduled_at: payload.scheduled_at,
    },
  });

  return {
    conversation: await hydrateConversation(supabase, auth, conversation),
    message,
  };
}

async function listAdminConversations(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select(CHAT_CONVERSATION_SELECT, { count: 'exact' })
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as ChatConversationRow[];
}

async function listParticipantConversations(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: participants, error: participantsError } = await supabase
    .from('chat_conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (participantsError) throw new Error(participantsError.message);

  const conversationIds = (participants ?? []).map(
    (participant) => participant.conversation_id as string,
  );

  if (!conversationIds.length) return [];

  const { data, error } = await supabase
    .from('chat_conversations')
    .select(CHAT_CONVERSATION_SELECT, { count: 'exact' })
    .in('id', conversationIds)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as ChatConversationRow[];
}

async function getAuthorizedOrder(
  supabase: SupabaseClient,
  auth: RequestAuth,
  orderId: string,
): Promise<ChatOrderRow> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, client_id, technician_id')
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('No se encontró el pedido');

  const order = data as ChatOrderRow;

  if (
    auth.role !== 'admin' &&
    order.client_id !== auth.id &&
    order.technician_id !== auth.id
  ) {
    throw new ForbiddenError('No tenés acceso al chat de este pedido');
  }

  return order;
}

async function findOrderConversation(
  supabase: SupabaseClient,
  orderId: string,
) {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select(CHAT_CONVERSATION_SELECT)
    .eq('conversation_type', 'order')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data ? (data as ChatConversationRow) : null;
}

async function createOrderConversation(
  supabase: SupabaseClient,
  createdBy: string,
  orderId: string,
) {
  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({
      conversation_type: 'order',
      order_id: orderId,
      status: 'open',
      created_by: createdBy,
    })
    .select(CHAT_CONVERSATION_SELECT)
    .single();

  if (error) {
    const existingConversation = await findOrderConversation(supabase, orderId);
    if (existingConversation) return existingConversation;

    throw new Error(error.message);
  }

  return data as ChatConversationRow;
}

async function ensureOrderParticipants(
  supabase: SupabaseClient,
  conversationId: string,
  order: ChatOrderRow,
) {
  const participants = [
    {
      conversation_id: conversationId,
      user_id: order.client_id,
      participant_role: 'client',
    },
    order.technician_id
      ? {
          conversation_id: conversationId,
          user_id: order.technician_id,
          participant_role: 'technician',
        }
      : null,
  ].filter(Boolean);

  if (!participants.length) return;

  const { error } = await supabase
    .from('chat_conversation_participants')
    .upsert(participants, { onConflict: 'conversation_id,user_id' });

  if (error) throw new Error(error.message);
}

async function announceAdminOnFirstMessage(
  supabase: SupabaseClient,
  auth: RequestAuth,
  conversation: ChatConversationRow,
) {
  const { data: previousMessage, error: previousMessageError } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('conversation_id', conversation.id)
    .eq('sender_id', auth.id)
    .eq('message_type', 'text')
    .limit(1)
    .maybeSingle();

  if (previousMessageError) throw new Error(previousMessageError.message);
  if (previousMessage) return;

  const { error } = await supabase
    .from('chat_conversation_participants')
    .upsert(
      {
        conversation_id: conversation.id,
        user_id: auth.id,
        participant_role: 'admin',
      },
      { onConflict: 'conversation_id,user_id' },
    );

  if (error) throw new Error(error.message);

  const message = await insertChatMessage(supabase, {
    conversationId: conversation.id,
    senderId: null,
    messageType: 'system',
    body: 'Un administrador se sumó a la conversación.',
    relatedOrderId: conversation.order_id,
    viewerRole: auth.role,
  });

  await recordActivityEvent(supabase, {
    actorId: auth.id,
    entityType: 'chat_conversation',
    entityId: conversation.id,
    eventType: 'chat.admin_joined',
    payload: {
      message_id: message.id,
      order_id: conversation.order_id,
    },
  });
}

async function getAuthorizedConversation(
  supabase: SupabaseClient,
  auth: RequestAuth,
  conversationId: string,
): Promise<ChatConversationRow> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select(CHAT_CONVERSATION_SELECT)
    .eq('id', conversationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('No se encontró la conversación del chat');

  const conversation = data as ChatConversationRow;

  if (auth.role === 'admin') return conversation;

  const { data: participant, error: participantError } = await supabase
    .from('chat_conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', auth.id)
    .maybeSingle();

  if (participantError) throw new Error(participantError.message);
  if (!participant)
    throw new ForbiddenError('No tenés acceso a esta conversación');

  return conversation;
}

async function hydrateConversation(
  supabase: SupabaseClient,
  auth: RequestAuth,
  row: ChatConversationRow,
): Promise<ChatConversation> {
  const [participantCount, unreadCount, lastMessage, operations, order] =
    await Promise.all([
      countConversationParticipants(supabase, row.id),
      countUnreadMessages(supabase, row.id, auth.id),
      getLastConversationMessage(supabase, row.id, auth.role),
      listConversationOperations(supabase, row.order_id, auth),
      getConversationOrderSummary(supabase, row.order_id),
    ]);

  return mapChatConversationRow(row, {
    participantCount,
    unreadCount,
    lastMessage,
    order,
    operations,
  });
}

async function getConversationOrderSummary(
  supabase: SupabaseClient,
  orderId: string | null,
): Promise<ChatConversationOrder | null> {
  if (!orderId) return null;

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
        id,
        status,
        created_at,
        client:users!orders_client_id_fkey(name, surname),
        technician:technician_profiles!orders_technician_id_fkey(
          user:users!technician_profiles_id_fkey(name, surname)
        )
      `,
    )
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as ChatConversationOrderRow;
  const client = Array.isArray(row.client) ? row.client[0] : row.client;
  const technician = Array.isArray(row.technician)
    ? row.technician[0]
    : row.technician;
  const technicianUser = technician
    ? Array.isArray(technician.user)
      ? technician.user[0]
      : technician.user
    : null;

  return {
    id: row.id,
    status: normalizeOrderStatus(row.status),
    created_at: row.created_at,
    client_name: client?.name ?? null,
    client_surname: client?.surname ?? null,
    technician_name: technicianUser?.name ?? null,
    technician_surname: technicianUser?.surname ?? null,
  };
}

function matchesConversationFilters(
  conversation: ChatConversation,
  auth: RequestAuth,
  input: ListCurrentChatConversationsInput,
) {
  const order = conversation.order;

  if (input.status && order?.status !== input.status) return false;
  if (!input.search) return true;

  const search = input.search.toLocaleLowerCase('es-AR');
  const clientName = `${order?.client_name ?? ''} ${order?.client_surname ?? ''}`;
  const technicianName = `${order?.technician_name ?? ''} ${order?.technician_surname ?? ''}`;
  const searchableText =
    auth.role === 'technician'
      ? `${order?.id ?? ''} ${clientName}`
      : auth.role === 'client'
        ? `${order?.id ?? ''} ${technicianName}`
        : `${order?.id ?? ''} ${clientName} ${technicianName}`;

  return searchableText.toLocaleLowerCase('es-AR').includes(search);
}

function normalizeOrderStatus(value: string): ChatConversationOrder['status'] {
  if (
    value === 'pending' ||
    value === 'accepted' ||
    value === 'cancelled' ||
    value === 'in_progress' ||
    value === 'completed_tech' ||
    value === 'completion_rejected' ||
    value === 'completed'
  ) {
    return value;
  }

  return 'pending';
}

async function listConversationOperations(
  supabase: SupabaseClient,
  orderId: string | null,
  auth: RequestAuth,
) {
  if (!orderId) return [];

  let query = supabase
    .from('operations')
    .select('id, status')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (auth.role === 'technician') query = query.eq('technician_id', auth.id);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).map((operation) => ({
    id: operation.id,
    status: operation.status,
  }));
}

async function countConversationParticipants(
  supabase: SupabaseClient,
  conversationId: string,
) {
  const { count, error } = await supabase
    .from('chat_conversation_participants')
    .select('conversation_id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId);

  if (error) throw new Error(error.message);

  return count ?? 0;
}

async function countUnreadMessages(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
) {
  const { data: participant, error: participantError } = await supabase
    .from('chat_conversation_participants')
    .select('last_read_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (participantError) throw new Error(participantError.message);

  let query = supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .or(`sender_id.is.null,sender_id.neq.${userId}`);

  if (participant?.last_read_at) {
    query = query.gt('created_at', participant.last_read_at as string);
  }

  const { count, error } = await query;

  if (error) throw new Error(error.message);

  return count ?? 0;
}

async function getLastConversationMessage(
  supabase: SupabaseClient,
  conversationId: string,
  viewerRole: RequestAuth['role'],
) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(CHAT_MESSAGE_SELECT)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data
    ? mapChatMessagePreviewRow(data as ChatMessageRow, viewerRole)
    : null;
}

async function insertChatMessage(
  supabase: SupabaseClient,
  input: {
    conversationId: string;
    senderId: string | null;
    messageType: 'text' | 'system' | 'action';
    body: string;
    actionType?: string | null;
    actionPayload?: Record<string, unknown> | null;
    relatedOrderId?: string | null;
    relatedOperationId?: string | null;
    viewerRole: RequestAuth['role'];
  },
) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      message_type: input.messageType,
      body: input.body,
      action_type: input.actionType ?? null,
      action_payload: input.actionPayload ?? null,
      related_order_id: input.relatedOrderId ?? null,
      related_operation_id: input.relatedOperationId ?? null,
    })
    .select(CHAT_MESSAGE_SELECT)
    .single();

  if (error) throw new Error(error.message);

  return mapChatMessageRow(data as ChatMessageRow, input.viewerRole);
}
