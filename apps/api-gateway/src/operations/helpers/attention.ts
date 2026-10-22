import type { ListCurrentOperationsInput } from '@servicienta/types';

export function technicianVisitFilters(
  input: ListCurrentOperationsInput,
  now = new Date(),
) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  return {
    ...input,
    todayStart: `${part('year')}-${part('month')}-${part('day')}T00:00:00-03:00`,
  };
}
export type TechnicianVisitFilters = ReturnType<typeof technicianVisitFilters>;

export function applyVisitView<
  T extends {
    eq(column: string, value: string): T;
    lt(column: string, value: string): T;
    or(filters: string): T;
  },
>(query: T, input: TechnicianVisitFilters): T {
  if (input.view === 'pending') return query.eq('status', 'pending');
  if (input.view === 'overdue')
    return query.eq('status', 'scheduled').lt('scheduled_at', input.todayStart);
  if (input.view === 'main')
    return query.or(
      `status.neq.scheduled,scheduled_at.gte.${input.todayStart},scheduled_at.is.null`,
    );
  return query;
}
