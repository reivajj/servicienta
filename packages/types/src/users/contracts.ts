import type {
  User,
  UserRole,
} from './domain.js'

export interface GetCurrentUserResponse {
  data: User
}

export interface UpdateCurrentUserInput {
  name: string
  surname: string
  role: UserRole
}

export interface UpdateCurrentUserResponse {
  data: User
}

export interface ListUsersResponse {
  data: User[]
}

export interface GetUserResponse {
  data: User
}

export interface UpdateUserInput {
  name: string
  surname: string
  role: UserRole
}

export interface UpdateUserResponse {
  data: User
}

export interface DeleteUserResponse {
  data: User
}

export interface RestoreUserResponse {
  data: User
}
