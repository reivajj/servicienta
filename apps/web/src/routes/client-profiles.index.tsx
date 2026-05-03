import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { ClientProfilesListPage } from '../features/client-profiles/components/ClientProfilesListPage';

export const Route = createFileRoute('/client-profiles/')({
  component: ClientProfilesRoute,
});

function ClientProfilesRoute() {
  return (
    <RequireAuth>
      <ClientProfilesListPage />
    </RequireAuth>
  );
}
