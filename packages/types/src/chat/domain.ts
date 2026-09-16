import type { UserRole } from '../users/domain.js';
import type { OperationStatus } from '../operations/domain.js';
import type { OrderStatus } from '../orders/domain.js';

export type ChatConversationType = 'order' | 'direct';
export type ChatConversationStatus = 'open' | 'closed' | 'archived';
export type ChatParticipantRole = Extract<
  UserRole,
  'admin' | 'technician' | 'client'
>;
export type ChatMessageType = 'text' | 'system' | 'action';

export type ChatActionType =
  | 'operation.schedule'
  | 'operation.cancel'
  | 'operation.complete_tech'
  | 'operation.confirm_completed';

export interface ChatConversationOperation {
  id: string;
  status: OperationStatus;
}

export interface ChatConversation {
  id: string;
  conversation_type: ChatConversationType;
  order_id: string | null;
  status: ChatConversationStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  participant_count: number;
  unread_count: number;
  last_message: ChatMessagePreview | null;
  order: ChatConversationOrder | null;
  operations?: ChatConversationOperation[];
}

export interface ChatConversationOrder {
  id: string;
  status: OrderStatus;
  created_at: string;
  client_name: string | null;
  client_surname: string | null;
  technician_name: string | null;
  technician_surname: string | null;
}

export interface ChatMessagePreview {
  id: string;
  message_type: ChatMessageType;
  body: string;
  sender_id: string | null;
  sender_email: string | null;
  sender_name: string | null;
  sender_surname: string | null;
  created_at: string;
}

export interface ChatParticipant {
  conversation_id: string;
  user_id: string;
  participant_role: ChatParticipantRole;
  joined_at: string;
  last_read_at: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_email: string | null;
  sender_name: string | null;
  sender_surname: string | null;
  sender_role: UserRole | null;
  message_type: ChatMessageType;
  body: string;
  action_type: ChatActionType | null;
  action_payload: Record<string, unknown> | null;
  related_order_id: string | null;
  related_operation_id: string | null;
  created_at: string;
}
