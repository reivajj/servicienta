import type { User } from '@supabase/supabase-js'
import { buildSeedUserSpecs } from '../../data/users.js'
import { buildSeedUserMetadata } from '../../lib/seed-tag.js'
import { listAllAuthUsers } from '../../lib/supabase-admin.js'
import type { SeedContext, SeededUserSpec } from '../../lib/types.js'
import type { SeedUsersExecutionInput, UsersSeedResult } from './types.js'

interface PublicUserRow {
  id: string
}

async function ensureAuthUser(
  context: SeedContext,
  existingUser: User | undefined,
  spec: SeededUserSpec,
) {
  const userMetadata = buildSeedUserMetadata(spec, context.env.seedTag)

  if (existingUser) {
    const { data, error } = await context.supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password: context.env.defaultPassword,
        email_confirm: true,
        user_metadata: userMetadata,
        app_metadata: userMetadata,
      },
    )

    if (error || !data.user) {
      throw new Error(`Could not update auth user ${spec.email}: ${error?.message ?? 'Unknown error'}`)
    }

    return { user: data.user, created: false }
  }

  const { data, error } = await context.supabase.auth.admin.createUser({
    email: spec.email,
    password: context.env.defaultPassword,
    email_confirm: true,
    user_metadata: userMetadata,
    app_metadata: userMetadata,
  })

  if (error || !data.user) {
    throw new Error(`Could not create auth user ${spec.email}: ${error?.message ?? 'Unknown error'}`)
  }

  return { user: data.user, created: true }
}

async function ensurePublicUserRow(
  context: SeedContext,
  authUserId: string,
  spec: SeededUserSpec,
) {
  const { error } = await context.supabase
    .from('users')
    .upsert(
      {
        id: authUserId,
        email: spec.email,
        name: spec.name,
        surname: spec.surname,
        role: spec.role,
        status: spec.status,
        deleted_at: spec.status === 'ACTIVE' ? null : new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('id')
    .single<PublicUserRow>()

  if (error) {
    throw new Error(`Could not reconcile public.users for ${spec.email}: ${error.message}`)
  }
}

export async function seedUsers({
  context,
  count,
  resolvedRoleCounts,
  scenario,
}: SeedUsersExecutionInput): Promise<UsersSeedResult> {
  const authUsers = await listAllAuthUsers(context.supabase)
  const authUsersByEmail = new Map(authUsers.map((user) => [user.email, user]))
  const specs = buildSeedUserSpecs({
    count,
    roleCounts: resolvedRoleCounts,
    seedTag: context.env.seedTag,
    scenario,
  })

  let created = 0
  let updated = 0

  for (const spec of specs) {
    const existingUser = authUsersByEmail.get(spec.email ?? '')
    const ensured = await ensureAuthUser(context, existingUser, spec)

    await ensurePublicUserRow(context, ensured.user.id, spec)

    if (ensured.created) {
      created += 1
      authUsersByEmail.set(spec.email, ensured.user)
    } else {
      updated += 1
    }
  }

  context.logger.info('Users seed completed', {
    count,
    created,
    updated,
    seedTag: context.env.seedTag,
    scenario,
  })

  return {
    entity: 'users',
    created,
    updated,
    deleted: 0,
    skipped: 0,
    byRole: resolvedRoleCounts,
  }
}
