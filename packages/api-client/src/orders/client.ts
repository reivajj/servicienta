import type {
  CreateOrderInput,
  CreateOrderResponse,
  GetAdminOrderResponse,
  GetOrderResponse,
  ListAdminOrdersInput,
  ListAdminOrdersResponse,
  ListMyOrdersInput,
  ListMyOrdersResponse,
  UpdateAdminOrderInput,
  UpdateAdminOrderResponse,
} from '@servicienta/types';

interface OrdersApiClientDependencies {
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
}

export interface OrdersApiClient {
  orders: {
    create: (input: CreateOrderInput) => Promise<CreateOrderResponse>;
    current: {
      list: (input: ListMyOrdersInput) => Promise<ListMyOrdersResponse>;
      getById: (orderId: string) => Promise<GetOrderResponse>;
    };
    admin: {
      list: (input: ListAdminOrdersInput) => Promise<ListAdminOrdersResponse>;
      getById: (orderId: string) => Promise<GetAdminOrderResponse>;
      updateById: (
        orderId: string,
        input: UpdateAdminOrderInput,
      ) => Promise<UpdateAdminOrderResponse>;
    };
  };
}

function buildPaginatedOrdersQuery(
  input: ListMyOrdersInput | ListAdminOrdersInput,
) {
  const searchParams = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  if (input.status) searchParams.set('status', input.status);
  if (input.search) searchParams.set('search', input.search);
  if ('flow_type' in input && input.flow_type) {
    searchParams.set('flowType', input.flow_type);
  }

  return searchParams.toString();
}

export function createOrdersApiClient({
  apiFetch,
}: OrdersApiClientDependencies): OrdersApiClient {
  return {
    orders: {
      create: (input) =>
        apiFetch<CreateOrderResponse>('/api/orders', {
          method: 'POST',
          body: JSON.stringify(input),
        }),
      current: {
        list: (input) =>
          apiFetch<ListMyOrdersResponse>(
            `/api/orders/current?${buildPaginatedOrdersQuery(input)}`,
          ),
        getById: (orderId) =>
          apiFetch<GetOrderResponse>(`/api/orders/${orderId}`),
      },
      admin: {
        list: (input) =>
          apiFetch<ListAdminOrdersResponse>(
            `/api/admin/orders?${buildPaginatedOrdersQuery(input)}`,
          ),
        getById: (orderId) =>
          apiFetch<GetAdminOrderResponse>(`/api/admin/orders/${orderId}`),
        updateById: (orderId, input) =>
          apiFetch<UpdateAdminOrderResponse>(`/api/admin/orders/${orderId}`, {
            method: 'PATCH',
            body: JSON.stringify(input),
          }),
      },
    },
  };
}
