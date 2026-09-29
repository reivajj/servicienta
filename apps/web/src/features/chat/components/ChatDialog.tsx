import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  useCancelOperationFromChat,
  useChatMessages,
  useCreateChatMessage,
  useAdminOrder,
  useCurrentOrder,
  useCurrentUser,
  useMarkChatConversationRead,
  useOrderChatConversation,
  useScheduleOperationFromChat,
} from '@servicienta/query-hooks';
import { OPERATION_SCHEDULE_STEP_MINUTES } from '@servicienta/types';
import type { ChatConversationOperation, ChatMessage } from '@servicienta/types';
import { getSupabaseBrowserClient } from '../../../lib/supabase';
import { DateTimePickerField } from '../../shared/components/DateTimePickerField';
import { useEscapeKey } from '../../shared/hooks/useEscapeKey';
import { formatOrderStatus } from '../../shared/utils/operation-status';

function getDefaultSchedule() {
  const now = new Date();
  const suggestedDate = new Date(now.getTime() + 30 * 60 * 1000);
  suggestedDate.setMinutes(
    Math.ceil(suggestedDate.getMinutes() / OPERATION_SCHEDULE_STEP_MINUTES) *
      OPERATION_SCHEDULE_STEP_MINUTES,
    0,
    0,
  );

  return suggestedDate.toISOString();
}

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

function formatCounterpartName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function ChatOrderContext({
  order,
  role,
  scheduledAt,
}: {
  order: {
    status: Parameters<typeof formatOrderStatus>[0];
    created_at: string;
    client_name: string | null;
    client_surname: string | null;
    technician_name: string | null;
    technician_surname: string | null;
  };
  role: 'admin' | 'client' | 'technician';
  scheduledAt?: string | null;
}) {
  const isAdmin = role === 'admin';
  const isTechnician = role === 'technician';
  const counterpartLabel = isTechnician ? 'Cliente' : 'Técnico';
  const counterpartName = isTechnician
    ? formatCounterpartName(order.client_name, order.client_surname)
    : formatCounterpartName(order.technician_name, order.technician_surname);

  return (
    <dl className={`chat-order-context chat-order-context--${role}`}>
      <div>
        <dt>Estado del pedido</dt>
        <dd>
          <span className={`status-badge status-badge--${order.status}`}>
            {formatOrderStatus(order.status)}
          </span>
        </dd>
      </div>
      {isAdmin ? (
        <>
          <div>
            <dt>Cliente</dt>
            <dd
              title={formatCounterpartName(
                order.client_name,
                order.client_surname,
              )}
            >
              {formatCounterpartName(order.client_name, order.client_surname)}
            </dd>
          </div>
          <div>
            <dt>Técnico</dt>
            <dd
              title={formatCounterpartName(
                order.technician_name,
                order.technician_surname,
              )}
            >
              {formatCounterpartName(
                order.technician_name,
                order.technician_surname,
              )}
            </dd>
          </div>
        </>
      ) : (
        <div>
          <dt>{counterpartLabel}</dt>
          <dd title={counterpartName}>{counterpartName}</dd>
        </div>
      )}
      <div>
        <dt>Creado el</dt>
        <dd>{formatMessageTime(order.created_at)}</dd>
      </div>
      {scheduledAt ? (
        <div className="chat-order-context__visit">
          <dt>Fecha y horario de la visita</dt>
          <dd>{formatMessageTime(scheduledAt)}</dd>
        </div>
      ) : null}
    </dl>
  );
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

function ChatComposer({
  conversationId,
  currentUser,
}: {
  conversationId: string;
  currentUser: {
    id: string;
    email: string;
    name: string | null;
    surname: string | null;
    role: ChatMessage['sender_role'];
  } | null;
}) {
  const [body, setBody] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const createMessage = useCreateChatMessage();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedBody = body.trim();

    if (!trimmedBody) return;

    setBody('');
    setSendError(null);
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
        onError: (mutationError) => {
          setBody((currentBody) => currentBody || trimmedBody);
          setSendError(
            mutationError instanceof Error
              ? mutationError.message
              : 'No se pudo enviar el mensaje. Intentá nuevamente.',
          );
        },
      },
    );
  }

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      <label className="chat-composer__field">
        <span>Mensaje</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key !== 'Enter' ||
              event.shiftKey ||
              event.nativeEvent.isComposing
            ) {
              return;
            }

            event.preventDefault();
            if (createMessage.isPending || !body.trim()) return;

            event.currentTarget.form?.requestSubmit();
          }}
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
      {sendError ? (
        <div className="chat-composer__error">
          <p className="users-message users-message--error">{sendError}</p>
          <button
            type="submit"
            className="users-table__action"
            disabled={createMessage.isPending || !body.trim()}
          >
            Reintentar
          </button>
        </div>
      ) : null}
    </form>
  );
}

