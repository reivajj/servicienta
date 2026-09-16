import type {
  CancelOperationResponse,
  CompleteOperationResponse,
  CompleteTechOperationResponse,
  ConfirmCompletedOperationResponse,
  CreateOperationInput,
  CreateOperationResponse,
  CreateTechnicianReviewInput,
  CreateTechnicianReviewResponse,
  GetAdminOperationResponse,
  GetOperationResponse,
  ListAdminOperationsInput,
  ListAdminOperationsResponse,
  ListCurrentOperationsInput,
  ListCurrentOperationsResponse,
  RejectCompletedOperationResponse,
  ScheduleOperationInput,
  ScheduleOperationResponse,
  UpdateAdminOperationInput,
  UpdateAdminOperationResponse,
} from '@servicienta/types';

interface OperationsApiClientDependencies {
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
}

export interface OperationsApiClient {
  operations: {
    createForOrder: (
      orderId: string,
      input: CreateOperationInput,
    ) => Promise<CreateOperationResponse>;
    current: {
      list: (
        input: ListCurrentOperationsInput,
      ) => Promise<ListCurrentOperationsResponse>;
      getById: (operationId: string) => Promise<GetOperationResponse>;
    };
    schedule: (
      operationId: string,
      input: ScheduleOperationInput,
    ) => Promise<ScheduleOperationResponse>;
    completeTech: (
      operationId: string,
    ) => Promise<CompleteTechOperationResponse>;
    confirmCompleted: (
      operationId: string,
    ) => Promise<ConfirmCompletedOperationResponse>;
    rejectCompleted: (
      operationId: string,
    ) => Promise<RejectCompletedOperationResponse>;
    cancel: (operationId: string) => Promise<CancelOperationResponse>;
    complete: (operationId: string) => Promise<CompleteOperationResponse>;
    createReview: (
      operationId: string,
      input: CreateTechnicianReviewInput,
    ) => Promise<CreateTechnicianReviewResponse>;
    admin: {
      list: (
        input: ListAdminOperationsInput,
      ) => Promise<ListAdminOperationsResponse>;
      getById: (operationId: string) => Promise<GetAdminOperationResponse>;
      updateById: (
        operationId: string,
        input: UpdateAdminOperationInput,
      ) => Promise<UpdateAdminOperationResponse>;
    };
  };
}

function buildPaginatedOperationsQuery(
  input: ListCurrentOperationsInput | ListAdminOperationsInput,
) {
  const searchParams = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  if (input.status) searchParams.set('status', input.status);
  if ('order_id' in input && input.order_id) {
    searchParams.set('orderId', input.order_id);
  }
  if ('technician_id' in input && input.technician_id) {
    searchParams.set('technicianId', input.technician_id);
  }
  if ('client_id' in input && input.client_id) {
    searchParams.set('clientId', input.client_id);
  }

  return searchParams.toString();
}

export function createOperationsApiClient({
  apiFetch,
}: OperationsApiClientDependencies): OperationsApiClient {
  return {
    operations: {
      createForOrder: (orderId, input) =>
        apiFetch<CreateOperationResponse>(`/api/orders/${orderId}/operations`, {
          method: 'POST',
          body: JSON.stringify(input),
        }),
      current: {
        list: (input) =>
          apiFetch<ListCurrentOperationsResponse>(
            `/api/operations/current?${buildPaginatedOperationsQuery(input)}`,
          ),
        getById: (operationId) =>
          apiFetch<GetOperationResponse>(`/api/operations/${operationId}`),
      },
      schedule: (operationId, input) =>
        apiFetch<ScheduleOperationResponse>(
          `/api/operations/${operationId}/schedule`,
          {
            method: 'POST',
            body: JSON.stringify(input),
          },
        ),
      completeTech: (operationId) =>
        apiFetch<CompleteTechOperationResponse>(
          `/api/operations/${operationId}/complete-tech`,
          { method: 'POST' },
        ),
      confirmCompleted: (operationId) =>
        apiFetch<ConfirmCompletedOperationResponse>(
          `/api/operations/${operationId}/confirm-completed`,
          { method: 'POST' },
        ),
      rejectCompleted: (operationId) =>
        apiFetch<RejectCompletedOperationResponse>(
          `/api/operations/${operationId}/reject-completed`,
          { method: 'POST' },
        ),
      cancel: (operationId) =>
        apiFetch<CancelOperationResponse>(
          `/api/operations/${operationId}/cancel`,
          { method: 'POST' },
        ),
      createReview: (operationId, input) =>
        apiFetch<CreateTechnicianReviewResponse>(
          `/api/operations/${operationId}/review`,
          {
            method: 'POST',
            body: JSON.stringify(input),
          },
        ),
      complete: (operationId) =>
        apiFetch<CompleteOperationResponse>(
          `/api/operations/${operationId}/complete`,
          { method: 'POST' },
        ),
      admin: {
        list: (input) =>
          apiFetch<ListAdminOperationsResponse>(
            `/api/admin/operations?${buildPaginatedOperationsQuery(input)}`,
          ),
        getById: (operationId) =>
          apiFetch<GetAdminOperationResponse>(
            `/api/admin/operations/${operationId}`,
          ),
        updateById: (operationId, input) =>
          apiFetch<UpdateAdminOperationResponse>(
            `/api/admin/operations/${operationId}`,
            {
              method: 'PATCH',
              body: JSON.stringify(input),
            },
          ),
      },
    },
  };
}
