import { Link, Outlet } from '@tanstack/react-router';
import { useCurrentUser } from '@servicienta/query-hooks';
import type { UserRole } from '@servicienta/types';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

interface NavItem {
  to:
    | '/dashboard'
    | '/users'
    | '/client-profiles'
    | '/technician-profiles'
    | '/orders'
    | '/operations'
    | '/chats'
    | '/technician-search'
    | '/technician-catalogs'
    | '/activity-events'
    | '/login'
    | '/dev/supabase';
  label: string;
  roles?: readonly UserRole[];
  publicOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Panel',
    roles: ['admin', 'client', 'technician'],
  },
  { to: '/users', label: 'Usuarios', roles: ['admin'] },
  { to: '/client-profiles', label: 'Clientes', roles: ['admin'] },
  {
    to: '/technician-profiles',
    label: 'Técnicos',
    roles: ['admin'],
  },
  { to: '/orders', label: 'Pedidos', roles: ['admin', 'client', 'technician'] },
  {
    to: '/operations',
    label: 'Visitas',
    roles: ['admin', 'client', 'technician'],
  },
  {
    to: '/chats',
    label: 'Chats',
    roles: ['admin', 'client', 'technician'],
  },
  {
    to: '/technician-search',
    label: 'Búsqueda',
    roles: ['admin', 'client'],
  },
  {
    to: '/technician-catalogs',
    label: 'Catálogo',
    roles: ['admin'],
  },
  {
    to: '/activity-events',
    label: 'Eventos de actividad',
    roles: ['admin'],
  },
  { to: '/login', label: 'Ingresar', publicOnly: true },
  { to: '/dev/supabase', label: 'Diagnóstico', roles: ['admin'] },
];

export function AppShell() {
  const { isLoading, session, user, signOut } = useAuth();
  const { data: currentUser } = useCurrentUser({ enabled: Boolean(session) });
  const [signOutMessage, setSignOutMessage] = useState('');
  const currentRole = currentUser?.role;
  const visibleNavItems = navItems.filter((item) =>
    isNavItemVisible(item, currentRole, Boolean(session)),
  );
  const apiDocsUrl = (() => {
    const url = new URL('/api-docs', import.meta.env.VITE_API_URL);

    if (session?.access_token) {
      url.searchParams.set('access_token', session.access_token);
    }

    return url.toString();
  })();

  async function handleSignOut() {
    try {
      await signOut();
      setSignOutMessage('');
    } catch (error) {
      setSignOutMessage(
        error instanceof Error ? error.message : 'No se pudo cerrar sesion',
      );
    }
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <Link to="/" className="app-shell__brand">
          Servicienta
        </Link>

        <div className="app-shell__status">
          {isLoading ? (
            <span>Cargando sesion...</span>
          ) : user ? (
            <>
              <span>{user.email ?? 'Sesion activa'}</span>
              <button type="button" onClick={handleSignOut}>
                Cerrar sesion
              </button>
            </>
          ) : (
            <span>Sin sesion</span>
          )}
        </div>
      </header>

      {signOutMessage ? (
        <p className="app-shell__message app-shell__message--error">
          {signOutMessage}
        </p>
      ) : null}

      <div className="app-shell__body">
        <aside className="app-shell__sidebar" aria-label="Navegacion principal">
          <nav className="app-shell__nav">
            {visibleNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="app-shell__link"
                activeProps={{
                  className: 'app-shell__link app-shell__link--active',
                }}
              >
                {item.label}
              </Link>
            ))}
            {currentRole === 'admin' ? (
              <a
                href={apiDocsUrl}
                target="_blank"
                rel="noreferrer"
                className="app-shell__link"
              >
                Documentación API
              </a>
            ) : null}
          </nav>
        </aside>

        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function isNavItemVisible(
  item: NavItem,
  role: UserRole | undefined,
  hasSession: boolean,
) {
  if (item.publicOnly) return !hasSession;
  if (!role) return item.to === '/technician-search';

  return item.roles?.includes(role) ?? false;
}
