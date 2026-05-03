import type {
  AdminTechnicianProfilesSort,
  ListAdminTechnicianProfilesInput,
  ListAdminTechniciansByCatalogItemInput,
  ListPublicTechnicianProfilesInput,
  TechnicianCatalogKind,
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
    sort: input.sort && isAdminTechnicianProfilesSort(input.sort)
      ? input.sort
      : 'default',
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
