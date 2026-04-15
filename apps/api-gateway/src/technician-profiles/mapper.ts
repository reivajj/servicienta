import type { PublicTechnicianProfile } from '@servicienta/types'
import type { PublicTechnicianProfileRow } from './types.js'

export function mapPublicTechnicianProfileRow(
  row: PublicTechnicianProfileRow,
): PublicTechnicianProfile {
  return {
    public_slug: row.public_slug,
    bio: row.bio,
    rating: Number(row.rating),
    rating_count: row.rating_count,
    available: row.available,
    verified_at: row.verified_at,
    created_at: row.created_at,
  }
}
