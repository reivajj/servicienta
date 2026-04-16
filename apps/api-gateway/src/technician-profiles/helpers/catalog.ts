import type { ListAdminTechniciansByCatalogItemInput } from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NotFoundError } from '../../core/errors.js';
import type { AdminTechnicianCatalogItemRow } from '../types.js';

export async function listCatalogItems(
  supabase: SupabaseClient,
  table: 'zones' | 'brands' | 'appliance_types',
): Promise<AdminTechnicianCatalogItemRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminTechnicianCatalogItemRow[];
}

export async function getCatalogItemBySlug(
  supabase: SupabaseClient,
  input: ListAdminTechniciansByCatalogItemInput,
): Promise<AdminTechnicianCatalogItemRow> {
  const table =
    input.kind === 'zones'
      ? 'zones'
      : input.kind === 'brands'
        ? 'brands'
        : 'appliance_types';

  const { data, error } = await supabase
    .from(table)
    .select('id, name, slug')
    .eq('slug', input.slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('Technician catalog item not found');

  return data as AdminTechnicianCatalogItemRow;
}
