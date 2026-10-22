import assert from 'node:assert/strict';
import { test } from 'node:test';
import dates from '../../apps/mobile/src/features/filters/dates.ts';
const { quickDateRange } = dates;
import {
  applyDateFilters,
  validateDateFilters,
} from '../../apps/api-gateway/src/core/date-filters.ts';
import { applyTextSearch } from '../../apps/api-gateway/src/core/text-search.ts';
import { listMyOrders } from '../../apps/api-gateway/src/orders/service.ts';
import { listCurrentOperations } from '../../apps/api-gateway/src/operations/service.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

test('calendar presets use Argentina days, rolling 7-day and 30-day ranges', () => {
  const now = new Date('2026-11-01T01:00:00Z'); // Still Saturday, October 31 locally.
  assert.deepEqual(quickDateRange('today', now), {
    date_from: '2026-10-31',
    date_to: '2026-10-31',
  });
  assert.deepEqual(quickDateRange('tomorrow', now), {
    date_from: '2026-11-01',
    date_to: '2026-11-01',
  });
  assert.deepEqual(quickDateRange('seven_days', now), {
    date_from: '2026-10-31',
    date_to: '2026-11-06',
  });
  assert.deepEqual(
    quickDateRange('thirty_days', new Date('2028-02-29T12:00:00Z')),
    {
      date_from: '2028-02-29',
      date_to: '2028-03-29',
    },
  );
  assert.deepEqual(
    quickDateRange('tomorrow', new Date('2026-12-31T12:00:00Z')),
    { date_from: '2027-01-01', date_to: '2027-01-01' },
  );
});

test('date validation rejects malformed dates, impossible days and reversed ranges', () => {
  for (const value of [
    '2026-02-30',
    '2026-13-01',
    '2026-1-01',
    'no-date',
    '2026-10-22T12:00:00Z',
    '',
  ]) {
    assert.throws(() => validateDateFilters({ date_from: value }));
  }
  assert.throws(() =>
    validateDateFilters({ date_from: '2026-10-23', date_to: '2026-10-22' }),
  );
  assert.deepEqual(validateDateFilters({ date_from: '2028-02-29' }), {
    date_from: '2028-02-29',
    date_to: undefined,
  });
});

test('inclusive Argentina day translates into a half-open UTC interval', () => {
  const calls: string[][] = [];
  const query = {
    gte(column: string, value: string) {
      calls.push(['gte', column, value]);
      return this;
    },
    lt(column: string, value: string) {
      calls.push(['lt', column, value]);
      return this;
    },
  };
  applyDateFilters(
    query,
    { date_from: '2026-12-31', date_to: '2026-12-31' },
    'scheduled_at',
  );
  assert.deepEqual(calls, [
    ['gte', 'scheduled_at', '2026-12-31T00:00:00-03:00'],
    ['lt', 'scheduled_at', '2027-01-01T03:00:00.000Z'],
  ]);
});

