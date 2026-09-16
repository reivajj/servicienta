import { useDeferredValue, useState } from 'react';
import {
  useAcceptOrder,
  useAdminOrders,
  useCurrentOrders,
  useCurrentUser,
} from '@servicienta/query-hooks';
import type {
  OrderFlowType,
  OrderStatus,
  UsersPageSize,
} from '@servicienta/types';
import { AcceptOrderActionButton } from '../../shared/components/AcceptOrderActionButton';
import { SettingsActionButton } from '../../shared/components/SettingsActionButton';
import { ViewOrderActionLink } from '../../shared/components/ViewOrderActionLink';
import {
  formatOrderFlowType,
  formatOrderStatus,
} from '../../shared/utils/operation-status';
import { OrderDetailDialog } from './OrderDetailDialog';
import { OrderVisitsActionButton, OrderVisitsDialog } from './OrderVisitsDialog';

function formatClientName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function getStatusBadgeClass(status: OrderStatus) {
  return `status-badge status-badge--${status}`;
}

export function OrdersListPage() {
  const { data: currentUser, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return (
      <main className="users-page">
        <section className="users-panel">
          <p>Cargando usuario...</p>
        </section>
      </main>
    );
  }

  if (error || !currentUser) {
    return (
      <main className="users-page">
        <section className="users-panel">
          <p className="users-message users-message--error">
            No se pudo cargar el usuario actual.
          </p>
        </section>
      </main>
    );
  }

  if (currentUser.role === 'admin') return <AdminOrdersListPage />;

  return <CurrentOrdersListPage role={currentUser.role} />;
}

