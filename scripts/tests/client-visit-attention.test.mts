import assert from 'node:assert/strict';
import { test } from 'node:test';
import helpers from '../../apps/mobile/src/features/operations/client-visits.ts';
import type { OperationStatus } from '@servicienta/types';
const { organizeClientVisits, clientVisitGuidance } = helpers;
const now = new Date('2026-10-26T15:00:00Z');
function visit(
  id: string,
  scheduled_at: string | null,
  status: OperationStatus = 'scheduled',
  reviewed = false,
) {
  return {
    id,
    scheduled_at,
    status,
    created_at: '2026-10-20T12:00:00Z',
    technician_completed_at:
      status === 'completed_tech' ? '2026-10-26T14:00:00Z' : null,
    technician_review: reviewed
      ? {
          id: 'review',
          rating: 5,
          comment: null,
          created_at: '2026-10-26T14:00:00Z',
        }
      : null,
  };
}

test('latest outstanding visit is the only pending card shown; older ones move to history', () => {
  const old = visit('old', '2026-10-22T12:00:00Z');
  const today = visit('today', '2026-10-26T18:00:00Z');
  const future = visit('future', '2026-10-27T12:00:00Z');
  const pending = visit('unagended', null, 'pending');
  const complete = visit('reviewed', '2026-10-26T20:00:00Z', 'completed', true);
  const cancelled = visit('cancelled', '2026-10-26T21:00:00Z', 'cancelled');
  const result = organizeClientVisits(
    [old, future, complete, pending, cancelled, today],
    now,
  );
  assert.equal(result.featured?.id, 'today');
  assert.deepEqual(
    result.sections
      .find((section) => section.title === 'Visita pendiente')
      ?.data.map((item) => item.id),
    ['today'],
  );
  assert.deepEqual(
    result.sections
      .find((section) => section.title === 'Próximas visitas')
      ?.data.map((item) => item.id),
    ['future'],
  );
  assert.deepEqual(
    result.history.map((item) => item.id),
    ['cancelled', 'reviewed', 'old', 'unagended'],
  );
});

test('technician completion unlocks action; client-confirmed visits still request a missing opinion', () => {
  const before = clientVisitGuidance(
    visit('today', '2026-10-26T12:00:00Z'),
    now,
  )!;
  assert.equal(before.action, null);
  assert.equal(before.ready, false);
  assert.match(before.text, /programada para hoy/);
  const ready = clientVisitGuidance(
    visit('ready', '2026-10-26T12:00:00Z', 'completed_tech'),
    now,
  )!;
  assert.equal(ready.action, 'Completar visita y opinar');
  assert.equal(ready.ready, true);
  const noOpinion = visit('no-opinion', '2026-10-26T12:00:00Z', 'completed');
  assert.equal(clientVisitGuidance(noOpinion, now)?.action, 'Dejar mi opinión');
  assert.equal(
    organizeClientVisits([noOpinion], now).featured?.id,
    noOpinion.id,
  );
  assert.equal(
    clientVisitGuidance(
      {
        ...noOpinion,
        technician_review: {
          id: 'r',
          rating: 5,
          comment: null,
          created_at: now.toISOString(),
        },
      },
      now,
    ),
    null,
  );
});

test('before Argentina midnight a visit is still upcoming; after midnight it becomes today and featured', () => {
  const midnight = visit('new-day', '2026-10-27T12:00:00Z');
  assert.equal(
    organizeClientVisits([midnight], new Date('2026-10-27T02:59:59Z')).featured,
    undefined,
  );
  assert.equal(
    organizeClientVisits([midnight], new Date('2026-10-27T03:00:00Z')).featured
      ?.id,
    'new-day',
  );
  assert.match(
    clientVisitGuidance(visit('old', '2026-10-25T12:00:00Z'), now)!.text,
    /fecha de tu visita ya pasó/,
  );
});

test('highlight is selected from the full collection and never duplicates a visit', () => {
  const visits = Array.from({ length: 120 }, (_, index) =>
    visit(
      String(index),
      `2026-09-${String((index % 28) + 1).padStart(2, '0')}T12:00:00Z`,
    ),
  );
  visits.push(visit('recent', '2026-10-26T12:00:00Z', 'completed_tech'));
  const result = organizeClientVisits(visits, now);
  assert.equal(result.featured?.id, 'recent');
  const ids = [
    ...result.sections.flatMap((section) =>
      section.data.map((item) => item.id),
    ),
    ...result.history.map((item) => item.id),
  ];
  assert.equal(result.sections.flatMap((section) => section.data).length, 1);
  assert.equal(result.history.length, 120);
  assert.equal(ids.length, visits.length);
  assert.equal(new Set(ids).size, visits.length);
});

test('history excludes the latest pending visit and future visits, while retaining older actionable visits', () => {
  const oldReady = visit('old-ready', '2026-10-22T12:00:00Z', 'completed_tech');
  const current = visit('today', '2026-10-26T12:00:00Z');
  const future = visit('tomorrow', '2026-10-27T12:00:00Z');
  const result = organizeClientVisits([oldReady, current, future], now);
  assert.deepEqual(
    result.history.map((item) => item.id),
    ['old-ready'],
  );
  assert.equal(
    clientVisitGuidance(result.history[0], now)?.action,
    'Completar visita y opinar',
  );
  const onlyFuture = organizeClientVisits([future], now);
  assert.equal(onlyFuture.featured, undefined);
  assert.equal(onlyFuture.history.length, 0);
  assert.deepEqual(
    onlyFuture.sections.flatMap((section) =>
      section.data.map((item) => item.id),
    ),
    ['tomorrow'],
  );
});
