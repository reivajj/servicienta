import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateOrderInput,
  ListAdminOrdersInput,
  ListMyOrdersInput,
  UpdateAdminOrderInput,
} from '@servicienta/api-client';
import { useApiClient } from '../core/api-client-context.js';
import { operationKeys } from '../operations/keys.js';
import { orderKeys } from './keys.js';

export function useCreateOrder() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => apiClient.orders.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.current() });
      void queryClient.invalidateQueries({ queryKey: orderKeys.admin() });
    },
  });
}

export function useCurrentOrders(input: ListMyOrdersInput) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: orderKeys.currentList(input),
    queryFn: async () => {
      const response = await apiClient.orders.current.list(input);
      return response.data;
    },
  });
}

export function useCurrentOrder(orderId: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: orderKeys.currentDetail(orderId),
    queryFn: async () => {
      const response = await apiClient.orders.current.getById(orderId);
      return response.data;
    },
    enabled: Boolean(orderId),
  });
}

export function useAdminOrders(input: ListAdminOrdersInput) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: orderKeys.adminList(input),
    queryFn: async () => {
      const response = await apiClient.orders.admin.list(input);
      return response.data;
    },
  });
}

export function useAdminOrder(orderId: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: orderKeys.adminDetail(orderId),
    queryFn: async () => {
      const response = await apiClient.orders.admin.getById(orderId);
      return response.data;
    },
    enabled: Boolean(orderId),
  });
}

export function useUpdateAdminOrder() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      input,
    }: {
      orderId: string;
      input: UpdateAdminOrderInput;
    }) => apiClient.orders.admin.updateById(orderId, input),
    onSuccess: (response) => {
      queryClient.setQueryData(
        orderKeys.adminDetail(response.data.id),
        response.data,
      );
      void queryClient.invalidateQueries({ queryKey: orderKeys.adminLists() });
      void queryClient.invalidateQueries({
        queryKey: operationKeys.adminLists(),
      });
    },
  });
}
