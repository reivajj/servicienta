import { CompleteVisitProvider } from '@/features/operations/CompleteVisitProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClientProvider } from '@servicienta/query-hooks';
import { createMobileApiClient } from '@/lib/api-client';
import { AuthProvider } from '@/features/auth/AuthProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const apiClient = createMobileApiClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApiClientProvider client={apiClient}>
          <CompleteVisitProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(technician)" />
              <Stack.Screen name="chats/[orderId]" />
              <Stack.Screen name="orders/[orderId]" />
              <Stack.Screen name="orders/[orderId]/client" />
              <Stack.Screen name="operations/[operationId]" />
              <Stack.Screen name="technicians/[publicSlug]" />
            </Stack>
          </CompleteVisitProvider>
        </ApiClientProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
