import type {
  AdminTechnicianCatalogItem,
  AdminTechnicianCatalogs,
  AdminTechniciansByCatalogItem,
  ListAdminTechnicianProfilesInput,
  ListAdminTechniciansByCatalogItemInput,
  ListPublicTechnicianProfilesInput,
  PaginatedAdminTechnicianProfiles,
  PublicTechnicianProfileCatalogs,
  PublicTechnicianProfile,
  AdminTechnicianProfile,
  UpdateTechnicianProfileInput,
} from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NotFoundError } from '../core/errors.js';
import { getCatalogItemBySlug, listCatalogItems } from './helpers/catalog.js';
import { listAssociatedTechnicianIds } from './helpers/relations.js';
import { buildTechnicianCountMap } from './helpers/utils.js';
import {
  mapAdminAssociatedTechnicianRow,
  mapAdminTechnicianCatalogItemRow,
  mapAdminTechnicianProfileRow,
  mapPublicTechnicianCatalogItemRow,
  mapPublicTechnicianProfileRow,
} from './mapper.js';
import type { AdminTechnicianProfileRow, PublicTechnicianProfileRow } from './types.js';
import { validateUpdateTechnicianProfileInput } from './validators.js';

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

  if (!data?.length) return [];
  const rows = data as PublicTechnicianProfileRow[];

  const { data: profiles, error: profilesError } = await supabase
    .from('technician_profiles')
    .select('public_slug, user:users!technician_profiles_id_fkey(name, surname)')
    .in('public_slug', rows.map((row) => row.public_slug));

  if (profilesError) throw new Error(profilesError.message);

  const usersBySlug = new Map(
    (profiles ?? []).map((profile) => [profile.public_slug, profile.user]),
  );

  return rows.map((row) =>
    mapPublicTechnicianProfileRow({
      ...row,
      user: usersBySlug.get(row.public_slug),
    }),
  );
}

