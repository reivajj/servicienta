import type { ListPublicTechnicianProfilesInput } from '@servicienta/types';

export const technicianProfileKeys = {
  all: ['technician-profiles'] as const,
  public: () => [...technicianProfileKeys.all, 'public'] as const,
  lists: () => [...technicianProfileKeys.public(), 'list'] as const,
  list: (input: ListPublicTechnicianProfilesInput) =>
    [...technicianProfileKeys.lists(), input] as const,
  details: () => [...technicianProfileKeys.public(), 'detail'] as const,
  detail: (publicSlug: string) =>
    [...technicianProfileKeys.details(), publicSlug] as const,
};
