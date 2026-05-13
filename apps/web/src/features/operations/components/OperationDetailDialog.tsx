import {
  useAdminOperation,
  useUpdateAdminOperation,
} from '@servicienta/query-hooks';
import type { OperationStatus } from '@servicienta/types';

function formatFullName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
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
  if (!rawValue) return null;

  return new Date(rawValue).toISOString();
}

function getStatusBadgeClass(status: string) {
  return `status-badge status-badge--${status}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function OperationDetailDialog({
  operationId,
  onClose,
}: {
  operationId: string;
  onClose: () => void;
}) {
  const { data: operation, error, isLoading } = useAdminOperation(operationId);
  const updateOperation = useUpdateAdminOperation();
  const errorMessage =
    error instanceof Error ? error.message : 'No se pudo cargar la operation';
  const updateMessage =
    updateOperation.error instanceof Error ? updateOperation.error.message : '';
  const feedbackMessage =
    updateMessage || (updateOperation.isSuccess ? 'Operation actualizada' : '');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    await updateOperation.mutateAsync({
      operationId,
      input: {
        status: (formData.get('status') as OperationStatus | null) ?? 'pending',
        scheduled_at: toIsoDateTime(formData.get('scheduled_at')),
        completed_at: toIsoDateTime(formData.get('completed_at')),
      },
    });
  }

  return (
    <div
      className="users-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="operation-detail-title"
      onClick={onClose}
    >
      <section
        className="users-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="users-modal__header">
          <div>
            <p className="users-hero__eyebrow">Operation Detail</p>
            <h2 id="operation-detail-title">Ver y editar operation</h2>
          </div>

          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
            aria-label="Cerrar detalle de operation"
          >
            Cerrar
          </button>
        </header>

        {isLoading ? (
          <section className="users-panel">
            <p>Cargando operation...</p>
          </section>
        ) : error || !operation ? (
          <section className="users-panel">
            <p className="users-message users-message--error">{errorMessage}</p>
          </section>
        ) : (
          <section className="users-detail-grid">
            <article className="users-panel">
              <div className="user-card__header">
                <div>
                  <p className="user-card__label">Operation</p>
                  <h3>
                    {formatFullName(
                      operation.technician_name,
                      operation.technician_surname,
                    )}
                  </h3>
                </div>

                <span className={getStatusBadgeClass(operation.status)}>
                  {operation.status}
                </span>
              </div>

              <dl className="user-card__meta">
                <div>
                  <dt>Operation ID</dt>
                  <dd>{operation.id}</dd>
                </div>
                <div>
                  <dt>Order ID</dt>
                  <dd>{operation.order_id}</dd>
                </div>
                <div>
                  <dt>Cliente</dt>
                  <dd>
                    {formatFullName(
                      operation.client_name,
                      operation.client_surname,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Técnico</dt>
                  <dd>{operation.technician_email}</dd>
                </div>
                <div>
                  <dt>Dirección</dt>
                  <dd>{operation.service_address_text}</dd>
                </div>
              </dl>
            </article>

            <article className="users-panel">
              <p className="user-card__label">Editar Operation</p>
              <h3>Patch admin</h3>

              <form
                key={`${operation.id}:${operation.status}:${operation.scheduled_at ?? ''}:${operation.completed_at ?? ''}`}
                className="auth-form"
                onSubmit={handleSubmit}
              >
                <label className="auth-form__field">
                  <span>Status</span>
                  <select name="status" defaultValue={operation.status}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>

                <label className="auth-form__field">
                  <span>Programada</span>
                  <input
                    name="scheduled_at"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(operation.scheduled_at)}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Completada</span>
                  <input
                    name="completed_at"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(operation.completed_at)}
                  />
                </label>

                <button type="submit" disabled={updateOperation.isPending}>
                  {updateOperation.isPending
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

            <article className="users-panel operation-detail-review">
              <div className="user-card__header">
                <div>
                  <p className="user-card__label">TechnicianReview</p>
                  <h3>Review del técnico</h3>
                </div>

                {operation.technician_review ? (
                  <span className="operation-review__rating">
                    {operation.technician_review.rating}/5
                  </span>
                ) : null}
              </div>

              {operation.technician_review ? (
                <dl className="user-card__meta">
                  <div>
                    <dt>Rating</dt>
                    <dd>{operation.technician_review.rating}/5</dd>
                  </div>
                  <div>
                    <dt>Comment</dt>
                    <dd>
                      {operation.technician_review.comment || 'Sin comentario'}
                    </dd>
                  </div>
                  <div>
                    <dt>Created at</dt>
                    <dd>
                      {formatDateTime(operation.technician_review.created_at)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="users-message">
                  Esta operation todavía no tiene TechnicianReview.
                </p>
              )}
            </article>
          </section>
        )}
      </section>
    </div>
  );
}
