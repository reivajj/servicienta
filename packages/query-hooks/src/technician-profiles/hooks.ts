import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ListAdminTechnicianProfilesInput,
  ListAdminTechniciansByCatalogItemInput,
  ListPublicTechnicianProfilesInput,
  UpdateTechnicianProfileInput,
} from '@servicienta/api-client';
import { useApiClient } from '../core/api-client-context.js';
import { technicianProfileKeys } from './keys.js';

export function usePublicTechnicianProfiles(
  input: ListPublicTechnicianProfilesInput | null,
) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: technicianProfileKeys.list(
      input ?? { zoneSlug: '', applianceTypeSlug: '' },
    ),
    queryFn: async () => {
      if (!input) {
        throw new Error('Technician search input is required');
      }

      const response = await apiClient.technicianProfiles.listPublic(input);
      return response.data;
    },
    enabled: Boolean(input?.zoneSlug && input?.applianceTypeSlug),
  });
}

export function usePublicTechnicianProfileCatalogs() {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: technicianProfileKeys.publicCatalogs(),
    queryFn: async () => {
      const response = await apiClient.technicianProfiles.listPublicCatalogs();
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

export function useAdminTechnicianCatalogs() {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: technicianProfileKeys.adminCatalogs(),
    queryFn: async () => {
      const response = await apiClient.technicianProfiles.listAdminCatalogs();
      return response.data;
    },
  });
}

export function useAdminTechnicianProfiles(
  input: ListAdminTechnicianProfilesInput,
) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: technicianProfileKeys.adminList(input),
    queryFn: async () => {
      const response = await apiClient.technicianProfiles.listAdmin(input);
      return response.data;
    },
  });
}

export function useAdminTechnicianProfile(
  technicianId: string,
  options?: { enabled?: boolean },
) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: technicianProfileKeys.adminDetail(technicianId),
    queryFn: async () => {
      const response =
        await apiClient.technicianProfiles.getAdminById(technicianId);
      return response.data;
    },
    enabled: Boolean(technicianId) && (options?.enabled ?? true),
  });
}

export function useCurrentTechnicianProfile(options?: { enabled?: boolean }) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: technicianProfileKeys.current(),
    queryFn: async () => {
      const response = await apiClient.technicianProfiles.getCurrent();
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateAdminTechnicianProfile() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      technicianId,
      input,
    }: {
      technicianId: string;
      input: UpdateTechnicianProfileInput;
    }) => apiClient.technicianProfiles.updateAdminById(technicianId, input),
    onSuccess: (response) => {
      queryClient.setQueryData(
        technicianProfileKeys.adminDetail(response.data.id),
        response.data,
      );
      void queryClient.invalidateQueries({
        queryKey: technicianProfileKeys.adminLists(),
      });
    },
  });
}

export function useUpdateCurrentTechnicianProfile() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTechnicianProfileInput) =>
      apiClient.technicianProfiles.updateCurrent(input),
    onSuccess: (response) => {
      queryClient.setQueryData(technicianProfileKeys.current(), response.data);
      queryClient.setQueryData(
        technicianProfileKeys.adminDetail(response.data.id),
        response.data,
      );
      void queryClient.invalidateQueries({
        queryKey: technicianProfileKeys.adminLists(),
      });
    },
  });
}

export function useAdminTechniciansByCatalogItem(
  input: ListAdminTechniciansByCatalogItemInput | null,
) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: technicianProfileKeys.adminCatalogItemTechniciansDetail(
      input ?? { kind: 'zones', slug: '' },
    ),
    queryFn: async () => {
      if (!input) {
        throw new Error('Catalog item is required');
      }

      const response =
        await apiClient.technicianProfiles.listAdminTechniciansByCatalogItem(
          input,
        );
      return response.data;
    },
    enabled: Boolean(input?.slug),
  });
}
