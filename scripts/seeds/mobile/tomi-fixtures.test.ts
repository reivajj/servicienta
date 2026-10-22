import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildTomiFixtures, MOBILE_SEED_MARKER } from './tomi-fixtures.js';

const today = '2026-10-20';
const fixtures = buildTomiFixtures(
  'technician',
  ['client-a', 'client-b'],
  today,
);
const localDay = (value: string) =>
  new Date(new Date(value).getTime() - 3 * 3600_000).toISOString().slice(0, 10);

test('40 pedidos y 20 visitas, repartidos por igual entre los únicos dos clientes', () => {
  assert.equal(fixtures.orders.length, 40);
  assert.equal(fixtures.operations.length, 20);
  for (const client of ['client-a', 'client-b']) {
    const orders = fixtures.orders.filter(
      (order) => order.client_id === client,
    );
    assert.equal(orders.length, 20);
    assert.equal(
      fixtures.operations.filter((operation) =>
        orders.some((order) => order.id === operation.order_id),
      ).length,
      10,
    );
  }
  for (const operation of fixtures.operations) {
    const order = fixtures.orders.find((row) => row.id === operation.order_id);
    assert.equal(order?.status, 'in_progress');
    assert.equal(operation.status, 'scheduled');
    assert.equal(operation.technician_id, order?.technician_id);
    assert.ok(operation.created_at <= operation.scheduled_at);
  }
});

test('cinco visitas hoy, quince en octubre y cinco pedidos y visitas en noviembre, en UTC-3', () => {
  assert.equal(
    fixtures.operations.filter((op) => localDay(op.scheduled_at) === today)
      .length,
    5,
  );
  assert.equal(
    fixtures.operations.filter((op) =>
      localDay(op.scheduled_at).startsWith('2026-10'),
    ).length,
    15,
  );
  assert.equal(
    fixtures.operations.filter((op) =>
      localDay(op.scheduled_at).startsWith('2026-11'),
    ).length,
    5,
  );
  assert.equal(
    fixtures.orders.filter((order) =>
      localDay(order.created_at).startsWith('2026-11'),
    ).length,
    5,
  );
  assert.equal(
    fixtures.orders.filter((order) => order.status === 'pending').length,
    20,
  );
});

test('marcas de limpieza y UUIDs estables y exclusivos por entidad', () => {
  assert.deepEqual(
    fixtures,
    buildTomiFixtures('technician', ['client-a', 'client-b'], today),
  );
  assert.equal(
    new Set([...fixtures.orders, ...fixtures.operations].map((row) => row.id))
      .size,
    60,
  );
  for (const order of fixtures.orders)
    assert.ok(order.address_notes.startsWith(MOBILE_SEED_MARKER));
  assert.throws(() => buildTomiFixtures('technician', ['same', 'same'], today));
  assert.throws(() =>
    buildTomiFixtures('technician', ['a', 'b'], '2026-11-20'),
  );
});
