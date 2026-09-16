import {
  useCompleteClientOnboarding,
  useCreateOrder,
  useCurrentUser,
  usePublicTechnicianProfileCatalogs,
  usePublicTechnicianProfiles,
} from '@servicienta/query-hooks';
import { useNavigate } from '@tanstack/react-router';
import type {
  CreateOrderInput,
  ListPublicTechnicianProfilesInput,
  PublicTechnicianProfile,
} from '@servicienta/types';
import { useState } from 'react';
import { getSupabaseBrowserClient } from '../../../lib/supabase';
import { useAuth } from '../../auth/components/AuthProvider';
import { useEscapeKey } from '../../shared/hooks/useEscapeKey';

type AuthMode = 'signup' | 'login';

function getTechnicianName(profile: PublicTechnicianProfile) {
  return [profile.name, profile.surname].filter(Boolean).join(' ').trim() || 'Técnico';
}

export function TechnicianSearchPage() {
  const navigate = useNavigate();
  const supabase = getSupabaseBrowserClient();
  const { session } = useAuth();
  const { data: currentUser } = useCurrentUser({ enabled: Boolean(session) });
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
  const [pendingOrderDraft, setPendingOrderDraft] =
    useState<CreateOrderInput | null>(null);
  const [isAuthStepOpen, setIsAuthStepOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [orderMessage, setOrderMessage] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const createOrder = useCreateOrder();
  const completeClientOnboarding = useCompleteClientOnboarding();
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
  const orderModalRef = useEscapeKey<HTMLDivElement>(handleCloseOrderFlow);
  const authModalRef = useEscapeKey<HTMLDivElement>(() => {
    setIsAuthStepOpen(false);
    setAuthMessage('');
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSearch) return;

    setSubmittedInput({
      zoneSlug,
      applianceTypeSlug,
    });
  }

  function buildCreateOrderInput(
    form: HTMLFormElement,
  ): CreateOrderInput | undefined {
    if (!selectedTechnician || !submittedInput) return;

    const formData = new FormData(form);

    return {
      technician_public_slug: selectedTechnician.public_slug,
      zone_slug: submittedInput.zoneSlug,
      appliance_type_slug: submittedInput.applianceTypeSlug,
      description: String(formData.get('description') ?? ''),
      service_address_text: String(formData.get('service_address_text') ?? ''),
      service_lat: null,
      service_lng: null,
      address_notes: String(formData.get('address_notes') ?? '') || null,
    };
  }

  async function handleCreateOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTechnician || !submittedInput) return;

    setOrderMessage('');

    const orderInput = buildCreateOrderInput(event.currentTarget);
    if (!orderInput) return;

    if (session && currentUser && currentUser.role !== 'client') {
      setOrderMessage('La solicitud debe crearla un usuario cliente.');
      return;
    }

    if (!session) {
      setPendingOrderDraft(orderInput);
      setAuthMode('signup');
      setAuthMessage('');
      setIsAuthStepOpen(true);
      return;
    }

    await createOrder.mutateAsync(orderInput);

    handleCloseOrderFlow();
    await navigate({ to: '/orders' });
  }

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingOrderDraft) return;

    setAuthMessage('');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const name = String(formData.get('name') ?? '').trim();
    const surname = String(formData.get('surname') ?? '').trim();

    if (!email || !password) {
      setAuthMessage('Email y password son obligatorios.');
      return;
    }

    if (authMode === 'signup') {
      if (!name || !surname) {
        setAuthMessage('Nombre y apellido son obligatorios.');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            surname,
            role: 'client',
          },
        },
      });

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      if (!data.session) {
        setAuthMessage(
          'La cuenta se creó, pero Supabase requiere confirmar email antes de continuar.',
        );
        return;
      }

      await completeClientOnboarding.mutateAsync({
        name,
        surname,
        phone: null,
        whatsapp_phone: null,
        default_address_text: null,
        address_notes: null,
        preferred_contact_channel: 'phone',
      });
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthMessage(error.message);
        return;
      }
    }

    await createOrder.mutateAsync(pendingOrderDraft);
    handleCloseOrderFlow();
    await navigate({ to: '/orders' });
  }

  function handleCloseOrderFlow() {
    setSelectedTechnician(null);
    setPendingOrderDraft(null);
    setIsAuthStepOpen(false);
    setOrderMessage('');
    setAuthMessage('');
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
                      <p className="user-card__label">Técnico</p>
                      <h2>{getTechnicianName(profile)}</h2>
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
          ref={orderModalRef}
          data-escape-modal="true"
          className="users-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-order-title"
          onClick={handleCloseOrderFlow}
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
                onClick={handleCloseOrderFlow}
              >
                Cerrar
              </button>
            </header>

            <div className="technician-order-modal">
              <form className="auth-form technician-order-form" onSubmit={handleCreateOrder}>
                <label className="auth-form__field">
                  <span>Técnico</span>
                  <input
                    type="text"
                    value={getTechnicianName(selectedTechnician)}
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

                {session && currentUser && currentUser.role !== 'client' ? (
                  <p className="users-message users-message--error">
                    La solicitud debe crearla un usuario cliente. Cerrá sesión e
                    ingresá con una cuenta cliente.
                  </p>
                ) : null}

                <article className="technician-order-step-card">
                  <div>
                    <p className="user-card__label">Siguiente paso</p>
                    <h3>{session ? 'Enviar solicitud' : 'Continuar con tu cuenta'}</h3>
                    <p className="technician-order-step-card__copy">
                      {session
                        ? 'Crearemos el pedido y el técnico evaluará la solicitud antes de avanzar.'
                        : 'Guardamos esta solicitud en memoria y te pedimos registrarte o ingresar en el paso siguiente.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="auth-form__primary-action technician-order-step-card__action"
                    disabled={
                      createOrder.isPending ||
                      (Boolean(session) &&
                        Boolean(currentUser) &&
                        currentUser?.role !== 'client')
                    }
                  >
                    {createOrder.isPending
                      ? 'Creando...'
                      : session
                        ? 'Crear pedido'
                        : 'Continuar'}
                  </button>
                </article>

                {orderMessage || createOrder.error ? (
                  <p className="users-message users-message--error">
                    {orderMessage ||
                      (createOrder.error instanceof Error
                        ? createOrder.error.message
                        : 'No se pudo crear el pedido')}
                  </p>
                ) : null}
              </form>
            </div>
          </section>

          {isAuthStepOpen ? (
            <div
              ref={authModalRef}
              data-escape-modal="true"
              className="users-modal users-modal--stacked"
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-step-title"
              onClick={() => {
                setIsAuthStepOpen(false);
                setAuthMessage('');
              }}
            >
              <section
                className="users-modal__panel users-modal__panel--compact"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="users-modal__header">
                  <div>
                    <p className="users-hero__eyebrow">Acceso</p>
                    <h2 id="auth-step-title">
                      {authMode === 'signup'
                        ? 'Registrate para enviar la solicitud'
                        : 'Ingresá para enviar la solicitud'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="users-modal__close"
                    onClick={() => {
                      setIsAuthStepOpen(false);
                      setAuthMessage('');
                    }}
                  >
                    Cerrar
                  </button>
                </header>

                <form className="auth-form" onSubmit={handleAuthSubmit}>
                  <div className="auth-form__tabs" role="tablist">
                    <button
                      type="button"
                      className={
                        authMode === 'signup'
                          ? 'auth-form__tab auth-form__tab--active'
                          : 'auth-form__tab'
                      }
                      onClick={() => setAuthMode('signup')}
                    >
                      Registrarme
                    </button>
                    <button
                      type="button"
                      className={
                        authMode === 'login'
                          ? 'auth-form__tab auth-form__tab--active'
                          : 'auth-form__tab'
                      }
                      onClick={() => setAuthMode('login')}
                    >
                      Ya tengo cuenta
                    </button>
                  </div>

                  <label className="auth-form__field">
                    <span>Email</span>
                    <input name="email" type="email" required />
                  </label>

                  <label className="auth-form__field">
                    <span>Password</span>
                    <input name="password" type="password" required />
                  </label>

                  {authMode === 'signup' ? (
                    <>
                      <label className="auth-form__field">
                        <span>Nombre</span>
                        <input name="name" type="text" required />
                      </label>

                      <label className="auth-form__field">
                        <span>Apellido</span>
                        <input name="surname" type="text" required />
                      </label>
                    </>
                  ) : null}

                  <button
                    type="submit"
                    className="auth-form__primary-action"
                    disabled={
                      createOrder.isPending || completeClientOnboarding.isPending
                    }
                  >
                    {createOrder.isPending || completeClientOnboarding.isPending
                      ? 'Creando...'
                      : authMode === 'signup'
                        ? 'Registrarme y crear order'
                        : 'Ingresar y crear order'}
                  </button>

                  {authMessage ? (
                    <p className="users-message users-message--error">
                      {authMessage}
                    </p>
                  ) : null}
                </form>
              </section>
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
