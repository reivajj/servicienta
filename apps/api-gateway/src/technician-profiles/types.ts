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

export interface AdminTechnicianProfileRow {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  status: string;
  technician_profiles:
    | {
        public_slug: string;
        available: boolean;
        rating: number;
        rating_count: number;
        verified_at: string | null;
        bio: string | null;
        created_at: string;
        updated_at: string;
      }
    | Array<{
        public_slug: string;
        available: boolean;
        rating: number;
        rating_count: number;
        verified_at: string | null;
        bio: string | null;
        created_at: string;
        updated_at: string;
      }>;
}
