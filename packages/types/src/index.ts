export type UserRole = 'admin' | 'client' | 'technician'

export interface User {
  id: string
  email: string
  name: string | null
  surname: string | null
  role: UserRole
  created_at: string
}

export interface GetMeResponse {
  data: User
}

export interface UpdateMeInput {
  name: string
  surname: string
  role: UserRole
}

export interface UpdateMeResponse {
  data: User
}

export interface ApiErrorResponse {
  error: string
}
