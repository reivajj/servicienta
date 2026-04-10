export const userKeys = {
  all: ['users'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  list: () => [...userKeys.all, 'list'] as const,
  detail: (userId: string) => [...userKeys.all, 'detail', userId] as const,
}
