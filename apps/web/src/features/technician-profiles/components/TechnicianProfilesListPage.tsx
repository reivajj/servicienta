import { useDeferredValue, useState } from 'react';
import { useAdminTechnicianProfiles } from '@servicienta/query-hooks';
import type {
  AdminTechnicianProfilesSort,
  UserStatus,
  UsersPageSize,
} from '@servicienta/types';

function formatTechnicianName(name: string | null, surname: string | null) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim();

  return fullName || 'Sin nombre';
}

function renderRatingStars(rating: number) {
  const filledStars = Math.round(rating);

  return Array.from({ length: 5 }, (_, index) =>
    index < filledStars ? '★' : '☆',
  ).join('');
}

function compareTechnicianName(
  left: { name: string | null; surname: string | null; email: string },
  right: { name: string | null; surname: string | null; email: string },
) {
  const leftName = formatTechnicianName(left.name, left.surname);
  const rightName = formatTechnicianName(right.name, right.surname);
  const byName = leftName.localeCompare(rightName, 'es-AR');

  if (byName !== 0) return byName;

  return left.email.localeCompare(right.email, 'es-AR');
}

export function TechnicianProfilesListPage() {
  const MIN_SEARCH_LENGTH = 3;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<UsersPageSize>(25);
  const [status, setStatus] = useState<UserStatus | 'all'>('all');
  const [availability, setAvailability] = useState<
    'all' | 'available' | 'unavailable'
  >('all');
  const [sort, setSort] = useState<AdminTechnicianProfilesSort>('default');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const searchFilter =
    deferredSearch.length >= MIN_SEARCH_LENGTH ? deferredSearch : undefined;

  const { data, error, isLoading } = useAdminTechnicianProfiles({
    page,
    pageSize,
    status: status === 'all' ? undefined : status,
    available:
      availability === 'all'
        ? undefined
        : availability === 'available',
    search: searchFilter,
    sort,
  });

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudieron cargar los technician profiles';
  const items = data?.items ?? [];
  const sortedItems = [...items].sort((left, right) => {
    if (sort === 'rating-desc') {
      if (right.rating !== left.rating) return right.rating - left.rating;
      if (right.rating_count !== left.rating_count) {
        return right.rating_count - left.rating_count;
      }

      return compareTechnicianName(left, right);
    }

    if (sort === 'rating-asc') {
      if (left.rating !== right.rating) return left.rating - right.rating;
      if (left.rating_count !== right.rating_count) {
        return left.rating_count - right.rating_count;
      }

      return compareTechnicianName(left, right);
    }

    if (sort === 'name-asc') return compareTechnicianName(left, right);
    if (sort === 'name-desc') return compareTechnicianName(right, left);

    return 0;
  });
  const summary = data?.summary;
  const pagination = data?.pagination;
  const start = pagination?.total
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const end = pagination?.total ? start + items.length - 1 : 0;
  const hasActiveFilters =
    search.length > 0 ||
    status !== 'all' ||
    availability !== 'all' ||
    sort !== 'default' ||
    pageSize !== 25 ||
    page !== 1;

  function handleStatusChange(nextStatus: UserStatus | 'all') {
    setStatus(nextStatus);
    setPage(1);
  }

  function handleAvailabilityChange(
    nextAvailability: 'all' | 'available' | 'unavailable',
  ) {
    setAvailability(nextAvailability);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleSortChange(nextSort: AdminTechnicianProfilesSort) {
    setSort(nextSort);
    setPage(1);
  }

  function handlePageSizeChange(nextPageSize: UsersPageSize) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  function handleClearFilters() {
    setSearch('');
    setStatus('all');
    setAvailability('all');
    setSort('default');
    setPageSize(25);
    setPage(1);
  }

  return (
    <main className="users-page">
      <section className="users-layout">
        <header className="users-hero">
          <div>
            <p className="users-hero__eyebrow">Admin Technicians</p>
            <h1>Technician Profiles</h1>
            <p className="users-hero__copy">
              Vista tabular para revisar technicians con mejor densidad visual:
              identidad, disponibilidad, slug público y rating con reseñas.
            </p>
          </div>

          <div className="users-hero__summary">
            <span>{summary?.totalTechnicians ?? 0} técnicos</span>
            <span>{summary?.activeTechnicians ?? 0} activos</span>
            <span>{summary?.availableTechnicians ?? 0} disponibles</span>
            <span>{summary?.deletedTechnicians ?? 0} eliminados</span>
          </div>
        </header>

        <section className="users-toolbar">
          <label className="users-toolbar__field">
            <span>Buscar</span>
            <input
              type="search"
              value={search}
              placeholder="Email, nombre o apellido"
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

          <label className="users-toolbar__field">
            <span>Disponibilidad</span>
            <select
              value={availability}
              onChange={(event) =>
                handleAvailabilityChange(
                  event.target.value as 'all' | 'available' | 'unavailable',
                )
              }
            >
              <option value="all">Todos</option>
              <option value="available">Disponibles</option>
              <option value="unavailable">No disponibles</option>
            </select>
          </label>

          <label className="users-toolbar__field">
            <span>Orden</span>
            <select
              value={sort}
              onChange={(event) =>
                handleSortChange(
                  event.target.value as AdminTechnicianProfilesSort,
                )
              }
            >
              <option value="default">Default</option>
              <option value="rating-desc">Puntaje: mayor a menor</option>
              <option value="rating-asc">Puntaje: menor a mayor</option>
              <option value="name-asc">Nombre: A a Z</option>
              <option value="name-desc">Nombre: Z a A</option>
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
            <p>Cargando técnicos...</p>
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
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Slug</th>
                  <th>Puntaje</th>
                  <th>Reseñas</th>
                  <th>Disponible</th>
                  <th>Verificado</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((profile) => (
                  <tr key={profile.id}>
                    <td>{formatTechnicianName(profile.name, profile.surname)}</td>
                    <td>{profile.email}</td>
                    <td>{profile.public_slug}</td>
                    <td>
                      <span className="technician-rating">
                        <span className="technician-rating__stars">
                          {renderRatingStars(profile.rating)}
                        </span>
                        <span className="technician-rating__value">
                          {profile.rating.toFixed(1)}
                        </span>
                      </span>
                    </td>
                    <td>{profile.rating_count}</td>
                    <td>
                      <span
                        className={
                          profile.available
                            ? 'user-badge user-badge--active'
                            : 'user-badge user-badge--deleted'
                        }
                      >
                        {profile.available ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td>{profile.verified_at ? 'Sí' : 'No'}</td>
                    <td>
                      <span
                        className={
                          profile.status === 'ACTIVE'
                            ? 'user-badge user-badge--active'
                            : 'user-badge user-badge--deleted'
                        }
                      >
                        {profile.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="users-panel">
            <p>No hay técnicos para los filtros actuales.</p>
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
      </section>
    </main>
  );
}
