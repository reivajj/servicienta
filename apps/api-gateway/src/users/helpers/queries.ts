import type { ListUsersInput } from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRow } from '../types.js';

export const USER_ROW_SELECT =
  'id, email, name, surname, role, status, deleted_at, created_at';

function applySearchFilter<TQuery extends { or(filters: string): TQuery }>(
  query: TQuery,
  input: ListUsersInput,
): TQuery {
  if (!input.search) return query;

  const escapedSearch = input.search.replace(/[%]/g, '');

  return query.or(
      `email.ilike.%${escapedSearch}%,name.ilike.%${escapedSearch}%,surname.ilike.%${escapedSearch}%`,
    );
}

export function buildListUsersQuery(
  supabase: SupabaseClient,
  input: ListUsersInput,
  from: number,
  to: number,
) {
  let query = supabase
    .from('users')
    .select(USER_ROW_SELECT, {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (input.status) query = query.eq('status', input.status);
  if (input.role) query = query.eq('role', input.role);

  return applySearchFilter(query, input);
}

export function buildUsersCountQuery(
  supabase: SupabaseClient,
  input: ListUsersInput,
  status?: 'ACTIVE' | 'DELETED',
) {
  let query = supabase.from('users').select('id', { count: 'exact', head: true });

  if (status) query = query.eq('status', status);
  if (input.status) query = query.eq('status', input.status);
  if (input.role) query = query.eq('role', input.role);

  return applySearchFilter(query, input);
}

export async function findUserRowById(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select(USER_ROW_SELECT)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}
