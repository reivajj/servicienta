import type { User } from '@supabase/supabase-js'
import type { SeededUserSpec } from './types.js'

export const SEED_SOURCE = 'servicienta-scripts'
export const SEED_VERSION = 'v1'

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function normalizeSeedTag(value: string) {
  const normalized = slugify(value)

  if (!normalized) {
    throw new Error('Seed tag cannot be empty')
  }

  return normalized
}

export function buildSeedEmail(
  tag: string,
  role: SeededUserSpec['role'],
  index: number,
) {
  return `seed-${tag}-${role}-${String(index).padStart(3, '0')}@servicienta.local`
}

export function buildSeedUserMetadata(spec: SeededUserSpec, seedTag: string) {
  return {
    name: spec.name,
    surname: spec.surname,
    role: spec.role,
    seed_tag: seedTag,
    seed_source: SEED_SOURCE,
    seed_scenario: spec.scenario,
    seed_version: SEED_VERSION,
  }
}

export function readSeedTagFromUser(user: User) {
  const appMetadataTag =
    typeof user.app_metadata?.seed_tag === 'string' ? user.app_metadata.seed_tag : null
  const userMetadataTag =
    typeof user.user_metadata?.seed_tag === 'string' ? user.user_metadata.seed_tag : null

  return appMetadataTag ?? userMetadataTag
}

export function isSeededUserForTag(user: User, seedTag: string) {
  return readSeedTagFromUser(user) === seedTag
}
