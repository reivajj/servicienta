import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useChatMessages,
  useCreateChatMessage,
  useCurrentUser,
  useMarkChatConversationRead,
  useOrderChatConversation,
  useScheduleOperationFromChat,
} from '@servicienta/query-hooks';
import { OPERATION_SCHEDULE_STEP_MINUTES } from '@servicienta/types';
import type { ChatMessage } from '@servicienta/types';
import { getSupabaseBrowserClient } from '../../../lib/supabase';
import { DateTimePickerField } from '../../shared/components/DateTimePickerField';
import { useEscapeKey } from '../../shared/hooks/useEscapeKey';

function formatSenderName(message: ChatMessage) {
  if (message.message_type === 'system') return 'Sistema';

  const fullName =
    `${message.sender_name ?? ''} ${message.sender_surname ?? ''}`.trim();

  if (fullName) return fullName;
  if (message.sender_email) return message.sender_email;

  return 'Usuario';
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getMessageClass(message: ChatMessage, currentUserId: string | null) {
  if (message.message_type === 'system')
    return 'chat-message chat-message--system';
  if (message.message_type === 'action')
    return 'chat-message chat-message--action';
  if (message.sender_id && message.sender_id === currentUserId) {
    return 'chat-message chat-message--own';
  }

  return 'chat-message';
}

function ChatMessageList({
  messages,
  currentUserId,
}: {
  messages: ChatMessage[];
  currentUserId: string | null;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  return (
    <div className="chat-thread__messages">
      {messages.length ? (
        messages.map((message) => (
          <article
            key={message.id}
            className={getMessageClass(message, currentUserId)}
          >
            <div className="chat-message__meta">
              <span>{formatSenderName(message)}</span>
              <span>{formatMessageTime(message.created_at)}</span>
            </div>
            <p>{message.body}</p>
          </article>
        ))
      ) : (
        <p className="users-message">Todavía no hay mensajes.</p>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function ChatComposer({ conversationId }: { conversationId: string }) {
  const [body, setBody] = useState('');
  const createMessage = useCreateChatMessage();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedBody = body.trim();

    if (!trimmedBody) return;

    await createMessage.mutateAsync({
      conversationId,
      input: { body: trimmedBody },
    });
    setBody('');
  }

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      <label className="chat-composer__field">
        <span>Mensaje</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escribí un mensaje"
          rows={3}
        />
      </label>
      <button
        type="submit"
        className="orders-dialog__primary-action"
        disabled={createMessage.isPending || !body.trim()}
      >
        {createMessage.isPending ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}

function ChatActionBar({
  conversationId,
  operationId,
  canSchedule,
}: {
  conversationId: string;
  operationId?: string | null;
  canSchedule: boolean;
}) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const scheduleFromChat = useScheduleOperationFromChat();

  if (!operationId || !canSchedule) return null;

  async function handleScheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await scheduleFromChat.mutateAsync({
      conversationId,
      input: {
        operation_id: operationId!,
        scheduled_at: String(formData.get('scheduled_at') ?? ''),
        description: String(formData.get('description') ?? ''),
      },
    });
    setShowScheduleForm(false);
  }

  return (
    <section className="chat-action-card">
      <div className="chat-action-card__header">
        <div>
          <p className="user-card__label">Acciones</p>
          <h3>Coordinar visita</h3>
        </div>
        <button
          type="button"
          className="users-table__action users-table__action--icon users-table__action--chat"
          aria-label="Agendar visita"
          title="Agendar visita"
          onClick={() => setShowScheduleForm((current) => !current)}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="users-table__action-icon"
          >
            <path
              d="M7 3.5v3M17 3.5v3M4.5 9.5h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="m9 15 1.7 1.7L15.5 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {showScheduleForm ? (
        <form
          className="auth-form chat-action-card__form"
          onSubmit={handleScheduleSubmit}
        >
          <DateTimePickerField
            name="scheduled_at"
            label="Fecha y horario"
            initialValue={null}
            required
            disablePastDates
            preventPastTimeSelection
            minuteStep={OPERATION_SCHEDULE_STEP_MINUTES}
          />
          <label className="auth-form__field">
            <span>Descripción técnica</span>
            <input name="description" type="text" required />
          </label>
          <button
            type="submit"
            className="orders-dialog__primary-action"
            disabled={scheduleFromChat.isPending}
          >
            {scheduleFromChat.isPending ? 'Agendando...' : 'Agendar'}
          </button>
          <p
            className={
              scheduleFromChat.error
                ? 'users-message users-message--error'
                : 'users-message'
            }
          >
            {scheduleFromChat.error instanceof Error
              ? scheduleFromChat.error.message
              : ' '}
          </p>
        </form>
      ) : null}
    </section>
  );
}

function useConversationRealtime(conversationId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`chat-messages:${conversationId}`)
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

export function ChatDialog({
  orderId,
  operationId,
  onClose,
}: {
  orderId: string;
  operationId?: string | null;
  onClose: () => void;
}) {
  useEscapeKey(onClose);
  const { data: currentUser } = useCurrentUser();
  const {
    data: conversation,
    isLoading,
    error,
  } = useOrderChatConversation(orderId);
  const { data: messagesData } = useChatMessages(conversation?.id ?? null, {
    page: 1,
    pageSize: 100,
  });
  const markRead = useMarkChatConversationRead();
  const messages = messagesData?.items ?? [];
  const conversationId = conversation?.id ?? null;

  useConversationRealtime(conversationId);

  useEffect(() => {
    if (!conversationId || !messages.length) return;

    markRead.mutate(conversationId);
  }, [conversationId, messages.length]);

  return (
    <div
      className="users-modal users-modal--stacked"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-dialog-title"
      onClick={onClose}
    >
      <section
        className="users-modal__panel chat-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="users-modal__header">
          <div>
            <p className="users-hero__eyebrow">Chat interno</p>
            <h2 id="chat-dialog-title">Conversación de la order</h2>
          </div>
          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
          >
            Cerrar
          </button>
        </header>

        {isLoading ? (
          <p className="users-message">Cargando chat...</p>
        ) : error || !conversation ? (
          <p className="users-message users-message--error">
            {error instanceof Error
              ? error.message
              : 'No se pudo cargar el chat'}
          </p>
        ) : (
          <section className="chat-thread">
            <ChatActionBar
              conversationId={conversation.id}
              operationId={operationId}
              canSchedule={currentUser?.role === 'technician'}
            />
            <ChatMessageList
              messages={messages}
              currentUserId={currentUser?.id ?? null}
            />
            <ChatComposer conversationId={conversation.id} />
          </section>
        )}
      </section>
    </div>
  );
}
