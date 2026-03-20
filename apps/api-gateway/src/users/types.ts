export interface AuthenticatedUser {
  id: string
  email: string
}

export interface UserRow {
  id: string
  email: string
  name: string | null
  surname: string | null
  role: string
  created_at: string
}
