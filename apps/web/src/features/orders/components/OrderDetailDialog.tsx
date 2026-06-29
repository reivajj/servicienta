import { Link } from '@tanstack/react-router';
import { type ReactNode, useState } from 'react';
import {
  useAdminOperations,
  useAdminOrder,
  useAcceptOrder,
  useCancelOrder,
  useCurrentOrder,
  useCurrentUser,
  useUpdateAdminOrder,
} from '@servicienta/query-hooks';
import type {
  AdminOrder,
  Order,
  OrderFlowType,
  OrderStatus,
  UsersPageSize,
} from '@servicienta/types';
import { AdminOperationsTable } from '../../operations/components/AdminOperationsTable';
import { OperationDetailDialog } from '../../operations/components/OperationDetailDialog';
import { InternalChatActionButton } from '../../shared/components/InternalChatActionButton';
import { ViewClientProfileActionLink } from '../../shared/components/ViewClientProfileActionLink';
import { useEscapeKey } from '../../shared/hooks/useEscapeKey';

function formatPersonName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatFlowType(value: OrderFlowType) {
  return value === 'client_selects' ? 'Client selects' : 'Tech applies';
}

function formatTechnicianLabel(order: Pick<Order, 'technician_id' | 'technician_name' | 'technician_surname'>) {
  if (!order.technician_id) return 'Sin técnico asignado';

  return formatPersonName(order.technician_name, order.technician_surname);
}

function getStatusBadgeClass(status: string) {
  return `status-badge status-badge--${status}`;
}

function getUserStatusBadgeClass(status: 'ACTIVE' | 'DELETED') {
  return status === 'ACTIVE'
    ? 'user-badge user-badge--active'
    : 'user-badge user-badge--deleted';
}

function canCancelOrder(status: OrderStatus) {
  return (
    status !== 'completed' &&
    status !== 'completed_tech' &&
    status !== 'cancelled'
  );
}

function canAcceptOrder(status: OrderStatus) {
  return status === 'pending';
}

function toNullableNumber(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return null;

  return Number(rawValue);
}

function buildWhatsAppUrl(phone: string | null) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;

  return `https://wa.me/${digits}`;
}

