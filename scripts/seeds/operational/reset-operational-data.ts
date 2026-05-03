import { listAllAuthUsers } from '../../lib/supabase-admin.js';
import { isSeededUserForTag } from '../../lib/seed-tag.js';
import type { SeedContext, SeederResult } from '../../lib/types.js';

interface PublicUserIdRow {
  id: string;
}

async function loadSeededUserIds(context: SeedContext) {
  const authUsers = await listAllAuthUsers(context.supabase);
  const seededUsers = authUsers.filter((user) =>
    isSeededUserForTag(user, context.env.seedTag),
  );

  return {
    authUsers: seededUsers,
    userIds: seededUsers.map((user) => user.id),
  };
}

async function deleteAllOperationalRows(context: SeedContext) {
  const [reviewsDelete, operationsDelete, ordersDelete] = await Promise.all([
    context.supabase.from('technician_reviews').delete().not('id', 'is', null),
    context.supabase.from('operations').delete().not('id', 'is', null),
    context.supabase.from('orders').delete().not('id', 'is', null),
  ]);

  const errors = [
    reviewsDelete.error,
    operationsDelete.error,
    ordersDelete.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(
      errors[0]?.message ?? 'Could not reset operational dataset rows',
    );
  }
}

async function deleteSeededTechnicianRelations(
  context: SeedContext,
  technicianIds: string[],
) {
  if (technicianIds.length === 0) return;

  const storagePrefix = `seed/${context.env.seedTag}/`;
  const [applianceDelete, brandDelete, zoneDelete, documentsDelete] =
    await Promise.all([
      context.supabase
        .from('technician_appliance_specialties')
        .delete()
        .in('technician_id', technicianIds),
      context.supabase
        .from('technician_brand_specialties')
        .delete()
        .in('technician_id', technicianIds),
      context.supabase
        .from('technician_coverage_zones')
        .delete()
        .in('technician_id', technicianIds),
      context.supabase
        .from('technician_documents')
        .delete()
        .in('technician_id', technicianIds)
        .like('storage_key', `${storagePrefix}%`),
    ]);

  const errors = [
    applianceDelete.error,
    brandDelete.error,
    zoneDelete.error,
    documentsDelete.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(
      errors[0]?.message ?? 'Could not reset seeded technician relations',
    );
  }
}

async function deleteSeededProfilesAndUsers(
  context: SeedContext,
  userIds: string[],
  technicianIds: string[],
) {
  if (userIds.length === 0) return;

  const [clientProfilesDelete, technicianProfilesDelete, usersDelete] =
    await Promise.all([
      context.supabase.from('client_profiles').delete().in('id', userIds),
      technicianIds.length > 0
        ? context.supabase
            .from('technician_profiles')
            .delete()
            .in('id', technicianIds)
        : Promise.resolve({ error: null }),
      context.supabase.from('users').delete().in('id', userIds),
    ]);

  const errors = [
    clientProfilesDelete.error,
    technicianProfilesDelete.error,
    usersDelete.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? 'Could not reset seeded profiles');
  }
}

async function deleteSeededAuthUsers(context: SeedContext, userIds: string[]) {
  for (const userId of userIds) {
    const { error } = await context.supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Could not delete auth user ${userId}: ${error.message}`);
    }
  }
}

export async function resetOperationalSeedData(
  context: SeedContext,
): Promise<SeederResult> {
  const { authUsers, userIds } = await loadSeededUserIds(context);
  const technicianIds = await loadSeededTechnicianIds(context, userIds);

  await deleteAllOperationalRows(context);
  await deleteSeededTechnicianRelations(context, technicianIds);
  await deleteSeededProfilesAndUsers(context, userIds, technicianIds);
  await deleteSeededAuthUsers(context, authUsers.map((user) => user.id));

  context.logger.info('Operational seed reset completed', {
    seedTag: context.env.seedTag,
    usersDeleted: authUsers.length,
    technicianProfilesDeleted: technicianIds.length,
  });

  return {
    entity: 'operational-reset',
    created: 0,
    updated: 0,
    deleted: authUsers.length,
    skipped: 0,
  };
}

async function loadSeededTechnicianIds(
  context: SeedContext,
  userIds: string[],
): Promise<string[]> {
  if (userIds.length === 0) return [];

  const { data, error } = await context.supabase
    .from('users')
    .select('id')
    .in('id', userIds)
    .eq('role', 'technician');

  if (error) {
    throw new Error(`Could not load seeded technicians: ${error.message}`);
  }

  return ((data ?? []) as PublicUserIdRow[]).map((row) => row.id);
}