export async function getPublicTechnicianProfileBySlug(
  supabase: SupabaseClient,
  publicSlug: string,
): Promise<PublicTechnicianProfile> {
  const { data, error } = await supabase
    .from('technician_profiles')
    .select(
      `
        public_slug,
        bio,
        rating,
        rating_count,
        available,
        verified_at,
        created_at,
        user:users!technician_profiles_id_fkey(
          name,
          surname
        )
      `,
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

export async function listAdminTechnicianProfiles(
  supabase: SupabaseClient,
  input: ListAdminTechnicianProfilesInput,
): Promise<PaginatedAdminTechnicianProfiles> {
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;

  const profilesQuery = buildAdminTechnicianProfilesQuery(
    supabase,
    input,
    from,
    to,
  );
  const totalQuery = buildAdminTechnicianProfilesCountQuery(supabase, input);
  const activeCountQuery = buildAdminTechnicianProfilesCountQuery(
    supabase,
    { ...input, status: undefined },
    'ACTIVE',
  );
  const deletedCountQuery = buildAdminTechnicianProfilesCountQuery(
    supabase,
    { ...input, status: undefined },
    'DELETED',
  );
  const availableCountQuery = buildAdminTechnicianProfilesCountQuery(
    supabase,
    { ...input, available: undefined },
    undefined,
    true,
  );

  const [
    profilesResult,
    totalResult,
    activeCountResult,
    deletedCountResult,
    availableCountResult,
  ] = await Promise.all([
    profilesQuery,
    totalQuery,
    activeCountQuery,
    deletedCountQuery,
    availableCountQuery,
  ]);

  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (totalResult.error) throw new Error(totalResult.error.message);
  if (activeCountResult.error) throw new Error(activeCountResult.error.message);
  if (deletedCountResult.error)
    throw new Error(deletedCountResult.error.message);
  if (availableCountResult.error)
    throw new Error(availableCountResult.error.message);

  const total = totalResult.count ?? profilesResult.count ?? 0;

  return {
    items: ((profilesResult.data ?? []) as AdminTechnicianProfileRow[]).flatMap(
      (row) => {
        const profile = mapAdminTechnicianProfileRow(row);

        return profile ? [profile] : [];
      },
    ),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
    summary: {
      totalTechnicians: total,
      activeTechnicians: activeCountResult.count ?? 0,
      deletedTechnicians: deletedCountResult.count ?? 0,
      availableTechnicians: availableCountResult.count ?? 0,
    },
  };
}

export async function getAdminTechnicianProfileById(
  supabase: SupabaseClient,
  technicianId: string,
): Promise<AdminTechnicianProfile> {
  const { data, error } = await supabase
    .from('users')
    .select(
      `
        id,
        email,
        name,
        surname,
        status,
        technician_profiles!inner(
          public_slug,
          available,
          rating,
          rating_count,
          verified_at,
          bio,
          phone,
          whatsapp_phone,
          preferred_contact_channel,
          base_address_text,
          base_lat,
          base_lng,
          service_radius_km,
          created_at,
          updated_at
        )
      `,
    )
    .eq('id', technicianId)
    .eq('role', 'technician')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('Technician profile not found');

  const profile = mapAdminTechnicianProfileRow(
    data as AdminTechnicianProfileRow,
  );
  if (!profile) throw new NotFoundError('Technician profile not found');

  return profile;
}

export async function updateAdminTechnicianProfileById(
  supabase: SupabaseClient,
  technicianId: string,
  input: UpdateTechnicianProfileInput,
): Promise<AdminTechnicianProfile> {
  await updateTechnicianProfilePayload(supabase, technicianId, input);

  return getAdminTechnicianProfileById(supabase, technicianId);
}

export async function getCurrentTechnicianProfile(
  supabase: SupabaseClient,
  technicianId: string,
): Promise<AdminTechnicianProfile> {
  return getAdminTechnicianProfileById(supabase, technicianId);
}

export async function updateCurrentTechnicianProfile(
  supabase: SupabaseClient,
  technicianId: string,
  input: UpdateTechnicianProfileInput,
): Promise<AdminTechnicianProfile> {
  await updateTechnicianProfilePayload(supabase, technicianId, input);

  return getCurrentTechnicianProfile(supabase, technicianId);
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

async function updateTechnicianProfilePayload(
  supabase: SupabaseClient,
  technicianId: string,
  input: UpdateTechnicianProfileInput,
) {
  const payload = validateUpdateTechnicianProfileInput(input);

  const { error: userError } = await supabase
    .from('users')
    .update({
      name: payload.name,
      surname: payload.surname,
    })
    .eq('id', technicianId)
    .eq('role', 'technician');

  if (userError) throw new Error(userError.message);

  const { error: profileError } = await supabase
    .from('technician_profiles')
    .update({
      bio: payload.bio,
      phone: payload.phone,
      whatsapp_phone: payload.whatsapp_phone,
      preferred_contact_channel: payload.preferred_contact_channel,
      base_address_text: payload.base_address_text,
      base_lat: payload.base_lat,
      base_lng: payload.base_lng,
      service_radius_km: payload.service_radius_km,
    })
    .eq('id', technicianId);

  if (profileError) throw new Error(profileError.message);
}

function buildAdminTechnicianProfilesQuery(
  supabase: SupabaseClient,
  input: ListAdminTechnicianProfilesInput,
  from: number,
  to: number,
) {
  let query = supabase
    .from('users')
    .select(
      `
        id,
        email,
        name,
        surname,
        status,
        technician_profiles!inner(
          public_slug,
          available,
          rating,
          rating_count,
          verified_at,
          bio,
          phone,
          whatsapp_phone,
          preferred_contact_channel,
          base_address_text,
          base_lat,
          base_lng,
          service_radius_km,
          created_at,
          updated_at
        )
      `,
      { count: 'exact' },
    )
    .eq('role', 'technician')
    .range(from, to);

  if (input.status) query = query.eq('status', input.status);
  if (typeof input.available === 'boolean') {
    query = query.eq('technician_profiles.available', input.available);
  }
  if (input.search) query = query.or(buildTechnicianSearchFilter(input.search));

  query = applyAdminTechnicianProfilesSort(query, input.sort ?? 'default');

  return query;
}

function buildAdminTechnicianProfilesCountQuery(
  supabase: SupabaseClient,
  input: ListAdminTechnicianProfilesInput,
  status?: 'ACTIVE' | 'DELETED',
  available?: boolean,
) {
  let query = supabase
    .from('users')
    .select('id, technician_profiles!inner(id)', { count: 'exact', head: true })
    .eq('role', 'technician');

  if (status) query = query.eq('status', status);
  if (input.status) query = query.eq('status', input.status);
  if (typeof available === 'boolean') {
    query = query.eq('technician_profiles.available', available);
  }
  if (typeof input.available === 'boolean') {
    query = query.eq('technician_profiles.available', input.available);
  }
  if (input.search) query = query.or(buildTechnicianSearchFilter(input.search));

  return query;
}

function buildTechnicianSearchFilter(search: string) {
  const escapedSearch = search.replace(/[%]/g, '');

  return [
    `email.ilike.%${escapedSearch}%`,
    `name.ilike.%${escapedSearch}%`,
    `surname.ilike.%${escapedSearch}%`,
  ].join(',');
}

function applyAdminTechnicianProfilesSort<
  TQuery extends {
    order(
      column: string,
      options?: {
        ascending?: boolean;
        foreignTable?: string;
        nullsFirst?: boolean;
      },
    ): TQuery;
  },
>(query: TQuery, sort: ListAdminTechnicianProfilesInput['sort']) {
  if (sort === 'rating-desc') {
    return query
      .order('rating', {
        foreignTable: 'technician_profiles',
        ascending: false,
      })
      .order('rating_count', {
        foreignTable: 'technician_profiles',
        ascending: false,
      })
      .order('email', { ascending: true });
  }

  if (sort === 'rating-asc') {
    return query
      .order('rating', {
        foreignTable: 'technician_profiles',
        ascending: true,
      })
      .order('rating_count', {
        foreignTable: 'technician_profiles',
        ascending: true,
      })
      .order('email', { ascending: true });
  }

  if (sort === 'name-asc') {
    return query
      .order('name', { ascending: true })
      .order('surname', { ascending: true })
      .order('email', { ascending: true });
  }

  if (sort === 'name-desc') {
    return query
      .order('name', { ascending: false })
      .order('surname', { ascending: false })
      .order('email', { ascending: false });
  }

  return query
    .order('created_at', {
      foreignTable: 'technician_profiles',
      ascending: false,
    })
    .order('email', { ascending: true });
}
