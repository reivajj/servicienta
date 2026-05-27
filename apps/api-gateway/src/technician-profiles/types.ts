export interface PublicTechnicianProfileRow {
  public_slug: string;
  bio: string | null;
  rating: number;
  rating_count: number;
  available: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface AdminTechnicianCatalogItemRow {
  id: string;
  name: string;
  slug: string;
}

interface AdminTechnicianProfileNestedRow {
  public_slug: string;
  available: boolean;
  rating: number;
  rating_count: number;
  verified_at: string | null;
  bio: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  preferred_contact_channel: string;
  base_address_text: string | null;
  base_lat: number | null;
  base_lng: number | null;
  service_radius_km: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdminTechnicianProfileRow {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  status: string;
  technician_profiles:
    | AdminTechnicianProfileNestedRow
    | AdminTechnicianProfileNestedRow[];
}
