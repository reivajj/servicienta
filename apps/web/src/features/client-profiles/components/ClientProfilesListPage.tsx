import { useDeferredValue, useState } from 'react';
import { useClientProfiles } from '@servicienta/query-hooks';
import type { UserStatus, UsersPageSize } from '@servicienta/types';
import { SettingsActionButton } from '../../shared/components/SettingsActionButton';
import { ClientProfileDetailDialog } from './ClientProfileDetailDialog';

function formatClientName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

export function ClientProfilesListPage() {
  const MIN_SEARCH_LENGTH = 3;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<UsersPageSize>(25);
  const [status, setStatus] = useState<UserStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedClientProfileId, setSelectedClientProfileId] = useState<
    string | null
  >(null);
  const deferredSearch = useDeferredValue(search.trim());
  const searchFilter =
    deferredSearch.length >= MIN_SEARCH_LENGTH ? deferredSearch : undefined;
  const {
    data: clientProfiles,
    error,
    isLoading,
  } = useClientProfiles({
    page,
    pageSize,
    status: status === 'all' ? undefined : status,
    search: searchFilter,
  });
  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudieron cargar los clientes';
  const items = clientProfiles?.items ?? [];
  const summary = clientProfiles?.summary;
  const pagination = clientProfiles?.pagination;
  const start = pagination?.total
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const end = pagination?.total ? start + items.length - 1 : 0;
  const hasActiveFilters =
    search.length > 0 || status !== 'all' || pageSize !== 25 || page !== 1;

  function handleStatusChange(nextStatus: UserStatus | 'all') {
    setStatus(nextStatus);
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
    setPageSize(25);
    setPage(1);
  }

  return (
    <main className="users-page">
      <section className="users-layout">
        <header className="users-hero">
          <div>
            <p className="users-hero__eyebrow">Admin Clients</p>
            <h1>Client Profiles</h1>
            <p className="users-hero__copy">
              Vista admin para listar, buscar e inspeccionar clientes con su
              perfil de contacto y dirección base.
            </p>
          </div>

          <div className="users-hero__summary">
            <span>{summary?.totalClients ?? 0} clientes</span>
            <span>{summary?.activeClients ?? 0} activos</span>
            <span>{summary?.deletedClients ?? 0} eliminados</span>
          </div>
        </header>

        <section className="users-toolbar">
          <label className="users-toolbar__field">
            <span>Buscar</span>
            <input
              type="search"
              value={search}
              placeholder="Email, nombre, telefono o direccion"
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
                handleStatusChange(event.target.value as UserStatus | 'all')
              }
            >
              <option value="all">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="DELETED">Eliminados</option>
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
            <p>Cargando clientes...</p>
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
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Telefono</th>
                  <th>Canal</th>
                  <th>Status</th>
                  <th>Direccion base</th>
                </tr>
              </thead>
              <tbody>
                {items.map((clientProfile) => (
                  <tr key={clientProfile.id}>
                    <td>
                      <SettingsActionButton
                        label="Ver y editar client profile"
                        onClick={() =>
                          setSelectedClientProfileId(clientProfile.id)
                        }
                      />
                    </td>
                    <td>
                      {formatClientName(
                        clientProfile.name,
                        clientProfile.surname,
                      )}
                    </td>
                    <td>{clientProfile.email}</td>
                    <td>
                      {clientProfile.phone ??
                        clientProfile.whatsapp_phone ??
                        'No cargado'}
                    </td>
                    <td>{clientProfile.preferred_contact_channel}</td>
                    <td>
                      <span
                        className={
                          clientProfile.status === 'ACTIVE'
                            ? 'user-badge user-badge--active'
                            : 'user-badge user-badge--deleted'
                        }
                      >
                        {clientProfile.status}
                      </span>
                    </td>
                    <td>
                      {clientProfile.default_address_text ?? 'No cargada'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="users-panel">
            <p>No hay clientes para los filtros actuales.</p>
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

        {selectedClientProfileId ? (
          <ClientProfileDetailDialog
            clientProfileId={selectedClientProfileId}
            onClose={() => setSelectedClientProfileId(null)}
          />
        ) : null}
      </section>
    </main>
  );
}
