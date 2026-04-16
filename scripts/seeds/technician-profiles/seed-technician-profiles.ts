import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  TECHNICIAN_SEARCH_APPLIANCE_TYPES,
  TECHNICIAN_SEARCH_BRANDS,
  TECHNICIAN_SEARCH_FIXTURES,
  TECHNICIAN_SEARCH_ZONES,
} from '../../data/technician-profiles.js';
import { buildSeedEmail } from '../../lib/seed-tag.js';
import { seedUsers } from '../users/seed-users.js';
import type { SeedContext, SeederResult } from '../../lib/types.js';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
}

interface TechnicianProfileRow {
  id: string;
  public_slug: string;
}

interface SeedTechnicianProfilesOptions {
  context: SeedContext;
  technicianLimit?: number;
  technicianEmails?: string[];
}

interface SeedLookupData {
  applianceTypeIdsBySlug: Map<string, string>;
  brandIdsBySlug: Map<string, string>;
  zoneIdsBySlug: Map<string, string>;
}

const REVIEW_SCENARIO = 'technician-search-fixtures';
const REVIEW_CLIENT_COUNT = 6;

async function ensureCatalog(
  supabase: SupabaseClient,
  table: 'appliance_types' | 'brands' | 'zones',
  rows: Array<{ name: string; slug: string }>,
) {
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'slug' });

  if (error) {
    throw new Error(`Could not seed ${table}: ${error.message}`);
  }

  const { data, error: fetchError } = await supabase
    .from(table)
    .select('id, slug')
    .in(
      'slug',
      rows.map((row) => row.slug),
    );

  if (fetchError) {
    throw new Error(`Could not read ${table}: ${fetchError.message}`);
  }

  return new Map((data ?? []).map((row) => [row.slug, row.id]));
}

async function ensureReviewClients(context: SeedContext) {
  await seedUsers({
    context,
    count: REVIEW_CLIENT_COUNT,
    resolvedRoleCounts: {
      admins: 0,
      technicians: 0,
      clients: REVIEW_CLIENT_COUNT,
    },
    scenario: REVIEW_SCENARIO,
  });

  const emails = Array.from(
    { length: REVIEW_CLIENT_COUNT },
    (_, index) =>
      `seed-${context.env.seedTag}-client-${String(index + 1).padStart(3, '0')}@servicienta.local`,
  );

  const { data, error } = await context.supabase
    .from('users')
    .select('id, email, name, surname')
    .in('email', emails)
    .order('email', { ascending: true });

  if (error) {
    throw new Error(`Could not load review clients: ${error.message}`);
  }

  if ((data ?? []).length !== REVIEW_CLIENT_COUNT) {
    throw new Error(
      'Review clients seed did not create the expected amount of users',
    );
  }

  return data as UserRow[];
}

