import { Fragment, useState } from 'react';
import type { AdminOperation } from '@servicienta/types';

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

function getStatusBadgeClass(status: string) {
  return `status-badge status-badge--${status}`;
}

function getReviewPreview(comment: string | null) {
  if (!comment) return 'Sin comentario';
  if (comment.length <= 72) return comment;

  return `${comment.slice(0, 72)}...`;
}

export function AdminOperationsTable({
  operations,
  onSelectOperation,
}: {
  operations: AdminOperation[];
  onSelectOperation?: (operationId: string) => void;
}) {
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const expandedColSpan = onSelectOperation ? 10 : 9;

  return (
    <section className="users-table-wrapper">
      <table className="users-table">
        <thead>
          <tr>
            {onSelectOperation ? <th>Accion</th> : null}
            <th>Cliente</th>
            <th>Técnico</th>
            <th>Slug</th>
            <th>Order</th>
            <th>Operation</th>
            <th>Review</th>
            <th>Programada</th>
            <th>Completada</th>
            <th>Dirección</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((operation) => {
            const review = operation.technician_review;
            const isReviewExpanded = expandedReviewId === operation.id;

            return (
              <Fragment key={operation.id}>
                <tr>
                  {onSelectOperation ? (
                    <td>
                      <button
                        type="button"
                        className="users-table__action"
                        onClick={() => onSelectOperation(operation.id)}
                      >
                        Ver y editar
                      </button>
                    </td>
                  ) : null}
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
                    <span
                      className={getStatusBadgeClass(operation.order_status)}
                    >
                      {operation.order_status}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(operation.status)}>
                      {operation.status}
                    </span>
                  </td>
                  <td>
                    {review ? (
                      <button
                        type="button"
                        className="operation-review"
                        onClick={() =>
                          setExpandedReviewId((currentValue) =>
                            currentValue === operation.id ? null : operation.id,
                          )
                        }
                      >
                        <span className="operation-review__rating">
                          {review.rating}/5
                        </span>
                        <span className="operation-review__preview">
                          {getReviewPreview(review.comment)}
                        </span>
                      </button>
                    ) : (
                      <span className="operation-review operation-review--empty">
                        Sin review
                      </span>
                    )}
                  </td>
                  <td>{formatDateTime(operation.scheduled_at)}</td>
                  <td>{formatDateTime(operation.completed_at)}</td>
                  <td>{operation.service_address_text}</td>
                </tr>

                {review && isReviewExpanded ? (
                  <tr
                    key={`${operation.id}:review`}
                    className="operation-review-row"
                  >
                    <td colSpan={expandedColSpan}>
                      <div className="operation-review-row__content">
                        <span className="operation-review-row__label">
                          TechnicianReview
                        </span>
                        <strong>Rating {review.rating}/5</strong>
                        <p>{review.comment || 'Sin comentario'}</p>
                        <small>{formatDateTime(review.created_at)}</small>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
