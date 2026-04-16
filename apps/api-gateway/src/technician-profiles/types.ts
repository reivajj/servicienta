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
