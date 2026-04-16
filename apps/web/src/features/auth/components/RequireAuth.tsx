import { Navigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <main className="state-page">
        <section className="state-card">
          <h1>Cargando sesion</h1>
          <p>Estamos verificando tu acceso.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
