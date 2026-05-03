import type {
  AdminClientProfile,
  ClientPreferredContactChannel,
} from '@servicienta/types';
import type { AdminClientProfileRow } from './types.js';
import {
  isClientPreferredContactChannel,
  isUserStatus,
} from './validators.js';

export function mapAdminClientProfileRow(
  row: AdminClientProfileRow,
): AdminClientProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    surname: row.surname,
    status: isUserStatus(row.status) ? row.status : 'ACTIVE',
    deleted_at: row.deleted_at,
    user_created_at: row.user_created_at,
    phone: row.phone,
    whatsapp_phone: row.whatsapp_phone,
    default_address_text: row.default_address_text,
    default_lat: row.default_lat,
    default_lng: row.default_lng,
    address_notes: row.address_notes,
    preferred_contact_channel: normalizePreferredContactChannel(
      row.preferred_contact_channel,
    ),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizePreferredContactChannel(
  value: string,
): ClientPreferredContactChannel {
  return isClientPreferredContactChannel(value) ? value : 'phone';
}
