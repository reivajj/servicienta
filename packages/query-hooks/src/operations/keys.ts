import type {
  ListAdminOperationsInput,
  ListCurrentOperationsInput,
} from '@servicienta/types';

export const operationKeys = {
  all: ['operations'] as const,
  current: () => [...operationKeys.all, 'current'] as const,
  currentLists: () => [...operationKeys.current(), 'list'] as const,
  currentList: (input: ListCurrentOperationsInput) =>
    [...operationKeys.currentLists(), input] as const,
  currentDetail: (operationId: string) =>
    [...operationKeys.current(), 'detail', operationId] as const,
  admin: () => [...operationKeys.all, 'admin'] as const,
  adminLists: () => [...operationKeys.admin(), 'list'] as const,
  adminList: (input: ListAdminOperationsInput) =>
    [...operationKeys.adminLists(), input] as const,
  adminDetail: (operationId: string) =>
    [...operationKeys.admin(), 'detail', operationId] as const,
};
