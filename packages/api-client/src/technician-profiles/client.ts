import type {
  ListAdminTechnicianProfilesInput,
  ListAdminTechnicianProfilesResponse,
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
    listAdmin: (
      input: ListAdminTechnicianProfilesInput,
    ) => Promise<ListAdminTechnicianProfilesResponse>;
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

function buildAdminTechnicianProfilesListQuery(
  input: ListAdminTechnicianProfilesInput,
) {
  const searchParams = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  if (input.status) searchParams.set('status', input.status);
  if (typeof input.available === 'boolean') {
    searchParams.set('available', String(input.available));
  }
  if (input.search) searchParams.set('search', input.search);
  if (input.sort) searchParams.set('sort', input.sort);

  return searchParams.toString();
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
      listAdmin: (input) =>
        apiFetch<ListAdminTechnicianProfilesResponse>(
          `/api/admin/technician-profiles?${buildAdminTechnicianProfilesListQuery(input)}`,
        ),
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
