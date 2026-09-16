import { useState } from 'react';
import { useAdminOperations, useCurrentOperations } from '@servicienta/query-hooks';
import type { Operation, UsersPageSize } from '@servicienta/types';
import { ViewOperationActionLink } from '../../shared/components/ViewOperationActionLink';
import { useEscapeKey } from '../../shared/hooks/useEscapeKey';
import { formatOperationStatus } from '../../shared/utils/operation-status';

export function OrderVisitsActionButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="users-table__action users-table__action--icon" aria-label="Ver visitas del pedido" title="Ver visitas del pedido" onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="users-table__action-icon">
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </button>
  );
}

export function OrderVisitsDialog({ orderId, mode, onClose }: { orderId: string; mode: 'admin' | 'current'; onClose: () => void }) {
  const modalRef = useEscapeKey<HTMLDivElement>(onClose);

  return (
    <div ref={modalRef} data-escape-modal="true" className="users-modal" role="dialog" aria-modal="true" aria-labelledby="order-visits-title" onClick={onClose}>
      <section className="users-modal__panel" onClick={(event) => event.stopPropagation()}>
        <div className="users-modal__header">
          <div><p className="user-card__label">PEDIDO</p><h2 id="order-visits-title">Visitas vinculadas</h2></div>
          <button type="button" className="users-modal__close" onClick={onClose}>Cerrar</button>
        </div>
        {mode === 'admin' ? <AdminOrderVisits orderId={orderId} /> : <CurrentOrderVisits orderId={orderId} />}
      </section>
    </div>
  );
}

const pageSize: UsersPageSize = 25;

function CurrentOrderVisits({ orderId }: { orderId: string }) {
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useCurrentOperations({ page, pageSize, order_id: orderId });
  return <VisitsContent operations={data?.items} page={page} totalPages={data?.pagination.totalPages ?? 1} total={data?.pagination.total ?? 0} error={error} isLoading={isLoading} onPageChange={setPage} />;
}

function AdminOrderVisits({ orderId }: { orderId: string }) {
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useAdminOperations({ page, pageSize, order_id: orderId });
  return <VisitsContent operations={data?.items} page={page} totalPages={data?.pagination.totalPages ?? 1} total={data?.pagination.total ?? 0} error={error} isLoading={isLoading} onPageChange={setPage} />;
}

function VisitsContent({ operations, page, totalPages, total, error, isLoading, onPageChange }: {
  operations?: Operation[];
  page: number;
  totalPages: number;
  total: number;
  error: Error | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}) {
  if (isLoading) return <p>Cargando visitas...</p>;
  if (error) return <p className="users-message users-message--error">{error.message}</p>;
  if (!operations?.length) return <p>No hay visitas vinculadas a este pedido.</p>;

  return (
    <>
      <div className="users-table-wrapper">
        <table className="users-table">
          <thead><tr><th>Acción</th><th>Estado</th><th>Programada</th><th>Terminada por técnico</th><th>Completada</th><th>Descripción</th></tr></thead>
          <tbody>{operations.map((operation) => (
            <tr key={operation.id}>
              <td><ViewOperationActionLink operationId={operation.id} /></td>
              <td><span className={`status-badge status-badge--${operation.status}`}>{formatOperationStatus(operation.status)}</span></td>
              <td>{formatDateTime(operation.scheduled_at)}</td>
              <td>{formatDateTime(operation.technician_completed_at)}</td>
              <td>{formatDateTime(operation.completed_at)}</td>
              <td>{operation.description ?? 'Sin definir'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="users-pagination">
        <p className="users-pagination__summary">{total} {total === 1 ? 'visita' : 'visitas'}</p>
        <div className="users-pagination__controls">
          <button type="button" className="users-pagination__button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
          <span className="users-pagination__page">Página {page} de {totalPages}</span>
          <button type="button" className="users-pagination__button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Siguiente</button>
        </div>
      </div>
    </>
  );
}

function formatDateTime(value: string | null) {
  return value ? new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Sin definir';
}
