import { useState } from 'react';
import { useAdminOperations } from '@servicienta/query-hooks';
import type { OperationStatus, UsersPageSize } from '@servicienta/types';

function formatFullName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function formatDateTime(value: string | null) {
  if (!value) return 'Sin definir';

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function OperationsListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<UsersPageSize>(25);
  const [status, setStatus] = useState<OperationStatus | 'all'>('all');

  const { data, error, isLoading } = useAdminOperations({
    page,
    pageSize,
    status: status === 'all' ? undefined : status,
  });

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudieron cargar las operations';
  const items = data?.items ?? [];
  const summary = data?.summary;
  const pagination = data?.pagination;
  const start = pagination?.total
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const end = pagination?.total ? start + items.length - 1 : 0;
  const hasActiveFilters = status !== 'all' || pageSize !== 25 || page !== 1;

  function handleStatusChange(nextStatus: OperationStatus | 'all') {
    setStatus(nextStatus);
    setPage(1);
  }

  function handlePageSizeChange(nextPageSize: UsersPageSize) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  function handleClearFilters() {
    setStatus('all');
    setPageSize(25);
    setPage(1);
  }

  return (
    <main className="users-page">
      <section className="users-layout">
        <header className="users-hero">
          <div>
            <p className="users-hero__eyebrow">Admin Operations</p>
            <h1>Operations</h1>
            <p className="users-hero__copy">
              Vista administrativa inicial para inspeccionar la asignación entre
              órdenes y técnicos, con fechas y estado operativo.
            </p>
          </div>

          <div className="users-hero__summary">
            <span>{summary?.totalOperations ?? 0} operations</span>
            <span>{summary?.pendingOperations ?? 0} pending</span>
            <span>{summary?.confirmedOperations ?? 0} confirmed</span>
            <span>{summary?.completedOperations ?? 0} completed</span>
            <span>{summary?.cancelledOperations ?? 0} cancelled</span>
          </div>
        </header>

        <section className="users-toolbar">
          <label className="users-toolbar__field">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as OperationStatus | 'all')
              }
            >
              <option value="all">Todos</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
            <p>Cargando operations...</p>
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
                  <th>Cliente</th>
                  <th>Técnico</th>
                  <th>Slug</th>
                  <th>Order</th>
                  <th>Operation</th>
                  <th>Programada</th>
                  <th>Completada</th>
                  <th>Dirección</th>
                </tr>
              </thead>
              <tbody>
                {items.map((operation) => (
                  <tr key={operation.id}>
                    <td>
                      {formatFullName(
                        operation.client_name,
                        operation.client_surname,
                      )}
                    </td>
                    <td>
                      {formatFullName(
                        operation.technician_name,
                        operation.technician_surname,
                      )}
                    </td>
                    <td>{operation.technician_public_slug}</td>
                    <td>
                      <span className="technician-catalog-chip">
                        {operation.order_status}
                      </span>
                    </td>
                    <td>
                      <span className="technician-catalog-chip">
                        {operation.status}
                      </span>
                    </td>
                    <td>{formatDateTime(operation.scheduled_at)}</td>
                    <td>{formatDateTime(operation.completed_at)}</td>
                    <td>{operation.service_address_text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="users-panel">
            <p>No hay operations para los filtros actuales.</p>
          </section>
        )}

        <section className="users-pagination">
          <div className="users-pagination__summary">
            <span>
              {pagination?.total
                ? `Mostrando ${start}-${end} de ${pagination.total}`
                : 'Sin resultados'}
            </span>
          </div>

          <div className="users-pagination__controls">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={!pagination || pagination.page <= 1}
            >
              Anterior
            </button>
            <span>
              Página {pagination?.page ?? 1} de {pagination?.totalPages ?? 1}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((currentPage) =>
                  pagination
                    ? Math.min(pagination.totalPages, currentPage + 1)
                    : currentPage,
                )
              }
              disabled={!pagination || pagination.page >= pagination.totalPages}
            >
              Siguiente
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