function CoordinationCard({
  role,
  order,
}: {
  role: 'client' | 'technician';
  order: Pick<
    Order,
    | 'client_name'
    | 'client_surname'
    | 'client_phone'
    | 'client_whatsapp_phone'
    | 'technician_id'
    | 'technician_name'
    | 'technician_surname'
    | 'technician_phone'
    | 'technician_whatsapp_phone'
  >;
}) {
  const isClient = role === 'client';
  const counterpartName = isClient
    ? formatTechnicianLabel(order)
    : formatPersonName(order.client_name, order.client_surname);
  const counterpartPhone = isClient
    ? order.technician_phone
    : order.client_phone;
  const counterpartWhatsappPhone = isClient
    ? order.technician_whatsapp_phone
    : order.client_whatsapp_phone;
  const whatsAppUrl = buildWhatsAppUrl(
    counterpartWhatsappPhone ?? counterpartPhone,
  );

  return (
    <article className="users-panel">
      <div className="user-card__header">
        <div>
          <p className="user-card__label">Coordinación</p>
          <h2>Coordiná la visita</h2>
        </div>

          <InternalChatActionButton />
      </div>

      <p className="orders-dialog__coordination-copy">
        Ya pueden coordinar la visita por chat interno o por celular.
      </p>

      <dl className="user-card__meta">
        <div>
          <dt>{isClient ? 'Técnico' : 'Cliente'}</dt>
          <dd>{counterpartName}</dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd className="orders-dialog__contact-row">
            <span>{counterpartPhone ?? 'Sin definir'}</span>
            {whatsAppUrl ? (
              <a
                className="users-table__action users-table__action--icon"
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir WhatsApp"
                title="Abrir WhatsApp"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="users-table__action-icon"
                >
                  <path
                    d="M12.1 3.5a8.4 8.4 0 0 0-7.3 12.5L4 20.5l4.7-1.2a8.4 8.4 0 1 0 3.4-15.8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.2 8.8c.2-.4.4-.5.8-.5h.6c.2 0 .4 0 .5.4l.6 1.5c.1.3 0 .4-.1.6l-.4.5c-.1.1-.2.3-.1.5.2.5.7 1.2 1.4 1.8.9.8 1.7 1.1 2.1 1.3.2.1.4 0 .5-.1l.6-.7c.2-.2.4-.2.6-.1l1.4.7c.3.1.4.3.4.5v.5c0 .4-.2.7-.6.9-.4.2-1 .3-1.6.2-1-.2-2.2-.8-3.5-1.9-1-.8-1.8-1.8-2.3-2.8-.5-.9-.7-1.8-.6-2.5.1-.4.2-.7.3-.9Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            ) : null}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function TechnicianInfoCard({
  order,
  technicianEmail,
  technicianStatus,
  showTechnicianLink = false,
}: {
  order: Pick<
    Order,
    | 'technician_id'
    | 'technician_name'
    | 'technician_surname'
    | 'technician_phone'
    | 'technician_whatsapp_phone'
  >;
  technicianEmail?: string | null;
  technicianStatus?: 'ACTIVE' | 'DELETED' | null;
  showTechnicianLink?: boolean;
}) {
  const whatsAppUrl = buildWhatsAppUrl(
    order.technician_whatsapp_phone ?? order.technician_phone,
  );

  return (
    <article className="users-panel">
      <div className="user-card__header">
        <div>
          <p className="user-card__label">Técnico</p>
          <h2>{formatTechnicianLabel(order)}</h2>
        </div>

        <div className="orders-dialog__icon-actions">
          <InternalChatActionButton />

          {showTechnicianLink && order.technician_id ? (
            <Link
              className="users-table__action users-table__action--icon"
              to="/technicians/$technicianId"
              params={{ technicianId: order.technician_id }}
              aria-label="Ver técnico"
              title="Ver técnico"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="users-table__action-icon"
              >
                <path
                  d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M4.5 20a7.5 7.5 0 0 1 15 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          ) : null}
        </div>
      </div>

      <dl className="user-card__meta">
        {technicianEmail !== undefined ? (
          <div>
            <dt>Email</dt>
            <dd>{technicianEmail ?? 'Sin asignar'}</dd>
          </div>
        ) : null}
        <div>
          <dt>Nombre</dt>
          <dd>
            {order.technician_id
              ? formatPersonName(order.technician_name, order.technician_surname)
              : 'Sin asignar'}
          </dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd className="orders-dialog__contact-row">
            <span>{order.technician_phone ?? 'Sin definir'}</span>
            {whatsAppUrl ? (
              <a
                className="users-table__action users-table__action--icon"
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir WhatsApp"
                title="Abrir WhatsApp"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="users-table__action-icon"
                >
                  <path
                    d="M12.1 3.5a8.4 8.4 0 0 0-7.3 12.5L4 20.5l4.7-1.2a8.4 8.4 0 1 0 3.4-15.8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.2 8.8c.2-.4.4-.5.8-.5h.6c.2 0 .4 0 .5.4l.6 1.5c.1.3 0 .4-.1.6l-.4.5c-.1.1-.2.3-.1.5.2.5.7 1.2 1.4 1.8.9.8 1.7 1.1 2.1 1.3.2.1.4 0 .5-.1l.6-.7c.2-.2.4-.2.6-.1l1.4.7c.3.1.4.3.4.5v.5c0 .4-.2.7-.6.9-.4.2-1 .3-1.6.2-1-.2-2.2-.8-3.5-1.9-1-.8-1.8-1.8-2.3-2.8-.5-.9-.7-1.8-.6-2.5.1-.4.2-.7.3-.9Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            ) : null}
          </dd>
        </div>
        {technicianStatus !== undefined ? (
          <div>
            <dt>Technician status</dt>
            <dd>
              {technicianStatus ? (
                <span className={getUserStatusBadgeClass(technicianStatus)}>
                  {technicianStatus}
                </span>
              ) : (
                'Sin asignar'
              )}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

function CurrentOrderDetailView({
  orderId,
  showCloseButton = false,
  onClose,
}: {
  orderId: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  const { data: currentUser } = useCurrentUser();
  const { data: order, error, isLoading } = useCurrentOrder(orderId);
  const acceptOrder = useAcceptOrder();
  const cancelOrder = useCancelOrder();
  const errorMessage =
    error instanceof Error ? error.message : 'No se pudo cargar la order';
  const feedbackMessage =
    acceptOrder.error instanceof Error
      ? acceptOrder.error.message
      : cancelOrder.error instanceof Error
        ? cancelOrder.error.message
        : acceptOrder.isSuccess
          ? 'Order aceptada'
          : cancelOrder.isSuccess
            ? 'Order cancelada'
            : '';
  const isTechnician = currentUser?.role === 'technician';
  const isMutating = acceptOrder.isPending || cancelOrder.isPending;

  return (
    <>
      <header className={showCloseButton ? 'users-modal__header' : 'users-hero'}>
        <div>
          <p className="users-hero__eyebrow">Order Detail</p>
          <h1>Detalle de order</h1>
          <p className="users-hero__copy">
            Vista de seguimiento de la solicitud con estado, dirección y datos
            del servicio.
          </p>
        </div>

        {showCloseButton && onClose ? (
          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
            aria-label="Cerrar detalle de order"
          >
            Cerrar
          </button>
        ) : null}
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
        <CurrentOrderContent
          order={order}
          role={currentUser?.role === 'technician' ? 'technician' : 'client'}
          showTechnicianInfo={currentUser?.role !== 'technician'}
          actionSlot={
            isTechnician && canAcceptOrder(order.status) ? (
              <>
                <button
                  type="button"
                  className="users-table__action users-table__action--success"
                  disabled={isMutating}
                  onClick={() => acceptOrder.mutate(order.id)}
                >
                  {acceptOrder.isPending ? 'Aceptando...' : 'Aceptar'}
                </button>
                <button
                  type="button"
                  className="users-table__action users-table__action--danger"
                  disabled={isMutating}
                  onClick={() => cancelOrder.mutate(order.id)}
                >
                  {cancelOrder.isPending ? 'Rechazando...' : 'Rechazar'}
                </button>
                <p
                  className={
                    feedbackMessage
                      ? acceptOrder.error || cancelOrder.error
                        ? 'users-message users-message--error'
                        : 'users-message users-message--success'
                      : 'users-message'
                  }
                >
                  {feedbackMessage || ' '}
                </p>
              </>
            ) : isTechnician && canCancelOrder(order.status) ? (
              <>
                <button
                  type="button"
                  className="users-table__action users-table__action--danger"
                  disabled={isMutating}
                  onClick={() => cancelOrder.mutate(order.id)}
                >
                  {cancelOrder.isPending ? 'Cancelando...' : 'Cancelar'}
                </button>
                <p
                  className={
                    feedbackMessage
                      ? cancelOrder.error
                        ? 'users-message users-message--error'
                        : 'users-message users-message--success'
                      : 'users-message'
                  }
                >
                  {feedbackMessage || ' '}
                </p>
              </>
            ) : canCancelOrder(order.status) ? (
              <>
                <button
                  type="button"
                  className="users-table__action"
                  disabled={cancelOrder.isPending}
                  onClick={() => cancelOrder.mutate(order.id)}
                >
                  {cancelOrder.isPending ? 'Cancelando...' : 'Cancelar'}
                </button>
                <p
                  className={
                    feedbackMessage
                      ? cancelOrder.error
                        ? 'users-message users-message--error'
                        : 'users-message users-message--success'
                      : 'users-message'
                  }
                >
                  {feedbackMessage || ' '}
                </p>
              </>
            ) : null
          }
        />
      )}
    </>
  );
}

function CurrentOrderContent({
  order,
  role,
  showTechnicianInfo = true,
  actionSlot,
}: {
  order: Order;
  role: 'client' | 'technician';
  showTechnicianInfo?: boolean;
  actionSlot?: ReactNode;
}) {
  return (
    <>
      <article className="users-panel orders-dialog__meta-strip">
        <dl className="user-card__meta orders-dialog__meta-list">
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

      <section className="orders-dialog__content">
        <article className="users-panel">
          <div className="user-card__header">
            <div>
              <p className="user-card__label">Order</p>
              <h2>Estado y flujo</h2>
            </div>

            <span className={getStatusBadgeClass(order.status)}>
              {order.status}
            </span>
          </div>

          <dl className="user-card__meta">
            <div>
              <dt>Flow type</dt>
              <dd>{formatFlowType(order.flow_type)}</dd>
            </div>
            <div>
              <dt>Zona</dt>
              <dd>{order.zone_slug ?? 'Sin definir'}</dd>
            </div>
            <div>
              <dt>Rubro</dt>
              <dd>{order.appliance_type_slug ?? 'Sin definir'}</dd>
            </div>
          </dl>
        </article>

        {showTechnicianInfo ? <TechnicianInfoCard order={order} /> : null}

        {order.status === 'accepted' ? (
          <CoordinationCard order={order} role={role} />
        ) : null}

        <article className="users-panel">
          <div className="user-card__header">
            <div>
              <p className="user-card__label">Servicio</p>
              <h2>Detalle de la solicitud</h2>
            </div>
          </div>

          <dl className="user-card__meta">
            <div>
              <dt>Dirección</dt>
              <dd>{order.service_address_text}</dd>
            </div>
            <div>
              <dt>Problema</dt>
              <dd>{order.description}</dd>
            </div>
            <div>
              <dt>Notas</dt>
              <dd>{order.address_notes ?? 'Sin notas'}</dd>
            </div>
          </dl>

          {actionSlot ? <div className="orders-dialog__actions">{actionSlot}</div> : null}
        </article>
      </section>
    </>
  );
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

function AdminOrderDetailView({
  orderId,
  titleId,
  showCloseButton = false,
  onClose,
}: {
  orderId: string;
  titleId: string;
  showCloseButton?: boolean;
  onClose?: () => void;
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

  async function handleDeleteOrder() {
    if (!order) return;

    await updateOrder.mutateAsync({
      orderId,
      input: {
        status: 'cancelled',
        flow_type: order.flow_type,
        description: order.description,
        service_address_text: order.service_address_text,
        service_lat: order.service_lat,
        service_lng: order.service_lng,
        address_notes: order.address_notes,
        technician_id: order.technician_id,
        zone_slug: order.zone_slug,
        appliance_type_slug: order.appliance_type_slug,
      },
    });
  }

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
    <>
      <header className={showCloseButton ? 'users-modal__header' : 'users-hero'}>
        <div>
          <p className="users-hero__eyebrow">Order Detail</p>
          <h1 id={titleId}>Ver y editar order</h1>
          {!showCloseButton ? (
            <p className="users-hero__copy">
              Vista administrativa completa de la order, con cliente, técnico,
              edición y operations vinculadas.
            </p>
          ) : null}
        </div>

        {showCloseButton && onClose ? (
          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
            aria-label="Cerrar detalle de order"
          >
            Cerrar
          </button>
        ) : null}
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
        <>
          <article className="users-panel orders-dialog__meta-strip">
            <dl className="user-card__meta orders-dialog__meta-list">
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

          <section className="orders-dialog__content">
            <section className="orders-dialog__summary">
            <article className="users-panel">
              <div className="user-card__header">
                <div>
                  <p className="user-card__label">Cliente</p>
                  <h2>
                    {formatPersonName(order.client_name, order.client_surname)}
                  </h2>
                </div>

                <div className="orders-dialog__icon-actions">
                  <span className={getStatusBadgeClass(order.status)}>
                    {order.status}
                  </span>
                  <InternalChatActionButton label="Chat interno cliente próximamente" />
                  <ViewClientProfileActionLink
                    clientProfileId={order.client_id}
                    label="Ver cliente"
                  />
                </div>
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
                  <dd>
                    <span className={getUserStatusBadgeClass(order.client_status)}>
                      {order.client_status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Flow type</dt>
                  <dd>{order.flow_type}</dd>
                </div>
              </dl>
            </article>

            <TechnicianInfoCard
              order={order}
              technicianEmail={order.technician_email}
              technicianStatus={order.technician_status}
              showTechnicianLink
            />
          </section>

          <article className="users-panel">
            <p className="user-card__label">Editar Order</p>
            <h3>Patch admin</h3>

            <form
              key={`${order.id}:${order.status}:${order.flow_type}:${order.updated_at}`}
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <input
                name="technician_id"
                type="hidden"
                value={order.technician_id ?? ''}
                readOnly
              />

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

              <div className="orders-dialog__actions">
                <button
                  type="submit"
                  className="orders-dialog__primary-action"
                  disabled={updateOrder.isPending}
                >
                  {updateOrder.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>

                {order.status !== 'cancelled' ? (
                  <button
                    type="button"
                    className="users-table__action users-table__action--danger"
                    disabled={updateOrder.isPending}
                    onClick={handleDeleteOrder}
                  >
                    {updateOrder.isPending ? 'Eliminando...' : 'Eliminar'}
                  </button>
                ) : null}
              </div>
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
                onClick={() => setShowOperations((currentValue) => !currentValue)}
              >
                {showOperations ? 'Ocultar operaciones' : 'Ver operaciones'}
              </button>
            </div>

            {showOperations ? <OrderOperationsPanel orderId={order.id} /> : null}
          </article>
          </section>
        </>
      )}
    </>
  );
}

export function AdminOrderPage({ orderId }: { orderId: string }) {
  return (
    <main className="users-page">
      <section className="users-layout">
        <AdminOrderDetailView orderId={orderId} titleId="order-page-title" />
      </section>
    </main>
  );
}

export function OrderPage({ orderId }: { orderId: string }) {
  const { data: currentUser, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return (
      <main className="users-page">
        <section className="users-layout">
          <section className="users-panel">
            <p>Cargando usuario...</p>
          </section>
        </section>
      </main>
    );
  }

  if (error || !currentUser) {
    return (
      <main className="users-page">
        <section className="users-layout">
          <section className="users-panel">
            <p className="users-message users-message--error">
              No se pudo cargar el usuario actual.
            </p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="users-page">
      <section className="users-layout">
        {currentUser.role === 'admin' ? (
          <AdminOrderDetailView orderId={orderId} titleId="order-page-title" />
        ) : (
          <CurrentOrderDetailView orderId={orderId} />
        )}
      </section>
    </main>
  );
}

export function OrderDetailDialog({
  orderId,
  onClose,
  mode = 'admin',
}: {
  orderId: string;
  onClose: () => void;
  mode?: 'admin' | 'current';
}) {
  const modalRef = useEscapeKey<HTMLDivElement>(onClose);
  return (
    <div
      ref={modalRef}
      data-escape-modal="true"
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
        {mode === 'admin' ? (
          <AdminOrderDetailView
            orderId={orderId}
            titleId="order-detail-title"
            showCloseButton
            onClose={onClose}
          />
        ) : (
          <CurrentOrderDetailView
            orderId={orderId}
            showCloseButton
            onClose={onClose}
          />
        )}
      </section>
    </div>
  );
}
