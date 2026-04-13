export type {
  User,
  UserRole,
  UserStatus,
} from './domain.js'
export type {
  DeleteUserResponse,
  GetUserResponse,
  GetCurrentUserResponse,
  ListUsersInput,
  ListUsersResponse,
  PaginatedUsers,
  PaginatedUsersPagination,
  PaginatedUsersSummary,
  RestoreUserResponse,
  UpdateCurrentUserInput,
  UpdateCurrentUserResponse,
  UpdateUserInput,
  UpdateUserResponse,
  UsersPageSize,
} from './contracts.js'

export interface ApiErrorResponse {
  error: string
}