function ChatActionBar({
  conversationId,
  operation,
  canManage,
}: {
  conversationId: string;
  operation?: ChatConversationOperation | null;
  canManage: boolean;
}) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const scheduleFromChat = useScheduleOperationFromChat();
  const cancelFromChat = useCancelOperationFromChat();

  if (
    !operation ||
    !canManage ||
    (operation.status !== 'pending' && operation.status !== 'scheduled')
  ) {
    return null;
  }

  const isScheduled = operation.status === 'scheduled';
  const isPending = scheduleFromChat.isPending || cancelFromChat.isPending;
  const initialSchedule = operation.scheduled_at ?? getDefaultSchedule();

  async function handleScheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const scheduledAt = String(formData.get('scheduled_at') ?? '');

    await scheduleFromChat.mutateAsync({
      conversationId,
      input: {
        operation_id: operation!.id,
        scheduled_at: new Date(scheduledAt).toISOString(),
        description: String(formData.get('description') ?? ''),
      },
    });
    setShowScheduleForm(false);
  }

  async function handleCancel() {
    await cancelFromChat.mutateAsync({
      conversationId,
      input: { operation_id: operation!.id },
    });
    setShowCancelConfirmation(false);
  }

  return (
    <section className="chat-action-card">
      <div className="chat-action-card__header">
        <div>
          <p className="user-card__label">Acciones rápidas</p>
          <h3>Gestionar visita</h3>
        </div>
        <div className="chat-action-card__actions">
          <button
            type="button"
            className="users-table__action"
            disabled={isPending}
            onClick={() => {
              setShowCancelConfirmation(false);
              setShowScheduleForm((current) => !current);
            }}
          >
            {isScheduled ? 'Cambiar fecha y horario' : 'Agendar visita'}
          </button>
          <button
            type="button"
            className="users-table__action users-table__action--danger"
            disabled={isPending}
            onClick={() => {
              setShowScheduleForm(false);
              setShowCancelConfirmation(true);
            }}
          >
            Cancelar visita
          </button>
        </div>
      </div>

      {showScheduleForm ? (
        <form
          className="auth-form chat-action-card__form"
          onSubmit={handleScheduleSubmit}
        >
          <DateTimePickerField
            name="scheduled_at"
            label={isScheduled ? 'Nueva fecha y horario' : 'Fecha y horario'}
            initialValue={initialSchedule}
            required
            disablePastDates
            preventPastTimeSelection
            minuteStep={OPERATION_SCHEDULE_STEP_MINUTES}
          />
          <label className="auth-form__field">
            <span>Descripción técnica</span>
            <input
              name="description"
              type="text"
              defaultValue={operation.description ?? ''}
              required
            />
          </label>
          <div className="chat-action-card__form-actions">
            <button
              type="submit"
              className="orders-dialog__primary-action"
              disabled={isPending}
            >
              {scheduleFromChat.isPending
                ? isScheduled
                  ? 'Reprogramando...'
                  : 'Agendando...'
                : isScheduled
                  ? 'Guardar nuevo horario'
                  : 'Agendar'}
            </button>
            <button
              type="button"
              className="users-table__action"
              disabled={isPending}
              onClick={() => setShowScheduleForm(false)}
            >
              Volver
            </button>
          </div>
        </form>
      ) : null}

      {showCancelConfirmation ? (
        <div className="chat-action-card__confirmation">
          <p>¿Confirmás que querés cancelar esta visita?</p>
          <p className="chat-action-card__confirmation-warning">
            Esta acción es irrevocable. Si sólo necesitás cambiar la fecha o el
            horario, volvé y usá “Cambiar fecha y horario” en lugar de cancelar.
          </p>
          <div className="chat-action-card__form-actions">
            <button
              type="button"
              className="users-table__action users-table__action--danger"
              disabled={isPending}
              onClick={() => void handleCancel()}
            >
              {cancelFromChat.isPending ? 'Cancelando...' : 'Sí, cancelar visita'}
            </button>
            <button
              type="button"
              className="users-table__action"
              disabled={isPending}
              onClick={() => setShowCancelConfirmation(false)}
            >
              Volver
            </button>
          </div>
        </div>
      ) : null}

      {scheduleFromChat.error || cancelFromChat.error ? (
        <p className="users-message users-message--error">
          {scheduleFromChat.error instanceof Error
            ? scheduleFromChat.error.message
            : cancelFromChat.error instanceof Error
              ? cancelFromChat.error.message
              : 'No se pudo actualizar la visita'}
        </p>
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
  const isCurrentParticipant =
    currentUser?.role === 'client' || currentUser?.role === 'technician';
  const { data: order } = useCurrentOrder(orderId, {
    enabled: isCurrentParticipant,
  });
  const { data: adminOrder } = useAdminOrder(orderId, {
    enabled: currentUser?.role === 'admin',
  });
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
  const conversationOperations = conversation?.operations ?? [];
  const resolvedOperation = operationId
    ? conversationOperations.find((operation) => operation.id === operationId)
    : conversationOperations.length === 1
      ? conversationOperations[0]
      : null;

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
            <h2 id="chat-dialog-title">
              Conversación del{' '}
              <Link
                className="chat-dialog__order-link"
                to="/orders/$orderId"
                params={{ orderId }}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir pedido en una nueva ventana"
                title="Abrir pedido en una nueva ventana"
              >
                pedido
              </Link>
            </h2>
            {order && currentUser?.role === 'client' ? (
              <ChatOrderContext
                order={order}
                role="client"
                scheduledAt={
                  resolvedOperation?.status === 'scheduled'
                    ? resolvedOperation.scheduled_at
                    : null
                }
              />
            ) : order && currentUser?.role === 'technician' ? (
              <ChatOrderContext
                order={order}
                role="technician"
                scheduledAt={
                  resolvedOperation?.status === 'scheduled'
                    ? resolvedOperation.scheduled_at
                    : null
                }
              />
            ) : adminOrder && currentUser?.role === 'admin' ? (
              <ChatOrderContext
                order={adminOrder}
                role="admin"
                scheduledAt={
                  resolvedOperation?.status === 'scheduled'
                    ? resolvedOperation.scheduled_at
                    : null
                }
              />
            ) : null}
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
              operation={resolvedOperation}
              canManage={currentUser?.role === 'technician'}
            />
            <ChatMessageList
              messages={messages}
              currentUserId={currentUser?.id ?? null}
            />
            <ChatComposer
              conversationId={conversation.id}
              currentUser={currentUser ?? null}
            />
          </section>
        )}
      </section>
    </div>
  );
}
