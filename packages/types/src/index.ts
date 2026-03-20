export interface Technician {
  id: string
  full_name: string
  specialty: string
  city: string
  bio: string | null
  is_available: boolean
  created_at: string
}

export interface ListTechniciansResponse {
  data: Technician[]
}

export interface ApiErrorResponse {
  error: string
}
