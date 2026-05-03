import type { UserStatus } from '../users/domain.js';
import type { UsersPageSize } from '../users/contracts.js';
import type {
  AdminClientProfile,
  ClientPreferredContactChannel,
} from './domain.js';

export interface ListClientProfilesInput {
  page: number;
  pageSize: UsersPageSize;
  status?: UserStatus;
  search?: string;
}

export interface PaginatedClientProfilesSummary {
  totalClients: number;
  activeClients: number;
  deletedClients: number;
}

export interface PaginatedClientProfilesPagination {
  page: number;
  pageSize: UsersPageSize;
  total: number;
  totalPages: number;
}

export interface PaginatedClientProfiles {
  items: AdminClientProfile[];
  pagination: PaginatedClientProfilesPagination;
  summary: PaginatedClientProfilesSummary;
}

export interface ListClientProfilesResponse {
  data: PaginatedClientProfiles;
}

export interface GetClientProfileResponse {
  data: AdminClientProfile;
}

export interface UpdateClientProfileInput {
  phone: string | null;
  whatsapp_phone: string | null;
  default_address_text: string | null;
  address_notes: string | null;
  preferred_contact_channel: ClientPreferredContactChannel;
}

export interface UpdateClientProfileResponse {
  data: AdminClientProfile;
}
