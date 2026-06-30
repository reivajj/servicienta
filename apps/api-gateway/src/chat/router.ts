import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ok } from '../core/http-response.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/require-auth.js';
import {
  createChatMessage,
  getOrCreateOrderChatConversation,
  listChatMessages,
  listCurrentChatConversations,
  markChatConversationRead,
  scheduleOperationFromChat,
} from './service.js';
import {
  validateConversationId,
  validateCreateChatMessageInput,
  validateListChatMessagesInput,
  validateListCurrentChatConversationsInput,
  validateOrderId,
  validateScheduleOperationFromChatInput,
} from './validators.js';

interface ChatRouterOptions {
  supabase: SupabaseClient;
}

export function chatRouter(options: ChatRouterOptions) {
  const router = Router();

  router.get(
    '/api/chat/conversations/current',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const conversations = await listCurrentChatConversations(
        options.supabase,
        request.auth!,
        validateListCurrentChatConversationsInput({
          page: readQueryParam(request.query.page),
          pageSize: readQueryParam(request.query.pageSize),
        }),
      );

      ok(response, conversations);
    }),
  );

  router.get(
    '/api/chat/conversations/orders/:orderId',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const conversation = await getOrCreateOrderChatConversation(
        options.supabase,
        request.auth!,
        validateOrderId(request.params.orderId),
      );

      ok(response, conversation);
    }),
  );

  router.get(
    '/api/chat/conversations/:conversationId/messages',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const messages = await listChatMessages(
        options.supabase,
        request.auth!,
        validateConversationId(request.params.conversationId),
        validateListChatMessagesInput({
          page: readQueryParam(request.query.page),
          pageSize: readQueryParam(request.query.pageSize),
        }),
      );

      ok(response, messages);
    }),
  );

  router.post(
    '/api/chat/conversations/:conversationId/messages',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const message = await createChatMessage(
        options.supabase,
        request.auth!,
        validateConversationId(request.params.conversationId),
        validateCreateChatMessageInput(request.body),
      );

      ok(response, message, 201);
    }),
  );

  router.post(
    '/api/chat/conversations/:conversationId/read',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const conversation = await markChatConversationRead(
        options.supabase,
        request.auth!,
        validateConversationId(request.params.conversationId),
      );

      ok(response, conversation);
    }),
  );

  router.post(
    '/api/chat/conversations/:conversationId/actions/schedule-operation',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const result = await scheduleOperationFromChat(
        options.supabase,
        request.auth!,
        validateConversationId(request.params.conversationId),
        validateScheduleOperationFromChatInput(request.body),
      );

      ok(response, result);
    }),
  );

  return router;
}

function readQueryParam(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];

  return undefined;
}
