import { useState } from 'react';
import { useAdminTechnicianCatalogs } from '@servicienta/query-hooks';
import type {
  AdminTechnicianCatalogItem,
  TechnicianCatalogKind,
} from '@servicienta/types';
import { TechnicianCatalogItemDialog } from './TechnicianCatalogItemDialog';

function formatCatalogKindTitle(kind: TechnicianCatalogKind) {
  if (kind === 'zones') return 'Zonas';
  if (kind === 'brands') return 'Marcas';

  return 'Electrodomésticos';
}

function formatCatalogDescription(kind: TechnicianCatalogKind) {
  if (kind === 'zones') {
    return 'Cobertura territorial asociada a technician profiles.';
  }

  if (kind === 'brands') {
    return 'Marcas explícitas modeladas en brand specialties.';
  }

  return 'Tipos de electrodoméstico asociados a appliance specialties.';
}

export function TechnicianCatalogsPage() {
  const { data, error, isLoading } = useAdminTechnicianCatalogs();
  const [selectedItem, setSelectedItem] = useState<{
    kind: TechnicianCatalogKind;
    item: AdminTechnicianCatalogItem;
  } | null>(null);
  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudieron cargar los catálogos de técnicos';

  const zones = data?.zones ?? [];
  const brands = data?.brands ?? [];
  const applianceTypes = data?.applianceTypes ?? [];
  const totalItems = zones.length + brands.length + applianceTypes.length;

  return (
    <main className="users-page">
      <section className="users-layout">
        <header className="users-hero">
          <div>
            <p className="users-hero__eyebrow">Admin Tester</p>
            <h1>Technician Catalogs</h1>
            <p className="users-hero__copy">
              Esta vista expone catálogos admin de `technician-profiles` para
              inspeccionar zonas, marcas y electrodomésticos, y ver qué técnicos
              están asociados a cada valor.
            </p>
          </div>

          <div className="users-hero__summary">
            <span>{zones.length} zonas</span>
            <span>{brands.length} marcas</span>
            <span>{applianceTypes.length} electrodomésticos</span>
            <span>{totalItems} items</span>
          </div>
        </header>

        {isLoading ? (
          <section className="users-panel">
            <p>Cargando catálogos de técnicos...</p>
          </section>
        ) : error ? (
          <section className="users-panel">
            <p className="users-message users-message--error">{errorMessage}</p>
          </section>
        ) : (
          <section className="technician-catalog-grid">
            <CatalogTable
              kind="zones"
              title={formatCatalogKindTitle('zones')}
              description={formatCatalogDescription('zones')}
              items={zones}
              onSelectItem={(item) => setSelectedItem({ kind: 'zones', item })}
            />
            <CatalogTable
              kind="brands"
              title={formatCatalogKindTitle('brands')}
              description={formatCatalogDescription('brands')}
              items={brands}
              onSelectItem={(item) => setSelectedItem({ kind: 'brands', item })}
            />
            <CatalogTable
              kind="appliance-types"
              title={formatCatalogKindTitle('appliance-types')}
              description={formatCatalogDescription('appliance-types')}
              items={applianceTypes}
              onSelectItem={(item) =>
                setSelectedItem({ kind: 'appliance-types', item })
              }
            />
          </section>
        )}
      </section>

      {selectedItem ? (
        <TechnicianCatalogItemDialog
          selectedItem={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
    </main>
  );
}

function CatalogTable({
  kind,
  title,
  description,
  items,
  onSelectItem,
}: {
  kind: TechnicianCatalogKind;
  title: string;
  description: string;
  items: AdminTechnicianCatalogItem[];
  onSelectItem: (item: AdminTechnicianCatalogItem) => void;
}) {
  return (
    <article className="users-panel technician-catalog-card">
      <div className="technician-catalog-card__header">
        <div>
          <p className="user-card__label">{title}</p>
          <h2>{title}</h2>
        </div>
        <span className="technician-catalog-chip">{items.length}</span>
      </div>

      <p className="technician-catalog-card__copy">{description}</p>

      {items.length > 0 ? (
        <div className="users-table-wrapper technician-catalog-card__table">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Técnicos</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${kind}:${item.id}`}>
                  <td>{item.name}</td>
                  <td>{item.slug}</td>
                  <td>{item.technician_count}</td>
                  <td>
                    <button
                      type="button"
                      className="users-table__action"
                      onClick={() => onSelectItem(item)}
                    >
                      Ver técnicos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No hay items cargados en este catálogo.</p>
      )}
    </article>
  );
}
