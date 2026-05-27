import type {
  AdminTechnicianProfilesSort,
  ListAdminTechnicianProfilesInput,
  ListAdminTechniciansByCatalogItemInput,
  ListPublicTechnicianProfilesInput,
  TechnicianCatalogKind,
  TechnicianPreferredContactChannel,
  UpdateTechnicianProfileInput,
  UsersPageSize,
} from '@servicienta/types';
import { ValidationError } from '../core/errors.js';

const ALLOWED_PAGE_SIZES: UsersPageSize[] = [25, 50, 100];

export function validateListPublicTechnicianProfilesInput(input: {
  zoneSlug?: string;
  applianceTypeSlug?: string;
  available?: string;
}): ListPublicTechnicianProfilesInput {
  const zoneSlug = input.zoneSlug?.trim();
  const applianceTypeSlug = input.applianceTypeSlug?.trim();

  if (!zoneSlug) {
    throw new ValidationError('Zone slug is required');
  }

  if (!applianceTypeSlug) {
    throw new ValidationError('Appliance type slug is required');
  }

  return {
    zoneSlug,
    applianceTypeSlug,
    available: parseOptionalBoolean(input.available),
  };
}

export function validatePublicTechnicianSlug(
  value: string | string[] | undefined,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid technician public slug');
  }

  return value.trim();
}

export function validateTechnicianId(
  value: string | string[] | undefined,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid technician id');
  }

  return value.trim();
}

export function validateAdminTechniciansByCatalogItemInput(input: {
  kind?: string | string[];
  slug?: string | string[];
}): ListAdminTechniciansByCatalogItemInput {
  const kind = normalizeCatalogKind(input.kind);
  const slug = normalizeSlug(input.slug);

  return { kind, slug };
}

export function validateListAdminTechnicianProfilesInput(input: {
  page?: string;
  pageSize?: string;
  status?: string;
  available?: string;
  search?: string;
  sort?: string;
}): ListAdminTechnicianProfilesInput {
  const page = input.page ? Number(input.page) : 1;
  const pageSize = input.pageSize ? Number(input.pageSize) : 25;
  const search = input.search?.trim() || undefined;

  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('Invalid page');
  }

  if (!ALLOWED_PAGE_SIZES.includes(pageSize as UsersPageSize)) {
    throw new ValidationError('Invalid page size');
  }

  if (input.status && input.status !== 'ACTIVE' && input.status !== 'DELETED') {
    throw new ValidationError('Invalid status filter');
  }

  if (input.sort && !isAdminTechnicianProfilesSort(input.sort)) {
    throw new ValidationError('Invalid sort');
  }

  return {
    page,
    pageSize: pageSize as UsersPageSize,
    status:
      input.status === 'ACTIVE' || input.status === 'DELETED'
        ? input.status
        : undefined,
    available: parseOptionalBoolean(input.available),
    search,
    sort:
      input.sort && isAdminTechnicianProfilesSort(input.sort)
        ? input.sort
        : 'default',
  };
}

export function validateUpdateTechnicianProfileInput(
  input: UpdateTechnicianProfileInput,
): UpdateTechnicianProfileInput {
  const name = normalizeRequiredText(input.name, 'Name is required');
  const preferredContactChannel = input.preferred_contact_channel;

  if (!isTechnicianPreferredContactChannel(preferredContactChannel)) {
    throw new ValidationError('Invalid preferred contact channel');
  }

  return {
    name,
    surname: normalizeNullableText(input.surname),
    bio: normalizeNullableText(input.bio),
    phone: normalizeNullableText(input.phone),
    whatsapp_phone: normalizeNullableText(input.whatsapp_phone),
    preferred_contact_channel: preferredContactChannel,
    base_address_text: normalizeNullableText(input.base_address_text),
    base_lat: normalizeNullableNumber(input.base_lat, 'Invalid base latitude'),
    base_lng: normalizeNullableNumber(input.base_lng, 'Invalid base longitude'),
    service_radius_km: normalizeNullableNumber(
      input.service_radius_km,
      'Invalid service radius',
    ),
  };
}

function isAdminTechnicianProfilesSort(
  value: string,
): value is AdminTechnicianProfilesSort {
  return (
    value === 'default' ||
    value === 'rating-desc' ||
    value === 'rating-asc' ||
    value === 'name-asc' ||
    value === 'name-desc'
  );
}

function isTechnicianPreferredContactChannel(
  value: string,
): value is TechnicianPreferredContactChannel {
  return value === 'phone' || value === 'whatsapp';
}

function parseOptionalBoolean(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new ValidationError('Invalid available filter');
}

function normalizeCatalogKind(
  value: string | string[] | undefined,
): TechnicianCatalogKind {
  if (typeof value !== 'string') {
    throw new ValidationError('Invalid technician catalog kind');
  }

  if (value === 'zones' || value === 'brands' || value === 'appliance-types') {
    return value;
  }

  throw new ValidationError('Invalid technician catalog kind');
}

function normalizeSlug(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid technician catalog slug');
  }

  return value.trim();
}

function normalizeRequiredText(value: string, errorMessage: string): string {
  const normalized = value?.trim();

  if (!normalized) throw new ValidationError(errorMessage);

  return normalized;
}

function normalizeNullableText(value: string | null): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeNullableNumber(
  value: number | null,
  errorMessage: string,
): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(errorMessage);
  }

  return value;
}
