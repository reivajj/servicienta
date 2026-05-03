import type { ListClientProfilesInput } from '@servicienta/types';

export const clientProfileKeys = {
  all: ['client-profiles'] as const,
  lists: () => [...clientProfileKeys.all, 'list'] as const,
  list: (input: ListClientProfilesInput) =>
    [...clientProfileKeys.lists(), input] as const,
  detail: (clientProfileId: string) =>
    [...clientProfileKeys.all, 'detail', clientProfileId] as const,
};
