import { useQuery } from '@tanstack/react-query';
import type { ListPublicTechnicianProfilesInput } from '@servicienta/api-client';
import { useApiClient } from '../core/api-client-context.js';
import { technicianProfileKeys } from './keys.js';

export function usePublicTechnicianProfiles(
  input: ListPublicTechnicianProfilesInput,
) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: technicianProfileKeys.list(input),
    queryFn: async () => {
      const response = await apiClient.technicianProfiles.listPublic(input);
      return response.data;
    },
  });
}

export function usePublicTechnicianProfile(publicSlug: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: technicianProfileKeys.detail(publicSlug),
    queryFn: async () => {
      const response =
        await apiClient.technicianProfiles.getPublicBySlug(publicSlug);
      return response.data;
    },
    enabled: Boolean(publicSlug),
  });
}
