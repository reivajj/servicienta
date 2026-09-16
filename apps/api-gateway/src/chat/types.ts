import type {
  ChatConversationStatus,
  ChatConversationType,
  ChatMessageType,
  ChatParticipantRole,
  UserRole,
} from '@servicienta/types';

export interface ChatConversationRow {
  id: string;
  conversation_type: ChatConversationType;
  order_id: string | null;
  status: ChatConversationStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface ChatParticipantRow {
  conversation_id: string;
  user_id: string;
  participant_role: ChatParticipantRole;
  joined_at: string;
  last_read_at: string | null;
}

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  message_type: ChatMessageType;
  body: string;
  action_type: string | null;
  action_payload: Record<string, unknown> | null;
  related_order_id: string | null;
  related_operation_id: string | null;
  created_at: string;
  sender?:
    | {
        email: string;
        name: string | null;
        surname: string | null;
        role: UserRole;
      }
    | Array<{
        email: string;
        name: string | null;
        surname: string | null;
        role: UserRole;
      }>
    | null;
}

export interface ChatOrderRow {
  id: string;
  client_id: string;
  technician_id: string | null;
}

export interface ChatConversationOrderRow {
  id: string;
  status: string;
  created_at: string;
  client:
    | { name: string | null; surname: string | null }
    | Array<{ name: string | null; surname: string | null }>
    | null;
  technician:
    | {
        user:
          | { name: string | null; surname: string | null }
          | Array<{ name: string | null; surname: string | null }>
          | null;
      }
    | Array<{
        user:
          | { name: string | null; surname: string | null }
          | Array<{ name: string | null; surname: string | null }>
          | null;
      }>
    | null;
}
