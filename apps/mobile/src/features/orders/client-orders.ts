import type { Order } from '@servicienta/types';
import { argentinaDay } from '../today/agenda';

type ClientOrder = Pick<Order, 'id' | 'status' | 'created_at'> &
  Pick<Partial<Order>, 'next_visit_at'>;
const orderTime = (order: ClientOrder) =>
  Date.parse(order.next_visit_at ?? order.created_at);

export function organizeClientOrders<T extends ClientOrder>(
  orders: T[],
  now = new Date(),
) {
  const todayStart = Date.parse(`${argentinaDay(now)}T00:00:00-03:00`);
  const current = orders
    .filter(
      (order) =>
        order.status !== 'completed' &&
        order.status !== 'cancelled' &&
        orderTime(order) >= todayStart,
    )
    .sort((a, b) => orderTime(a) - orderTime(b) || a.id.localeCompare(b.id));
  const visibleIds = new Set(current.map((order) => order.id));
  return {
    current,
    history: orders
      .filter((order) => !visibleIds.has(order.id))
      .sort((a, b) => orderTime(b) - orderTime(a) || a.id.localeCompare(b.id)),
  };
}
