import { Ionicons } from '@expo/vector-icons';
import { ActionLabel } from '@/components/ActionLabel';
import { AddressLink } from '@/components/AddressLink';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { ChatQuickActions } from './ChatQuickActions';
import { formatPersonName, formatTime } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';
import {
  chatKeys,
  useChatMessages,
  useCreateChatMessage,
  useCurrentUser,
  useCurrentOrder,
  useMarkChatConversationRead,
  useOrderChatConversation,
} from '@servicienta/query-hooks';
import type { ChatMessage } from '@servicienta/types';
import { getMobileSupabaseClient } from '@/lib/supabase';
import { colors } from '@/theme/colors';

const ANDROID_KEYBOARD_CLEARANCE = 18;

export function ChatThreadScreen({
  orderId,
  operationId,
}: {
  orderId: string;
  operationId?: string;
}) {
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { data: currentUser } = useCurrentUser();
  const { data: order } = useCurrentOrder(orderId);
  const {
    data: conversation,
    error: conversationError,
    isLoading: isConversationLoading,
    refetch: refetchConversation,
  } = useOrderChatConversation(orderId);
  const conversationId = conversation?.id ?? null;
  const {
    data: messageData,
    error: messagesError,
    isLoading: areMessagesLoading,
    refetch,
  } = useChatMessages(conversationId, { page: 1, pageSize: 100 });
  const markRead = useMarkChatConversationRead();
  const messages = messageData?.items ?? [];

  useConversationRealtime(conversationId);

  useEffect(() => {
    if (!conversationId) return;
    void queryClient.invalidateQueries({
      queryKey: chatKeys.conversationLists(),
    });
  }, [conversationId, queryClient]);

  useEffect(() => {
    navigation.setOptions({ title: 'Chat del pedido' });
  }, [navigation]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        requestAnimationFrame(() =>
          listRef.current?.scrollToEnd({ animated: true }),
        );
      },
    );
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!conversationId || !messages.length) return;
    markRead.mutate(conversationId);
  }, [conversationId, messages.length]);

  useEffect(() => {
    if (!messages.length) return;
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: false }),
    );
  }, [messages.length]);

  if (isConversationLoading || areMessagesLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.muted}>Cargando chat…</Text>
      </View>
    );
  }

  const error = conversationError ?? messagesError;
  if (error || !conversation) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo abrir el chat.'}
        </Text>
        <Pressable
          onPress={() => {
            void refetchConversation();
            void refetch();
          }}
          style={styles.retryButton}
        >
          <ActionLabel icon="refresh-outline" textStyle={styles.retryText}>
            Reintentar
          </ActionLabel>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.screen}
    >
      <View style={styles.context}>
        <View style={styles.contextCopy}>
          <Text
            numberOfLines={1}
            style={[
              styles.sender,
              currentUser?.role === 'technician' && order && styles.clientLink,
            ]}
            accessibilityRole={
              currentUser?.role === 'technician' && order ? 'link' : undefined
            }
            accessibilityLabel={
              currentUser?.role === 'technician' && order
                ? `Ver detalle de ${formatPersonName(order.client_name, order.client_surname)}`
                : undefined
            }
            onPress={
              currentUser?.role === 'technician' && order
                ? () =>
                    router.push({
                      pathname: '/orders/[orderId]/client',
                      params: { orderId },
                    })
                : undefined
            }
          >
            {conversation.order
              ? formatPersonName(
                  currentUser?.role === 'client'
                    ? conversation.order.technician_name
                    : conversation.order.client_name,
                  currentUser?.role === 'client'
                    ? conversation.order.technician_surname
                    : conversation.order.client_surname,
                )
              : 'Pedido'}
          </Text>
          {order?.service_address_text ? (
            <AddressLink
              address={order.service_address_text}
              zone={order.zone_slug}
              style={styles.contextAddress}
            />
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          style={styles.contextButton}
          onPress={() =>
            router.push({ pathname: '/orders/[orderId]', params: { orderId } })
          }
        >
          <ActionLabel icon="clipboard-outline" textStyle={styles.sender}>
            Ver pedido
          </ActionLabel>
        </Pressable>
      </View>
      {(conversation.operations ?? [])
        .filter((item) => !operationId || item.id === operationId)
        .map((item) => (
          <ChatQuickActions
            key={item.id}
            conversationId={conversation.id}
            operation={item}
            canManage={currentUser?.role === 'technician'}
          />
        ))}
      <FlatList
        ref={listRef}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={styles.messages}
        data={messages}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(message) => message.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Todavía no hay mensajes. Escribí para coordinar la visita.
          </Text>
        }
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: false })
        }
        renderItem={({ item }) => (
          <MessageBubble
            isOwn={item.sender_id === currentUser?.id}
            message={item}
          />
        )}
      />
      <ChatComposer
        conversationId={conversation.id}
        currentUser={currentUser ?? null}
        keyboardInset={keyboardHeight}
      />
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  isOwn,
  message,
}: {
  isOwn: boolean;
  message: ChatMessage;
}) {
  const sender = message.sender_id
    ? [message.sender_name, message.sender_surname].filter(Boolean).join(' ') ||
      message.sender_email ||
      'Usuario'
    : 'Sistema';

  return (
    <View
      style={[
        styles.bubble,
        isOwn && styles.ownBubble,
        message.message_type === 'action' && styles.actionBubble,
      ]}
    >
      {!isOwn || message.message_type === 'action' ? (
        <Text style={styles.sender}>{isOwn ? 'Vos' : sender}</Text>
      ) : null}
      <Text style={styles.messageText}>{message.body}</Text>
      <Text style={styles.messageTime}>{formatTime(message.created_at)}</Text>
    </View>
  );
}

