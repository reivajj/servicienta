import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { OperationPage } from '../features/operations/components/OperationDetailDialog';

export const Route = createFileRoute('/operations/$operationId')({
  component: OperationRoute,
});

function OperationRoute() {
  const { operationId } = Route.useParams();

  return (
    <RequireAuth>
      <OperationPage operationId={operationId} />
    </RequireAuth>
  );
}
