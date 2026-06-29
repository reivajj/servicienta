import { useState } from 'react';
import { useAdminActivityEvents } from '@servicienta/query-hooks';
import type {
  ActivityEventEntityType,
  ActivityEventType,
  UsersPageSize,
} from '@servicienta/types';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ActivityEventsListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<UsersPageSize>(25);
  const [entityType, setEntityType] = useState<ActivityEventEntityType | 'all'>(
    'all',
  );
  const [eventType, setEventType] = useState<ActivityEventType | 'all'>('all');
  const [entityId, setEntityId] = useState('');

  const { data, error, isLoading } = useAdminActivityEvents({
    page,
    pageSize,
    entity_type: entityType === 'all' ? undefined : entityType,
    event_type: eventType === 'all' ? undefined : eventType,
    entity_id: entityId.trim() || undefined,
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudieron cargar los activity events';

  function handleClearFilters() {
    setEntityType('all');
    setEventType('all');
    setEntityId('');
    setPageSize(25);
    setPage(1);
  }

  return (
    <main className="users-page">
      <section className="users-layout">
        <header className="users-hero">
          <div>
            <p className="users-hero__eyebrow">Admin Events</p>
            <h1>Activity Events</h1>
            <p className="users-hero__copy">
              Eventos principales del flujo operativo para auditar onboarding,
              órdenes, operaciones y reviews.
            </p>
          </div>

          <div className="users-hero__summary">
            <span>{pagination?.total ?? 0} eventos</span>
            <span>{items.length} visibles</span>
          </div>
        </header>

        <section className="users-toolbar">
          <label className="users-toolbar__field">
            <span>Entity type</span>
            <select
              value={entityType}
              onChange={(event) => {
                setEntityType(event.target.value as ActivityEventEntityType | 'all');
                setPage(1);
              }}
            >
              <option value="all">Todos</option>
              <option value="user">User</option>
              <option value="order">Order</option>
              <option value="operation">Operation</option>
              <option value="technician_review">Technician review</option>
            </select>
          </label>

          <label className="users-toolbar__field">
            <span>Event type</span>
            <select
              value={eventType}
              onChange={(event) => {
                setEventType(event.target.value as ActivityEventType | 'all');
                setPage(1);
              }}
            >
              <option value="all">Todos</option>
              <option value="user.client_onboarded">Client onboarded</option>
              <option value="order.created">Order created</option>
              <option value="order.accepted">Order accepted</option>
              <option value="order.cancelled">Order cancelled</option>
              <option value="operation.created">Operation created</option>
              <option value="operation.scheduled">Operation scheduled</option>
              <option value="operation.completed_by_technician">
                Completed by technician
              </option>
              <option value="operation.completed_by_client">
                Completed by client
              </option>
              <option value="operation.cancelled">Operation cancelled</option>
              <option value="technician_review.created">Review created</option>
              <option value="admin.order_updated">Admin order updated</option>
              <option value="admin.operation_updated">
                Admin operation updated
              </option>
            </select>
          </label>

          <label className="users-toolbar__field">
            <span>Entity ID</span>
            <input
              type="search"
              value={entityId}
              onChange={(event) => {
                setEntityId(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <div className="users-toolbar__group">
            <label className="users-toolbar__field">
              <span>Page size</span>
              <select
                value={String(pageSize)}
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
              >
                Limpiar
              </button>
            </div>
          </div>
        </section>

        {isLoading ? (
          <section className="users-panel">
            <p>Cargando activity events...</p>
          </section>
        ) : error ? (
          <section className="users-panel">
            <p className="users-message users-message--error">{errorMessage}</p>
          </section>
        ) : items.length ? (
          <section className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Actor</th>
                  <th>Entidad</th>
                  <th>Event</th>
                  <th>Payload</th>
                </tr>
              </thead>
              <tbody>
                {items.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDateTime(event.created_at)}</td>
                    <td>{event.actor_email ?? event.actor_id}</td>
                    <td>
                      {event.entity_type}
                      <br />
                      <small>{event.entity_id}</small>
                    </td>
                    <td>{event.event_type}</td>
                    <td>
                      <code>
                        {event.payload
                          ? JSON.stringify(event.payload)
                          : 'sin payload'}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="users-panel">
            <p>No hay activity events para los filtros actuales.</p>
          </section>
        )}

        <section className="users-pagination">
          <p className="users-pagination__summary">
            {pagination?.total ?? 0} resultados
          </p>
          <div className="users-pagination__controls">
            <button
              type="button"
              className="users-pagination__button"
              disabled={isLoading || page <= 1}
              onClick={() => setPage((currentPage) => currentPage - 1)}
            >
              Anterior
            </button>
            <span className="users-pagination__page">
              Página {pagination?.page ?? page} de {pagination?.totalPages ?? 1}
            </span>
            <button
              type="button"
              className="users-pagination__button"
              disabled={isLoading || (pagination?.totalPages ?? 1) <= page}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Siguiente
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
