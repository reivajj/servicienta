import type {
  ListAdminTechnicianCatalogsResponse,
  ListAdminTechniciansByCatalogItemInput,
  ListAdminTechniciansByCatalogItemResponse,
  GetPublicTechnicianProfileResponse,
  ListPublicTechnicianProfileCatalogsResponse,
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
    listPublicCatalogs: () => Promise<ListPublicTechnicianProfileCatalogsResponse>;
    getPublicBySlug: (
      publicSlug: string,
    ) => Promise<GetPublicTechnicianProfileResponse>;
    listAdminCatalogs: () => Promise<ListAdminTechnicianCatalogsResponse>;
    listAdminTechniciansByCatalogItem: (
      input: ListAdminTechniciansByCatalogItemInput,
    ) => Promise<ListAdminTechniciansByCatalogItemResponse>;
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
      listPublicCatalogs: () =>
        apiFetch<ListPublicTechnicianProfileCatalogsResponse>(
          '/api/public/technician-profiles/catalogs',
        ),
      listPublic: (input) =>
        apiFetch<ListPublicTechnicianProfilesResponse>(
          `/api/public/technician-profiles?${buildPublicTechnicianProfilesListQuery(input)}`,
        ),
      getPublicBySlug: (publicSlug) =>
        apiFetch<GetPublicTechnicianProfileResponse>(
          `/api/public/technician-profiles/${publicSlug}`,
        ),
      listAdminCatalogs: () =>
        apiFetch<ListAdminTechnicianCatalogsResponse>(
          '/api/admin/technician-profiles/catalogs',
        ),
      listAdminTechniciansByCatalogItem: (input) =>
        apiFetch<ListAdminTechniciansByCatalogItemResponse>(
          `/api/admin/technician-profiles/catalogs/${input.kind}/${input.slug}/technicians`,
        ),
    },
  };
}
