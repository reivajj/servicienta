import { useState } from 'react';
import {
  useCurrentChatConversations,
  useCurrentUser,
} from '@servicienta/query-hooks';
import type {
  ChatConversation,
  OrderStatus,
  UsersPageSize,
} from '@servicienta/types';
import { formatOrderStatus } from '../../shared/utils/operation-status';
import { ChatDialog } from './ChatDialog';

function formatDateTime(value: string | null) {
  if (!value) return 'Sin mensajes todavía';

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatSender(conversation: ChatConversation) {
  const message = conversation.last_message;
  if (!message) return null;
  if (!message.sender_id) return 'Sistema';

  const fullName = [message.sender_name, message.sender_surname]
    .filter(Boolean)
    .join(' ');

  return fullName || message.sender_email || 'Usuario';
}

export function ChatConversationsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<UsersPageSize>(25);
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversation | null>(null);
  const { data: currentUser } = useCurrentUser();
  const { data, error, isLoading } = useCurrentChatConversations({
    page,
    pageSize,
    status: status === 'all' ? undefined : status,
    search: search.trim() || undefined,
  });
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const hasActiveFilters = status !== 'all' || Boolean(search.trim());
  const searchLabel =
    currentUser?.role === 'technician'
      ? 'Buscar cliente o ID de pedido'
      : currentUser?.role === 'client'
        ? 'Buscar técnico o ID de pedido'
        : 'Buscar cliente, técnico o ID de pedido';

  function handleStatusChange(nextStatus: OrderStatus | 'all') {
    setStatus(nextStatus);
    setPage(1);
  }

  function handleSearchChange(nextSearch: string) {
    setSearch(nextSearch);
    setPage(1);
  }

  function handleClearFilters() {
    setStatus('all');
    setSearch('');
    setPage(1);
  }

  return (
    <main className="users-page chat-conversations-page">
      <section className="users-layout">
        <header className="users-hero">
          <div>
            <p className="users-hero__eyebrow">Mensajería</p>
            <h1>Chats</h1>
            <p className="users-hero__copy">
              Tus conversaciones asociadas a pedidos y visitas.
            </p>
          </div>
        </header>

        <section className="users-panel users-toolbar chat-conversations-toolbar">
          <label className="users-toolbar__field">
            <span>Buscar</span>
            <input
              type="search"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder={searchLabel}
            />
          </label>
          <label className="users-toolbar__field">
            <span>Estado del pedido</span>
            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as OrderStatus | 'all')
              }
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="accepted">Aceptado</option>
              <option value="in_progress">En progreso</option>
              <option value="completed_tech">Completado por técnico</option>
              <option value="completion_rejected">
                Finalización rechazada
              </option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </label>
          <label className="users-toolbar__field">
            <span>Por página</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value) as UsersPageSize);
                setPage(1);
              }}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
          <div className="users-toolbar__actions">
            <button
              type="button"
              className="users-toolbar__clear"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              aria-label="Quitar filtros"
              title="Quitar filtros"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="users-toolbar__clear-icon"
              >
                <circle
                  cx="10.5"
                  cy="10.5"
                  r="6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="m15 15 4 4M8.2 8.2l4.6 4.6m0-4.6-4.6 4.6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </section>

        {isLoading ? (
          <section className="users-panel chat-conversations-state">
            <p>Cargando conversaciones...</p>
          </section>
        ) : error ? (
          <section className="users-panel chat-conversations-state">
            <p className="users-message users-message--error">
              {error instanceof Error
                ? error.message
                : 'No se pudieron cargar las conversaciones'}
            </p>
          </section>
        ) : items.length === 0 ? (
          <section className="users-panel chat-conversations-state">
            <p className="user-card__label">Sin conversaciones</p>
            <h2>Todavía no tenés chats</h2>
            <p className="users-hero__copy">
              Los chats aparecerán cuando exista una conversación asociada a un
              pedido.
            </p>
          </section>
        ) : (
          <section
            className="chat-conversations-list"
            aria-label="Conversaciones"
          >
            {items.map((conversation) => {
              const sender = formatSender(conversation);
              const order = conversation.order;
              const clientName = [order?.client_name, order?.client_surname]
                .filter(Boolean)
                .join(' ');
              const technicianName = [
                order?.technician_name,
                order?.technician_surname,
              ]
                .filter(Boolean)
                .join(' ');
              const counterpartName =
                currentUser?.role === 'technician'
                  ? clientName
                  : currentUser?.role === 'admin'
                    ? [clientName, technicianName].filter(Boolean).join(' · ')
                    : technicianName;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  className="users-panel chat-conversation-card"
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <span
                    className="chat-conversation-card__icon"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M5.5 5.5h13A2.5 2.5 0 0 1 21 8v7a2.5 2.5 0 0 1-2.5 2.5H11L6.5 21v-3.5h-1A2.5 2.5 0 0 1 3 15V8a2.5 2.5 0 0 1 2.5-2.5Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <span className="chat-conversation-card__content">
                    <span className="chat-conversation-card__header">
                      <strong>
                        {order
                          ? counterpartName || `Pedido ${order.id.slice(0, 8)}`
                          : 'Conversación directa'}
                      </strong>
                      <time
                        dateTime={conversation.last_message_at ?? undefined}
                      >
                        {formatDateTime(conversation.last_message_at)}
                      </time>
                    </span>

                    <span className="chat-conversation-card__preview">
                      {sender ? <b>{sender}: </b> : null}
                      {conversation.last_message?.body ??
                        'Abrí el chat para iniciar la conversación.'}
                    </span>

                    <span className="chat-conversation-card__meta">
                      {order ? (
                        <span
                          className={`status-badge status-badge--${order.status}`}
                        >
                          {formatOrderStatus(order.status)}
                        </span>
                      ) : null}
                      <span>
                        {conversation.participant_count}{' '}
                        {conversation.participant_count === 1
                          ? 'participante'
                          : 'participantes'}
                      </span>
                    </span>
                  </span>

                  {conversation.unread_count > 0 ? (
                    <span
                      className="chat-conversation-card__unread"
                      aria-label={`${conversation.unread_count} mensajes sin leer`}
                    >
                      {conversation.unread_count > 99
                        ? '99+'
                        : conversation.unread_count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </section>
        )}

        {(pagination?.totalPages ?? 1) > 1 ? (
          <nav className="users-pagination" aria-label="Paginación de chats">
            <button
              type="button"
              className="users-pagination__button"
              disabled={isLoading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </button>
            <span>
              Página {pagination?.page ?? page} de {pagination?.totalPages ?? 1}
            </span>
            <button
              type="button"
              className="users-pagination__button"
              disabled={isLoading || page >= (pagination?.totalPages ?? 1)}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </button>
          </nav>
        ) : null}
      </section>

      {selectedConversation?.order_id ? (
        <ChatDialog
          orderId={selectedConversation.order_id}
          operationId={selectedConversation.operations?.[0]?.id}
          onClose={() => setSelectedConversation(null)}
        />
      ) : null}
    </main>
  );
}