async function loadTargetTechnicians(
  context: SeedContext,
  technicianLimit: number,
  technicianEmails?: string[],
) {
  let query = context.supabase
    .from('users')
    .select('id, email, name, surname')
    .eq('role', 'technician')
    .order('created_at', { ascending: true });

  if (technicianEmails && technicianEmails.length > 0) {
    query = query.in('email', technicianEmails);
  } else {
    query = query.limit(technicianLimit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load technicians: ${error.message}`);
  }

  if (!data?.length) {
    throw new Error('No technician users were found. Seed technicians first.');
  }

  if (technicianEmails && technicianEmails.length > 0) {
    const technicianByEmail = new Map(
      data.map((technician) => [technician.email, technician]),
    );

    return technicianEmails
      .map((email) => technicianByEmail.get(email))
      .filter((technician): technician is UserRow => Boolean(technician));
  }

  return data as UserRow[];
}

async function loadTechnicianProfiles(
  context: SeedContext,
  technicianIds: string[],
) {
  const { data, error } = await context.supabase
    .from('technician_profiles')
    .select('id, public_slug')
    .in('id', technicianIds);

  if (error) {
    throw new Error(`Could not load technician profiles: ${error.message}`);
  }

  return new Map((data ?? []).map((row) => [row.id, row])) as Map<
    string,
    TechnicianProfileRow
  >;
}

async function ensureLookupData(context: SeedContext): Promise<SeedLookupData> {
  const [applianceTypeIdsBySlug, brandIdsBySlug, zoneIdsBySlug] =
    await Promise.all([
      ensureCatalog(
        context.supabase,
        'appliance_types',
        TECHNICIAN_SEARCH_APPLIANCE_TYPES,
      ),
      ensureCatalog(context.supabase, 'brands', TECHNICIAN_SEARCH_BRANDS),
      ensureCatalog(context.supabase, 'zones', TECHNICIAN_SEARCH_ZONES),
    ]);

  return {
    applianceTypeIdsBySlug,
    brandIdsBySlug,
    zoneIdsBySlug,
  };
}

async function resetTechnicianRelations(
  context: SeedContext,
  technicianIds: string[],
) {
  const storagePrefix = `seed/${context.env.seedTag}/`;

  const [applianceDelete, brandDelete, zoneDelete, documentsDelete] =
    await Promise.all([
      context.supabase
        .from('technician_appliance_specialties')
        .delete()
        .in('technician_id', technicianIds),
      context.supabase
        .from('technician_brand_specialties')
        .delete()
        .in('technician_id', technicianIds),
      context.supabase
        .from('technician_coverage_zones')
        .delete()
        .in('technician_id', technicianIds),
      context.supabase
        .from('technician_documents')
        .delete()
        .in('technician_id', technicianIds)
        .like('storage_key', `${storagePrefix}%`),
    ]);

  const relationErrors = [
    applianceDelete.error,
    brandDelete.error,
    zoneDelete.error,
    documentsDelete.error,
  ].filter(Boolean);

  if (relationErrors.length > 0) {
    throw new Error(
      relationErrors[0]?.message ?? 'Could not reset technician relations',
    );
  }
}

async function resetSeededReviews(
  context: SeedContext,
  reviewClientIds: string[],
) {
  const { error } = await context.supabase
    .from('technician_reviews')
    .delete()
    .in('client_id', reviewClientIds);

  if (error) {
    throw new Error(`Could not reset seeded reviews: ${error.message}`);
  }
}

function requireLookupId(
  catalogName: string,
  slug: string,
  id: string | undefined,
) {
  if (!id) {
    throw new Error(`Missing ${catalogName} seeded with slug "${slug}"`);
  }

  return id;
}

export async function seedTechnicianProfiles({
  context,
  technicianLimit = 10,
  technicianEmails,
}: SeedTechnicianProfilesOptions): Promise<SeederResult> {
  const targetCount = Math.min(
    technicianEmails?.length ?? technicianLimit,
    TECHNICIAN_SEARCH_FIXTURES.length,
  );
  const targetEmails = technicianEmails?.slice(0, targetCount);
  const technicians = await loadTargetTechnicians(
    context,
    targetCount,
    targetEmails,
  );
  const reviewClients = await ensureReviewClients(context);
  const lookupData = await ensureLookupData(context);
  const technicianIds = technicians.map((technician) => technician.id);
  const profilesById = await loadTechnicianProfiles(context, technicianIds);

  await resetTechnicianRelations(context, technicianIds);
  await resetSeededReviews(
    context,
    reviewClients.map((client) => client.id),
  );

  let createdProfiles = 0;
  let updatedProfiles = 0;

  for (const [index, technician] of technicians.entries()) {
    const fixture = TECHNICIAN_SEARCH_FIXTURES[index];
    const existingProfile = profilesById.get(technician.id);
    const displayName = [technician.name, technician.surname]
      .filter(Boolean)
      .join(' ')
      .trim();
    const publicSlug = existingProfile?.public_slug?.trim()
      ? existingProfile.public_slug
      : `${context.env.seedTag}-tech-${String(index + 1).padStart(2, '0')}`;

    const { error: profileError } = await context.supabase
      .from('technician_profiles')
      .upsert(
        {
          id: technician.id,
          public_slug: publicSlug,
          bio: `${displayName || 'Tecnico'} especializado en ${fixture.applianceSlugs.join(', ')} en CABA.`,
          available: true,
          base_address_text: fixture.baseAddressText,
          base_lat: fixture.baseLat,
          base_lng: fixture.baseLng,
          service_radius_km: fixture.serviceRadiusKm,
          verified_at: new Date(
            Date.UTC(2026, 0, index + 1, 12, 0, 0),
          ).toISOString(),
        },
        { onConflict: 'id' },
      );

    if (profileError) {
      throw new Error(
        `Could not upsert technician profile ${technician.email}: ${profileError.message}`,
      );
    }

    if (existingProfile) {
      updatedProfiles += 1;
    } else {
      createdProfiles += 1;
    }

    const applianceRows = fixture.applianceSlugs.map((applianceSlug) => ({
      technician_id: technician.id,
      appliance_type_id: requireLookupId(
        'appliance type',
        applianceSlug,
        lookupData.applianceTypeIdsBySlug.get(applianceSlug),
      ),
      supports_all_brands: !fixture.brandSpecialties.some(
        (brandSpecialty) => brandSpecialty.applianceSlug === applianceSlug,
      ),
      free_text: null,
    }));

    const brandRows = fixture.brandSpecialties.flatMap((brandSpecialty) =>
      brandSpecialty.brandSlugs.map((brandSlug) => ({
        technician_id: technician.id,
        appliance_type_id: requireLookupId(
          'appliance type',
          brandSpecialty.applianceSlug,
          lookupData.applianceTypeIdsBySlug.get(brandSpecialty.applianceSlug),
        ),
        brand_id: requireLookupId(
          'brand',
          brandSlug,
          lookupData.brandIdsBySlug.get(brandSlug),
        ),
      })),
    );

    const zoneRows = fixture.zoneSlugs.map((zoneSlug) => ({
      technician_id: technician.id,
      zone_id: requireLookupId(
        'zone',
        zoneSlug,
        lookupData.zoneIdsBySlug.get(zoneSlug),
      ),
    }));

    const documentRows = fixture.documents.map((document, documentIndex) => ({
      technician_id: technician.id,
      document_type: document.documentType,
      storage_key: `seed/${context.env.seedTag}/technicians/${technician.id}/document-${String(documentIndex + 1).padStart(2, '0')}.pdf`,
      title: document.title,
      description: document.description,
      is_public: document.isPublic,
    }));

    const reviewRows = fixture.reviewRatings.map((rating, reviewIndex) => ({
      technician_id: technician.id,
      order_id: randomUUID(),
      client_id: reviewClients[(index + reviewIndex) % reviewClients.length].id,
      rating,
      comment: `Seed review ${reviewIndex + 1} para ${displayName || technician.email}`,
    }));

    const [
      applianceInsert,
      brandInsert,
      zoneInsert,
      documentInsert,
      reviewInsert,
    ] = await Promise.all([
      context.supabase
        .from('technician_appliance_specialties')
        .insert(applianceRows),
      brandRows.length > 0
        ? context.supabase
            .from('technician_brand_specialties')
            .insert(brandRows)
        : Promise.resolve({ error: null }),
      context.supabase.from('technician_coverage_zones').insert(zoneRows),
      documentRows.length > 0
        ? context.supabase.from('technician_documents').insert(documentRows)
        : Promise.resolve({ error: null }),
      reviewRows.length > 0
        ? context.supabase.from('technician_reviews').insert(reviewRows)
        : Promise.resolve({ error: null }),
    ]);

    const insertErrors = [
      applianceInsert.error,
      brandInsert.error,
      zoneInsert.error,
      documentInsert.error,
      reviewInsert.error,
    ].filter(Boolean);

    if (insertErrors.length > 0) {
      throw new Error(
        `Could not seed technician relations for ${technician.email}: ${insertErrors[0]?.message ?? 'Unknown error'}`,
      );
    }
  }

  context.logger.info('Technician profiles seed completed', {
    seedTag: context.env.seedTag,
    technicians: technicians.length,
    appliances: TECHNICIAN_SEARCH_APPLIANCE_TYPES.length,
    zones: TECHNICIAN_SEARCH_ZONES.length,
    brands: TECHNICIAN_SEARCH_BRANDS.length,
  });

  return {
    entity: 'technician-profiles',
    created: createdProfiles,
    updated: updatedProfiles,
    deleted: 0,
    skipped: 0,
  };
}
