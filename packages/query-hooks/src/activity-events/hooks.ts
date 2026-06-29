import { useQuery } from '@tanstack/react-query';
import type { ListActivityEventsInput } from '@servicienta/api-client';
import { useApiClient } from '../core/api-client-context.js';
import { activityEventKeys } from './keys.js';

export function useAdminActivityEvents(input: ListActivityEventsInput) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: activityEventKeys.adminList(input),
    queryFn: async () => {
      const response = await apiClient.activityEvents.admin.list(input);
      return response.data;
    },
  });
}
