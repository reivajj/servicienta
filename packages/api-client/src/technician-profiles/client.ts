import type {
  GetPublicTechnicianProfileResponse,
  ListPublicTechnicianProfilesInput,
  ListPublicTechnicianProfilesResponse,
} from '@servicienta/types';

interface TechnicianProfilesApiClientDependencies {
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
}

export interface TechnicianProfilesApiClient {
  technicianProfiles: {
    listPublic: (
      input: ListPublicTechnicianProfilesInput,
    ) => Promise<ListPublicTechnicianProfilesResponse>;
    getPublicBySlug: (
      publicSlug: string,
    ) => Promise<GetPublicTechnicianProfileResponse>;
  };
}

function buildPublicTechnicianProfilesListQuery(
  input: ListPublicTechnicianProfilesInput,
) {
  const searchParams = new URLSearchParams({
    zoneSlug: input.zoneSlug,
    applianceTypeSlug: input.applianceTypeSlug,
  });

  if (typeof input.available === 'boolean') {
    searchParams.set('available', String(input.available));
  }

  return searchParams.toString();
}

export function createTechnicianProfilesApiClient({
  apiFetch,
}: TechnicianProfilesApiClientDependencies): TechnicianProfilesApiClient {
  return {
    technicianProfiles: {
      listPublic: (input) =>
        apiFetch<ListPublicTechnicianProfilesResponse>(
          `/api/public/technician-profiles?${buildPublicTechnicianProfilesListQuery(input)}`,
        ),
      getPublicBySlug: (publicSlug) =>
        apiFetch<GetPublicTechnicianProfileResponse>(
          `/api/public/technician-profiles/${publicSlug}`,
        ),
    },
  };
}
