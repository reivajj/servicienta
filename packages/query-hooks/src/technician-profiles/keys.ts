import type {
  ListAdminTechnicianProfilesInput,
  ListAdminTechniciansByCatalogItemInput,
  ListPublicTechnicianProfilesInput,
} from '@servicienta/types';

export const technicianProfileKeys = {
  all: ['technician-profiles'] as const,
  public: () => [...technicianProfileKeys.all, 'public'] as const,
  publicCatalogs: () =>
    [...technicianProfileKeys.public(), 'catalogs'] as const,
  lists: () => [...technicianProfileKeys.public(), 'list'] as const,
  list: (input: ListPublicTechnicianProfilesInput) =>
    [...technicianProfileKeys.lists(), input] as const,
  details: () => [...technicianProfileKeys.public(), 'detail'] as const,
  detail: (publicSlug: string) =>
    [...technicianProfileKeys.details(), publicSlug] as const,
  admin: () => [...technicianProfileKeys.all, 'admin'] as const,
  adminLists: () => [...technicianProfileKeys.admin(), 'list'] as const,
  adminList: (input: ListAdminTechnicianProfilesInput) =>
    [...technicianProfileKeys.adminLists(), input] as const,
  adminCatalogs: () => [...technicianProfileKeys.admin(), 'catalogs'] as const,
  adminCatalogItemTechnicians: () =>
    [...technicianProfileKeys.admin(), 'catalog-item-technicians'] as const,
  adminCatalogItemTechniciansDetail: (
    input: ListAdminTechniciansByCatalogItemInput,
  ) => [...technicianProfileKeys.adminCatalogItemTechnicians(), input] as const,
};
