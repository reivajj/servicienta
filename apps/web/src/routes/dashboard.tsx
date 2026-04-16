import { createFileRoute } from '@tanstack/react-router';
import { DashboardPage } from '../features/dashboard/components/DashboardPage';
import { RequireAuth } from '../features/auth/components/RequireAuth';

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  );
}
