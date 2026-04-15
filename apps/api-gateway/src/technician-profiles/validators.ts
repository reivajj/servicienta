import type { ListPublicTechnicianProfilesInput } from '@servicienta/types'
import { ValidationError } from '../core/errors.js'

export function validateListPublicTechnicianProfilesInput(input: {
  zoneSlug?: string
  applianceTypeSlug?: string
  available?: string
}): ListPublicTechnicianProfilesInput {
  const zoneSlug = input.zoneSlug?.trim()
  const applianceTypeSlug = input.applianceTypeSlug?.trim()

  if (!zoneSlug) {
    throw new ValidationError('Zone slug is required')
  }

  if (!applianceTypeSlug) {
    throw new ValidationError('Appliance type slug is required')
  }

  return {
    zoneSlug,
    applianceTypeSlug,
    available: parseOptionalBoolean(input.available),
  }
}

export function validatePublicTechnicianSlug(
  value: string | string[] | undefined,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid technician public slug')
  }

  return value.trim()
}

function parseOptionalBoolean(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined
  }

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  throw new ValidationError('Invalid available filter')
}
