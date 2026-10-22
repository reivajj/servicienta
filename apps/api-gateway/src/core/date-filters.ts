import { ValidationError } from './errors.js';

/** Inclusive calendar days in Argentina; the database upper bound is exclusive. */
export function validateDateFilters(input: {
  date_from?: string;
  date_to?: string;
}) {
  for (const value of [input.date_from, input.date_to]) {
    if (value === undefined) continue;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value
    )
      throw new ValidationError('La fecha del filtro no es válida');
  }
  if (input.date_from && input.date_to && input.date_from > input.date_to)
    throw new ValidationError('La fecha inicial debe ser anterior a la final');
  return { date_from: input.date_from, date_to: input.date_to };
}

export function applyDateFilters<
  T extends {
    gte(column: string, value: string): T;
    lt(column: string, value: string): T;
  },
>(
  query: T,
  input: { date_from?: string; date_to?: string },
  column: string,
): T {
  if (input.date_from)
    query = query.gte(column, `${input.date_from}T00:00:00-03:00`);
  if (input.date_to) {
    const end = new Date(`${input.date_to}T00:00:00-03:00`);
    end.setUTCDate(end.getUTCDate() + 1);
    query = query.lt(column, end.toISOString());
  }
  return query;
}
