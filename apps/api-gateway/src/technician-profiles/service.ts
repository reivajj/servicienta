import type {
  ListPublicTechnicianProfilesInput,
  PublicTechnicianProfile,
} from '@servicienta/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NotFoundError } from '../core/errors.js'
import { mapPublicTechnicianProfileRow } from './mapper.js'

export async function listPublicTechnicianProfiles(
  supabase: SupabaseClient,
  input: ListPublicTechnicianProfilesInput,
): Promise<PublicTechnicianProfile[]> {
  const { data, error } = await supabase.rpc(
    'search_public_technician_profiles',
    {
      _zone_slug: input.zoneSlug,
      _appliance_type_slug: input.applianceTypeSlug,
      _available: input.available ?? null,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapPublicTechnicianProfileRow)
}

export async function getPublicTechnicianProfileBySlug(
  supabase: SupabaseClient,
  publicSlug: string,
): Promise<PublicTechnicianProfile> {
  const { data, error } = await supabase
    .from('public_technician_profiles')
    .select('public_slug, bio, rating, rating_count, available, verified_at, created_at')
    .eq('public_slug', publicSlug)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new NotFoundError('Public technician profile not found')
  }

  return mapPublicTechnicianProfileRow(data)
}
