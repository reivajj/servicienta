export interface AuthenticatedUser {
  id: string
  email: string
}

export interface AuthorizedUser extends AuthenticatedUser {
  role: 'admin' | 'client' | 'technician'
  status: 'ACTIVE' | 'DELETED'
}

export interface UserRow {
  id: string
  email: string
  name: string | null
  surname: string | null
  role: string
  status: string
  deleted_at: string | null
  created_at: string
}
