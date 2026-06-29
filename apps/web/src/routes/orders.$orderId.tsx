import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { OrderPage } from '../features/orders/components/OrderDetailDialog';

export const Route = createFileRoute('/orders/$orderId')({
  component: OrderRoute,
});

function OrderRoute() {
  const { orderId } = Route.useParams();

  return (
    <RequireAuth>
      <OrderPage orderId={orderId} />
    </RequireAuth>
  );
}
