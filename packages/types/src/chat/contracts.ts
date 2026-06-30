import type { UsersPageSize } from '../users/contracts.js';
import type { ScheduleOperationInput } from '../operations/contracts.js';
import type { ChatConversation, ChatMessage } from './domain.js';

export interface ListCurrentChatConversationsInput {
  page: number;
  pageSize: UsersPageSize;
}

export interface PaginatedChatConversationsPagination {
  page: number;
  pageSize: UsersPageSize;
  total: number;
  totalPages: number;
}

export interface PaginatedChatConversations {
  items: ChatConversation[];
  pagination: PaginatedChatConversationsPagination;
}

export interface ListCurrentChatConversationsResponse {
  data: PaginatedChatConversations;
}

export interface GetOrderChatConversationResponse {
  data: ChatConversation;
}

export interface ListChatMessagesInput {
  page: number;
  pageSize: UsersPageSize;
}

export interface PaginatedChatMessagesPagination {
  page: number;
  pageSize: UsersPageSize;
  total: number;
  totalPages: number;
}

export interface PaginatedChatMessages {
  items: ChatMessage[];
  pagination: PaginatedChatMessagesPagination;
}

export interface ListChatMessagesResponse {
  data: PaginatedChatMessages;
}

export interface CreateChatMessageInput {
  body: string;
}

export interface CreateChatMessageResponse {
  data: ChatMessage;
}

export interface MarkChatConversationReadResponse {
  data: ChatConversation;
}

export interface ScheduleOperationFromChatInput extends ScheduleOperationInput {
  operation_id: string;
}

export interface ScheduleOperationFromChatResponse {
  data: {
    conversation: ChatConversation;
    message: ChatMessage;
  };
}
