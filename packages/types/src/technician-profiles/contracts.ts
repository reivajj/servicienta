import type { PublicTechnicianProfile } from './domain.js'

export interface ListPublicTechnicianProfilesInput {
  zoneSlug: string
  applianceTypeSlug: string
  available?: boolean
}

export interface ListPublicTechnicianProfilesResponse {
  data: PublicTechnicianProfile[]
}

export interface GetPublicTechnicianProfileResponse {
  data: PublicTechnicianProfile
}
