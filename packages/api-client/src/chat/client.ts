import type {
  CreateChatMessageInput,
  CreateChatMessageResponse,
  GetOrderChatConversationResponse,
  ListChatMessagesInput,
  ListChatMessagesResponse,
  ListCurrentChatConversationsInput,
  ListCurrentChatConversationsResponse,
  MarkChatConversationReadResponse,
  ScheduleOperationFromChatInput,
  ScheduleOperationFromChatResponse,
} from '@servicienta/types';

interface ChatApiClientDependencies {
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
}

export interface ChatApiClient {
  chat: {
    conversations: {
      current: (
        input: ListCurrentChatConversationsInput,
      ) => Promise<ListCurrentChatConversationsResponse>;
      getOrderConversation: (
        orderId: string,
      ) => Promise<GetOrderChatConversationResponse>;
      markRead: (
        conversationId: string,
      ) => Promise<MarkChatConversationReadResponse>;
    };
    messages: {
      list: (
        conversationId: string,
        input: ListChatMessagesInput,
      ) => Promise<ListChatMessagesResponse>;
      create: (
        conversationId: string,
        input: CreateChatMessageInput,
      ) => Promise<CreateChatMessageResponse>;
    };
    actions: {
      scheduleOperation: (
        conversationId: string,
        input: ScheduleOperationFromChatInput,
      ) => Promise<ScheduleOperationFromChatResponse>;
    };
  };
}

function buildChatPaginationQuery(
  input: ListCurrentChatConversationsInput | ListChatMessagesInput,
) {
  return new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  }).toString();
}

export function createChatApiClient({
  apiFetch,
}: ChatApiClientDependencies): ChatApiClient {
  return {
    chat: {
      conversations: {
        current: (input) =>
          apiFetch<ListCurrentChatConversationsResponse>(
            `/api/chat/conversations/current?${buildChatPaginationQuery(input)}`,
          ),
        getOrderConversation: (orderId) =>
          apiFetch<GetOrderChatConversationResponse>(
            `/api/chat/conversations/orders/${orderId}`,
          ),
        markRead: (conversationId) =>
          apiFetch<MarkChatConversationReadResponse>(
            `/api/chat/conversations/${conversationId}/read`,
            { method: 'POST' },
          ),
      },
      messages: {
        list: (conversationId, input) =>
          apiFetch<ListChatMessagesResponse>(
            `/api/chat/conversations/${conversationId}/messages?${buildChatPaginationQuery(input)}`,
          ),
        create: (conversationId, input) =>
          apiFetch<CreateChatMessageResponse>(
            `/api/chat/conversations/${conversationId}/messages`,
            {
              method: 'POST',
              body: JSON.stringify(input),
            },
          ),
      },
      actions: {
        scheduleOperation: (conversationId, input) =>
          apiFetch<ScheduleOperationFromChatResponse>(
            `/api/chat/conversations/${conversationId}/actions/schedule-operation`,
            {
              method: 'POST',
              body: JSON.stringify(input),
            },
          ),
      },
    },
  };
}
