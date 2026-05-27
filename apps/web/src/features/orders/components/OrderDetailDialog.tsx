import { useState } from 'react';
import {
  useAdminOperations,
  useAdminOrder,
  useUpdateAdminOrder,
} from '@servicienta/query-hooks';
import type {
  OrderFlowType,
  OrderStatus,
  UsersPageSize,
} from '@servicienta/types';
import { AdminOperationsTable } from '../../operations/components/AdminOperationsTable';
import { OperationDetailDialog } from '../../operations/components/OperationDetailDialog';

function formatClientName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getStatusBadgeClass(status: string) {
  return `status-badge status-badge--${status}`;
}

function toNullableNumber(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return null;

  return Number(rawValue);
}

function OrderOperationsPanel({ orderId }: { orderId: string }) {
  const [page, setPage] = useState(1);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(
    null,
  );
  const pageSize: UsersPageSize = 25;
  const { data, error, isLoading } = useAdminOperations({
    page,
    pageSize,
    order_id: orderId,
  });

  const operations = data?.items ?? [];
  const pagination = data?.pagination;
  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudieron cargar las operations';

  return (
    <>
      <section className="orders-dialog__operations">
        {isLoading ? (
          <section className="users-panel">
            <p>Cargando operations...</p>
          </section>
        ) : error ? (
          <section className="users-panel">
            <p className="users-message users-message--error">{errorMessage}</p>
          </section>
        ) : operations.length ? (
          <>
            <AdminOperationsTable
              operations={operations}
              onSelectOperation={setSelectedOperationId}
            />

            <div className="users-pagination orders-dialog__pagination">
              <p className="users-pagination__summary">
                {pagination?.total ?? 0} operations vinculadas
              </p>

              <div className="users-pagination__controls">
                <button
                  type="button"
                  className="users-pagination__button"
                  disabled={isLoading || page <= 1}
                  onClick={() =>
                    setPage((currentPage) => Math.max(1, currentPage - 1))
                  }
                >
                  Anterior
                </button>

                <span className="users-pagination__page">
                  Pagina {pagination?.page ?? page} de{' '}
                  {pagination?.totalPages ?? 1}
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
            </div>
          </>
        ) : (
          <section className="users-panel">
            <p>No hay operations vinculadas a esta order.</p>
          </section>
        )}
      </section>

      {selectedOperationId ? (
        <OperationDetailDialog
          operationId={selectedOperationId}
          onClose={() => setSelectedOperationId(null)}
        />
      ) : null}
    </>
  );
}

