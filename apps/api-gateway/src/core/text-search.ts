/** Match every word anywhere in the computed search field, regardless of order.
 * Keep wildcard-only input from becoming a match-all request.
 */
export function applyTextSearch<
  T extends { ilike(column: string, pattern: string): T },
>(query: T, column: string, search: string): T {
  const words = search
    .replace(/[\\%_*]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return query.ilike(column, '');
  for (const word of words) query = query.ilike(column, `%${word}%`);
  return query;
}
