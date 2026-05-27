import { useState } from 'react';
import {
  useAdminOperations,
  useCancelOperation,
  useCompleteTechOperation,
  useConfirmCompletedOperation,
  useCurrentOperations,
  useCurrentUser,
  useScheduleOperation,
} from '@servicienta/query-hooks';
import type {
  Operation,
  OperationStatus,
  UsersPageSize,
} from '@servicienta/types';
import { AdminOperationsTable } from './AdminOperationsTable';
import { OperationDetailDialog } from './OperationDetailDialog';

function getStatusBadgeClass(status: string) {
  return `status-badge status-badge--${status}`;
}

function formatDateTime(value: string | null) {
  if (!value) return 'Sin definir';

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toDateTimeLocal(value: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoDateTime(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return '';

  return new Date(rawValue).toISOString();
}

export function OperationsListPage() {
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

  if (currentUser.role === 'admin') return <AdminOperationsListPage />;

  return <CurrentOperationsListPage role={currentUser.role} />;
}

function CurrentOperationsListPage({ role }: { role: string }) {
  const [page, setPage] = useState(1);
  const [scheduleOperation, setScheduleOperation] = useState<Operation | null>(
    null,
  );
  const pageSize: UsersPageSize = 25;
  const { data, error, isLoading } = useCurrentOperations({ page, pageSize });
  const scheduleMutation = useScheduleOperation();
  const completeTechMutation = useCompleteTechOperation();
  const confirmCompletedMutation = useConfirmCompletedOperation();
  const cancelOperation = useCancelOperation();
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudieron cargar tus operations';

  async function handleScheduleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scheduleOperation) return;

    const formData = new FormData(event.currentTarget);

    await scheduleMutation.mutateAsync({
      operationId: scheduleOperation.id,
      input: {
        scheduled_at: toIsoDateTime(formData.get('scheduled_at')),
        description: String(formData.get('description') ?? ''),
      },
    });

    setScheduleOperation(null);
  }

  return (
    <main className="users-page">
      <section className="users-layout">
        <header className="users-hero">
          <div>
            <p className="users-hero__eyebrow">
              {role === 'technician'
                ? 'Technician Operations'
                : 'Client Operations'}
            </p>
            <h1>Operations</h1>
            <p className="users-hero__copy">
              {role === 'technician'
                ? 'Agendá, cancelá o marcá terminadas tus operaciones.'
                : 'Confirmá el cierre cuando el técnico marcó su trabajo terminado.'}
            </p>
          </div>

          <div className="users-hero__summary">
            <span>{data?.summary.totalOperations ?? 0} operations</span>
            <span>{data?.summary.pendingOperations ?? 0} pending</span>
            <span>{data?.summary.scheduledOperations ?? 0} scheduled</span>
            <span>
              {data?.summary.completedTechOperations ?? 0} completed tech
            </span>
          </div>
        </header>

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
                  <th>Accion</th>
                  <th>Status</th>
                  <th>Programada</th>
                  <th>Terminada técnico</th>
                  <th>Completada</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((operation) => (
                  <tr key={operation.id}>
                    <td>
                      <div className="users-table__actions">
                        {role === 'technician' &&
                        operation.status === 'pending' ? (
                          <button
                            type="button"
                            className="users-table__action"
                            onClick={() => setScheduleOperation(operation)}
                          >
                            Agendar
                          </button>
                        ) : null}
                        {role === 'technician' &&
                        operation.status === 'scheduled' ? (
                          <button
                            type="button"
                            className="users-table__action"
                            disabled={completeTechMutation.isPending}
                            onClick={() =>
                              completeTechMutation.mutate(operation.id)
                            }
                          >
                            Completar técnico
                          </button>
                        ) : null}
                        {role === 'technician' &&
                        (operation.status === 'pending' ||
                          operation.status === 'scheduled') ? (
                          <button
                            type="button"
                            className="users-table__action"
                            disabled={cancelOperation.isPending}
                            onClick={() => cancelOperation.mutate(operation.id)}
                          >
                            Cancelar
                          </button>
                        ) : null}
                        {role === 'client' &&
                        operation.status === 'completed_tech' ? (
                          <button
                            type="button"
                            className="users-table__action"
                            disabled={confirmCompletedMutation.isPending}
                            onClick={() =>
                              confirmCompletedMutation.mutate(operation.id)
                            }
                          >
                            Confirmar cierre
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(operation.status)}>
                        {operation.status}
                      </span>
                    </td>
                    <td>{formatDateTime(operation.scheduled_at)}</td>
                    <td>{formatDateTime(operation.technician_completed_at)}</td>
                    <td>{formatDateTime(operation.completed_at)}</td>
                    <td>{operation.description ?? 'Sin definir'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="users-panel">
            <p>No hay operations por ahora.</p>
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

      {scheduleOperation ? (
        <div
          className="users-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-operation-title"
          onClick={() => setScheduleOperation(null)}
        >
          <section
            className="users-modal__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="users-modal__header">
              <div>
                <p className="users-hero__eyebrow">Schedule</p>
                <h2 id="schedule-operation-title">Agendar operation</h2>
              </div>
              <button
                type="button"
                className="users-modal__close"
                onClick={() => setScheduleOperation(null)}
              >
                Cerrar
              </button>
            </header>
            <form className="auth-form" onSubmit={handleScheduleSubmit}>
              <label className="auth-form__field">
                <span>Fecha y horario</span>
                <input
                  name="scheduled_at"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(scheduleOperation.scheduled_at)}
                  required
                />
              </label>
              <label className="auth-form__field">
                <span>Descripción técnica</span>
                <textarea
                  name="description"
                  defaultValue={scheduleOperation.description ?? ''}
                  required
                />
              </label>
              <button type="submit" disabled={scheduleMutation.isPending}>
                {scheduleMutation.isPending ? 'Guardando...' : 'Agendar'}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function AdminOperationsListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<UsersPageSize>(25);
  const [status, setStatus] = useState<OperationStatus | 'all'>('all');
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(
    null,
  );

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
            <span>{summary?.scheduledOperations ?? 0} scheduled</span>
            <span>{summary?.completedTechOperations ?? 0} completed tech</span>
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
                handleStatusChange(
                  event.target.value as OperationStatus | 'all',
                )
              }
            >
              <option value="all">Todos</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed_tech">Completed tech</option>
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
          <AdminOperationsTable
            operations={items}
            onSelectOperation={setSelectedOperationId}
          />
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
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
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

        {selectedOperationId ? (
          <OperationDetailDialog
            operationId={selectedOperationId}
            onClose={() => setSelectedOperationId(null)}
          />
        ) : null}
      </section>
    </main>
  );
}
