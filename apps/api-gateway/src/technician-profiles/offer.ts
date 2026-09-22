import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  TechnicianOffer,
  TechnicianOfferDetails,
  TechnicianOfferSpecialty,
} from '@servicienta/types';
import { ValidationError } from '../core/errors.js';
import { listCatalogItems } from './helpers/catalog.js';

export async function getTechnicianOffer(
  supabase: SupabaseClient,
  technicianId: string,
): Promise<TechnicianOfferDetails> {
  const [zones, applianceTypes, brands, profile, coverage, appliances, brandRelations] =
    await Promise.all([
      listCatalogItems(supabase, 'zones'),
      listCatalogItems(supabase, 'appliance_types'),
      listCatalogItems(supabase, 'brands'),
      supabase.from('technician_profiles').select('available').eq('id', technicianId).single(),
      supabase.from('technician_coverage_zones').select('zone_id').eq('technician_id', technicianId),
      supabase.from('technician_appliance_specialties').select('appliance_type_id, supports_all_brands').eq('technician_id', technicianId).not('appliance_type_id', 'is', null),
      supabase.from('technician_brand_specialties').select('appliance_type_id, brand_id').eq('technician_id', technicianId),
    ]);

  for (const result of [profile, coverage, appliances, brandRelations]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    catalogs: { zones, applianceTypes, brands },
    offer: {
      available: profile.data!.available,
      zoneIds: (coverage.data ?? []).map((row) => row.zone_id),
      specialties: (appliances.data ?? []).map((row) => ({
        applianceTypeId: row.appliance_type_id!,
        supportsAllBrands: row.supports_all_brands,
        brandIds: (brandRelations.data ?? [])
          .filter((brand) => brand.appliance_type_id === row.appliance_type_id)
          .map((brand) => brand.brand_id),
      })),
    },
  };
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function validateTechnicianOffer(input: unknown): TechnicianOffer {
  if (!input || typeof input !== 'object') throw new ValidationError('Oferta inválida');
  const value = input as Record<string, unknown>;
  if (typeof value.available !== 'boolean' || !Array.isArray(value.zoneIds) ||
      !Array.isArray(value.specialties)) throw new ValidationError('Oferta inválida');
  if (!value.zoneIds.every(isUuid)) throw new ValidationError('Zona inválida');

  const specialties: TechnicianOfferSpecialty[] = value.specialties.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object') throw new ValidationError('Especialidad inválida');
    const specialty = entry as Record<string, unknown>;
    if (!isUuid(specialty.applianceTypeId) ||
        typeof specialty.supportsAllBrands !== 'boolean' ||
        !Array.isArray(specialty.brandIds) ||
        !specialty.brandIds.every(isUuid)) throw new ValidationError('Especialidad inválida');
    const brandIds = [...new Set(specialty.brandIds as string[])];
    if (specialty.supportsAllBrands ? brandIds.length > 0 : brandIds.length === 0)
      throw new ValidationError('Elegí marcas o seleccioná todas las marcas');
    return {
      applianceTypeId: specialty.applianceTypeId,
      supportsAllBrands: specialty.supportsAllBrands,
      brandIds,
    };
  });

  const applianceIds = specialties.map((item) => item.applianceTypeId);
  if (new Set(applianceIds).size !== applianceIds.length)
    throw new ValidationError('Electrodoméstico duplicado');

  return {
    available: value.available,
    zoneIds: [...new Set(value.zoneIds as string[])],
    specialties,
  };
}

export async function updateTechnicianOffer(
  supabase: SupabaseClient,
  technicianId: string,
  input: unknown,
): Promise<TechnicianOfferDetails> {
  const offer = validateTechnicianOffer(input);
  const { error } = await supabase.rpc('replace_technician_offer', {
    _technician_id: technicianId,
    _available: offer.available,
    _zone_ids: offer.zoneIds,
    _specialties: offer.specialties,
  });
  if (error) {
    if (error.message.includes('Unknown') || error.message.includes('Invalid'))
      throw new ValidationError(error.message);
    throw new Error(error.message);
  }
  return getTechnicianOffer(supabase, technicianId);
}
