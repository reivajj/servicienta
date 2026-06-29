import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { ClientProfilePage } from '../features/client-profiles/components/ClientProfileDetailDialog';

export const Route = createFileRoute('/client-profiles/$clientProfileId')({
  component: ClientProfileRoute,
});

function ClientProfileRoute() {
  const { clientProfileId } = Route.useParams();

  return (
    <RequireAuth>
      <ClientProfilePage clientProfileId={clientProfileId} />
    </RequireAuth>
  );
}
