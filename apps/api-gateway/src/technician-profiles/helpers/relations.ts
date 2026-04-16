import type { ListAdminTechniciansByCatalogItemInput } from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function listAssociatedTechnicianIds(
  supabase: SupabaseClient,
  input: ListAdminTechniciansByCatalogItemInput,
  catalogItemId: string,
): Promise<string[]> {
  if (input.kind === 'zones') {
    const { data, error } = await supabase
      .from('technician_coverage_zones')
      .select('technician_id')
      .eq('zone_id', catalogItemId);

    if (error) throw new Error(error.message);

    return Array.from(new Set((data ?? []).map((row) => row.technician_id)));
  }

  if (input.kind === 'brands') {
    const { data, error } = await supabase
      .from('technician_brand_specialties')
      .select('technician_id')
      .eq('brand_id', catalogItemId);

    if (error) throw new Error(error.message);

    return Array.from(new Set((data ?? []).map((row) => row.technician_id)));
  }

  const { data, error } = await supabase
    .from('technician_appliance_specialties')
    .select('technician_id')
    .eq('appliance_type_id', catalogItemId);

  if (error) throw new Error(error.message);

  return Array.from(new Set((data ?? []).map((row) => row.technician_id)));
}
