import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ListClientProfilesInput,
  UpdateClientProfileInput,
} from '@servicienta/api-client';
import { useApiClient } from '../core/api-client-context.js';
import { clientProfileKeys } from './keys.js';

export function useClientProfiles(input: ListClientProfilesInput) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: clientProfileKeys.list(input),
    queryFn: async () => {
      const response = await apiClient.clientProfiles.list(input);
      return response.data;
    },
  });
}

export function useClientProfile(clientProfileId: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: clientProfileKeys.detail(clientProfileId),
    queryFn: async () => {
      const response = await apiClient.clientProfiles.getById(clientProfileId);
      return response.data;
    },
    enabled: Boolean(clientProfileId),
  });
}

export function useUpdateClientProfile() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientProfileId,
      input,
    }: {
      clientProfileId: string;
      input: UpdateClientProfileInput;
    }) => apiClient.clientProfiles.updateById(clientProfileId, input),
    onSuccess: (response) => {
      queryClient.setQueryData(
        clientProfileKeys.detail(response.data.id),
        response.data,
      );
      void queryClient.invalidateQueries({
        queryKey: clientProfileKeys.lists(),
      });
    },
  });
}
