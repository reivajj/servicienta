import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { TechnicianCatalogsPage } from '../features/technician-profiles/components/TechnicianCatalogsPage';

export const Route = createFileRoute('/technician-catalogs/')({
  component: TechnicianCatalogsRoute,
});

function TechnicianCatalogsRoute() {
  return (
    <RequireAuth>
      <TechnicianCatalogsPage />
    </RequireAuth>
  );
}
