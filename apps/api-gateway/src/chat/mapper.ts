import type {
  ChatActionType,
  ChatConversation,
  ChatConversationOperation,
  ChatConversationOrder,
  ChatMessage,
  ChatMessagePreview,
  UserRole,
} from '@servicienta/types';
import type { ChatConversationRow, ChatMessageRow } from './types.js';

export interface MapChatConversationOptions {
  participantCount: number;
  unreadCount: number;
  lastMessage: ChatMessagePreview | null;
  order: ChatConversationOrder | null;
  operations: ChatConversationOperation[];
}

export function mapChatConversationRow(
  row: ChatConversationRow,
  options: MapChatConversationOptions,
): ChatConversation {
  return {
    id: row.id,
    conversation_type: row.conversation_type,
    order_id: row.order_id,
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_message_at: row.last_message_at,
    participant_count: options.participantCount,
    unread_count: options.unreadCount,
    last_message: options.lastMessage,
    order: options.order,
    operations: options.operations,
  };
}

export function mapChatMessageRow(
  row: ChatMessageRow,
  viewerRole: UserRole,
): ChatMessage {
  const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
  const hideAdminIdentity = sender?.role === 'admin' && viewerRole !== 'admin';

  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    sender_email: hideAdminIdentity ? null : (sender?.email ?? null),
    sender_name: hideAdminIdentity ? 'Soporte' : (sender?.name ?? null),
    sender_surname: hideAdminIdentity ? null : (sender?.surname ?? null),
    sender_role: sender?.role ?? null,
    message_type: row.message_type,
    body: row.body,
    action_type: normalizeActionType(row.action_type),
    action_payload: row.action_payload,
    related_order_id: row.related_order_id,
    related_operation_id: row.related_operation_id,
    created_at: row.created_at,
  };
}

export function mapChatMessagePreviewRow(
  row: ChatMessageRow,
  viewerRole: UserRole,
): ChatMessagePreview {
  const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
  const hideAdminIdentity = sender?.role === 'admin' && viewerRole !== 'admin';

  return {
    id: row.id,
    message_type: row.message_type,
    body: row.body,
    sender_id: row.sender_id,
    sender_email: hideAdminIdentity ? null : (sender?.email ?? null),
    sender_name: hideAdminIdentity ? 'Soporte' : (sender?.name ?? null),
    sender_surname: hideAdminIdentity ? null : (sender?.surname ?? null),
    created_at: row.created_at,
  };
}

function normalizeActionType(value: string | null): ChatActionType | null {
  if (
    value === 'operation.schedule' ||
    value === 'operation.cancel' ||
    value === 'operation.complete_tech' ||
    value === 'operation.confirm_completed'
  ) {
    return value;
  }

  return null;
}
