import { Link, Outlet } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

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

        <nav className="app-shell__nav">
          <Link to="/dashboard" className="app-shell__link">
            Dashboard
          </Link>
          <Link to="/users" className="app-shell__link">
            Users
          </Link>
          <Link to="/technician-search" className="app-shell__link">
            Technician Search
          </Link>
          <Link to="/technician-catalogs" className="app-shell__link">
            Technician Catalogs
          </Link>
          <Link to="/login" className="app-shell__link">
            Login
          </Link>
          <Link to="/dev/supabase" className="app-shell__link">
            Diagnostico
          </Link>
        </nav>

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

      <Outlet />
    </div>
  );
}
