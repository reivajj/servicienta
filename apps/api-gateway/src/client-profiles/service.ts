import type {
  ListClientProfilesInput,
  PaginatedClientProfiles,
  UpdateClientProfileInput,
} from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NotFoundError } from '../core/errors.js';
import { mapAdminClientProfileRow } from './mapper.js';
import type { AdminClientProfileRow } from './types.js';
import { validateUpdateClientProfileInput } from './validators.js';

const ADMIN_CLIENT_PROFILE_SELECT =
  'id, email, name, surname, status, deleted_at, user_created_at, phone, whatsapp_phone, default_address_text, default_lat, default_lng, address_notes, preferred_contact_channel, created_at, updated_at';

export async function listClientProfiles(
  supabase: SupabaseClient,
  input: ListClientProfilesInput,
): Promise<PaginatedClientProfiles> {
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;

  const profilesQuery = buildListClientProfilesQuery(supabase, input, from, to);
  const totalQuery = buildClientProfilesCountQuery(supabase, input);
  const activeCountQuery = buildClientProfilesCountQuery(
    supabase,
    { ...input, status: undefined },
    'ACTIVE',
  );
  const deletedCountQuery = buildClientProfilesCountQuery(
    supabase,
    { ...input, status: undefined },
    'DELETED',
  );

  const [profilesResult, totalResult, activeCountResult, deletedCountResult] =
    await Promise.all([
      profilesQuery,
      totalQuery,
      activeCountQuery,
      deletedCountQuery,
    ]);

  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (totalResult.error) throw new Error(totalResult.error.message);
  if (activeCountResult.error) throw new Error(activeCountResult.error.message);
  if (deletedCountResult.error)
    throw new Error(deletedCountResult.error.message);

  const total = totalResult.count ?? profilesResult.count ?? 0;

  return {
    items: ((profilesResult.data ?? []) as AdminClientProfileRow[]).map((row) =>
      mapAdminClientProfileRow(row),
    ),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
    summary: {
      totalClients: total,
      activeClients: activeCountResult.count ?? 0,
      deletedClients: deletedCountResult.count ?? 0,
    },
  };
}

export async function getClientProfileById(
  supabase: SupabaseClient,
  clientProfileId: string,
) {
  const { data, error } = await supabase
    .from('admin_client_profiles')
    .select(ADMIN_CLIENT_PROFILE_SELECT)
    .eq('id', clientProfileId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('Client profile not found');

  return mapAdminClientProfileRow(data as AdminClientProfileRow);
}

export async function updateClientProfileById(
  supabase: SupabaseClient,
  clientProfileId: string,
  input: UpdateClientProfileInput,
) {
  const payload = validateUpdateClientProfileInput(input);

  const { error } = await supabase
    .from('client_profiles')
    .update(payload)
    .eq('id', clientProfileId);

  if (error) throw new Error(error.message);

  return getClientProfileById(supabase, clientProfileId);
}

function buildListClientProfilesQuery(
  supabase: SupabaseClient,
  input: ListClientProfilesInput,
  from: number,
  to: number,
) {
  let query = supabase
    .from('admin_client_profiles')
    .select(ADMIN_CLIENT_PROFILE_SELECT, { count: 'exact' })
    .order('user_created_at', { ascending: false })
    .range(from, to);

  if (input.status) query = query.eq('status', input.status);
  if (input.search) query = applySearchFilter(query, input.search);

  return query;
}

function buildClientProfilesCountQuery(
  supabase: SupabaseClient,
  input: ListClientProfilesInput,
  status?: 'ACTIVE' | 'DELETED',
) {
  let query = supabase
    .from('admin_client_profiles')
    .select('id', { count: 'exact', head: true });

  if (status) query = query.eq('status', status);
  if (input.status) query = query.eq('status', input.status);
  if (input.search) query = applySearchFilter(query, input.search);

  return query;
}

function applySearchFilter<
  TQuery extends { or(filters: string): TQuery },
>(query: TQuery, search: string): TQuery {
  const escapedSearch = search.replace(/[%]/g, '');

  return query.or(
    [
      `email.ilike.%${escapedSearch}%`,
      `name.ilike.%${escapedSearch}%`,
      `surname.ilike.%${escapedSearch}%`,
      `phone.ilike.%${escapedSearch}%`,
      `whatsapp_phone.ilike.%${escapedSearch}%`,
      `default_address_text.ilike.%${escapedSearch}%`,
    ].join(','),
  );
}
