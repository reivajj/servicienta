import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { OrdersListPage } from '../features/orders/components/OrdersListPage';

export const Route = createFileRoute('/orders/')({
  component: OrdersRoute,
});

function OrdersRoute() {
  return (
    <RequireAuth>
      <OrdersListPage />
    </RequireAuth>
  );
}
