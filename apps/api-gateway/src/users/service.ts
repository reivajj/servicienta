import type { UpdateCurrentUserInput, UpdateUserInput, User } from "@servicienta/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "../core/errors.js";
import type { AuthenticatedUser, AuthorizedUser } from "./types.js";
import { mapUserRow } from "./mapper.js";
import { isUserRole, isUserStatus, validateUpdateCurrentUserInput, validateUpdateUserInput } from "./validators.js";

export async function authenticateUser(
  supabase: SupabaseClient,
  accessToken: string | null,
): Promise<AuthenticatedUser> {
  if (!accessToken) throw new UnauthorizedError("Missing bearer token");

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user?.email) throw new UnauthorizedError("Invalid access token");

  return {
    id: data.user.id,
    email: data.user.email,
  };
}

export async function getCurrentUser(supabase: SupabaseClient, authenticatedUser: AuthenticatedUser): Promise<User> {
  const user = await getUserById(supabase, authenticatedUser.id);

  if (user.status !== "ACTIVE") throw new UnauthorizedError("Inactive user");

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
    .from("users")
    .update({
      email: authenticatedUser.email,
      name: payload.name,
      surname: payload.surname,
      role: payload.role,
      status: currentUser.status,
    })
    .eq("id", authenticatedUser.id)
    .select("id, email, name, surname, role, status, deleted_at, created_at")
    .single();

  if (error) throw new Error(error.message);

  return mapUserRow(data);
}

export async function listUsers(supabase: SupabaseClient): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, surname, role, status, deleted_at, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data.map(mapUserRow);
}

export async function getUserById(supabase: SupabaseClient, userId: string): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, surname, role, status, deleted_at, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError("User not found");

  return mapUserRow(data);
}

export async function updateUserById(supabase: SupabaseClient, userId: string, input: UpdateUserInput): Promise<User> {
  const payload = validateUpdateUserInput(input);
  const existingUser = await getUserById(supabase, userId);

  if (existingUser.status !== "ACTIVE") {
    throw new ValidationError("Deleted users cannot be updated");
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      name: payload.name,
      surname: payload.surname,
      role: payload.role,
    })
    .eq("id", userId)
    .select("id, email, name, surname, role, status, deleted_at, created_at")
    .single();

  if (error) throw new Error(error.message);

  return mapUserRow(data);
}

export async function deleteUserById(supabase: SupabaseClient, userId: string): Promise<User> {
  const existingUser = await getUserById(supabase, userId);

  if (existingUser.status === "DELETED") return existingUser;

  const { data, error } = await supabase
    .from("users")
    .update({
      status: "DELETED",
      deleted_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, email, name, surname, role, status, deleted_at, created_at")
    .single();

  if (error) throw new Error(error.message);

  return mapUserRow(data);
}

export async function restoreUserById(supabase: SupabaseClient, userId: string): Promise<User> {
  const existingUser = await getUserById(supabase, userId);

  if (existingUser.status === "ACTIVE") return existingUser;

  const { data, error } = await supabase
    .from("users")
    .update({
      status: "ACTIVE",
      deleted_at: null,
    })
    .eq("id", userId)
    .select("id, email, name, surname, role, status, deleted_at, created_at")
    .single();

  if (error) throw new Error(error.message);

  return mapUserRow(data);
}

export async function requireAdminUser(supabase: SupabaseClient, accessToken: string | null): Promise<AuthorizedUser> {
  const authenticatedUser = await authenticateUser(supabase, accessToken);
  const currentUser = await getUserById(supabase, authenticatedUser.id);

  if (!isUserRole(currentUser.role) || !isUserStatus(currentUser.status)) {
    throw new UnauthorizedError("Invalid user state");
  }

  if (currentUser.status !== "ACTIVE") throw new UnauthorizedError("Inactive user");
  if (currentUser.role !== "admin") throw new ForbiddenError("Admin role required");

  return {
    ...authenticatedUser,
    role: currentUser.role,
    status: currentUser.status,
  };
}
