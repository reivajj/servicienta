import type {
  AdminAssociatedTechnician,
  AdminTechnicianProfile,
  AdminTechnicianCatalogItem,
  AdminTechnicianCatalogs,
  PublicTechnicianProfileCatalogs,
  PublicTechnicianProfile,
  TechnicianPreferredContactChannel,
  TechnicianCatalogKind,
} from './domain.js';
import type { UserStatus } from '../users/domain.js';
import type { UsersPageSize } from '../users/contracts.js';

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

export interface ListAdminTechnicianProfilesInput {
  page: number;
  pageSize: UsersPageSize;
  status?: UserStatus;
  available?: boolean;
  search?: string;
  sort?: AdminTechnicianProfilesSort;
}

export type AdminTechnicianProfilesSort =
  | 'default'
  | 'rating-desc'
  | 'rating-asc'
  | 'name-asc'
  | 'name-desc';

export interface PaginatedAdminTechnicianProfilesSummary {
  totalTechnicians: number;
  activeTechnicians: number;
  deletedTechnicians: number;
  availableTechnicians: number;
}

export interface PaginatedAdminTechnicianProfilesPagination {
  page: number;
  pageSize: UsersPageSize;
  total: number;
  totalPages: number;
}

export interface PaginatedAdminTechnicianProfiles {
  items: AdminTechnicianProfile[];
  pagination: PaginatedAdminTechnicianProfilesPagination;
  summary: PaginatedAdminTechnicianProfilesSummary;
}

export interface ListAdminTechnicianProfilesResponse {
  data: PaginatedAdminTechnicianProfiles;
}

export interface GetAdminTechnicianProfileResponse {
  data: AdminTechnicianProfile;
}

export interface GetCurrentTechnicianProfileResponse {
  data: AdminTechnicianProfile;
}

export interface UpdateTechnicianProfileInput {
  name: string;
  surname: string | null;
  bio: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  preferred_contact_channel: TechnicianPreferredContactChannel;
  base_address_text: string | null;
  base_lat: number | null;
  base_lng: number | null;
  service_radius_km: number | null;
}

export interface UpdateTechnicianProfileResponse {
  data: AdminTechnicianProfile;
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