// In-memory query adapter evaluates filters to exercise list and summary queries together.
function database(column: string, selectedStatus: string) {
  const rows = [
    {
      technician_id: 'tech',
      status: selectedStatus,
      [column]: '2026-10-22T03:00:00Z',
      description: 'Heladera',
    },
    {
      technician_id: 'tech',
      status: selectedStatus,
      [column]: '2026-10-23T02:59:59Z',
      description: 'Heladera',
    },
    {
      technician_id: 'tech',
      status: selectedStatus,
      [column]: '2026-10-23T03:00:00Z',
      description: 'Heladera',
    },
    {
      technician_id: 'other',
      status: selectedStatus,
      [column]: '2026-10-22T15:00:00Z',
      description: 'Heladera',
    },
    {
      technician_id: 'tech',
      status: 'completed',
      [column]: '2026-10-22T15:00:00Z',
      description: 'Heladera',
    },
    {
      technician_id: 'tech',
      status: selectedStatus,
      [column]: null,
      description: 'Heladera',
    },
    {
      technician_id: 'tech',
      status: selectedStatus,
      [column]: '2026-10-22T15:00:00Z',
      description: 'Lavarropas',
    },
  ];
  return {
    from() {
      let matches = rows.map((row) => ({
        ...row,
        order_search_text: `${row.description} María Pérez Villa Urquiza`,
        operation_search_text: `${row.description} María Pérez Villa Urquiza`,
      })) as Record<string, string | null>[];
      const query = {
        returns() {
          return this;
        },
        select() {
          return this;
        },
        order() {
          return this;
        },
        range() {
          return this;
        },
        eq(key: string, value: string) {
          matches = matches.filter((row) => row[key] === value);
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
        ilike(key: string, pattern: string) {
          const term = pattern.replace(/^%|%$/g, '').toLowerCase();
          matches = matches.filter(
            (row) => Boolean(term) && row[key]?.toLowerCase().includes(term),
          );
          return this;
        },
        or(_filter: string) {
          return this.ilike('description', '%Heladera%');
        },
        then(resolve: (value: unknown) => unknown) {
          return Promise.resolve({
            data: [],
            count: matches.length,
            error: null,
          }).then(resolve);
        },
      };
      return query;
    },
  } as unknown as SupabaseClient;
}

test('order totals and status counters combine owner, text, dates and selected state', async () => {
  const result = await listMyOrders(
    database('created_at', 'pending'),
    { id: 'tech', role: 'technician' } as Parameters<typeof listMyOrders>[1],
    {
      page: 1,
      pageSize: 25,
      status: 'pending',
      search: 'Heladera',
      date_from: '2026-10-22',
      date_to: '2026-10-22',
    },
  );
  assert.equal(result.pagination.total, 2);
  assert.equal(result.summary.totalOrders, 2);
  assert.equal(result.summary.pendingOrders, 2);
  assert.equal(result.summary.completedOrders, 0);
});

test('visit counters use scheduled dates and exclude other statuses and unagended visits', async () => {
  const result = await listCurrentOperations(
    database('scheduled_at', 'scheduled'),
    { id: 'tech', role: 'technician' } as Parameters<
      typeof listCurrentOperations
    >[1],
    {
      page: 1,
      pageSize: 25,
      status: 'scheduled',
      search: 'Heladera',
      date_from: '2026-10-22',
      date_to: '2026-10-22',
    },
  );
  assert.equal(result.pagination.total, 2);
  assert.equal(result.summary.scheduledOperations, 2);
  assert.equal(result.summary.completedOperations, 0);
});

test('text search combines note, client name, zone and appliance words in any order', () => {
  const rows = [
    { text: 'No enfría María Pérez Villa Urquiza Heladera', id: 1 },
    { text: 'No enfría Juan López Palermo Lavarropas', id: 2 },
  ];
  for (const column of ['order_search_text', 'operation_search_text']) {
    for (const search of [
      'No enfría',
      'María',
      'Pérez',
      'Villa Urquiza',
      'Heladera',
      'Heladera María Urquiza',
    ]) {
      let matches = rows;
      const query = {
        ilike(key: string, pattern: string) {
          assert.equal(key, column);
          const term = pattern.slice(1, -1).toLowerCase();
          matches = matches.filter((row) =>
            row.text.toLowerCase().includes(term),
          );
          return this;
        },
      };
      applyTextSearch(query, column, search);
      assert.ok(matches.some((row) => row.id === 1));
      if (search !== 'No enfría') assert.equal(matches.length, 1);
    }
    const patterns: string[] = [];
    const query = {
      ilike(_key: string, pattern: string) {
        patterns.push(pattern);
        return this;
      },
    };
    applyTextSearch(query, column, '%_*');
    assert.deepEqual(patterns, ['']);
  }
});

test('expanded search keeps visit and order counters consistent for client, zone and appliance queries', async () => {
  for (const search of ['María Pérez', 'Villa Urquiza', 'Heladera María']) {
    const orders = await listMyOrders(
      database('created_at', 'pending'),
      { id: 'tech', role: 'technician' } as Parameters<typeof listMyOrders>[1],
      {
        page: 1,
        pageSize: 25,
        status: 'pending',
        search,
        date_from: '2026-10-22',
        date_to: '2026-10-22',
      },
    );
    const visits = await listCurrentOperations(
      database('scheduled_at', 'scheduled'),
      { id: 'tech', role: 'technician' } as Parameters<
        typeof listCurrentOperations
      >[1],
      {
        page: 1,
        pageSize: 25,
        status: 'scheduled',
        search,
        date_from: '2026-10-22',
        date_to: '2026-10-22',
      },
    );
    assert.equal(
      orders.summary.totalOrders,
      search.includes('Heladera') ? 2 : 3,
    );
    assert.equal(orders.summary.pendingOrders, orders.pagination.total);
    assert.equal(visits.summary.scheduledOperations, visits.pagination.total);
    assert.equal(visits.pagination.total, orders.pagination.total);
  }
});
