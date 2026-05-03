import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { OperationsListPage } from '../features/operations/components/OperationsListPage';

export const Route = createFileRoute('/operations/')({
  component: OperationsRoute,
});

function OperationsRoute() {
  return (
    <RequireAuth>
      <OperationsListPage />
    </RequireAuth>
  );
}
