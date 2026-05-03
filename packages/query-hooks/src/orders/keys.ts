import type { ListAdminOrdersInput, ListMyOrdersInput } from '@servicienta/types';

export const orderKeys = {
  all: ['orders'] as const,
  current: () => [...orderKeys.all, 'current'] as const,
  currentLists: () => [...orderKeys.current(), 'list'] as const,
  currentList: (input: ListMyOrdersInput) =>
    [...orderKeys.currentLists(), input] as const,
  currentDetail: (orderId: string) =>
    [...orderKeys.current(), 'detail', orderId] as const,
  admin: () => [...orderKeys.all, 'admin'] as const,
  adminLists: () => [...orderKeys.admin(), 'list'] as const,
  adminList: (input: ListAdminOrdersInput) =>
    [...orderKeys.adminLists(), input] as const,
  adminDetail: (orderId: string) =>
    [...orderKeys.admin(), 'detail', orderId] as const,
};
