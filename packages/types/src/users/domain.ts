export type UserStatus = 'ACTIVE' | 'DELETED';

export type UserRole = 'admin' | 'client' | 'technician';

export interface User {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  role: UserRole;
  status: UserStatus;
  deleted_at: string | null;
  created_at: string;
}
