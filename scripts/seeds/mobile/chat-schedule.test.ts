import { validateScheduleOperationInput } from '../../../apps/api-gateway/src/operations/validators.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseArgentinaSchedule,
  scheduleFields,
} from '../../../apps/mobile/src/features/chat/schedule.js';
const now = new Date('2026-10-20T12:00:00Z');

test('agenda en hora argentina y convierte a UTC sin cambiar el instante', () => {
  assert.equal(
    parseArgentinaSchedule('2026-10-21', '23:50', now),
    '2026-10-22T02:50:00.000Z',
  );
  assert.deepEqual(scheduleFields('2026-10-22T02:50:00Z'), {
    day: '2026-10-21',
    time: '23:50',
  });
});

test('rechaza fechas inexistentes, pasadas, horas inválidas y minutos fuera del intervalo', () => {
  for (const [day, time] of [
    ['2026-02-30', '14:00'],
    ['2026-10-20', '08:00'],
    ['2026-10-21', '24:00'],
    ['2026-10-21', '14:13'],
    ['21/10/2026', '14:00'],
  ]) {
    assert.throws(() => parseArgentinaSchedule(day, time, now));
  }
});

test('acepta minutos en pasos de cinco', () => {
  for (const time of ['14:05', '14:15', '14:25', '14:55']) {
    assert.equal(
      scheduleFields(parseArgentinaSchedule('2026-10-21', time, now)).time,
      time,
    );
  }
});

test('el gateway admite cinco minutos y rechaza horarios no alineados', () => {
  assert.equal(
    validateScheduleOperationInput({
      scheduled_at: '2099-10-21T14:05:00-03:00',
      description: 'Diagnóstico',
    }).scheduled_at,
    '2099-10-21T14:05:00-03:00',
  );
  assert.throws(() =>
    validateScheduleOperationInput({
      scheduled_at: '2099-10-21T14:07:00-03:00',
      description: 'Diagnóstico',
    }),
  );
});
