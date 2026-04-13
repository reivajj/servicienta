import { resolveUserRoleCounts } from '../data/users.js'
import type { SeedContext, SeederResult } from '../lib/types.js'
import { seedUsers } from '../seeds/users/seed-users.js'

export const ADMIN_BASIC_SCENARIO = {
  name: 'admin-basic',
  description: 'Creates 2 admins, 5 technicians and 5 clients for manual admin testing.',
  async seed(context: SeedContext): Promise<SeederResult[]> {
    const result = await seedUsers({
      context,
      count: 12,
      resolvedRoleCounts: resolveUserRoleCounts(12, {
        admins: 2,
        technicians: 5,
        clients: 5,
      }),
      scenario: 'admin-basic',
    })

    return [result]
  },
}
