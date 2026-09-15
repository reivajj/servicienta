import { Link } from '@tanstack/react-router';
import { useCurrentUser, useUpdateCurrentUser } from '@servicienta/query-hooks';
import type { UserRole } from '@servicienta/types';
import { useAuth } from '../../auth/components/AuthProvider';
import { formatUserRole } from '../../shared/utils/user-role';

export function DashboardPage() {
  const { user, session } = useAuth();
  const { data: currentUser, error, isLoading } = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const apiDocsUrl = (() => {
    const url = new URL('/api-docs', import.meta.env.VITE_API_URL);

    if (session?.access_token) {
      url.searchParams.set('access_token', session.access_token);
    }

    return url.toString();
  })();
  const errorMessage = error instanceof Error ? error.message : '';
  const mutationError =
    updateCurrentUser.error instanceof Error
      ? updateCurrentUser.error.message
      : '';
  const formKey = currentUser
    ? `${currentUser.id}:${currentUser.name ?? ''}:${currentUser.surname ?? ''}:${currentUser.role}`
    : 'current-user-form';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '');
    const surname = String(formData.get('surname') ?? '');
    const role = (formData.get('role') as UserRole | null) ?? 'client';

    await updateCurrentUser.mutateAsync({ name, surname, role });
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <p className="dashboard-card__eyebrow">Dashboard</p>
        <h1>Sesion activa</h1>
        <p className="dashboard-card__copy">
          Entraste correctamente con Supabase. Desde aca podes validar tu sesion
          y saltar a la feature `users` para probar endpoints admin.
        </p>

        <dl className="dashboard-card__meta">
          <div>
            <dt>Email</dt>
            <dd>{user?.email ?? 'Sin email'}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>{user?.id ?? 'No disponible'}</dd>
          </div>
          <div>
            <dt>Perfil actual</dt>
            <dd>
              {isLoading
                ? 'Cargando perfil...'
                : currentUser
                  ? `${currentUser.name ?? 'Sin nombre'} ${currentUser.surname ?? ''}`.trim() ||
                    'Sin datos'
                  : 'Sin perfil'}
            </dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>
              {currentUser ? formatUserRole(currentUser.role) : 'No disponible'}
            </dd>
          </div>
        </dl>

        {errorMessage ? (
          <p className="auth-card__message">{errorMessage}</p>
        ) : null}

        <form key={formKey} className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__field">
            <span>Nombre</span>
            <input
              name="name"
              type="text"
              defaultValue={currentUser?.name ?? ''}
            />
          </label>

          <label className="auth-form__field">
            <span>Apellido</span>
            <input
              name="surname"
              type="text"
              defaultValue={currentUser?.surname ?? ''}
            />
          </label>

          <label className="auth-form__field">
            <span>Rol</span>
            <select name="role" defaultValue={currentUser?.role ?? 'client'}>
              <option value="client">Usuario</option>
              <option value="technician">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
          </label>

          <button type="submit" disabled={updateCurrentUser.isPending}>
            {updateCurrentUser.isPending ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </form>

        <p className="auth-card__message">
          {mutationError
            ? mutationError
            : updateCurrentUser.isSuccess
              ? 'Perfil actualizado'
              : ' '}
        </p>

        <Link to="/dev/supabase" className="dashboard-card__link">
          Ir al diagnostico tecnico
        </Link>
        <Link
          to="/users"
          className="dashboard-card__link dashboard-card__link--secondary"
        >
          Ir al tester de users
        </Link>
        {currentUser?.role === 'admin' ? (
          <>
            <Link
              to="/technician-search"
              className="dashboard-card__link dashboard-card__link--secondary"
            >
              Ir al buscador técnico
            </Link>
            <a
              href={apiDocsUrl}
              target="_blank"
              rel="noreferrer"
              className="dashboard-card__link dashboard-card__link--secondary"
            >
              Ver API Docs
            </a>
          </>
        ) : null}
        <Link
          to="/technician-catalogs"
          className="dashboard-card__link dashboard-card__link--secondary"
        >
          Ir al tester de catálogos técnicos
        </Link>
      </section>
    </main>
  );
}
