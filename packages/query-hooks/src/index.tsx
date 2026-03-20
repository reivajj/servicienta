import {
  createContext,
  useContext,
  type PropsWithChildren,
} from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { ApiClient, UpdateMeInput } from '@servicienta/api-client'

const ApiClientContext = createContext<ApiClient | null>(null)

export function ApiClientProvider({
  children,
  client,
}: PropsWithChildren<{ client: ApiClient }>) {
  return (
    <ApiClientContext.Provider value={client}>
      {children}
    </ApiClientContext.Provider>
  )
}

export const meKeys = {
  all: ['me'] as const,
  current: () => [...meKeys.all, 'current'] as const,
}

export function useMe() {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: meKeys.current(),
    queryFn: async () => {
      const response = await apiClient.me.get()
      return response.data
    },
  })
}

export function useUpdateMe() {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateMeInput) => apiClient.me.update(input),
    onSuccess: (response) => {
      queryClient.setQueryData(meKeys.current(), response.data)
    },
  })
}

function useApiClient() {
  const apiClient = useContext(ApiClientContext)

  if (!apiClient) {
    throw new Error('ApiClientProvider is required to use query hooks')
  }

  return apiClient
}
