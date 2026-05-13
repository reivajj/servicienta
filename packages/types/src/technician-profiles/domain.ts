export interface TechnicianProfile {
  id: string;
  public_slug: string;
  bio: string | null;
  rating: number;
  rating_count: number;
  available: boolean;
  base_address_text: string | null;
  base_lat: number | null;
  base_lng: number | null;
  service_radius_km: number | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicTechnicianProfile {
  public_slug: string;
  bio: string | null;
  rating: number;
  rating_count: number;
  available: boolean;
  verified_at: string | null;
  created_at: string;
}

export type TechnicianCatalogKind = 'zones' | 'brands' | 'appliance-types';

export interface PublicTechnicianCatalogItem {
  id: string;
  name: string;
  slug: string;
}

export interface PublicTechnicianProfileCatalogs {
  zones: PublicTechnicianCatalogItem[];
  applianceTypes: PublicTechnicianCatalogItem[];
}

export interface AdminTechnicianCatalogItem {
  id: string;
  name: string;
  slug: string;
  technician_count: number;
}

export interface AdminTechnicianCatalogs {
  zones: AdminTechnicianCatalogItem[];
  brands: AdminTechnicianCatalogItem[];
  applianceTypes: AdminTechnicianCatalogItem[];
}

export interface AdminAssociatedTechnician {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  status: 'ACTIVE' | 'DELETED';
  public_slug: string;
  available: boolean;
  rating: number;
  rating_count: number;
  verified_at: string | null;
  created_at: string;
}

export interface AdminTechnicianProfile {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  status: 'ACTIVE' | 'DELETED';
  public_slug: string;
  available: boolean;
  rating: number;
  rating_count: number;
  verified_at: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplianceType {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface TechnicianApplianceSpecialty {
  id: string;
  technician_id: string;
  appliance_type_id: string | null;
  supports_all_brands: boolean;
  free_text: string | null;
  created_at: string;
}

export interface TechnicianBrandSpecialty {
  id: string;
  technician_id: string;
  appliance_type_id: string;
  brand_id: string;
  created_at: string;
}

export interface TechnicianCoverageZone {
  id: string;
  technician_id: string;
  zone_id: string;
  created_at: string;
}

export interface TechnicianReview {
  id: string;
  technician_id: string;
  operation_id: string;
  client_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface TechnicianDocument {
  id: string;
  technician_id: string;
  document_type: string;
  storage_key: string;
  title: string;
  description: string | null;
  is_public: boolean;
  uploaded_at: string;
}
