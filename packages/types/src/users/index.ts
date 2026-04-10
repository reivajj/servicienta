export type {
  User,
  UserRole,
  UserStatus,
} from './domain.js'
export type {
  DeleteUserResponse,
  GetUserResponse,
  GetCurrentUserResponse,
  ListUsersResponse,
  RestoreUserResponse,
  UpdateCurrentUserInput,
  UpdateCurrentUserResponse,
  UpdateUserInput,
  UpdateUserResponse,
} from './contracts.js'

export interface ApiErrorResponse {
  error: string
}
