import type {
  ListChatMessagesInput,
  ListCurrentChatConversationsInput,
} from '@servicienta/types';

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversationLists: () => [...chatKeys.conversations(), 'list'] as const,
  conversationList: (input: ListCurrentChatConversationsInput) =>
    [...chatKeys.conversationLists(), input] as const,
  orderConversation: (orderId: string) =>
    [...chatKeys.conversations(), 'order', orderId] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, 'messages', conversationId] as const,
  messageList: (conversationId: string, input: ListChatMessagesInput) =>
    [...chatKeys.messages(conversationId), input] as const,
};
