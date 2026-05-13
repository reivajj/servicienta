import { Link, Outlet } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/client-profiles', label: 'Client Profiles' },
  { to: '/technician-profiles', label: 'Technician Profiles' },
  { to: '/orders', label: 'Orders' },
  { to: '/operations', label: 'Operations' },
  { to: '/technician-search', label: 'Technician Search' },
  { to: '/technician-catalogs', label: 'Technician Catalogs' },
  { to: '/login', label: 'Login' },
  { to: '/dev/supabase', label: 'Diagnostico' },
] as const;

export function AppShell() {
  const { isLoading, user, signOut } = useAuth();
  const [signOutMessage, setSignOutMessage] = useState('');

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
            {navItems.map((item) => (
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
          </nav>
        </aside>

        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
