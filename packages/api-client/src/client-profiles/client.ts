import type {
  GetClientProfileResponse,
  ListClientProfilesInput,
  ListClientProfilesResponse,
  UpdateClientProfileInput,
  UpdateClientProfileResponse,
} from '@servicienta/types';

interface ClientProfilesApiClientDependencies {
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
}

export interface ClientProfilesApiClient {
  clientProfiles: {
    list: (input: ListClientProfilesInput) => Promise<ListClientProfilesResponse>;
    getById: (clientProfileId: string) => Promise<GetClientProfileResponse>;
    updateById: (
      clientProfileId: string,
      input: UpdateClientProfileInput,
    ) => Promise<UpdateClientProfileResponse>;
  };
}

function buildClientProfilesListQuery(input: ListClientProfilesInput) {
  const searchParams = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  if (input.status) searchParams.set('status', input.status);
  if (input.search) searchParams.set('search', input.search);

  return searchParams.toString();
}

export function createClientProfilesApiClient({
  apiFetch,
}: ClientProfilesApiClientDependencies): ClientProfilesApiClient {
  return {
    clientProfiles: {
      list: (input) =>
        apiFetch<ListClientProfilesResponse>(
          `/api/client-profiles?${buildClientProfilesListQuery(input)}`,
        ),
      getById: (clientProfileId) =>
        apiFetch<GetClientProfileResponse>(
          `/api/client-profiles/${clientProfileId}`,
        ),
      updateById: (clientProfileId, input) =>
        apiFetch<UpdateClientProfileResponse>(
          `/api/client-profiles/${clientProfileId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(input),
          },
        ),
    },
  };
}
