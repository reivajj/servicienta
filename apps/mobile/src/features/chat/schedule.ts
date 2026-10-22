import { OPERATION_SCHEDULE_STEP_MINUTES } from '@servicienta/types';

export function parseArgentinaSchedule(
  day: string,
  time: string,
  now = new Date(),
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    throw new Error('Ingresá fecha AAAA-MM-DD y hora HH:MM.');
  const date = new Date(`${day}T${time}:00-03:00`);
  const local = new Date(date.getTime() - 3 * 3600_000);
  if (
    !Number.isFinite(date.getTime()) ||
    local.toISOString().slice(0, 10) !== day
  )
    throw new Error('La fecha no es válida.');
  if (Number(time.slice(3)) % OPERATION_SCHEDULE_STEP_MINUTES !== 0)
    throw new Error(
      `Usá intervalos de ${OPERATION_SCHEDULE_STEP_MINUTES} minutos.`,
    );
  if (date <= now) throw new Error('La fecha y hora deben ser futuras.');
  return date.toISOString();
}

export function scheduleFields(value?: string | null) {
  const date = value
    ? new Date(value)
    : new Date(
        Math.ceil(
          (Date.now() + 3600_000) / (OPERATION_SCHEDULE_STEP_MINUTES * 60_000),
        ) *
          OPERATION_SCHEDULE_STEP_MINUTES *
          60_000,
      );
  const local = new Date(date.getTime() - 3 * 3600_000).toISOString();
  return { day: local.slice(0, 10), time: local.slice(11, 16) };
}
