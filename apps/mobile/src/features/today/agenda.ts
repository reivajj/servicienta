import type { Operation } from '@servicienta/types';

export const AGENDA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

export function argentinaDay(value: Date | string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: AGENDA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function todayScheduledOperations<
  T extends Pick<Operation, 'id' | 'status' | 'scheduled_at'>,
>(operations: T[], now: Date) {
  const today = argentinaDay(now);
  return operations
    .filter(
      (operation) =>
        operation.status === 'scheduled' &&
        operation.scheduled_at &&
        argentinaDay(operation.scheduled_at) === today,
    )
    .sort(
      (a, b) =>
        Date.parse(a.scheduled_at!) - Date.parse(b.scheduled_at!) ||
        a.id.localeCompare(b.id),
    );
}
