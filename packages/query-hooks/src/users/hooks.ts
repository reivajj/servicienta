import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  ListUsersInput,
  UpdateCurrentUserInput,
  UpdateUserInput,
} from '@servicienta/api-client'
import { useApiClient } from '../core/api-client-context.js'
import { userKeys } from './keys.js'

export function useCurrentUser() {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      const response = await apiClient.users.current.get()
      return response.data
    },
  })
}

export function useUsers(input: ListUsersInput) {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: userKeys.list(input),
    queryFn: async () => {
      const response = await apiClient.users.list(input)
      return response.data
    },
  })
}

export function useUser(userId: string) {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: async () => {
      const response = await apiClient.users.getById(userId)
      return response.data
    },
    enabled: Boolean(userId),
  })
}

export function useUpdateCurrentUser() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCurrentUserInput) =>
      apiClient.users.current.update(input),
    onSuccess: (response) => {
      queryClient.setQueryData(userKeys.current(), response.data)
    },
  })
}

export function useUpdateUser() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string
      input: UpdateUserInput
    }) => apiClient.users.updateById(userId, input),
    onSuccess: (response) => {
      queryClient.setQueryData(userKeys.detail(response.data.id), response.data)
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useDeleteUser() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => apiClient.users.remove(userId),
    onSuccess: (response) => {
      queryClient.setQueryData(userKeys.detail(response.data.id), response.data)
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useRestoreUser() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => apiClient.users.restore(userId),
    onSuccess: (response) => {
      queryClient.setQueryData(userKeys.detail(response.data.id), response.data)
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
