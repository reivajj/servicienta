import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  argentinaDay,
  todayScheduledOperations,
} from '../../../apps/mobile/src/features/today/agenda.js';
import { buildTomiFixtures } from './tomi-fixtures.js';

test('la agenda de Tomi muestra las cinco visitas de hoy, ordenadas por horario', () => {
  const { operations } = buildTomiFixtures('tech', ['a', 'b'], '2026-10-20');
  const today = todayScheduledOperations(
    operations.reverse(),
    new Date('2026-10-20T12:00:00Z'),
  );
  assert.equal(today.length, 5);
  assert.deepEqual(
    today.map((op) => op.scheduled_at),
    [...today.map((op) => op.scheduled_at)].sort(),
  );
});

test('el día usa Argentina aunque el timestamp UTC ya sea del día siguiente', () => {
  assert.equal(argentinaDay('2026-10-21T02:59:59Z'), '2026-10-20');
  assert.equal(argentinaDay('2026-10-21T03:00:00Z'), '2026-10-21');
  const operations = [
    {
      id: 'late',
      status: 'scheduled' as const,
      scheduled_at: '2026-10-21T02:59:59Z',
    },
    {
      id: 'tomorrow',
      status: 'scheduled' as const,
      scheduled_at: '2026-10-21T03:00:00Z',
    },
    {
      id: 'cancelled',
      status: 'cancelled' as const,
      scheduled_at: '2026-10-20T15:00:00Z',
    },
    { id: 'pending', status: 'pending' as const, scheduled_at: null },
  ];
  assert.deepEqual(
    todayScheduledOperations(operations, new Date('2026-10-20T18:00:00Z')).map(
      (row) => row.id,
    ),
    ['late'],
  );
  assert.equal(todayScheduledOperations([], new Date()).length, 0);
});
