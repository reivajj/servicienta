import { createContext, useContext, type PropsWithChildren } from 'react';
import type { ApiClient } from '@servicienta/api-client';

const ApiClientContext = createContext<ApiClient | null>(null);

export function ApiClientProvider({
  children,
  client,
}: PropsWithChildren<{ client: ApiClient }>) {
  return (
    <ApiClientContext.Provider value={client}>
      {children}
    </ApiClientContext.Provider>
  );
}

export function useApiClient() {
  const apiClient = useContext(ApiClientContext);

  if (!apiClient) {
    throw new Error('ApiClientProvider is required to use query hooks');
  }

  return apiClient;
}
