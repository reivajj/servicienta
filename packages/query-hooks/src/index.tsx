import {
  createContext,
  useContext,
  type PropsWithChildren,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ApiClient } from '@servicienta/api-client'

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

export const techniciansKeys = {
  all: ['technicians'] as const,
  list: () => [...techniciansKeys.all, 'list'] as const,
}

export function useTechnicians() {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: techniciansKeys.list(),
    queryFn: async () => {
      const response = await apiClient.technicians.list()
      return response.data
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
