import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { TechnicianProfilePage } from '../features/technician-profiles/components/TechnicianProfilePage';

export const Route = createFileRoute('/technicians/$technicianId')({
  component: TechnicianRoute,
});

function TechnicianRoute() {
  const { technicianId } = Route.useParams();

  return (
    <RequireAuth>
      <TechnicianProfilePage technicianId={technicianId} />
    </RequireAuth>
  );
}
