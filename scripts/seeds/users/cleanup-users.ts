import { isSeededUserForTag } from '../../lib/seed-tag.js';
import { listAllAuthUsers } from '../../lib/supabase-admin.js';
import type { SeedContext, SeederResult } from '../../lib/types.js';

export async function cleanupSeededUsers(
  context: SeedContext,
): Promise<SeederResult> {
  const authUsers = await listAllAuthUsers(context.supabase);
  const usersForTag = authUsers.filter((user) =>
    isSeededUserForTag(user, context.env.seedTag),
  );

  for (const user of usersForTag) {
    const { error } = await context.supabase.auth.admin.deleteUser(user.id);

    if (error) {
      throw new Error(
        `Could not delete auth user ${user.email ?? user.id}: ${error.message}`,
      );
    }
  }

  context.logger.info('Users cleanup completed', {
    seedTag: context.env.seedTag,
    deleted: usersForTag.length,
  });

  return {
    entity: 'users',
    created: 0,
    updated: 0,
    deleted: usersForTag.length,
    skipped: 0,
  };
}
