import { Link, Outlet } from '@tanstack/react-router';
import { useCurrentUser } from '@servicienta/query-hooks';
import type { UserRole } from '@servicienta/types';
import { useEffect, useRef, useState } from 'react';
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

const mobilePrimaryRoutes = new Set<NavItem['to']>([
  '/dashboard',
  '/users',
  '/client-profiles',
  '/technician-profiles',
  '/orders',
  '/operations',
  '/chats',
  '/technician-search',
]);

function MobileNavIcon({ route }: { route: NavItem['to'] }) {
  if (route === '/dashboard') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
  if (route === '/users') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.5-3.2 2.4-5 5.5-5s5 1.8 5.5 5M17 5.5a2.7 2.7 0 0 1 0 5.2M17 14c2.3.2 3.5 1.8 3.8 4" /></svg>;
  if (route === '/client-profiles') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5.5 20c.6-3.5 2.8-5.5 6.5-5.5s5.9 2 6.5 5.5M4 4h2M18 4h2" /></svg>;
  if (route === '/technician-profiles') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5a4.5 4.5 0 0 0-5.7 5.7L3 17l4 4 5.8-5.8a4.5 4.5 0 0 0 5.7-5.7l-3 3-3-3 3-3Z" /></svg>;
  if (route === '/orders') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3.5h6M8.5 9h7M8.5 13h7M8.5 17h5" /></svg>;
  if (route === '/operations') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M7.5 15l2.5 2.5 5-5" /></svg>;
  if (route === '/technician-search') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 3v-3a2 2 0 0 1-1-2V6a2 2 0 0 1 2-2Z" /><path d="M7 9h10M7 13h7" /></svg>;
}

export function AppShell() {
  const { isLoading, session, user, signOut } = useAuth();
  const { data: currentUser } = useCurrentUser({ enabled: Boolean(session) });
  const [signOutMessage, setSignOutMessage] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMoreButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMoreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsProfileMenuOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!isMobileMoreOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!mobileMoreButtonRef.current?.contains(target) && !mobileMoreMenuRef.current?.contains(target)) {
        setIsMobileMoreOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMobileMoreOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMoreOpen]);
  const currentRole = session ? currentUser?.role : undefined;
  const visibleNavItems = navItems.filter((item) =>
    isNavItemVisible(item, currentRole, Boolean(session)),
  );
  const secondaryNavItems = visibleNavItems.filter((item) => !mobilePrimaryRoutes.has(item.to));
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

        {session ? <nav className="app-shell__mobile-nav" aria-label="Navegación principal móvil">
          {visibleNavItems.filter((item) => mobilePrimaryRoutes.has(item.to)).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="app-shell__mobile-link"
              activeProps={{ className: 'app-shell__mobile-link app-shell__mobile-link--active' }}
              aria-label={item.label}
              title={item.label}
            >
              <MobileNavIcon route={item.to} />
            </Link>
          ))}
          {secondaryNavItems.length > 0 || currentRole === 'admin' ? (
            <button
              ref={mobileMoreButtonRef}
              type="button"
              className={`app-shell__mobile-link${isMobileMoreOpen ? ' app-shell__mobile-link--active' : ''}`}
              aria-label="Más opciones"
              title="Más opciones"
              aria-expanded={isMobileMoreOpen}
              aria-controls="app-shell-mobile-more-menu"
              onClick={() => setIsMobileMoreOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
            </button>
          ) : null}
        </nav> : null}

        {isMobileMoreOpen ? (
          <div ref={mobileMoreMenuRef} id="app-shell-mobile-more-menu" className="app-shell__mobile-more-menu">
            {secondaryNavItems.map((item) => (
              <Link key={item.to} to={item.to} className="app-shell__mobile-more-link" activeProps={{ className: 'app-shell__mobile-more-link app-shell__mobile-more-link--active' }} onClick={() => setIsMobileMoreOpen(false)}>{item.label}</Link>
            ))}
            {currentRole === 'admin' ? <a href={apiDocsUrl} target="_blank" rel="noreferrer" className="app-shell__mobile-more-link" onClick={() => setIsMobileMoreOpen(false)}>Documentación API</a> : null}
          </div>
        ) : null}

        <div className="app-shell__status">
          {isLoading ? (
            <span>Cargando sesion...</span>
          ) : user ? (
            <div className="app-shell__profile" ref={profileRef}>
              <button
                type="button"
                className="app-shell__profile-trigger"
                aria-label="Abrir menú de perfil"
                aria-expanded={isProfileMenuOpen}
                onClick={() => setIsProfileMenuOpen((current) => !current)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M5.5 20c.7-3.5 3.2-5.5 6.5-5.5s5.8 2 6.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              {isProfileMenuOpen ? (
                <div className="app-shell__profile-menu">
                  <strong>{`${currentUser?.name ?? ''} ${currentUser?.surname ?? ''}`.trim() || 'Sin nombre'}</strong>
                  <span>{user.email ?? 'Sin email'}</span>
                  <span>{currentUser ? currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'technician' ? 'Técnico' : 'Cliente' : 'Cargando rol...'}</span>
                  <button type="button" onClick={handleSignOut}>Cerrar sesión</button>
                </div>
              ) : null}
            </div>
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

      <div className={`app-shell__body${session ? '' : ' app-shell__body--guest'}`}>
        {session ? <aside className="app-shell__sidebar" aria-label="Navegacion principal">
          <nav className="app-shell__nav">
            {visibleNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`app-shell__link${mobilePrimaryRoutes.has(item.to) ? ' app-shell__link--mobile-primary' : ''}`}
                activeProps={{
                  className: `app-shell__link app-shell__link--active${mobilePrimaryRoutes.has(item.to) ? ' app-shell__link--mobile-primary' : ''}`,
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
        </aside> : null}

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
