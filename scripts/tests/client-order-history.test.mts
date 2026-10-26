import assert from 'node:assert/strict';
import { test } from 'node:test';
import helpers from '../../apps/mobile/src/features/orders/client-orders.ts';
import type { OrderStatus } from '@servicienta/types';
const { organizeClientOrders } = helpers;
const now = new Date('2026-10-26T15:00:00Z');
const order = (id: string, status: OrderStatus, created_at: string) => ({
  id,
  status,
  created_at,
});

test('all active orders today and later stay visible from nearest to furthest, even after their time today', () => {
  const orders = [
    order('nov26', 'accepted', '2026-11-26T12:00:00Z'),
    order('tomorrow', 'pending', '2026-10-27T12:00:00Z'),
    order('today-afternoon', 'in_progress', '2026-10-26T18:00:00Z'),
    order('today-past-hour', 'pending', '2026-10-26T10:00:00Z'),
    order('yesterday', 'pending', '2026-10-26T02:59:59Z'),
    order('closed', 'completed', '2026-10-26T12:00:00Z'),
    order('cancelled', 'cancelled', '2026-10-24T12:00:00Z'),
  ];
  const result = organizeClientOrders(orders, now);
  assert.deepEqual(
    result.current.map((item) => item.id),
    ['today-past-hour', 'today-afternoon', 'tomorrow', 'nov26'],
  );
  assert.deepEqual(
    result.history.map((item) => item.id),
    ['closed', 'yesterday', 'cancelled'],
  );
  assert.equal(orders[0].id, 'nov26');
});

test('past and closed orders stay in history; empty collections stay empty', () => {
  const result = organizeClientOrders(
    [
      order('closed', 'completed', '2026-10-26T12:00:00Z'),
      order('cancelled', 'cancelled', '2026-10-25T12:00:00Z'),
      order('old-active', 'pending', '2026-10-24T12:00:00Z'),
    ],
    now,
  );
  assert.deepEqual(result.current, []);
  assert.equal(result.history.length, 3);
  assert.deepEqual(organizeClientOrders([], now), { current: [], history: [] });
});

test('the full collection is partitioned without losing or duplicating orders', () => {
  const orders = Array.from({ length: 120 }, (_, index) =>
    order(`old-${index}`, 'pending', '2026-10-20T12:00:00Z'),
  );
  orders.push(order('new', 'completed_tech', '2026-10-26T12:00:00Z'));
  const result = organizeClientOrders(orders, now);
  assert.deepEqual(
    result.current.map((item) => item.id),
    ['new'],
  );
  assert.equal(result.history.length, 120);
  assert.equal(
    new Set([...result.current, ...result.history].map((item) => item.id)).size,
    121,
  );
});

test('Argentina midnight changes the date boundary; the visit date takes precedence when supplied', () => {
  const visits = [order('oct26', 'accepted', '2026-10-26T12:00:00Z')];
  assert.equal(
    organizeClientOrders(visits, new Date('2026-10-27T02:59:59Z')).current
      .length,
    1,
  );
  assert.equal(
    organizeClientOrders(visits, new Date('2026-10-27T03:00:00Z')).current
      .length,
    0,
  );
  const withVisit = {
    ...order('upcoming-visit', 'in_progress', '2026-10-20T12:00:00Z'),
    next_visit_at: '2026-10-27T12:00:00Z',
  };
  assert.equal(organizeClientOrders([withVisit], now).current.length, 1);
});
