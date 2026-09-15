import type { UserRole } from '@servicienta/types';

const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  technician: 'Técnico',
  client: 'Usuario',
};

export function formatUserRole(role: UserRole) {
  return USER_ROLE_LABELS[role];
}
