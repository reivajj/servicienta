import {
  useCreateOrder,
  usePublicTechnicianProfileCatalogs,
  usePublicTechnicianProfiles,
} from '@servicienta/query-hooks';
import type {
  ListPublicTechnicianProfilesInput,
  PublicTechnicianProfile,
} from '@servicienta/types';
import { useState } from 'react';

export function TechnicianSearchPage() {
  const {
    data: catalogs,
    error: catalogsError,
    isLoading: isCatalogsLoading,
  } = usePublicTechnicianProfileCatalogs();
  const [zoneSlug, setZoneSlug] = useState('');
  const [applianceTypeSlug, setApplianceTypeSlug] = useState('');
  const [submittedInput, setSubmittedInput] =
    useState<ListPublicTechnicianProfilesInput | null>(null);
  const [selectedTechnician, setSelectedTechnician] =
    useState<PublicTechnicianProfile | null>(null);
  const createOrder = useCreateOrder();
  const {
    data: profiles,
    error: profilesError,
    isFetching: isProfilesFetching,
  } = usePublicTechnicianProfiles(submittedInput);
  const canSearch = Boolean(zoneSlug && applianceTypeSlug);
  const catalogsErrorMessage =
    catalogsError instanceof Error
      ? catalogsError.message
      : 'No se pudieron cargar los filtros de búsqueda';
  const profilesErrorMessage =
    profilesError instanceof Error
      ? profilesError.message
      : 'No se pudieron cargar los técnicos';

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSearch) return;

    setSubmittedInput({
      zoneSlug,
      applianceTypeSlug,
    });
  }

  async function handleCreateOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTechnician || !submittedInput) return;

    const formData = new FormData(event.currentTarget);

    await createOrder.mutateAsync({
      technician_public_slug: selectedTechnician.public_slug,
      zone_slug: submittedInput.zoneSlug,
      appliance_type_slug: submittedInput.applianceTypeSlug,
      description: String(formData.get('description') ?? ''),
      service_address_text: String(formData.get('service_address_text') ?? ''),
      service_lat: null,
      service_lng: null,
      address_notes: String(formData.get('address_notes') ?? '') || null,
    });

    setSelectedTechnician(null);
  }

  return (
    <main className="users-page technician-search-page">
      <section className="users-layout">
        <header className="users-hero">
          <div>
            <p className="users-hero__eyebrow">Technician Search</p>
            <h1>Buscá técnicos por zona y electrodoméstico</h1>
            <p className="users-hero__copy">
              Esta vista reutiliza la búsqueda pública de `technician-profiles`.
              Sirve para probar el flujo como usuario anónimo y también como
              herramienta interna desde la app.
            </p>
          </div>

          <div className="users-hero__summary">
            <span>{catalogs?.zones.length ?? 0} zonas</span>
            <span>
              {catalogs?.applianceTypes.length ?? 0} electrodomésticos
            </span>
            <span>{profiles?.length ?? 0} resultados</span>
          </div>
        </header>

        <section className="users-panel technician-search-panel">
          <form
            className="users-toolbar technician-search-form"
            onSubmit={handleSubmit}
          >
            <label className="users-toolbar__field">
              <span>Zona</span>
              <select
                value={zoneSlug}
                onChange={(event) => setZoneSlug(event.target.value)}
                disabled={isCatalogsLoading}
              >
                <option value="">Seleccionar zona</option>
                {(catalogs?.zones ?? []).map((zone) => (
                  <option key={zone.id} value={zone.slug}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="users-toolbar__field">
              <span>Electrodoméstico</span>
              <select
                value={applianceTypeSlug}
                onChange={(event) => setApplianceTypeSlug(event.target.value)}
                disabled={isCatalogsLoading}
              >
                <option value="">Seleccionar electrodoméstico</option>
                {(catalogs?.applianceTypes ?? []).map((applianceType) => (
                  <option key={applianceType.id} value={applianceType.slug}>
                    {applianceType.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="technician-search-form__actions">
              <button
                type="submit"
                className="dashboard-card__link"
                disabled={!canSearch || isCatalogsLoading || isProfilesFetching}
              >
                {isProfilesFetching ? 'Buscando...' : 'Buscar técnicos'}
              </button>
            </div>
          </form>

          {isCatalogsLoading ? (
            <p>Cargando filtros públicos...</p>
          ) : catalogsError ? (
            <p className="users-message users-message--error">
              {catalogsErrorMessage}
            </p>
          ) : (
            <p className="users-toolbar__hint technician-search-form__hint">
              Seleccioná una zona y un electrodoméstico para ejecutar la
              búsqueda pública.
            </p>
          )}
        </section>

        <section className="users-panel technician-search-results">
          {!submittedInput ? (
            <p>
              La búsqueda todavía no se ejecutó. Elegí ambos filtros y enviá el
              formulario.
            </p>
          ) : profilesError ? (
            <p className="users-message users-message--error">
              {profilesErrorMessage}
            </p>
          ) : isProfilesFetching ? (
            <p>Cargando técnicos...</p>
          ) : profiles && profiles.length > 0 ? (
            <div className="technician-search-results__grid">
              {profiles.map((profile) => (
                <article
                  key={profile.public_slug}
                  className="technician-result-card"
                >
                  <div className="technician-result-card__header">
                    <div>
                      <p className="user-card__label">Técnico público</p>
                      <h2>{profile.public_slug}</h2>
                    </div>
                    <span
                      className={`user-badge ${
                        profile.available
                          ? 'user-badge--active'
                          : 'user-badge--deleted'
                      }`}
                    >
                      {profile.available ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>

                  <dl className="technician-result-card__meta">
                    <div>
                      <dt>Rating</dt>
                      <dd>
                        {profile.rating.toFixed(1)} · {profile.rating_count}{' '}
                        reseñas
                      </dd>
                    </div>
                    <div>
                      <dt>Verificado</dt>
                      <dd>{profile.verified_at ? 'Sí' : 'No'}</dd>
                    </div>
                  </dl>

                  <p className="technician-result-card__bio">
                    {profile.bio ?? 'Sin bio pública.'}
                  </p>

                  <p className="technician-result-card__created-at">
                    Perfil creado el{' '}
                    {new Date(profile.created_at).toLocaleDateString('es-AR')}
                  </p>

                  <button
                    type="button"
                    className="dashboard-card__link"
                    disabled={!profile.available}
                    onClick={() => setSelectedTechnician(profile)}
                  >
                    Seleccionar técnico
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p>
              No encontramos técnicos para la combinación seleccionada de zona y
              electrodoméstico.
            </p>
          )}
        </section>
      </section>

      {selectedTechnician ? (
        <div
          className="users-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-order-title"
          onClick={() => setSelectedTechnician(null)}
        >
          <section
            className="users-modal__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="users-modal__header">
              <div>
                <p className="users-hero__eyebrow">Client Selects</p>
                <h2 id="create-order-title">Crear order</h2>
              </div>
              <button
                type="button"
                className="users-modal__close"
                onClick={() => setSelectedTechnician(null)}
              >
                Cerrar
              </button>
            </header>

            <form className="auth-form" onSubmit={handleCreateOrder}>
              <label className="auth-form__field">
                <span>Técnico</span>
                <input
                  type="text"
                  value={selectedTechnician.public_slug}
                  readOnly
                />
              </label>

              <label className="auth-form__field">
                <span>Problema</span>
                <textarea
                  name="description"
                  placeholder="Contá qué está pasando con el equipo"
                  required
                />
              </label>

              <label className="auth-form__field">
                <span>Dirección aproximada</span>
                <input
                  name="service_address_text"
                  type="text"
                  placeholder="Calle, altura aproximada, barrio"
                  required
                />
              </label>

              <label className="auth-form__field">
                <span>Notas de dirección</span>
                <input
                  name="address_notes"
                  type="text"
                  placeholder="Piso, referencias, horarios posibles"
                />
              </label>

              <div className="users-message">
                Imágenes: placeholder visual. El upload real se modelará en una
                próxima pasada.
              </div>

              <button type="submit" disabled={createOrder.isPending}>
                {createOrder.isPending ? 'Creando...' : 'Crear order pending'}
              </button>
              {createOrder.error ? (
                <p className="users-message users-message--error">
                  {createOrder.error instanceof Error
                    ? createOrder.error.message
                    : 'No se pudo crear la order'}
                </p>
              ) : null}
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
