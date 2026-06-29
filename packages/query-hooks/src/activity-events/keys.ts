import type { ListActivityEventsInput } from '@servicienta/types';

export const activityEventKeys = {
  all: ['activity-events'] as const,
  admin: () => [...activityEventKeys.all, 'admin'] as const,
  adminLists: () => [...activityEventKeys.admin(), 'list'] as const,
  adminList: (input: ListActivityEventsInput) =>
    [...activityEventKeys.adminLists(), input] as const,
};
