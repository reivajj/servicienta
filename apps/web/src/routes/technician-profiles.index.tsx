import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { TechnicianProfilesListPage } from '../features/technician-profiles/components/TechnicianProfilesListPage';

export const Route = createFileRoute('/technician-profiles/')({
  component: TechnicianProfilesRoute,
});

function TechnicianProfilesRoute() {
  return (
    <RequireAuth>
      <TechnicianProfilesListPage />
    </RequireAuth>
  );
}
