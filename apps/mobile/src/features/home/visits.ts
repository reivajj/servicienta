import type { Operation } from '@servicienta/types';
import { argentinaDay } from '../today/agenda';

/** Keep today's visits visible until their status changes, including elapsed times. */
export function upcomingClientVisits<
  T extends Pick<Operation, 'id' | 'status' | 'scheduled_at'>,
>(visits: T[], now: Date): T[] {
  const startOfToday = Date.parse(`${argentinaDay(now)}T00:00:00-03:00`);
  return visits
    .filter(
      (visit) =>
        visit.status === 'scheduled' &&
        visit.scheduled_at &&
        Date.parse(visit.scheduled_at) >= startOfToday,
    )
    .sort(
      (a, b) =>
        Date.parse(a.scheduled_at!) - Date.parse(b.scheduled_at!) ||
        a.id.localeCompare(b.id),
    );
}
