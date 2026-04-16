import type {
  AdminAssociatedTechnician,
  AdminTechnicianCatalogItem,
  AdminTechnicianCatalogs,
  PublicTechnicianProfileCatalogs,
  PublicTechnicianProfile,
  TechnicianCatalogKind,
} from './domain.js';

export interface ListPublicTechnicianProfilesInput {
  zoneSlug: string;
  applianceTypeSlug: string;
  available?: boolean;
}

export interface ListPublicTechnicianProfilesResponse {
  data: PublicTechnicianProfile[];
}

export interface GetPublicTechnicianProfileResponse {
  data: PublicTechnicianProfile;
}

export interface ListPublicTechnicianProfileCatalogsResponse {
  data: PublicTechnicianProfileCatalogs;
}

export interface ListAdminTechnicianCatalogsResponse {
  data: AdminTechnicianCatalogs;
}

export interface ListAdminTechniciansByCatalogItemInput {
  kind: TechnicianCatalogKind;
  slug: string;
}

export interface AdminTechniciansByCatalogItem {
  kind: TechnicianCatalogKind;
  item: AdminTechnicianCatalogItem;
  technicians: AdminAssociatedTechnician[];
}

export interface ListAdminTechniciansByCatalogItemResponse {
  data: AdminTechniciansByCatalogItem;
}
