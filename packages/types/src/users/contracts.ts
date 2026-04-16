import type { User, UserRole, UserStatus } from './domain.js';

export interface GetCurrentUserResponse {
  data: User;
}

export interface UpdateCurrentUserInput {
  name: string;
  surname: string;
  role: UserRole;
}

export interface UpdateCurrentUserResponse {
  data: User;
}

export type UsersPageSize = 25 | 50 | 100;

export interface ListUsersInput {
  page: number;
  pageSize: UsersPageSize;
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}

export interface PaginatedUsersSummary {
  totalUsers: number;
  activeUsers: number;
  deletedUsers: number;
}

export interface PaginatedUsersPagination {
  page: number;
  pageSize: UsersPageSize;
  total: number;
  totalPages: number;
}

export interface PaginatedUsers {
  items: User[];
  pagination: PaginatedUsersPagination;
  summary: PaginatedUsersSummary;
}

export interface ListUsersResponse {
  data: PaginatedUsers;
}

export interface GetUserResponse {
  data: User;
}

export interface UpdateUserInput {
  name: string;
  surname: string;
  role: UserRole;
}

export interface UpdateUserResponse {
  data: User;
}

export interface DeleteUserResponse {
  data: User;
}

export interface RestoreUserResponse {
  data: User;
}