function CurrentOrdersListPage({ role }: { role: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<UsersPageSize>(25);
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [visitsOrderId, setVisitsOrderId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search.trim());
  const { data, error, isLoading } = useCurrentOrders({
    page,
    pageSize,
    status: status === 'all' ? undefined : status,
    search: deferredSearch.length >= 3 ? deferredSearch : undefined,
  });
  const acceptOrder = useAcceptOrder();
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const start = pagination?.total ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const end = pagination?.total ? start + items.length - 1 : 0;
  const hasActiveFilters = search.length > 0 || status !== 'all' || pageSize !== 25 || page !== 1;
  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudieron cargar tus pedidos';

  return (
    <main className="users-page">
      <section className="users-layout">
        <header className="users-hero">
          <div>
            <p className="users-hero__eyebrow">
              {role === 'technician'
                ? 'Pedidos del técnico'
                : 'Pedidos del usuario'}
            </p>
            <h1>{role === 'technician' ? 'Pedidos' : 'Mis órdenes'}</h1>
            <p className="users-hero__copy">
              {role === 'technician'
                ? 'Aceptá solicitudes pendientes para crear la visita vinculada.'
                : 'Seguí tus solicitudes y cancelá las que todavía no fueron cerradas.'}
            </p>
          </div>

          <div className="users-hero__summary">
            <span>{data?.summary.totalOrders ?? 0} órdenes</span>
            <span>{data?.summary.pendingOrders ?? 0} pendientes</span>
            <span>{data?.summary.acceptedOrders ?? 0} aceptados</span>
            <span>{data?.summary.completedOrders ?? 0} completados</span>
          </div>
        </header>

        {role === 'technician' ? (
          <section className="users-toolbar users-toolbar--technician-orders">
            <label className="users-toolbar__field">
              <span>Buscar</span>
              <input type="search" value={search} placeholder="Descripción o dirección" onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
              <small className="users-toolbar__hint">{search.trim().length > 0 && search.trim().length < 3 ? 'Escribí al menos 3 caracteres para buscar' : ' '}</small>
            </label>
            <label className="users-toolbar__field">
              <span>Estado</span>
              <select value={status} onChange={(event) => { setStatus(event.target.value as OrderStatus | 'all'); setPage(1); }}>
                <option value="all">Todos</option><option value="pending">Pendiente</option><option value="accepted">Aceptado</option><option value="cancelled">Cancelado</option><option value="in_progress">En progreso</option><option value="completed_tech">Completado por técnico</option><option value="completion_rejected">Finalización rechazada</option><option value="completed">Completado</option>
              </select>
            </label>
            <div className="users-toolbar__group">
              <label className="users-toolbar__field"><span>Resultados por página</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value) as UsersPageSize); setPage(1); }}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label>
              <div className="users-toolbar__actions"><button type="button" className="users-toolbar__clear" disabled={!hasActiveFilters} aria-label="Quitar filtros" title="Quitar filtros" onClick={() => { setSearch(''); setStatus('all'); setPageSize(25); setPage(1); }}>×</button></div>
            </div>
          </section>
        ) : null}

        {isLoading ? (
          <section className="users-panel">
            <p>Cargando órdenes...</p>
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
                  <th>Acción</th>
                  <th>Estado</th>
                  <th>Dirección</th>
                  <th>Problema</th>
                  <th>Zona</th>
                  <th>Rubro</th>
                  <th>Visitas</th>
                </tr>
              </thead>
              <tbody>
                {items.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="users-table__actions">
                        <ViewOrderActionLink orderId={order.id} />

                        <SettingsActionButton
                          label="Ver y gestionar pedido"
                          onClick={() => setSelectedOrderId(order.id)}
                        />

                        {role === 'technician' && order.status === 'pending' ? (
                          <AcceptOrderActionButton
                            label="Aceptar pedido"
                            disabled={acceptOrder.isPending}
                            onClick={() => acceptOrder.mutate(order.id)}
                          />
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(order.status)}>
                        {formatOrderStatus(order.status)}
                      </span>
                    </td>
                    <td>{order.service_address_text}</td>
                    <td>{order.description}</td>
                    <td>{order.zone_slug ?? 'Sin definir'}</td>
                    <td>{order.appliance_type_slug ?? 'Sin definir'}</td>
                    <td><OrderVisitsActionButton onClick={() => setVisitsOrderId(order.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="users-panel">
            <p>{role === 'technician' && hasActiveFilters ? 'No hay pedidos para los filtros actuales.' : 'No hay órdenes por ahora.'}</p>
          </section>
        )}

        <section className="users-pagination">
          <p className="users-pagination__summary">
            {pagination?.total ? `Mostrando ${start}-${end} de ${pagination.total}` : 'Sin resultados'}
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
              Pagina {pagination?.page ?? page} de {pagination?.totalPages ?? 1}
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

        {selectedOrderId ? (
          <OrderDetailDialog
            orderId={selectedOrderId}
            mode="current"
            onClose={() => setSelectedOrderId(null)}
          />
        ) : null}
        {visitsOrderId ? <OrderVisitsDialog orderId={visitsOrderId} mode="current" onClose={() => setVisitsOrderId(null)} /> : null}
      </section>
    </main>
  );
}

function AdminOrdersListPage() {
  const MIN_SEARCH_LENGTH = 3;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<UsersPageSize>(25);
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [flowType, setFlowType] = useState<OrderFlowType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [visitsOrderId, setVisitsOrderId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search.trim());
  const searchFilter =
    deferredSearch.length >= MIN_SEARCH_LENGTH ? deferredSearch : undefined;

  const { data, error, isLoading } = useAdminOrders({
    page,
    pageSize,
    status: status === 'all' ? undefined : status,
    flow_type: flowType === 'all' ? undefined : flowType,
    search: searchFilter,
  });

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudieron cargar los pedidos';
  const items = data?.items ?? [];
  const summary = data?.summary;
  const pagination = data?.pagination;
  const start = pagination?.total
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const end = pagination?.total ? start + items.length - 1 : 0;
  const hasActiveFilters =
    search.length > 0 ||
    status !== 'all' ||
    flowType !== 'all' ||
    pageSize !== 25 ||
    page !== 1;

  function handleStatusChange(nextStatus: OrderStatus | 'all') {
    setStatus(nextStatus);
    setPage(1);
  }

  function handleFlowTypeChange(nextFlowType: OrderFlowType | 'all') {
    setFlowType(nextFlowType);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePageSizeChange(nextPageSize: UsersPageSize) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  function handleClearFilters() {
    setSearch('');
    setStatus('all');
    setFlowType('all');
    setPageSize(25);
    setPage(1);
  }

  return (
    <main className="users-page">
      <section className="users-layout">
        <header className="users-hero">
          <div>
            <p className="users-hero__eyebrow">Administración de pedidos</p>
            <h1>Pedidos</h1>
            <p className="users-hero__copy">
              Primera vista administrativa de órdenes para inspeccionar cliente,
              flujo, estado y dirección de servicio.
            </p>
          </div>

          <div className="users-hero__summary">
            <span>{summary?.totalOrders ?? 0} órdenes</span>
            <span>{summary?.pendingOrders ?? 0} pendientes</span>
            <span>{summary?.acceptedOrders ?? 0} aceptados</span>
            <span>{summary?.inProgressOrders ?? 0} en progreso</span>
            <span>
              {summary?.completedTechOrders ?? 0} completados por técnico
            </span>
            <span>{summary?.completedOrders ?? 0} completados</span>
          </div>
        </header>

        <section className="users-toolbar">
          <label className="users-toolbar__field">
            <span>Buscar</span>
            <input
              type="search"
              value={search}
              placeholder="Descripción o dirección"
              onChange={(event) => handleSearchChange(event.target.value)}
            />
            <small className="users-toolbar__hint">
              {search.trim().length > 0 &&
              search.trim().length < MIN_SEARCH_LENGTH
                ? 'Escribi al menos 3 caracteres para buscar'
                : ' '}
            </small>
          </label>

          <label className="users-toolbar__field">
            <span>Estado</span>
            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as OrderStatus | 'all')
              }
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="accepted">Aceptado</option>
              <option value="cancelled">Cancelado</option>
              <option value="in_progress">En progreso</option>
              <option value="completed_tech">Completado por técnico</option>
              <option value="completion_rejected">
                Finalización rechazada
              </option>
              <option value="completed">Completado</option>
            </select>
          </label>

          <label className="users-toolbar__field">
            <span>Flujo</span>
            <select
              value={flowType}
              onChange={(event) =>
                handleFlowTypeChange(
                  event.target.value as OrderFlowType | 'all',
                )
              }
            >
              <option value="all">Todos</option>
              <option value="client_selects">El cliente elige</option>
              <option value="tech_applies">El técnico se postula</option>
            </select>
          </label>

          <div className="users-toolbar__group">
            <label className="users-toolbar__field">
              <span>Resultados por página</span>
              <select
                value={String(pageSize)}
                onChange={(event) =>
                  handlePageSizeChange(
                    Number(event.target.value) as UsersPageSize,
                  )
                }
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
                    r="5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M15 15l4.5 4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8.6 8.6l3.8 3.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12.4 8.6l-3.8 3.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {isLoading ? (
          <section className="users-panel">
            <p>Cargando órdenes...</p>
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
                  <th>Acción</th>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Flujo</th>
                  <th>Estado</th>
                  <th>Dirección</th>
                  <th>Descripción</th>
                  <th>Visitas</th>
                </tr>
              </thead>
              <tbody>
                {items.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="users-table__actions">
                        <SettingsActionButton
                          label="Ver y editar pedido"
                          onClick={() => setSelectedOrderId(order.id)}
                        />

                        <ViewOrderActionLink orderId={order.id} />
                      </div>
                    </td>
                    <td>
                      {formatClientName(
                        order.client_name,
                        order.client_surname,
                      )}
                    </td>
                    <td>{order.client_email}</td>
                    <td>{formatOrderFlowType(order.flow_type)}</td>
                    <td>
                      <span className={getStatusBadgeClass(order.status)}>
                        {formatOrderStatus(order.status)}
                      </span>
                    </td>
                    <td>{order.service_address_text}</td>
                    <td>{order.description}</td>
                    <td><OrderVisitsActionButton onClick={() => setVisitsOrderId(order.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="users-panel">
            <p>No hay órdenes para los filtros actuales.</p>
          </section>
        )}

        <section className="users-pagination">
          <p className="users-pagination__summary">
            {pagination?.total
              ? `Mostrando ${start}-${end} de ${pagination.total}`
              : 'Mostrando 0 resultados'}
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
              Pagina {pagination?.page ?? page} de {pagination?.totalPages ?? 1}
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

        {selectedOrderId ? (
          <OrderDetailDialog
            orderId={selectedOrderId}
            onClose={() => setSelectedOrderId(null)}
          />
        ) : null}
        {visitsOrderId ? <OrderVisitsDialog orderId={visitsOrderId} mode="admin" onClose={() => setVisitsOrderId(null)} /> : null}
      </section>
    </main>
  );
}
