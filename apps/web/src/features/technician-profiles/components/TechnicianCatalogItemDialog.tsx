import { useAdminTechniciansByCatalogItem } from '@servicienta/query-hooks';
import type {
  AdminTechnicianCatalogItem,
  TechnicianCatalogKind,
} from '@servicienta/types';
import { useEscapeKey } from '../../shared/hooks/useEscapeKey';

function formatTechnicianName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function formatCatalogKind(kind: TechnicianCatalogKind) {
  if (kind === 'zones') return 'Zona';
  if (kind === 'brands') return 'Marca';

  return 'Electrodoméstico';
}

export function TechnicianCatalogItemDialog({
  selectedItem,
  onClose,
}: {
  selectedItem: {
    kind: TechnicianCatalogKind;
    item: AdminTechnicianCatalogItem;
  };
  onClose: () => void;
}) {
  const modalRef = useEscapeKey<HTMLDivElement>(onClose);
  const { data, error, isLoading } = useAdminTechniciansByCatalogItem({
    kind: selectedItem.kind,
    slug: selectedItem.item.slug,
  });
  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudieron cargar los técnicos asociados';

  return (
    <div
      ref={modalRef}
      data-escape-modal="true"
      className="users-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="technician-catalog-dialog-title"
      onClick={onClose}
    >
      <section
        className="users-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="users-modal__header">
          <div>
            <p className="users-hero__eyebrow">Technician Profiles Admin</p>
            <h2 id="technician-catalog-dialog-title">
              {formatCatalogKind(selectedItem.kind)}: {selectedItem.item.name}
            </h2>
            <p className="users-hero__copy">
              Técnicos asociados a `{selectedItem.item.slug}`.
            </p>
          </div>

          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
            aria-label="Cerrar detalle de técnicos asociados"
          >
            Cerrar
          </button>
        </header>

        <section className="users-panel technician-catalog-dialog__meta">
          <div className="technician-catalog-dialog__meta-row">
            <span className="user-badge user-badge--active">
              {data?.technicians.length ?? selectedItem.item.technician_count}{' '}
              técnicos
            </span>
            <span className="technician-catalog-chip">
              {formatCatalogKind(selectedItem.kind)}
            </span>
          </div>
        </section>

        {isLoading ? (
          <section className="users-panel">
            <p>Cargando técnicos asociados...</p>
          </section>
        ) : error ? (
          <section className="users-panel">
            <p className="users-message users-message--error">{errorMessage}</p>
          </section>
        ) : data && data.technicians.length > 0 ? (
          <section className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Slug público</th>
                  <th>Rating</th>
                  <th>Disponible</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.technicians.map((technician) => (
                  <tr key={technician.id}>
                    <td>
                      {formatTechnicianName(
                        technician.name,
                        technician.surname,
                      )}
                    </td>
                    <td>{technician.email}</td>
                    <td>{technician.public_slug}</td>
                    <td>
                      {technician.rating.toFixed(2)} ({technician.rating_count})
                    </td>
                    <td>{technician.available ? 'Sí' : 'No'}</td>
                    <td>
                      <span
                        className={
                          technician.status === 'ACTIVE'
                            ? 'user-badge user-badge--active'
                            : 'user-badge user-badge--deleted'
                        }
                      >
                        {technician.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="users-panel">
            <p>No hay técnicos asociados a este valor.</p>
          </section>
        )}
      </section>
    </div>
  );
}