export function OrderDetailDialog({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [showOperations, setShowOperations] = useState(false);
  const { data: order, error, isLoading } = useAdminOrder(orderId);
  const updateOrder = useUpdateAdminOrder();
  const errorMessage =
    error instanceof Error ? error.message : 'No se pudo cargar la order';
  const updateMessage =
    updateOrder.error instanceof Error ? updateOrder.error.message : '';
  const feedbackMessage =
    updateMessage || (updateOrder.isSuccess ? 'Order actualizada' : '');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    await updateOrder.mutateAsync({
      orderId,
      input: {
        status: (formData.get('status') as OrderStatus | null) ?? 'pending',
        flow_type:
          (formData.get('flow_type') as OrderFlowType | null) ??
          'client_selects',
        description: String(formData.get('description') ?? ''),
        service_address_text: String(
          formData.get('service_address_text') ?? '',
        ),
        service_lat: toNullableNumber(formData.get('service_lat')),
        service_lng: toNullableNumber(formData.get('service_lng')),
        address_notes: String(formData.get('address_notes') ?? '') || null,
        technician_id: String(formData.get('technician_id') ?? '') || null,
        zone_slug: String(formData.get('zone_slug') ?? '') || null,
        appliance_type_slug:
          String(formData.get('appliance_type_slug') ?? '') || null,
      },
    });
  }

  return (
    <div
      className="users-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      onClick={onClose}
    >
      <section
        className="users-modal__panel orders-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="users-modal__header">
          <div>
            <p className="users-hero__eyebrow">Order Detail</p>
            <h2 id="order-detail-title">Ver y editar order</h2>
          </div>

          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
            aria-label="Cerrar detalle de order"
          >
            Cerrar
          </button>
        </header>

        {isLoading ? (
          <section className="users-panel">
            <p>Cargando order...</p>
          </section>
        ) : error || !order ? (
          <section className="users-panel">
            <p className="users-message users-message--error">{errorMessage}</p>
          </section>
        ) : (
          <section className="orders-dialog__content">
            <article className="users-panel">
              <div className="user-card__header">
                <div>
                  <p className="user-card__label">Cliente</p>
                  <h3>
                    {formatClientName(order.client_name, order.client_surname)}
                  </h3>
                </div>

                <span className={getStatusBadgeClass(order.status)}>
                  {order.status}
                </span>
              </div>

              <dl className="user-card__meta">
                <div>
                  <dt>Email</dt>
                  <dd>{order.client_email}</dd>
                </div>
                <div>
                  <dt>Client ID</dt>
                  <dd>{order.client_id}</dd>
                </div>
                <div>
                  <dt>Client status</dt>
                  <dd>{order.client_status}</dd>
                </div>
                <div>
                  <dt>Flow type</dt>
                  <dd>{order.flow_type}</dd>
                </div>
              </dl>
            </article>

            <article className="users-panel">
              <p className="user-card__label">Editar Order</p>
              <h3>Patch admin</h3>

              <form
                key={`${order.id}:${order.status}:${order.flow_type}:${order.updated_at}`}
                className="auth-form"
                onSubmit={handleSubmit}
              >
                <label className="auth-form__field">
                  <span>Status</span>
                  <select name="status" defaultValue={order.status}>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed_tech">Completed tech</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>

                <label className="auth-form__field">
                  <span>Flujo</span>
                  <select name="flow_type" defaultValue={order.flow_type}>
                    <option value="client_selects">Client selects</option>
                    <option value="tech_applies">Tech applies</option>
                  </select>
                </label>

                <label className="auth-form__field">
                  <span>Descripción</span>
                  <input
                    name="description"
                    type="text"
                    defaultValue={order.description}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Dirección</span>
                  <input
                    name="service_address_text"
                    type="text"
                    defaultValue={order.service_address_text}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Technician ID</span>
                  <input
                    name="technician_id"
                    type="text"
                    defaultValue={order.technician_id ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Zona</span>
                  <input
                    name="zone_slug"
                    type="text"
                    defaultValue={order.zone_slug ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Rubro</span>
                  <input
                    name="appliance_type_slug"
                    type="text"
                    defaultValue={order.appliance_type_slug ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Notas</span>
                  <input
                    name="address_notes"
                    type="text"
                    defaultValue={order.address_notes ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Latitud</span>
                  <input
                    name="service_lat"
                    type="number"
                    step="any"
                    defaultValue={order.service_lat ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Longitud</span>
                  <input
                    name="service_lng"
                    type="number"
                    step="any"
                    defaultValue={order.service_lng ?? ''}
                  />
                </label>

                <button type="submit" disabled={updateOrder.isPending}>
                  {updateOrder.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>

              <p
                className={
                  feedbackMessage
                    ? updateMessage
                      ? 'users-message users-message--error'
                      : 'users-message users-message--success'
                    : 'users-message'
                }
              >
                {feedbackMessage || ' '}
              </p>

              <dl className="user-card__meta">
                <div>
                  <dt>Order ID</dt>
                  <dd>{order.id}</dd>
                </div>
                <div>
                  <dt>Created at</dt>
                  <dd>{formatDateTime(order.created_at)}</dd>
                </div>
                <div>
                  <dt>Updated at</dt>
                  <dd>{formatDateTime(order.updated_at)}</dd>
                </div>
              </dl>
            </article>

            <article className="users-panel orders-dialog__operations-card">
              <div className="user-card__header">
                <div>
                  <p className="user-card__label">Operations</p>
                  <h3>Operations vinculadas</h3>
                </div>

                <button
                  type="button"
                  className="users-table__action"
                  onClick={() =>
                    setShowOperations((currentValue) => !currentValue)
                  }
                >
                  {showOperations ? 'Ocultar operaciones' : 'Ver operaciones'}
                </button>
              </div>

              {showOperations ? (
                <OrderOperationsPanel orderId={order.id} />
              ) : null}
            </article>
          </section>
        )}
      </section>
    </div>
  );
}
