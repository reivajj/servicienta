import type { UsersPageSize } from '../users/contracts.js';
import type { AdminOperation, Operation, OperationStatus } from './domain.js';

export interface CreateOperationInput {
  technician_id: string;
  scheduled_at: string | null;
}

export interface CreateOperationResponse {
  data: Operation;
}

export interface CompleteOperationResponse {
  data: Operation;
}

export interface ScheduleOperationInput {
  scheduled_at: string;
  description: string;
}

export interface ScheduleOperationResponse {
  data: Operation;
}

export interface CompleteTechOperationResponse {
  data: Operation;
}

export interface ConfirmCompletedOperationResponse {
  data: Operation;
}

export interface CancelOperationResponse {
  data: Operation;
}

export interface CreateTechnicianReviewInput {
  rating: number;
  comment: string | null;
}

export interface CreateTechnicianReviewResponse {
  data: Operation;
}

export interface UpdateAdminOperationInput {
  status: OperationStatus;
  scheduled_at: string | null;
  description: string | null;
  completed_at: string | null;
  technician_completed_at: string | null;
}

export interface UpdateAdminOperationResponse {
  data: AdminOperation;
}

export interface ListCurrentOperationsInput {
  page: number;
  pageSize: UsersPageSize;
  status?: OperationStatus;
}

export interface PaginatedOperationsSummary {
  totalOperations: number;
  pendingOperations: number;
  scheduledOperations: number;
  completedTechOperations: number;
  completedOperations: number;
  cancelledOperations: number;
}

export interface PaginatedOperationsPagination {
  page: number;
  pageSize: UsersPageSize;
  total: number;
  totalPages: number;
}

export interface PaginatedOperations {
  items: Operation[];
  pagination: PaginatedOperationsPagination;
  summary: PaginatedOperationsSummary;
}

export interface ListCurrentOperationsResponse {
  data: PaginatedOperations;
}

export interface GetOperationResponse {
  data: Operation;
}

export interface ListAdminOperationsInput {
  page: number;
  pageSize: UsersPageSize;
  status?: OperationStatus;
  order_id?: string;
  technician_id?: string;
  client_id?: string;
}

export interface PaginatedAdminOperations {
  items: AdminOperation[];
  pagination: PaginatedOperationsPagination;
  summary: PaginatedOperationsSummary;
}

export interface ListAdminOperationsResponse {
  data: PaginatedAdminOperations;
}

export interface GetAdminOperationResponse {
  data: AdminOperation;
}
