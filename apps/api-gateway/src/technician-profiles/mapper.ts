import type {
  AdminAssociatedTechnician,
  AdminTechnicianCatalogItem,
  PublicTechnicianCatalogItem,
  PublicTechnicianProfile,
} from '@servicienta/types';
import type {
  AdminTechnicianCatalogItemRow,
  PublicTechnicianProfileRow,
} from './types.js';

export function mapPublicTechnicianProfileRow(
  row: PublicTechnicianProfileRow,
): PublicTechnicianProfile {
  return {
    public_slug: row.public_slug,
    bio: row.bio,
    rating: Number(row.rating),
    rating_count: row.rating_count,
    available: row.available,
    verified_at: row.verified_at,
    created_at: row.created_at,
  };
}

export function mapAdminTechnicianCatalogItemRow(
  row: AdminTechnicianCatalogItemRow,
  technicianCount: number,
): AdminTechnicianCatalogItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    technician_count: technicianCount,
  };
}

export function mapPublicTechnicianCatalogItemRow(
  row: AdminTechnicianCatalogItemRow,
): PublicTechnicianCatalogItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

export function mapAdminAssociatedTechnicianRow(row: {
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
}): AdminAssociatedTechnician {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    surname: row.surname,
    status: row.status,
    public_slug: row.public_slug,
    available: row.available,
    rating: Number(row.rating),
    rating_count: row.rating_count,
    verified_at: row.verified_at,
    created_at: row.created_at,
  };
}
