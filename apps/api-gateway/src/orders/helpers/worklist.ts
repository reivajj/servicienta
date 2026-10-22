import type { ListMyOrdersInput } from '@servicienta/types';
import { applyDateFilters } from '../../core/date-filters.js';

export function applyOrderWorklist<
  T extends {
    eq(column: string, value: string): T;
    in(column: string, values: string[]): T;
    gte(column: string, value: string): T;
    lt(column: string, value: string): T;
  },
>(query: T, input: ListMyOrdersInput): T {
  if (input.view === 'main')
    query = query.in('order_worklist', ['main', 'pending']);
  else if (input.view) query = query.eq('order_worklist', input.view);
  const dateColumn =
    input.view && input.view !== 'history'
      ? 'order_next_visit_at'
      : 'created_at';
  return applyDateFilters(query, input, dateColumn);
}
