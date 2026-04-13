import type {
  DeleteUserResponse,
  GetUserResponse,
  GetCurrentUserResponse,
  ListUsersInput,
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
    list: (input: ListUsersInput) => Promise<ListUsersResponse>
    getById: (userId: string) => Promise<GetUserResponse>
    updateById: (userId: string, input: UpdateUserInput) => Promise<UpdateUserResponse>
    remove: (userId: string) => Promise<DeleteUserResponse>
    restore: (userId: string) => Promise<RestoreUserResponse>
  }
}

function buildUsersListQuery(input: ListUsersInput) {
  const searchParams = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  })

  if (input.status) {
    searchParams.set('status', input.status)
  }

  if (input.role) {
    searchParams.set('role', input.role)
  }

  if (input.search) {
    searchParams.set('search', input.search)
  }

  return searchParams.toString()
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
      list: (input) =>
        apiFetch<ListUsersResponse>(`/api/users?${buildUsersListQuery(input)}`),
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
