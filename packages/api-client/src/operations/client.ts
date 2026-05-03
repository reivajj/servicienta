import type {
  CompleteOperationResponse,
  CreateOperationInput,
  CreateOperationResponse,
  GetAdminOperationResponse,
  GetOperationResponse,
  ListAdminOperationsInput,
  ListAdminOperationsResponse,
  ListCurrentOperationsInput,
  ListCurrentOperationsResponse,
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
    complete: (operationId: string) => Promise<CompleteOperationResponse>;
    admin: {
      list: (
        input: ListAdminOperationsInput,
      ) => Promise<ListAdminOperationsResponse>;
      getById: (operationId: string) => Promise<GetAdminOperationResponse>;
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
      },
    },
  };
}
