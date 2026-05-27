import type {
  ListAdminTechnicianProfilesInput,
  ListAdminTechnicianProfilesResponse,
  ListAdminTechnicianCatalogsResponse,
  ListAdminTechniciansByCatalogItemInput,
  ListAdminTechniciansByCatalogItemResponse,
  GetCurrentTechnicianProfileResponse,
  GetAdminTechnicianProfileResponse,
  GetPublicTechnicianProfileResponse,
  ListPublicTechnicianProfileCatalogsResponse,
  ListPublicTechnicianProfilesInput,
  ListPublicTechnicianProfilesResponse,
  UpdateTechnicianProfileInput,
  UpdateTechnicianProfileResponse,
} from '@servicienta/types';

interface TechnicianProfilesApiClientDependencies {
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
}

export interface TechnicianProfilesApiClient {
  technicianProfiles: {
    listAdmin: (
      input: ListAdminTechnicianProfilesInput,
    ) => Promise<ListAdminTechnicianProfilesResponse>;
    getAdminById: (
      technicianId: string,
    ) => Promise<GetAdminTechnicianProfileResponse>;
    updateAdminById: (
      technicianId: string,
      input: UpdateTechnicianProfileInput,
    ) => Promise<UpdateTechnicianProfileResponse>;
    getCurrent: () => Promise<GetCurrentTechnicianProfileResponse>;
    updateCurrent: (
      input: UpdateTechnicianProfileInput,
    ) => Promise<UpdateTechnicianProfileResponse>;
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
      getAdminById: (technicianId) =>
        apiFetch<GetAdminTechnicianProfileResponse>(
          `/api/admin/technician-profiles/${technicianId}`,
        ),
      updateAdminById: (technicianId, input) =>
        apiFetch<UpdateTechnicianProfileResponse>(
          `/api/admin/technician-profiles/${technicianId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(input),
          },
        ),
      getCurrent: () =>
        apiFetch<GetCurrentTechnicianProfileResponse>(
          '/api/technician-profile/me',
        ),
      updateCurrent: (input) =>
        apiFetch<UpdateTechnicianProfileResponse>(
          '/api/technician-profile/me',
          {
            method: 'PATCH',
            body: JSON.stringify(input),
          },
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
