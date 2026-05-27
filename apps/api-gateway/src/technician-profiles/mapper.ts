import type {
  AdminAssociatedTechnician,
  AdminTechnicianProfile,
  AdminTechnicianCatalogItem,
  PublicTechnicianCatalogItem,
  PublicTechnicianProfile,
} from '@servicienta/types';
import type {
  AdminTechnicianCatalogItemRow,
  AdminTechnicianProfileRow,
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

export function mapAdminTechnicianProfileRow(
  row: AdminTechnicianProfileRow,
): AdminTechnicianProfile | null {
  const profile = Array.isArray(row.technician_profiles)
    ? row.technician_profiles[0]
    : row.technician_profiles;

  if (!profile) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    surname: row.surname,
    status: row.status === 'DELETED' ? 'DELETED' : 'ACTIVE',
    public_slug: profile.public_slug,
    available: profile.available,
    rating: Number(profile.rating),
    rating_count: profile.rating_count,
    verified_at: profile.verified_at,
    bio: profile.bio,
    phone: profile.phone,
    whatsapp_phone: profile.whatsapp_phone,
    preferred_contact_channel:
      profile.preferred_contact_channel === 'whatsapp' ? 'whatsapp' : 'phone',
    base_address_text: profile.base_address_text,
    base_lat: profile.base_lat === null ? null : Number(profile.base_lat),
    base_lng: profile.base_lng === null ? null : Number(profile.base_lng),
    service_radius_km:
      profile.service_radius_km === null
        ? null
        : Number(profile.service_radius_km),
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}
