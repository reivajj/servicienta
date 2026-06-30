import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateChatMessageInput,
  ListChatMessagesInput,
  ListCurrentChatConversationsInput,
  ScheduleOperationFromChatInput,
} from '@servicienta/types';
import { operationKeys } from '../operations/keys.js';
import { orderKeys } from '../orders/keys.js';
import { useApiClient } from '../core/api-client-context.js';
import { chatKeys } from './keys.js';

export function useCurrentChatConversations(
  input: ListCurrentChatConversationsInput,
) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: chatKeys.conversationList(input),
    queryFn: async () => {
      const response = await apiClient.chat.conversations.current(input);
      return response.data;
    },
  });
}

export function useOrderChatConversation(
  orderId: string,
  options?: { enabled?: boolean },
) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: chatKeys.orderConversation(orderId),
    queryFn: async () => {
      const response =
        await apiClient.chat.conversations.getOrderConversation(orderId);
      return response.data;
    },
    enabled: Boolean(orderId) && (options?.enabled ?? true),
  });
}

export function useChatMessages(
  conversationId: string | null,
  input: ListChatMessagesInput,
) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: chatKeys.messageList(conversationId ?? '', input),
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation id is required');

      const response = await apiClient.chat.messages.list(
        conversationId,
        input,
      );
      return response.data;
    },
    enabled: Boolean(conversationId),
  });
}

export function useCreateChatMessage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      input,
    }: {
      conversationId: string;
      input: CreateChatMessageInput;
    }) => apiClient.chat.messages.create(conversationId, input),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversationLists(),
      });
    },
  });
}

export function useMarkChatConversationRead() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      apiClient.chat.conversations.markRead(conversationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversationLists(),
      });
    },
  });
}

export function useScheduleOperationFromChat() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      input,
    }: {
      conversationId: string;
      input: ScheduleOperationFromChatInput;
    }) => apiClient.chat.actions.scheduleOperation(conversationId, input),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversationLists(),
      });
      void queryClient.invalidateQueries({ queryKey: operationKeys.current() });
      void queryClient.invalidateQueries({ queryKey: operationKeys.admin() });
      void queryClient.invalidateQueries({ queryKey: orderKeys.current() });
      void queryClient.invalidateQueries({ queryKey: orderKeys.admin() });
    },
  });
}
