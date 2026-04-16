import { resolveUserRoleCounts } from '../data/users.js';
import { buildSeedEmail } from '../lib/seed-tag.js';
import type { SeedContext, SeederResult } from '../lib/types.js';
import { seedTechnicianProfiles } from '../seeds/technician-profiles/seed-technician-profiles.js';
import { seedUsers } from '../seeds/users/seed-users.js';

export const TECHNICIAN_SEARCH_BASIC_SCENARIO = {
  name: 'technician-search-basic',
  description:
    'Creates technicians and clients if needed, then populates technician search fixtures for public search.',
  async seed(context: SeedContext): Promise<SeederResult[]> {
    const usersResult = await seedUsers({
      context,
      count: 16,
      resolvedRoleCounts: resolveUserRoleCounts(16, {
        admins: 0,
        technicians: 10,
        clients: 6,
      }),
      scenario: 'technician-search-basic',
    });

    const profilesResult = await seedTechnicianProfiles({
      context,
      technicianLimit: 10,
      technicianEmails: Array.from({ length: 10 }, (_, index) =>
        buildSeedEmail(context.env.seedTag, 'technician', index + 1),
      ),
    });

    return [usersResult, profilesResult];
  },
};
