import { useState } from 'react';
import {
  useAdminOperations,
  useAdminOrders,
  useClientProfile,
  useCurrentUser,
  useUpdateClientProfile,
} from '@servicienta/query-hooks';
import type {
  AdminOrder,
  ClientPreferredContactChannel,
  OrderFlowType,
  OrderStatus,
} from '@servicienta/types';
import { AdminOperationsTable } from '../../operations/components/AdminOperationsTable';
import { ViewOrderActionLink } from '../../shared/components/ViewOrderActionLink';
import { useEscapeKey } from '../../shared/hooks/useEscapeKey';

function formatClientName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function normalizeNullableFormValue(
  value: FormDataEntryValue | null,
): string | null {
  const normalized = String(value ?? '').trim();

  return normalized ? normalized : null;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatFlowType(flowType: OrderFlowType) {
  return flowType === 'client_selects' ? 'Client selects' : 'Tech applies';
}

function getStatusBadgeClass(status: OrderStatus) {
  return `status-badge status-badge--${status}`;
}

function ClientOrdersTable({ orders }: { orders: AdminOrder[] }) {
  return (
    <section className="users-table-wrapper">
      <table className="users-table">
        <thead>
          <tr>
            <th>Accion</th>
            <th>Técnico</th>
            <th>Email</th>
            <th>Flujo</th>
            <th>Status</th>
            <th>Dirección</th>
            <th>Descripción</th>
            <th>Creada</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <ViewOrderActionLink orderId={order.id} />
              </td>
              <td>
                {formatClientName(
                  order.technician_name,
                  order.technician_surname,
                )}
              </td>
              <td>{order.technician_email ?? 'Sin asignar'}</td>
              <td>{formatFlowType(order.flow_type)}</td>
              <td>
                <span className={getStatusBadgeClass(order.status)}>
                  {order.status}
                </span>
              </td>
              <td>{order.service_address_text}</td>
              <td>{order.description}</td>
              <td>{formatDateTime(order.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ClientProfileDetailView({
  clientProfileId,
  titleId,
  showCloseButton = false,
  onClose,
}: {
  clientProfileId: string;
  titleId: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  const [showOperations, setShowOperations] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const { data: currentUser, isLoading: isCurrentUserLoading } =
    useCurrentUser();
  const {
    data: clientProfile,
    error,
    isLoading,
  } = useClientProfile(clientProfileId);
  const updateClientProfile = useUpdateClientProfile();
  const canViewRelatedRecords =
    !showCloseButton && currentUser?.role === 'admin';
  const {
    data: operationsData,
    error: operationsError,
    isLoading: isOperationsLoading,
  } = useAdminOperations(
    {
      page: 1,
      pageSize: 25,
      client_id: clientProfileId,
    },
    { enabled: canViewRelatedRecords },
  );
  const {
    data: ordersData,
    error: ordersError,
    isLoading: isOrdersLoading,
  } = useAdminOrders(
    {
      page: 1,
      pageSize: 25,
      client_id: clientProfileId,
    },
    { enabled: canViewRelatedRecords },
  );

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudo cargar el perfil del cliente';
  const operationsErrorMessage =
    operationsError instanceof Error
      ? operationsError.message
      : 'No se pudieron cargar las visitas';
  const ordersErrorMessage =
    ordersError instanceof Error
      ? ordersError.message
      : 'No se pudieron cargar las orders';
  const updateMessage =
    updateClientProfile.error instanceof Error
      ? updateClientProfile.error.message
      : '';
  const feedbackMessage =
    updateMessage ||
    (updateClientProfile.isSuccess ? 'Perfil de cliente actualizado' : '');
  const operations = operationsData?.items ?? [];
  const orders = ordersData?.items ?? [];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const preferredContactChannel =
      (formData.get(
        'preferred_contact_channel',
      ) as ClientPreferredContactChannel | null) ?? 'phone';

    await updateClientProfile.mutateAsync({
      clientProfileId,
      input: {
        phone: normalizeNullableFormValue(formData.get('phone')),
        whatsapp_phone: normalizeNullableFormValue(
          formData.get('whatsapp_phone'),
        ),
        default_address_text: normalizeNullableFormValue(
          formData.get('default_address_text'),
        ),
        address_notes: normalizeNullableFormValue(
          formData.get('address_notes'),
        ),
        preferred_contact_channel: preferredContactChannel,
      },
    });
  }

  const isMutating = updateClientProfile.isPending;

  return (
    <>
      <header
        className={showCloseButton ? 'users-modal__header' : 'users-hero'}
      >
        <div>
          <p className="users-hero__eyebrow">Client Profile</p>
          <h2 id={titleId}>Ver y editar cliente</h2>
          {!showCloseButton ? (
            <p className="users-hero__copy">
              Vista detallada del cliente con datos de contacto, dirección base
              y edición administrativa.
            </p>
          ) : null}
        </div>

        {showCloseButton && onClose ? (
          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
            aria-label="Cerrar detalle de client profile"
          >
            Cerrar
          </button>
        ) : null}
      </header>

      {isLoading || (!showCloseButton && isCurrentUserLoading) ? (
        <section className="users-panel">
          <p>Cargando cliente...</p>
        </section>
      ) : error || !clientProfile ? (
        <section className="users-panel">
          <p className="users-message users-message--error">{errorMessage}</p>
        </section>
      ) : (
        <>
          <section className="users-detail-grid">
            <article className="users-panel">
              <div className="user-card__header">
                <div>
                  <p className="user-card__label">Identidad</p>
                  <h3>
                    {formatClientName(
                      clientProfile.name,
                      clientProfile.surname,
                    )}
                  </h3>
                </div>

                <span
                  className={
                    clientProfile.status === 'ACTIVE'
                      ? 'user-badge user-badge--active'
                      : 'user-badge user-badge--deleted'
                  }
                >
                  {clientProfile.status}
                </span>
              </div>

              <dl className="user-card__meta">
                <div>
                  <dt>Email</dt>
                  <dd>{clientProfile.email}</dd>
                </div>
                <div>
                  <dt>Client ID</dt>
                  <dd>{clientProfile.id}</dd>
                </div>
                <div>
                  <dt>Telefono</dt>
                  <dd>{clientProfile.phone ?? 'No cargado'}</dd>
                </div>
                <div>
                  <dt>Whatsapp</dt>
                  <dd>{clientProfile.whatsapp_phone ?? 'No cargado'}</dd>
                </div>
                <div>
                  <dt>Canal preferido</dt>
                  <dd>{clientProfile.preferred_contact_channel}</dd>
                </div>
                <div>
                  <dt>Direccion base</dt>
                  <dd>{clientProfile.default_address_text ?? 'No cargada'}</dd>
                </div>
                <div>
                  <dt>Notas</dt>
                  <dd>{clientProfile.address_notes ?? 'Sin notas'}</dd>
                </div>
                <div>
                  <dt>User created at</dt>
                  <dd>{formatDateTime(clientProfile.user_created_at)}</dd>
                </div>
                <div>
                  <dt>Profile updated at</dt>
                  <dd>{formatDateTime(clientProfile.updated_at)}</dd>
                </div>
              </dl>
            </article>

            <article className="users-panel">
              <p className="user-card__label">Editar perfil</p>
              <h3>Patch admin</h3>

              <form
                key={`${clientProfile.id}:${clientProfile.updated_at}`}
                className="auth-form"
                onSubmit={handleSubmit}
              >
                <label className="auth-form__field">
                  <span>Telefono</span>
                  <input
                    name="phone"
                    type="text"
                    defaultValue={clientProfile.phone ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Whatsapp</span>
                  <input
                    name="whatsapp_phone"
                    type="text"
                    defaultValue={clientProfile.whatsapp_phone ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Direccion base</span>
                  <input
                    name="default_address_text"
                    type="text"
                    defaultValue={clientProfile.default_address_text ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Notas de direccion</span>
                  <input
                    name="address_notes"
                    type="text"
                    defaultValue={clientProfile.address_notes ?? ''}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Canal preferido</span>
                  <select
                    name="preferred_contact_channel"
                    defaultValue={clientProfile.preferred_contact_channel}
                  >
                    <option value="phone">Telefono</option>
                    <option value="whatsapp">Whatsapp</option>
                  </select>
                </label>

                <button type="submit" disabled={isMutating}>
                  {updateClientProfile.isPending
                    ? 'Guardando...'
                    : 'Guardar cambios'}
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
            </article>
          </section>

          {canViewRelatedRecords ? (
            <section className="users-grid technician-profile-sections">
              <article className="users-panel technician-profile-collapsible-card">
                <div className="user-card__header">
                  <div>
                    <p className="user-card__label">Visitas</p>
                    <h2>Visitas del cliente</h2>
                  </div>
                  <button
                    type="button"
                    className="users-table__action"
                    onClick={() => setShowOperations((current) => !current)}
                  >
                    {showOperations ? 'Ocultar' : 'Visitas'}
                  </button>
                </div>

                {showOperations ? (
                  <div className="technician-profile-collapsible-card__content">
                    {isOperationsLoading ? (
                      <p className="users-message">Cargando visitas...</p>
                    ) : operationsError ? (
                      <p className="users-message users-message--error">
                        {operationsErrorMessage}
                      </p>
                    ) : operations.length ? (
                      <AdminOperationsTable operations={operations} />
                    ) : (
                      <p className="users-message">
                        No hay visitas para este cliente.
                      </p>
                    )}
                  </div>
                ) : null}
              </article>

              <article className="users-panel technician-profile-collapsible-card">
                <div className="user-card__header">
                  <div>
                    <p className="user-card__label">Orders</p>
                    <h2>Órdenes del cliente</h2>
                  </div>
                  <button
                    type="button"
                    className="users-table__action"
                    onClick={() => setShowOrders((current) => !current)}
                  >
                    {showOrders ? 'Ocultar' : 'Ordenes'}
                  </button>
                </div>

                {showOrders ? (
                  <div className="technician-profile-collapsible-card__content">
                    {isOrdersLoading ? (
                      <p className="users-message">Cargando orders...</p>
                    ) : ordersError ? (
                      <p className="users-message users-message--error">
                        {ordersErrorMessage}
                      </p>
                    ) : orders.length ? (
                      <ClientOrdersTable orders={orders} />
                    ) : (
                      <p className="users-message">
                        No hay orders para este cliente.
                      </p>
                    )}
                  </div>
                ) : null}
              </article>
            </section>
          ) : null}
        </>
      )}
    </>
  );
}

export function ClientProfileDetailDialog({
  clientProfileId,
  onClose,
}: {
  clientProfileId: string;
  onClose: () => void;
}) {
  const modalRef = useEscapeKey<HTMLDivElement>(onClose);

  return (
    <div
      ref={modalRef}
      data-escape-modal="true"
      className="users-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-profile-detail-title"
      onClick={onClose}
    >
      <section
        className="users-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <ClientProfileDetailView
          clientProfileId={clientProfileId}
          titleId="client-profile-detail-title"
          showCloseButton
          onClose={onClose}
        />
      </section>
    </div>
  );
}

export function ClientProfilePage({
  clientProfileId,
}: {
  clientProfileId: string;
}) {
  return (
    <main className="users-page">
      <section className="users-layout">
        <ClientProfileDetailView
          clientProfileId={clientProfileId}
          titleId="client-profile-page-title"
        />
      </section>
    </main>
  );
}
