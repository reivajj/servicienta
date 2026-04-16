import type {
  AdminTechnicianCatalogItem,
  AdminTechnicianCatalogs,
  AdminTechniciansByCatalogItem,
  ListAdminTechniciansByCatalogItemInput,
  ListPublicTechnicianProfilesInput,
  PublicTechnicianProfileCatalogs,
  PublicTechnicianProfile,
} from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NotFoundError } from '../core/errors.js';
import { getCatalogItemBySlug, listCatalogItems } from './helpers/catalog.js';
import { listAssociatedTechnicianIds } from './helpers/relations.js';
import { buildTechnicianCountMap } from './helpers/utils.js';
import {
  mapAdminAssociatedTechnicianRow,
  mapAdminTechnicianCatalogItemRow,
  mapPublicTechnicianCatalogItemRow,
  mapPublicTechnicianProfileRow,
} from './mapper.js';

export async function listPublicTechnicianProfiles(
  supabase: SupabaseClient,
  input: ListPublicTechnicianProfilesInput,
): Promise<PublicTechnicianProfile[]> {
  const { data, error } = await supabase.rpc(
    'search_public_technician_profiles',
    {
      _zone_slug: input.zoneSlug,
      _appliance_type_slug: input.applianceTypeSlug,
      _available: input.available ?? null,
    },
  );

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapPublicTechnicianProfileRow);
}

export async function getPublicTechnicianProfileBySlug(
  supabase: SupabaseClient,
  publicSlug: string,
): Promise<PublicTechnicianProfile> {
  const { data, error } = await supabase
    .from('public_technician_profiles')
    .select(
      'public_slug, bio, rating, rating_count, available, verified_at, created_at',
    )
    .eq('public_slug', publicSlug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('Public technician profile not found');

  return mapPublicTechnicianProfileRow(data);
}

export async function listPublicTechnicianProfileCatalogs(
  supabase: SupabaseClient,
): Promise<PublicTechnicianProfileCatalogs> {
  const [zones, applianceTypes] = await Promise.all([
    listCatalogItems(supabase, 'zones'),
    listCatalogItems(supabase, 'appliance_types'),
  ]);

  return {
    zones: zones.map(mapPublicTechnicianCatalogItemRow),
    applianceTypes: applianceTypes.map(mapPublicTechnicianCatalogItemRow),
  };
}

export async function listAdminTechnicianCatalogs(
  supabase: SupabaseClient,
): Promise<AdminTechnicianCatalogs> {
  const [
    zones,
    brands,
    applianceTypes,
    coverageZoneRelations,
    brandRelations,
    applianceRelations,
  ] = await Promise.all([
    listCatalogItems(supabase, 'zones'),
    listCatalogItems(supabase, 'brands'),
    listCatalogItems(supabase, 'appliance_types'),
    supabase.from('technician_coverage_zones').select('technician_id, zone_id'),
    supabase
      .from('technician_brand_specialties')
      .select('technician_id, brand_id'),
    supabase
      .from('technician_appliance_specialties')
      .select('technician_id, appliance_type_id')
      .not('appliance_type_id', 'is', null),
  ]);

  if (coverageZoneRelations.error)
    throw new Error(coverageZoneRelations.error.message);
  if (brandRelations.error) throw new Error(brandRelations.error.message);
  if (applianceRelations.error)
    throw new Error(applianceRelations.error.message);

  const zoneCountMap = buildTechnicianCountMap(
    (coverageZoneRelations.data ?? []).map((row) => ({
      technician_id: row.technician_id,
      relation_id: row.zone_id,
    })),
  );
  const brandCountMap = buildTechnicianCountMap(
    (brandRelations.data ?? []).map((row) => ({
      technician_id: row.technician_id,
      relation_id: row.brand_id,
    })),
  );
  const applianceCountMap = buildTechnicianCountMap(
    (applianceRelations.data ?? []).flatMap((row) =>
      row.appliance_type_id
        ? [
            {
              technician_id: row.technician_id,
              relation_id: row.appliance_type_id,
            },
          ]
        : [],
    ),
  );

  return {
    zones: zones.map((zone) =>
      mapAdminTechnicianCatalogItemRow(
        zone,
        zoneCountMap.get(zone.id)?.size ?? 0,
      ),
    ),
    brands: brands.map((brand) =>
      mapAdminTechnicianCatalogItemRow(
        brand,
        brandCountMap.get(brand.id)?.size ?? 0,
      ),
    ),
    applianceTypes: applianceTypes.map((applianceType) =>
      mapAdminTechnicianCatalogItemRow(
        applianceType,
        applianceCountMap.get(applianceType.id)?.size ?? 0,
      ),
    ),
  };
}

export async function listAdminTechniciansByCatalogItem(
  supabase: SupabaseClient,
  input: ListAdminTechniciansByCatalogItemInput,
): Promise<AdminTechniciansByCatalogItem> {
  const itemRow = await getCatalogItemBySlug(supabase, input);
  const technicianIds = await listAssociatedTechnicianIds(
    supabase,
    input,
    itemRow.id,
  );
  const item: AdminTechnicianCatalogItem = mapAdminTechnicianCatalogItemRow(
    itemRow,
    technicianIds.length,
  );

  if (technicianIds.length === 0) {
    return {
      kind: input.kind,
      item,
      technicians: [],
    };
  }

  const [profilesResult, usersResult] = await Promise.all([
    supabase
      .from('technician_profiles')
      .select(
        'id, public_slug, available, rating, rating_count, verified_at, created_at',
      )
      .in('id', technicianIds),
    supabase
      .from('users')
      .select('id, email, name, surname, status')
      .in('id', technicianIds),
  ]);

  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (usersResult.error) throw new Error(usersResult.error.message);

  const usersById = new Map(
    (usersResult.data ?? []).map((row) => [row.id, row]),
  );

  const technicians = (profilesResult.data ?? [])
    .flatMap((profile) => {
      const user = usersById.get(profile.id);

      if (!user) return [];

      return [
        mapAdminAssociatedTechnicianRow({
          id: profile.id,
          email: user.email,
          name: user.name,
          surname: user.surname,
          status: user.status,
          public_slug: profile.public_slug,
          available: profile.available,
          rating: profile.rating,
          rating_count: profile.rating_count,
          verified_at: profile.verified_at,
          created_at: profile.created_at,
        }),
      ];
    })
    .sort((left, right) => {
      if (right.rating !== left.rating) {
        return right.rating - left.rating;
      }

      if (right.rating_count !== left.rating_count) {
        return right.rating_count - left.rating_count;
      }

      return left.email.localeCompare(right.email);
    });

  return {
    kind: input.kind,
    item,
    technicians,
  };
}
