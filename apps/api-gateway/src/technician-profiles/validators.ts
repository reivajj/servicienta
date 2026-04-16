import type {
  ListAdminTechniciansByCatalogItemInput,
  ListPublicTechnicianProfilesInput,
  TechnicianCatalogKind,
} from '@servicienta/types';
import { ValidationError } from '../core/errors.js';

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
