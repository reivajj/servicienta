import type {
  ClientPreferredContactChannel,
  CompleteClientOnboardingInput,
} from '@servicienta/types';
import { ValidationError } from '../core/errors.js';

export function validateCompleteClientOnboardingInput(
  input: CompleteClientOnboardingInput,
): CompleteClientOnboardingInput {
  const name = input.name?.trim();
  const surname = input.surname?.trim();

  if (!name) throw new ValidationError('Name is required');
  if (!surname) throw new ValidationError('Surname is required');

  if (!isClientPreferredContactChannel(input.preferred_contact_channel)) {
    throw new ValidationError('Invalid preferred contact channel');
  }

  return {
    name,
    surname,
    phone: normalizeNullableText(input.phone),
    whatsapp_phone: normalizeNullableText(input.whatsapp_phone),
    default_address_text: normalizeNullableText(input.default_address_text),
    address_notes: normalizeNullableText(input.address_notes),
    preferred_contact_channel: input.preferred_contact_channel,
  };
}

function isClientPreferredContactChannel(
  value: string,
): value is ClientPreferredContactChannel {
  return value === 'phone' || value === 'whatsapp';
}

function normalizeNullableText(value: string | null): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}
