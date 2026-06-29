import type { UsersPageSize } from '../users/contracts.js';
import type {
  ActivityEvent,
  ActivityEventEntityType,
  ActivityEventType,
} from './domain.js';

export interface ListActivityEventsInput {
  page: number;
  pageSize: UsersPageSize;
  entity_type?: ActivityEventEntityType;
  entity_id?: string;
  event_type?: ActivityEventType;
  created_from?: string;
  created_to?: string;
}

export interface PaginatedActivityEventsPagination {
  page: number;
  pageSize: UsersPageSize;
  total: number;
  totalPages: number;
}

export interface PaginatedActivityEvents {
  items: ActivityEvent[];
  pagination: PaginatedActivityEventsPagination;
}

export interface ListActivityEventsResponse {
  data: PaginatedActivityEvents;
}
