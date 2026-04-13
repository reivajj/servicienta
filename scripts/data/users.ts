import type { UserRole } from '@servicienta/types'
import type { SeededUserSpec } from '../lib/types.js'
import { buildSeedEmail } from '../lib/seed-tag.js'

const FIRST_NAMES = [
  'Ada',
  'Bruno',
  'Carla',
  'Diego',
  'Elena',
  'Fabian',
  'Gina',
  'Hector',
  'Ines',
  'Joaquin',
  'Kiara',
  'Lucio',
  'Mora',
  'Nadia',
  'Octavio',
  'Paula',
  'Quino',
  'Rocio',
  'Santiago',
  'Tamara',
]

const SURNAMES = [
  'Acosta',
  'Benitez',
  'Cardozo',
  'Diaz',
  'Estevez',
  'Fernandez',
  'Gimenez',
  'Herrera',
  'Ibarra',
  'Juarez',
  'Keller',
  'Lopez',
  'Martinez',
  'Navarro',
  'Ortega',
  'Pereyra',
  'Quiroga',
  'Ramos',
  'Suarez',
  'Torres',
]

export interface RequestedUserRoleCounts {
  admins?: number
  technicians?: number
  clients?: number
}

export interface ResolvedUserRoleCounts {
  admins: number
  technicians: number
  clients: number
}

function assertCount(total: number) {
  if (!Number.isInteger(total) || total <= 0) {
    throw new Error('--count must be a positive integer')
  }
}

export function resolveUserRoleCounts(
  total: number,
  requested: RequestedUserRoleCounts,
): ResolvedUserRoleCounts {
  assertCount(total)

  const hasRequestedCounts = Object.values(requested).some((value) => value !== undefined)

  if (!hasRequestedCounts) {
    const admins = total >= 10 ? Math.floor(total * 0.1) : Math.min(1, total)
    const remaining = total - admins
    const technicians = Math.floor(remaining / 2)
    const clients = remaining - technicians

    return { admins, technicians, clients }
  }

  const admins = requested.admins ?? 0
  const technicians = requested.technicians ?? 0
  const explicitClients = requested.clients
  const remainder = total - admins - technicians

  if (remainder < 0) {
    throw new Error('Role counts cannot exceed total count')
  }

  const clients = explicitClients ?? remainder

  if (admins + technicians + clients !== total) {
    throw new Error('Role counts must add up exactly to --count')
  }

  return { admins, technicians, clients }
}

function buildDisplayName(role: UserRole, index: number) {
  const offset = index - 1
  const name = FIRST_NAMES[offset % FIRST_NAMES.length]
  const surname = `${SURNAMES[offset % SURNAMES.length]} ${role}`

  return {
    name,
    surname,
  }
}

export function buildSeedUserSpecs(options: {
  count: number
  roleCounts: ResolvedUserRoleCounts
  seedTag: string
  scenario: string | null
}): SeededUserSpec[] {
  const specs: SeededUserSpec[] = []
  const roleSequence: UserRole[] = [
    ...Array.from({ length: options.roleCounts.admins }, () => 'admin' as const),
    ...Array.from({ length: options.roleCounts.technicians }, () => 'technician' as const),
    ...Array.from({ length: options.roleCounts.clients }, () => 'client' as const),
  ]

  if (roleSequence.length !== options.count) {
    throw new Error('Role distribution does not match requested count')
  }

  roleSequence.forEach((role, position) => {
    const index = position + 1
    const { name, surname } = buildDisplayName(role, index)

    specs.push({
      email: buildSeedEmail(options.seedTag, role, index),
      name,
      surname,
      role,
      status: 'ACTIVE',
      index,
      scenario: options.scenario,
    })
  })

  return specs
}
