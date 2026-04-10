import type {
  DeleteUserResponse,
  GetUserResponse,
  GetCurrentUserResponse,
  ListUsersResponse,
  RestoreUserResponse,
  UpdateCurrentUserInput,
  UpdateCurrentUserResponse,
  UpdateUserInput,
  UpdateUserResponse,
} from '@servicienta/types'

interface UsersApiClientDependencies {
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>
}

export interface UsersApiClient {
  users: {
    current: {
      get: () => Promise<GetCurrentUserResponse>
      update: (input: UpdateCurrentUserInput) => Promise<UpdateCurrentUserResponse>
    }
    list: () => Promise<ListUsersResponse>
    getById: (userId: string) => Promise<GetUserResponse>
    updateById: (userId: string, input: UpdateUserInput) => Promise<UpdateUserResponse>
    remove: (userId: string) => Promise<DeleteUserResponse>
    restore: (userId: string) => Promise<RestoreUserResponse>
  }
}

export function createUsersApiClient({
  apiFetch,
}: UsersApiClientDependencies): UsersApiClient {
  return {
    users: {
      current: {
        get: () => apiFetch<GetCurrentUserResponse>('/api/users/current'),
        update: (input) =>
          apiFetch<UpdateCurrentUserResponse>('/api/users/current', {
            method: 'PATCH',
            body: JSON.stringify(input),
          }),
      },
      list: () => apiFetch<ListUsersResponse>('/api/users'),
      getById: (userId) => apiFetch<GetUserResponse>(`/api/users/${userId}`),
      updateById: (userId, input) =>
        apiFetch<UpdateUserResponse>(`/api/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        }),
      remove: (userId) =>
        apiFetch<DeleteUserResponse>(`/api/users/${userId}`, {
          method: 'DELETE',
        }),
      restore: (userId) =>
        apiFetch<RestoreUserResponse>(`/api/users/${userId}/restore`, {
          method: 'PATCH',
        }),
    },
  }
}
