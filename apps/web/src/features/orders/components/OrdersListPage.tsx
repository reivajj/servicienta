import { useDeferredValue, useState } from 'react';
import {
  useAcceptOrder,
  useAdminOrders,
  useCancelOrder,
  useCurrentOrders,
  useCurrentUser,
} from '@servicienta/query-hooks';
import type {
  OrderFlowType,
  OrderStatus,
  UsersPageSize,
} from '@servicienta/types';
import { SettingsActionButton } from '../../shared/components/SettingsActionButton';
import { OrderDetailDialog } from './OrderDetailDialog';

function formatClientName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function formatFlowType(flowType: OrderFlowType) {
  return flowType === 'client_selects' ? 'Client selects' : 'Tech applies';
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
  const pageSize: UsersPageSize = 25;
  const { data, error, isLoading } = useCurrentOrders({ page, pageSize });
  const cancelOrder = useCancelOrder();
  const acceptOrder = useAcceptOrder();
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const errorMessage =
    error instanceof Error ? error.message : 'No se pudieron cargar tus orders';

  return (
    <main className="users-page">
      <section className="users-layout">
        <header className="users-hero">
          <div>
            <p className="users-hero__eyebrow">
              {role === 'technician' ? 'Technician Orders' : 'Client Orders'}
            </p>
            <h1>{role === 'technician' ? 'Solicitudes' : 'Mis órdenes'}</h1>
            <p className="users-hero__copy">
              {role === 'technician'
                ? 'Aceptá solicitudes pendientes para crear la operación vinculada.'
                : 'Seguí tus solicitudes y cancelá las que todavía no fueron cerradas.'}
            </p>
          </div>

          <div className="users-hero__summary">
            <span>{data?.summary.totalOrders ?? 0} órdenes</span>
            <span>{data?.summary.pendingOrders ?? 0} pending</span>
            <span>{data?.summary.acceptedOrders ?? 0} accepted</span>
            <span>{data?.summary.completedOrders ?? 0} completed</span>
          </div>
        </header>

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
                  <th>Accion</th>
                  <th>Status</th>
                  <th>Dirección</th>
                  <th>Problema</th>
                  <th>Zona</th>
                  <th>Rubro</th>
                </tr>
              </thead>
              <tbody>
                {items.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="users-table__actions">
                        {role === 'technician' && order.status === 'pending' ? (
                          <button
                            type="button"
                            className="users-table__action"
                            disabled={acceptOrder.isPending}
                            onClick={() => acceptOrder.mutate(order.id)}
                          >
                            Aceptar
                          </button>
                        ) : null}
                        {order.status !== 'completed' &&
                        order.status !== 'completed_tech' &&
                        order.status !== 'cancelled' ? (
                          <button
                            type="button"
                            className="users-table__action"
                            disabled={cancelOrder.isPending}
                            onClick={() => cancelOrder.mutate(order.id)}
                          >
                            Cancelar
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(order.status)}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.service_address_text}</td>
                    <td>{order.description}</td>
                    <td>{order.zone_slug ?? 'Sin definir'}</td>
                    <td>{order.appliance_type_slug ?? 'Sin definir'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="users-panel">
            <p>No hay órdenes por ahora.</p>
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
    error instanceof Error ? error.message : 'No se pudieron cargar las orders';
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
            <p className="users-hero__eyebrow">Admin Orders</p>
            <h1>Orders</h1>
            <p className="users-hero__copy">
              Primera vista administrativa de órdenes para inspeccionar cliente,
              flujo, estado y dirección de servicio.
            </p>
          </div>

          <div className="users-hero__summary">
            <span>{summary?.totalOrders ?? 0} órdenes</span>
            <span>{summary?.pendingOrders ?? 0} pending</span>
            <span>{summary?.acceptedOrders ?? 0} accepted</span>
            <span>{summary?.inProgressOrders ?? 0} in progress</span>
            <span>{summary?.completedTechOrders ?? 0} completed tech</span>
            <span>{summary?.completedOrders ?? 0} completed</span>
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
            <span>Status</span>
            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as OrderStatus | 'all')
              }
            >
              <option value="all">Todos</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="cancelled">Cancelled</option>
              <option value="in_progress">In progress</option>
              <option value="completed_tech">Completed tech</option>
              <option value="completed">Completed</option>
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
              <option value="client_selects">Client selects</option>
              <option value="tech_applies">Tech applies</option>
            </select>
          </label>

          <div className="users-toolbar__group">
            <label className="users-toolbar__field">
              <span>Page size</span>
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
                  <th>Accion</th>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Flujo</th>
                  <th>Status</th>
                  <th>Dirección</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <SettingsActionButton
                        label="Ver y editar order"
                        onClick={() => setSelectedOrderId(order.id)}
                      />
                    </td>
                    <td>
                      {formatClientName(
                        order.client_name,
                        order.client_surname,
                      )}
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
      </section>
    </main>
  );
}
