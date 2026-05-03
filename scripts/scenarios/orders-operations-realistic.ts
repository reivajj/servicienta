import { resolveUserRoleCounts } from '../data/users.js';
import { buildSeedEmail } from '../lib/seed-tag.js';
import type { SeedContext, SeederResult } from '../lib/types.js';
import { resetOperationalSeedData } from '../seeds/operational/reset-operational-data.js';
import { seedOperationalData } from '../seeds/operational/seed-operational-data.js';
import { seedTechnicianProfiles } from '../seeds/technician-profiles/seed-technician-profiles.js';
import { seedUsers } from '../seeds/users/seed-users.js';

export const ORDERS_OPERATIONS_REALISTIC_SCENARIO = {
  name: 'orders-operations-realistic',
  description:
    'Resets the testing dataset and seeds admins, clients, technician profiles, orders, operations and reviews with valid relations.',
  async seed(context: SeedContext): Promise<SeederResult[]> {
    const resetResult = await resetOperationalSeedData(context);
    const usersResult = await seedUsers({
      context,
      count: 20,
      resolvedRoleCounts: resolveUserRoleCounts(20, {
        admins: 2,
        technicians: 8,
        clients: 10,
      }),
      scenario: 'orders-operations-realistic',
    });
    const technicianProfilesResult = await seedTechnicianProfiles({
      context,
      technicianLimit: 8,
      technicianEmails: Array.from({ length: 8 }, (_, index) =>
        buildSeedEmail(context.env.seedTag, 'technician', index + 3),
      ),
    });
    const operationalResults = await seedOperationalData(context, {
      technicianEmails: Array.from({ length: 8 }, (_, index) =>
        buildSeedEmail(context.env.seedTag, 'technician', index + 3),
      ),
      clientEmails: Array.from({ length: 10 }, (_, index) =>
        buildSeedEmail(context.env.seedTag, 'client', index + 11),
      ),
    });

    return [
      resetResult,
      usersResult,
      technicianProfilesResult,
      ...operationalResults,
    ];
  },
};
