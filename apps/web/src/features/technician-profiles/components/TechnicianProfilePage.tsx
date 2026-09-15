import { useState } from 'react';
import {
  useAdminTechnicianProfile,
  useCurrentTechnicianProfile,
  useAdminOperations,
  useAdminOrders,
  useCurrentUser,
  usePublicTechnicianProfile,
  useUpdateAdminTechnicianProfile,
  useUpdateCurrentTechnicianProfile,
} from '@servicienta/query-hooks';
import type {
  AdminOrder,
  OrderFlowType,
  OrderStatus,
  PublicTechnicianProfile,
  UpdateTechnicianProfileInput,
} from '@servicienta/types';
import { AdminOperationsTable } from '../../operations/components/AdminOperationsTable';
import { ViewOrderActionLink } from '../../shared/components/ViewOrderActionLink';
import { TechnicianProfileEditCard } from './TechnicianProfileEditCard';

function formatTechnicianName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function formatFlowType(flowType: OrderFlowType) {
  return flowType === 'client_selects' ? 'Client selects' : 'Tech applies';
}

function formatDateTime(value: string | null) {
  if (!value) return 'Sin definir';

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatOptionalText(value: string | null) {
  return value?.trim() || 'Sin definir';
}

function formatOptionalNumber(value: number | null, suffix = '') {
  if (value === null) return 'Sin definir';

  return `${value}${suffix}`;
}

function formatContactChannel(channel: 'phone' | 'whatsapp') {
  return channel === 'whatsapp' ? 'WhatsApp' : 'Teléfono';
}

function getStatusBadgeClass(status: OrderStatus) {
  return `status-badge status-badge--${status}`;
}

function PublicTechnicianProfileView({
  profile,
}: {
  profile: PublicTechnicianProfile;
}) {
  return (
    <>
      <header className="users-hero">
        <div>
          <p className="users-hero__eyebrow">Technician Profile</p>
          <h1>{formatTechnicianName(profile.name, profile.surname)}</h1>
          <p className="users-hero__copy">
            Perfil público del técnico con información visible para clientes.
          </p>
        </div>

        <div className="users-hero__summary">
          <span>{profile.rating.toFixed(1)} rating</span>
          <span>{profile.rating_count} reviews</span>
          <span>{profile.available ? 'Disponible' : 'No disponible'}</span>
        </div>
      </header>

      <section className="users-detail-grid">
        <article className="users-panel">
          <div className="user-card__header">
            <div>
              <p className="user-card__label">Perfil público</p>
              <h2>{formatTechnicianName(profile.name, profile.surname)}</h2>
            </div>
            <span
              className={
                profile.available
                  ? 'user-badge user-badge--active'
                  : 'user-badge user-badge--deleted'
              }
            >
              {profile.available ? 'Disponible' : 'No disponible'}
            </span>
          </div>

          <dl className="user-card__meta">
            <div>
              <dt>Public slug</dt>
              <dd>{profile.public_slug}</dd>
            </div>
            <div>
              <dt>Bio</dt>
              <dd>{profile.bio || 'Sin bio pública'}</dd>
            </div>
          </dl>
        </article>

        <article className="users-panel">
          <div className="user-card__header">
            <div>
              <p className="user-card__label">Reputación</p>
              <h2>Rating y verificación</h2>
            </div>
          </div>

          <dl className="user-card__meta">
            <div>
              <dt>Rating</dt>
              <dd>
                {profile.rating.toFixed(1)} / 5 ({profile.rating_count} reviews)
              </dd>
            </div>
            <div>
              <dt>Verificado</dt>
              <dd>{formatDateTime(profile.verified_at)}</dd>
            </div>
            <div>
              <dt>Creado</dt>
              <dd>{formatDateTime(profile.created_at)}</dd>
            </div>
          </dl>
        </article>
      </section>
    </>
  );
}

function TechnicianOrdersTable({ orders }: { orders: AdminOrder[] }) {
  return (
    <section className="users-table-wrapper">
      <table className="users-table">
        <thead>
          <tr>
            <th>Accion</th>
            <th>Cliente</th>
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
                {formatTechnicianName(order.client_name, order.client_surname)}
              </td>
              <td>{order.client_email}</td>
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

export function TechnicianProfilePage({
  technicianId,
}: {
  technicianId: string;
}) {
  const [showOperations, setShowOperations] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

  const { data: currentUser, isLoading: isCurrentUserLoading } =
    useCurrentUser();
  const canUseAdminProfile = currentUser?.role === 'admin';
  const canUseCurrentProfile =
    currentUser?.role === 'technician' && currentUser.id === technicianId;
  const canUsePublicProfile = currentUser?.role === 'client';
  const canEditProfile = canUseAdminProfile || canUseCurrentProfile;

  const {
    data: adminProfile,
    error: adminProfileError,
    isLoading: isAdminProfileLoading,
  } = useAdminTechnicianProfile(technicianId, { enabled: canUseAdminProfile });
  const {
    data: currentProfile,
    error: currentProfileError,
    isLoading: isCurrentProfileLoading,
  } = useCurrentTechnicianProfile({ enabled: canUseCurrentProfile });
  const {
    data: publicProfile,
    error: publicProfileError,
    isLoading: isPublicProfileLoading,
  } = usePublicTechnicianProfile(canUsePublicProfile ? technicianId : '');
  const updateAdminProfileMutation = useUpdateAdminTechnicianProfile();
  const updateCurrentProfileMutation = useUpdateCurrentTechnicianProfile();
  const {
    data: operationsData,
    error: operationsError,
    isLoading: isOperationsLoading,
  } = useAdminOperations(
    {
      page: 1,
      pageSize: 25,
      technician_id: technicianId,
    },
    { enabled: canUseAdminProfile },
  );
  const {
    data: ordersData,
    error: ordersError,
    isLoading: isOrdersLoading,
  } = useAdminOrders(
    {
      page: 1,
      pageSize: 25,
      technician_id: technicianId,
    },
    { enabled: canUseAdminProfile },
  );

  const profile = canUseAdminProfile ? adminProfile : currentProfile;
  const profileError = canUseAdminProfile
    ? adminProfileError
    : canUsePublicProfile
      ? publicProfileError
      : currentProfileError;
  const isProfileLoading =
    isCurrentUserLoading ||
    (canUseAdminProfile && isAdminProfileLoading) ||
    (canUseCurrentProfile && isCurrentProfileLoading) ||
    (canUsePublicProfile && isPublicProfileLoading);
  const profileErrorMessage =
    profileError instanceof Error
      ? profileError.message
      : 'No se pudo cargar el técnico';
  const operationsErrorMessage =
    operationsError instanceof Error
      ? operationsError.message
      : 'No se pudieron cargar las visitas';
  const ordersErrorMessage =
    ordersError instanceof Error
      ? ordersError.message
      : 'No se pudieron cargar las orders';
  const operations = operationsData?.items ?? [];
  const orders = ordersData?.items ?? [];
  const isSaving =
    updateAdminProfileMutation.isPending ||
    updateCurrentProfileMutation.isPending;

  async function handleProfileSave(input: UpdateTechnicianProfileInput) {
    if (canUseAdminProfile) {
      await updateAdminProfileMutation.mutateAsync({ technicianId, input });
      return;
    }

    await updateCurrentProfileMutation.mutateAsync(input);
  }

  return (
    <main className="users-page">
      <section className="users-layout">
        {isProfileLoading ? (
          <section className="users-panel">
            <p>Cargando técnico...</p>
          </section>
        ) : canUsePublicProfile ? (
          publicProfile ? (
            <PublicTechnicianProfileView profile={publicProfile} />
          ) : (
            <section className="users-panel">
              <p className="users-message users-message--error">
                {profileErrorMessage}
              </p>
            </section>
          )
        ) : profileError || !profile ? (
          <section className="users-panel">
            <p className="users-message users-message--error">
              {profileErrorMessage}
            </p>
          </section>
        ) : (
          <>
            <header className="users-hero">
              <div>
                <p className="users-hero__eyebrow">Technician Profile</p>
                <h1>{formatTechnicianName(profile.name, profile.surname)}</h1>
                <p className="users-hero__copy">
                  Vista operativa completa del técnico, con datos de perfil,
                  pedidos y visitas asociadas.
                </p>
              </div>

              <div className="users-hero__summary">
                <span>{profile.rating.toFixed(1)} rating</span>
                <span>{profile.rating_count} reviews</span>
                <span>
                  {profile.available ? 'Disponible' : 'No disponible'}
                </span>
                <span>{profile.status}</span>
              </div>
            </header>

            {canEditProfile ? (
              <TechnicianProfileEditCard
                profile={profile}
                isSaving={isSaving}
                onSave={handleProfileSave}
              />
            ) : null}

            <section className="users-detail-grid">
              <article className="users-panel">
                <div className="user-card__header">
                  <div>
                    <p className="user-card__label">Identidad</p>
                    <h2>{profile.email}</h2>
                  </div>
                </div>

                <dl className="user-card__meta">
                  <div>
                    <dt>Technician ID</dt>
                    <dd>{profile.id}</dd>
                  </div>
                  <div>
                    <dt>Public slug</dt>
                    <dd>{profile.public_slug}</dd>
                  </div>
                  <div>
                    <dt>Nombre</dt>
                    <dd>
                      {formatTechnicianName(profile.name, profile.surname)}
                    </dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{profile.email}</dd>
                  </div>
                </dl>
              </article>

              <article className="users-panel">
                <div className="user-card__header">
                  <div>
                    <p className="user-card__label">Perfil</p>
                    <h2>Datos públicos y operativos</h2>
                  </div>
                  <span
                    className={
                      profile.available
                        ? 'user-badge user-badge--active'
                        : 'user-badge user-badge--deleted'
                    }
                  >
                    {profile.available ? 'Disponible' : 'No disponible'}
                  </span>
                </div>

                <dl className="user-card__meta">
                  <div>
                    <dt>Bio</dt>
                    <dd>{profile.bio || 'Sin bio'}</dd>
                  </div>
                  <div>
                    <dt>Rating</dt>
                    <dd>
                      {profile.rating.toFixed(1)} / 5 ({profile.rating_count}{' '}
                      reviews)
                    </dd>
                  </div>
                  <div>
                    <dt>Verified at</dt>
                    <dd>{formatDateTime(profile.verified_at)}</dd>
                  </div>
                  <div>
                    <dt>Created at</dt>
                    <dd>{formatDateTime(profile.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Updated at</dt>
                    <dd>{formatDateTime(profile.updated_at)}</dd>
                  </div>
                </dl>
              </article>
            </section>

            <section className="users-detail-grid technician-profile-sections">
              <article className="users-panel">
                <div className="user-card__header">
                  <div>
                    <p className="user-card__label">Contacto</p>
                    <h2>Datos operativos internos</h2>
                  </div>
                </div>

                <dl className="user-card__meta">
                  <div>
                    <dt>Teléfono</dt>
                    <dd>{formatOptionalText(profile.phone)}</dd>
                  </div>
                  <div>
                    <dt>WhatsApp</dt>
                    <dd>{formatOptionalText(profile.whatsapp_phone)}</dd>
                  </div>
                  <div>
                    <dt>Canal preferido</dt>
                    <dd>
                      {formatContactChannel(profile.preferred_contact_channel)}
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="users-panel">
                <div className="user-card__header">
                  <div>
                    <p className="user-card__label">Base</p>
                    <h2>Dirección y cobertura</h2>
                  </div>
                </div>

                <dl className="user-card__meta">
                  <div>
                    <dt>Dirección base</dt>
                    <dd>{formatOptionalText(profile.base_address_text)}</dd>
                  </div>
                  <div>
                    <dt>Coordenadas base</dt>
                    <dd>
                      {profile.base_lat === null || profile.base_lng === null
                        ? 'Sin definir'
                        : `${profile.base_lat}, ${profile.base_lng}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Radio operativo</dt>
                    <dd>
                      {formatOptionalNumber(profile.service_radius_km, ' km')}
                    </dd>
                  </div>
                </dl>
              </article>
            </section>

            {canUseAdminProfile ? (
              <section className="users-grid technician-profile-sections">
                <article className="users-panel technician-profile-collapsible-card">
                  <div className="user-card__header">
                    <div>
                      <p className="user-card__label">Visitas</p>
                      <h2>Visitas del técnico</h2>
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
                          No hay visitas para este técnico.
                        </p>
                      )}
                    </div>
                  ) : null}
                </article>

                <article className="users-panel technician-profile-collapsible-card">
                  <div className="user-card__header">
                    <div>
                      <p className="user-card__label">Orders</p>
                      <h2>Órdenes relacionadas</h2>
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
                        <TechnicianOrdersTable orders={orders} />
                      ) : (
                        <p className="users-message">
                          No hay orders relacionadas a este técnico.
                        </p>
                      )}
                    </div>
                  ) : null}
                </article>
              </section>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
