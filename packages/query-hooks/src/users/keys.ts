import type { ListUsersInput } from '@servicienta/types'

export const userKeys = {
  all: ['users'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (input: ListUsersInput) => [...userKeys.lists(), input] as const,
  detail: (userId: string) => [...userKeys.all, 'detail', userId] as const,
}
