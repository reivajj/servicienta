import type {
  ListUsersInput,
  PaginatedUsers,
  UpdateCurrentUserInput,
  UpdateUserInput,
  User,
} from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../core/errors.js';
import {
  buildListUsersQuery,
  buildUsersCountQuery,
  findUserRowById,
  USER_ROW_SELECT,
} from './helpers/queries.js';
import type { AuthenticatedUser, AuthorizedUser } from './types.js';
import { mapUserRow } from './mapper.js';
import {
  isUserRole,
  isUserStatus,
  validateUpdateCurrentUserInput,
  validateUpdateUserInput,
} from './validators.js';

export async function authenticateUser(
  supabase: SupabaseClient,
  accessToken: string | null,
): Promise<AuthenticatedUser> {
  if (!accessToken) throw new UnauthorizedError('Missing bearer token');

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user?.email)
    throw new UnauthorizedError('Invalid access token');

  return {
    id: data.user.id,
    email: data.user.email,
  };
}

export async function getCurrentUser(
  supabase: SupabaseClient,
  authenticatedUser: AuthenticatedUser,
): Promise<User> {
  const user = await getUserById(supabase, authenticatedUser.id);

  if (user.status !== 'ACTIVE') throw new UnauthorizedError('Inactive user');

  return user;
}

export async function updateCurrentUser(
  supabase: SupabaseClient,
  authenticatedUser: AuthenticatedUser,
  input: UpdateCurrentUserInput,
): Promise<User> {
  const payload = validateUpdateCurrentUserInput(input);
  const currentUser = await getCurrentUser(supabase, authenticatedUser);

  const { data, error } = await supabase
    .from('users')
    .update({
      email: authenticatedUser.email,
      name: payload.name,
      surname: payload.surname,
      role: payload.role,
      status: currentUser.status,
    })
    .eq('id', authenticatedUser.id)
    .select(USER_ROW_SELECT)
    .single();

  if (error) throw new Error(error.message);

  return mapUserRow(data);
}

export async function listUsers(
  supabase: SupabaseClient,
  input: ListUsersInput,
): Promise<PaginatedUsers> {
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;

  const usersQuery = buildListUsersQuery(supabase, input, from, to);
  const totalQuery = buildUsersCountQuery(supabase, input);
  const activeCountQuery = buildUsersCountQuery(
    supabase,
    { ...input, status: undefined },
    'ACTIVE',
  );
  const deletedCountQuery = buildUsersCountQuery(
    supabase,
    { ...input, status: undefined },
    'DELETED',
  );

  const [usersResult, totalResult, activeCountResult, deletedCountResult] =
    await Promise.all([
      usersQuery,
      totalQuery,
      activeCountQuery,
      deletedCountQuery,
    ]);

  if (usersResult.error) throw new Error(usersResult.error.message);
  if (totalResult.error) throw new Error(totalResult.error.message);
  if (activeCountResult.error) throw new Error(activeCountResult.error.message);
  if (deletedCountResult.error)
    throw new Error(deletedCountResult.error.message);

  const total = totalResult.count ?? usersResult.count ?? 0;

  return {
    items: (usersResult.data ?? []).map(mapUserRow),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
    summary: {
      totalUsers: total,
      activeUsers: activeCountResult.count ?? 0,
      deletedUsers: deletedCountResult.count ?? 0,
    },
  };
}

export async function getUserById(
  supabase: SupabaseClient,
  userId: string,
): Promise<User> {
  const data = await findUserRowById(supabase, userId);
  if (!data) throw new NotFoundError('User not found');

  return mapUserRow(data);
}

export async function updateUserById(
  supabase: SupabaseClient,
  userId: string,
  input: UpdateUserInput,
): Promise<User> {
  const payload = validateUpdateUserInput(input);
  const existingUser = await getUserById(supabase, userId);

  if (existingUser.status !== 'ACTIVE') {
    throw new ValidationError('Deleted users cannot be updated');
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      name: payload.name,
      surname: payload.surname,
      role: payload.role,
    })
    .eq('id', userId)
    .select(USER_ROW_SELECT)
    .single();

  if (error) throw new Error(error.message);

  return mapUserRow(data);
}

export async function deleteUserById(
  supabase: SupabaseClient,
  userId: string,
  actorUserId?: string,
): Promise<User> {
  if (actorUserId && actorUserId === userId) {
    throw new ValidationError('You cannot delete your own active admin user');
  }

  const existingUser = await getUserById(supabase, userId);

  if (existingUser.status === 'DELETED') return existingUser;

  const { data, error } = await supabase
    .from('users')
    .update({
      status: 'DELETED',
      deleted_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select(USER_ROW_SELECT)
    .single();

  if (error) throw new Error(error.message);

  return mapUserRow(data);
}

export async function restoreUserById(
  supabase: SupabaseClient,
  userId: string,
): Promise<User> {
  const existingUser = await getUserById(supabase, userId);

  if (existingUser.status === 'ACTIVE') return existingUser;

  const { data, error } = await supabase
    .from('users')
    .update({
      status: 'ACTIVE',
      deleted_at: null,
    })
    .eq('id', userId)
    .select(USER_ROW_SELECT)
    .single();

  if (error) throw new Error(error.message);

  return mapUserRow(data);
}

export async function requireAdminUser(
  supabase: SupabaseClient,
  accessToken: string | null,
): Promise<AuthorizedUser> {
  const authenticatedUser = await authenticateUser(supabase, accessToken);
  const currentUser = await getUserById(supabase, authenticatedUser.id);

  if (!isUserRole(currentUser.role) || !isUserStatus(currentUser.status)) {
    throw new UnauthorizedError('Invalid user state');
  }

  if (currentUser.status !== 'ACTIVE')
    throw new UnauthorizedError('Inactive user');
  if (currentUser.role !== 'admin')
    throw new ForbiddenError('Admin role required');

  return {
    ...authenticatedUser,
    role: currentUser.role,
    status: currentUser.status,
  };
}
