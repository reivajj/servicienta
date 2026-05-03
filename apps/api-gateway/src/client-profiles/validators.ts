import type {
  ClientPreferredContactChannel,
  ListClientProfilesInput,
  UpdateClientProfileInput,
  UserStatus,
  UsersPageSize,
} from '@servicienta/types';
import { ValidationError } from '../core/errors.js';

const ALLOWED_PAGE_SIZES: UsersPageSize[] = [25, 50, 100];

export function isUserStatus(value: string): value is UserStatus {
  return value === 'ACTIVE' || value === 'DELETED';
}

export function isClientPreferredContactChannel(
  value: string,
): value is ClientPreferredContactChannel {
  return value === 'phone' || value === 'whatsapp';
}

export function validateListClientProfilesInput(input: {
  page?: string;
  pageSize?: string;
  status?: string;
  search?: string;
}): ListClientProfilesInput {
  const page = input.page ? Number(input.page) : 1;
  const pageSize = input.pageSize ? Number(input.pageSize) : 25;
  const search = input.search?.trim() || undefined;

  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('Invalid page');
  }

  if (!ALLOWED_PAGE_SIZES.includes(pageSize as UsersPageSize)) {
    throw new ValidationError('Invalid page size');
  }

  if (input.status && !isUserStatus(input.status)) {
    throw new ValidationError('Invalid status filter');
  }

  return {
    page,
    pageSize: pageSize as UsersPageSize,
    status: input.status && isUserStatus(input.status) ? input.status : undefined,
    search,
  };
}

export function validateUpdateClientProfileInput(
  input: UpdateClientProfileInput,
): UpdateClientProfileInput {
  if (!isClientPreferredContactChannel(input.preferred_contact_channel)) {
    throw new ValidationError('Invalid preferred contact channel');
  }

  return {
    phone: normalizeNullableText(input.phone),
    whatsapp_phone: normalizeNullableText(input.whatsapp_phone),
    default_address_text: normalizeNullableText(input.default_address_text),
    address_notes: normalizeNullableText(input.address_notes),
    preferred_contact_channel: input.preferred_contact_channel,
  };
}

export function validateClientProfileId(
  value: string | string[] | undefined,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid client profile id');
  }

  return value;
}

function normalizeNullableText(value: string | null): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}
