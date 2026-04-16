// apps/web/src/routes/index.tsx
import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAuth } from '../features/auth/components/AuthProvider';

export const Route = createFileRoute('/')({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <main className="state-page">
        <section className="state-card">
          <h1>Preparando la app</h1>
          <p>Estamos verificando tu sesion actual.</p>
        </section>
      </main>
    );
  }

  return <Navigate to={session ? '/dashboard' : '/login'} />;
}
