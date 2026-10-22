import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { listMyOrders } from '../../apps/api-gateway/src/orders/service.ts';
import { validateListMyOrdersInput } from '../../apps/api-gateway/src/orders/validators.ts';

function database() {
  const row = (
    id: string,
    status: string,
    group: string,
    visit: string | null,
    created = '2026-10-20T12:00:00Z',
    technician = 'tech',
    search = 'Heladera María Palermo',
  ) => ({
    id,
    client_id: 'client',
    technician_id: technician,
    status,
    flow_type: 'client_selects',
    description: 'Nota',
    service_address_text: 'Calle 123',
    service_lat: null,
    service_lng: null,
    address_notes: null,
    zone_slug: 'palermo',
    appliance_type_slug: 'heladera',
    created_at: created,
    updated_at: created,
    order_worklist: group,
    order_next_visit_at: visit,
    next_visit_at: visit,
    order_search_text: search,
  });
  const rows: Record<string, string | null>[] = [
    row('future', 'in_progress', 'main', '2026-10-25T12:00:00Z'),
    row(
      'today',
      'in_progress',
      'main',
      '2026-10-22T18:00:00Z',
      '2026-10-21T12:00:00Z',
    ),
    row('pending-old', 'pending', 'pending', null, '2026-10-19T12:00:00Z'),
    row('pending-new', 'pending', 'pending', null, '2026-10-21T12:00:00Z'),
    row('no-agenda', 'accepted', 'main', null),
    row('overdue', 'in_progress', 'waiting', '2026-10-21T12:00:00Z'),
    row('confirmation', 'completed_tech', 'waiting', null),
    row('rejected', 'completion_rejected', 'waiting', null),
    row('completed', 'completed', 'history', null, '2026-09-01T12:00:00Z'),
    row('cancelled', 'cancelled', 'history', null, '2026-10-02T12:00:00Z'),
    row('other-tech', 'pending', 'pending', null, undefined, 'other'),
    row(
      'different-search',
      'pending',
      'pending',
      null,
      undefined,
      'tech',
      'Lavarropas Juan Belgrano',
    ),
  ];
  return {
    from() {
      let matches = rows.slice();
      let head = false;
      let range: [number, number] = [0, Infinity];
      const sorting: {
        key: string;
        ascending: boolean;
        nullsFirst?: boolean;
      }[] = [];
      return {
        select(_columns: string, options?: { head?: boolean }) {
          head = options?.head ?? false;
          return this;
        },
        returns() {
          return this;
        },
        eq(key: string, value: string) {
          matches = matches.filter((row) => row[key] === value);
          return this;
        },
        in(key: string, values: string[]) {
          matches = matches.filter((row) => values.includes(row[key]!));
          return this;
        },
        gte(key: string, value: string) {
          matches = matches.filter(
            (row) => row[key] && Date.parse(row[key]!) >= Date.parse(value),
          );
          return this;
        },
        lt(key: string, value: string) {
          matches = matches.filter(
            (row) => row[key] && Date.parse(row[key]!) < Date.parse(value),
          );
          return this;
        },
        ilike(key: string, value: string) {
          matches = matches.filter((row) =>
            row[key]?.toLowerCase().includes(value.slice(1, -1).toLowerCase()),
          );
          return this;
        },
        order(
          key: string,
          options: { ascending: boolean; nullsFirst?: boolean },
        ) {
          sorting.push({ key, ...options });
          return this;
        },
        range(from: number, to: number) {
          range = [from, to];
          return this;
        },
        then(resolve: (result: unknown) => unknown) {
          const count = matches.length;
          matches.sort((a, b) => {
            for (const sort of sorting) {
              if (a[sort.key] === b[sort.key]) continue;
              if (a[sort.key] === null) return sort.nullsFirst ? -1 : 1;
              if (b[sort.key] === null) return sort.nullsFirst ? 1 : -1;
              return (
                a[sort.key]!.localeCompare(b[sort.key]!) *
                (sort.ascending ? 1 : -1)
              );
            }
            return 0;
          });
          return Promise.resolve({
            error: null,
            count,
            data: head ? null : matches.slice(range[0], range[1] + 1),
          }).then(resolve);
        },
      };
    },
  } as unknown as SupabaseClient;
}
const auth = { id: 'tech', role: 'technician' } as Parameters<
  typeof listMyOrders
>[1];
const base = { page: 1, pageSize: 25 as const, search: 'Heladera' };

test('main orders use next visit dates before undated orders and keep counts for every shortcut', async () => {
  const result = await listMyOrders(database(), auth, {
    ...base,
    view: 'main',
  });
  assert.deepEqual(
    result.items.map((row) => row.id),
    ['today', 'future', 'pending-old', 'no-agenda', 'pending-new'],
  );
  assert.equal(result.items[0].next_visit_at, '2026-10-22T18:00:00Z');
  assert.equal(result.summary.totalOrders, 5);
  assert.equal(result.summary.pendingOrders, 2);
  assert.deepEqual(result.summary.attentionCounts, {
    pending: 2,
    waiting: 3,
    history: 2,
  });
});

test('acceptance, waiting and history shortcuts select their group and preserve text search', async () => {
  const pending = await listMyOrders(database(), auth, {
    ...base,
    view: 'pending',
  });
  assert.deepEqual(
    pending.items.map((row) => row.id),
    ['pending-old', 'pending-new'],
  );
  const waiting = await listMyOrders(database(), auth, {
    ...base,
    view: 'waiting',
  });
  assert.deepEqual(
    waiting.items.map((row) => row.id),
    ['overdue', 'confirmation', 'rejected'],
  );
  assert.equal(waiting.summary.pendingOrders, 0);
  const history = await listMyOrders(database(), auth, {
    ...base,
    view: 'history',
  });
  assert.deepEqual(
    history.items.map((row) => row.id),
    ['cancelled', 'completed'],
  );
  assert.deepEqual(history.summary.attentionCounts, {
    pending: 2,
    waiting: 3,
    history: 2,
  });
});

test('main calendar filters target visit dates while history calendar targets creation dates', async () => {
  const main = await listMyOrders(database(), auth, {
    ...base,
    view: 'main',
    date_from: '2026-10-22',
    date_to: '2026-10-22',
  });
  assert.deepEqual(
    main.items.map((row) => row.id),
    ['today'],
  );
  assert.equal(main.summary.totalOrders, 1);
  assert.deepEqual(main.summary.attentionCounts, {
    pending: 2,
    waiting: 3,
    history: 2,
  });
  const history = await listMyOrders(database(), auth, {
    ...base,
    view: 'history',
    date_from: '2026-10-01',
    date_to: '2026-10-31',
  });
  assert.deepEqual(
    history.items.map((row) => row.id),
    ['cancelled'],
  );
  assert.throws(() => validateListMyOrdersInput({ view: 'unknown' }));
});