function ChatComposer({
  conversationId,
  currentUser,
  keyboardInset,
}: {
  conversationId: string;
  currentUser: {
    id: string;
    email: string;
    name: string | null;
    surname: string | null;
    role: ChatMessage['sender_role'];
  } | null;
  keyboardInset: number;
}) {
  const [body, setBody] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const createMessage = useCreateChatMessage();

  function handleSend() {
    const trimmedBody = body.trim();
    if (!trimmedBody || createMessage.isPending) return;

    setBody('');
    setErrorMessage('');
    createMessage.mutate(
      {
        conversationId,
        input: { body: trimmedBody },
        optimisticMessage: {
          id: `optimistic:${Date.now()}:${Math.random().toString(36).slice(2)}`,
          conversation_id: conversationId,
          sender_id: currentUser?.id ?? null,
          sender_email: currentUser?.email ?? null,
          sender_name: currentUser?.name ?? null,
          sender_surname: currentUser?.surname ?? null,
          sender_role: currentUser?.role ?? null,
          message_type: 'text',
          body: trimmedBody,
          action_type: null,
          action_payload: null,
          related_order_id: null,
          related_operation_id: null,
          created_at: new Date().toISOString(),
        },
      },
      {
        onError: (error) => {
          setBody((current) => current || trimmedBody);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'No se pudo enviar el mensaje.',
          );
        },
      },
    );
  }

  return (
    <View
      style={[
        styles.composerContainer,
        keyboardInset > 0 && {
          marginBottom: keyboardInset + ANDROID_KEYBOARD_CLEARANCE,
        },
      ]}
    >
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <View style={styles.composer}>
        <TextInput
          editable={!createMessage.isPending}
          multiline
          onChangeText={setBody}
          placeholder="Escribí un mensaje"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={body}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          accessibilityState={{
            disabled: !body.trim() || createMessage.isPending,
            busy: createMessage.isPending,
          }}
          disabled={!body.trim() || createMessage.isPending}
          onPress={handleSend}
          style={[
            styles.sendButton,
            (!body.trim() || createMessage.isPending) && styles.disabled,
          ]}
        >
          {createMessage.isPending ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Ionicons
              name="send-outline"
              size={24}
              color={colors.text}
              accessible={false}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function useConversationRealtime(conversationId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getMobileSupabaseClient();
    if (!conversationId || !supabase) return;

    const channel = supabase
      .channel(`mobile-chat-messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['chat', 'messages', conversationId],
          });
          void queryClient.invalidateQueries({
            queryKey: ['chat', 'conversations'],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contextCopy: { flex: 1, gap: 4 },
  clientLink: { fontSize: 14.4, paddingVertical: 8 },
  contextAddress: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  contextButton: { minHeight: 44, justifyContent: 'center', padding: 8 },
  actionBubble: {
    alignSelf: 'center',
    maxWidth: '95%',
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
    backgroundColor: colors.background,
  },
  muted: { color: colors.muted },
  error: { color: '#ff8d87', lineHeight: 20 },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  retryText: { color: colors.text, fontWeight: '900' },
  messages: { flexGrow: 1, gap: 10, padding: 16, paddingBottom: 24 },
  emptyText: {
    margin: 'auto',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  bubble: {
    maxWidth: '84%',
    alignSelf: 'flex-start',
    gap: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.surface,
  },
  ownBubble: {
    alignSelf: 'flex-end',
    borderColor: 'rgba(39, 180, 126, 0.45)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
    backgroundColor: 'rgba(39, 180, 126, 0.18)',
  },
  sender: { color: colors.accent, fontSize: 12, fontWeight: '800' },
  messageText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  messageTime: { alignSelf: 'flex-end', color: colors.muted, fontSize: 10 },
  composerContainer: {
    gap: 6,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: {
    flex: 1,
    minWidth: 0,
    maxHeight: 120,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 15,
  },
  sendButton: {
    width: 46,
    height: 46,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.accent,
  },
  disabled: { opacity: 0.45 },
});
