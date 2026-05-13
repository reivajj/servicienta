import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateOperationInput,
  ListAdminOperationsInput,
  ListCurrentOperationsInput,
  UpdateAdminOperationInput,
} from '@servicienta/api-client';
import { useApiClient } from '../core/api-client-context.js';
import { operationKeys } from './keys.js';

export function useCreateOperation(orderId: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOperationInput) =>
      apiClient.operations.createForOrder(orderId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: operationKeys.current() });
      void queryClient.invalidateQueries({ queryKey: operationKeys.admin() });
    },
  });
}

export function useCompleteOperation() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operationId: string) =>
      apiClient.operations.complete(operationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: operationKeys.current() });
      void queryClient.invalidateQueries({ queryKey: operationKeys.admin() });
    },
  });
}

export function useCurrentOperations(input: ListCurrentOperationsInput) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: operationKeys.currentList(input),
    queryFn: async () => {
      const response = await apiClient.operations.current.list(input);
      return response.data;
    },
  });
}

export function useCurrentOperation(operationId: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: operationKeys.currentDetail(operationId),
    queryFn: async () => {
      const response = await apiClient.operations.current.getById(operationId);
      return response.data;
    },
    enabled: Boolean(operationId),
  });
}

export function useAdminOperations(input: ListAdminOperationsInput) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: operationKeys.adminList(input),
    queryFn: async () => {
      const response = await apiClient.operations.admin.list(input);
      return response.data;
    },
  });
}

export function useAdminOperation(operationId: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: operationKeys.adminDetail(operationId),
    queryFn: async () => {
      const response = await apiClient.operations.admin.getById(operationId);
      return response.data;
    },
    enabled: Boolean(operationId),
  });
}

export function useUpdateAdminOperation() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      operationId,
      input,
    }: {
      operationId: string;
      input: UpdateAdminOperationInput;
    }) => apiClient.operations.admin.updateById(operationId, input),
    onSuccess: (response) => {
      queryClient.setQueryData(
        operationKeys.adminDetail(response.data.id),
        response.data,
      );
      void queryClient.invalidateQueries({
        queryKey: operationKeys.adminLists(),
      });
    },
  });
}
