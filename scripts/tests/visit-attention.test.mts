import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { technicianVisitFilters } from '../../apps/api-gateway/src/operations/helpers/attention.ts';
import { listCurrentOperations } from '../../apps/api-gateway/src/operations/service.ts';
import { validateListCurrentOperationsInput } from '../../apps/api-gateway/src/operations/validators.ts';

test('day boundary follows Argentina even while UTC is already on the next day', () => {
  const input = { page: 1, pageSize: 25 as const, view: 'main' as const };
  assert.equal(
    technicianVisitFilters(input, new Date('2026-10-23T02:59:59Z')).todayStart,
    '2026-10-22T00:00:00-03:00',
  );
  assert.equal(
    technicianVisitFilters(input, new Date('2026-10-23T03:00:00Z')).todayStart,
    '2026-10-23T00:00:00-03:00',
  );
  assert.throws(() => validateListCurrentOperationsInput({ view: 'unknown' }));
});

function database() {
  const row = (
    id: string,
    status: string,
    scheduled_at: string | null,
    created_at = '2026-10-20T12:00:00Z',
    technician_id = 'tech',
    operation_search_text = 'Heladera',
  ) => ({
    id,
    status,
    scheduled_at,
    created_at,
    technician_id,
    operation_search_text,
  });
  const rows: Record<string, string | null>[] = [
    row('yesterday', 'scheduled', '2026-10-22T02:59:59Z'),
    row('older', 'scheduled', '2026-10-20T14:00:00Z'),
    row('today-start', 'scheduled', '2026-10-22T03:00:00Z'),
    row('today-passed', 'scheduled', '2026-10-22T10:00:00Z'),
    row('tomorrow', 'scheduled', '2026-10-23T15:00:00Z'),
    row('pending-new', 'pending', null, '2026-10-22T15:00:00Z'),
    row('pending-old', 'pending', null, '2026-10-19T15:00:00Z'),
    row('completed', 'completed', '2026-10-20T15:00:00Z'),
    row('rejected', 'completion_rejected', '2026-10-20T15:00:00Z'),
    row('other-tech', 'scheduled', '2026-10-20T15:00:00Z', undefined, 'other'),
    row(
      'other-appliance',
      'scheduled',
      '2026-10-20T15:00:00Z',
      undefined,
      'tech',
      'Lavarropas',
    ),
  ];
  const listIds: string[][] = [];
  const client = {
    from() {
      let matches = rows.slice();
      let head = false;
      let range: [number, number] = [0, 24];
      const sorting: {
        key: string;
        ascending: boolean;
        nullsFirst: boolean;
      }[] = [];
      return {
        select(_select: string, options?: { head?: boolean }) {
          head = options?.head ?? false;
          return this;
        },
        eq(key: string, value: string) {
          matches = matches.filter((row) => row[key] === value);
          return this;
        },
        lt(key: string, value: string) {
          matches = matches.filter(
            (row) => row[key] && Date.parse(row[key]!) < Date.parse(value),
          );
          return this;
        },
        gte(key: string, value: string) {
          matches = matches.filter(
            (row) => row[key] && Date.parse(row[key]!) >= Date.parse(value),
          );
          return this;
        },
        ilike(key: string, value: string) {
          matches = matches.filter((row) =>
            row[key]?.toLowerCase().includes(value.slice(1, -1).toLowerCase()),
          );
          return this;
        },
        or(value: string) {
          const start = value.split(',')[1].slice('scheduled_at.gte.'.length);
          matches = matches.filter(
            (row) =>
              row.status !== 'scheduled' ||
              row.scheduled_at === null ||
              Date.parse(row.scheduled_at!) >= Date.parse(start),
          );
          return this;
        },
        order(
          key: string,
          options: { ascending: boolean; nullsFirst?: boolean },
        ) {
          sorting.push({
            key,
            ascending: options.ascending,
            nullsFirst: options.nullsFirst ?? false,
          });
          return this;
        },
        range(from: number, to: number) {
          range = [from, to];
          return this;
        },
        then(resolve: (result: unknown) => unknown) {
          if (!head) {
            matches.sort((a, b) => {
              for (const { key, ascending, nullsFirst } of sorting) {
                if (a[key] === b[key]) continue;
                if (a[key] === null) return nullsFirst ? -1 : 1;
                if (b[key] === null) return nullsFirst ? 1 : -1;
                return a[key]!.localeCompare(b[key]!) * (ascending ? 1 : -1);
              }
              return 0;
            });
            listIds.push(
              matches.slice(range[0], range[1] + 1).map((row) => row.id!),
            );
          }
          return Promise.resolve({
            data: [],
            error: null,
            count: matches.length,
          }).then(resolve);
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, listIds };
}

test('main, pending and overdue lists match counters without losing filters or today visits', async (context) => {
  context.mock.timers.enable({
    apis: ['Date'],
    now: new Date('2026-10-22T18:00:00Z'),
  });
  const auth = { id: 'tech', role: 'technician' } as Parameters<
    typeof listCurrentOperations
  >[1];
  const db = database();
  const base = { page: 1, pageSize: 25 as const, search: 'Heladera' };
  const main = await listCurrentOperations(db.client, auth, {
    ...base,
    view: 'main',
  });
  assert.deepEqual(db.listIds.at(-1), [
    'completed',
    'rejected',
    'today-start',
    'today-passed',
    'tomorrow',
    'pending-old',
    'pending-new',
  ]);
  assert.equal(main.summary.totalOperations, 7);
  assert.equal(main.summary.scheduledOperations, 3);
  assert.deepEqual(main.summary.attentionCounts, { pending: 2, overdue: 2 });

  const overdue = await listCurrentOperations(db.client, auth, {
    ...base,
    view: 'overdue',
  });
  assert.deepEqual(db.listIds.at(-1), ['older', 'yesterday']);
  assert.equal(overdue.pagination.total, 2);
  assert.equal(overdue.summary.scheduledOperations, 2);
  assert.equal(overdue.summary.pendingOperations, 0);
  assert.deepEqual(
    overdue.summary.attentionCounts,
    main.summary.attentionCounts,
  );

  const pending = await listCurrentOperations(db.client, auth, {
    ...base,
    view: 'pending',
  });
  assert.deepEqual(db.listIds.at(-1), ['pending-old', 'pending-new']);
  assert.equal(pending.summary.pendingOperations, 2);
  assert.equal(pending.summary.scheduledOperations, 0);
  assert.deepEqual(
    pending.summary.attentionCounts,
    main.summary.attentionCounts,
  );

  const dated = await listCurrentOperations(db.client, auth, {
    ...base,
    view: 'main',
    date_from: '2026-10-23',
    date_to: '2026-10-23',
  });
  assert.deepEqual(db.listIds.at(-1), ['tomorrow']);
  assert.equal(dated.pagination.total, 1);
  assert.deepEqual(dated.summary.attentionCounts, { pending: 2, overdue: 2 });
});
