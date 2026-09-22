#!/usr/bin/env node

import { readSeedEnv } from '../lib/env.js';
import { createLogger } from '../lib/logger.js';
import {
  createSeedSupabaseClient,
  listAllAuthUsers,
} from '../lib/supabase-admin.js';

const accounts = [
  {
    email: 'tomi.admin@test.com',
    password: 'servicienta123',
    name: 'Tomi',
    surname: 'Admin',
    role: 'admin' as const,
  },
  {
    email: 'tomi.tech@test.com',
    password: 'servicienta123',
    name: 'Tomi',
    surname: 'Tech',
    role: 'technician' as const,
  },
];

async function main() {
  const env = readSeedEnv();
  const logger = createLogger('provision-demo-accounts');
  const supabase = createSeedSupabaseClient(env);
  const existingUsers = new Map(
    (await listAllAuthUsers(supabase)).map((user) => [user.email, user]),
  );

  for (const account of accounts) {
    const existingUser = existingUsers.get(account.email);
    const userMetadata = {
      name: account.name,
      surname: account.surname,
      provisioned_for: 'partner-demo',
    };

    const { data, error } = existingUser
      ? await supabase.auth.admin.updateUserById(existingUser.id, {
          password: account.password,
          email_confirm: true,
          user_metadata: userMetadata,
        })
      : await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: userMetadata,
        });

    if (error || !data.user) {
      throw new Error(
        `Could not provision ${account.email}: ${error?.message ?? 'Unknown error'}`,
      );
    }

    const { error: publicUserError } = await supabase.from('users').upsert(
      {
        id: data.user.id,
        email: account.email,
        name: account.name,
        surname: account.surname,
        role: account.role,
        status: 'ACTIVE',
        deleted_at: null,
      },
      { onConflict: 'id' },
    );

    if (publicUserError) {
      throw new Error(
        `Could not assign ${account.role} role to ${account.email}: ${publicUserError.message}`,
      );
    }

    logger.info(existingUser ? 'Account updated' : 'Account created', {
      email: account.email,
      role: account.role,
      emailConfirmed: true,
    });
  }
}

main().catch((error) => {
  const logger = createLogger('provision-demo-accounts');
  logger.error(error instanceof Error ? error.message : 'Unexpected error');
  process.exitCode = 1;
});
