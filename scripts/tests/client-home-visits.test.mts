import assert from 'node:assert/strict';
import { test } from 'node:test';
import helpers from '../../apps/mobile/src/features/home/visits.ts';
import type { OperationStatus } from '@servicienta/types';
const { upcomingClientVisits } = helpers;
const visit = (
  id: string,
  scheduled_at: string | null,
  status: OperationStatus = 'scheduled',
) => ({ id, scheduled_at, status });

test('client home highlights the nearest visit, including elapsed times today in Argentina', () => {
  const visits = [
    visit('tomorrow', '2026-10-27T14:00:00Z'),
    visit('yesterday', '2026-10-26T02:59:59Z'),
    visit('afternoon', '2026-10-26T18:00:00Z'),
    visit('today-elapsed', '2026-10-26T12:00:00Z'),
    visit('cancelled', '2026-10-26T10:00:00Z', 'cancelled'),
    visit('completed', '2026-10-26T11:00:00Z', 'completed'),
    visit('awaiting-client', '2026-10-26T11:00:00Z', 'completed_tech'),
    visit('no-date', null),
  ];
  const result = upcomingClientVisits(visits, new Date('2026-10-26T15:00:00Z'));
  assert.deepEqual(
    result.map((item) => item.id),
    ['today-elapsed', 'afternoon', 'tomorrow'],
  );
  assert.equal(visits[0].id, 'tomorrow');
});

test('Argentina midnight removes previous days and keeps later visits', () => {
  const visits = [
    visit('oct26', '2026-10-26T12:00:00Z'),
    visit('oct27', '2026-10-27T12:00:00Z'),
  ];
  assert.equal(
    upcomingClientVisits(visits, new Date('2026-10-27T02:59:59Z'))[0].id,
    'oct26',
  );
  assert.equal(
    upcomingClientVisits(visits, new Date('2026-10-27T03:00:00Z'))[0].id,
    'oct27',
  );
});

test('without a scheduled visit there is no featured card', () => {
  assert.deepEqual(
    upcomingClientVisits([], new Date('2026-10-26T15:00:00Z')),
    [],
  );
  assert.deepEqual(
    upcomingClientVisits(
      [visit('pending', null, 'pending'), visit('invalid', 'bad-date')],
      new Date('2026-10-26T15:00:00Z'),
    ),
    [],
  );
});
