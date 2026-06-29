import type {
  ClientOnboardingProfile,
  CompleteClientOnboardingInput,
} from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ForbiddenError } from '../core/errors.js';
import type { RequestAuth } from '../core/http.js';
import { recordActivityEvent } from '../activity-events/service.js';
import { validateCompleteClientOnboardingInput } from './validators.js';

interface ClientOnboardingRow {
  id: string;
  email: string;
  name: string;
  surname: string;
  client_profiles:
    | {
        phone: string | null;
        whatsapp_phone: string | null;
        default_address_text: string | null;
        address_notes: string | null;
        preferred_contact_channel: string;
      }
    | Array<{
        phone: string | null;
        whatsapp_phone: string | null;
        default_address_text: string | null;
        address_notes: string | null;
        preferred_contact_channel: string;
      }>;
}

export async function completeClientOnboarding(
  supabase: SupabaseClient,
  auth: RequestAuth,
  input: CompleteClientOnboardingInput,
): Promise<ClientOnboardingProfile> {
  if (auth.role !== 'client') throw new ForbiddenError('Client role required');

  const payload = validateCompleteClientOnboardingInput(input);

  const { error: userError } = await supabase
    .from('users')
    .update({
      email: auth.email,
      name: payload.name,
      surname: payload.surname,
      role: 'client',
      status: 'ACTIVE',
      deleted_at: null,
    })
    .eq('id', auth.id);

  if (userError) throw new Error(userError.message);

  const { error: profileError } = await supabase
    .from('client_profiles')
    .upsert(
      {
        id: auth.id,
        phone: payload.phone,
        whatsapp_phone: payload.whatsapp_phone,
        default_address_text: payload.default_address_text,
        address_notes: payload.address_notes,
        preferred_contact_channel: payload.preferred_contact_channel,
      },
      { onConflict: 'id' },
    );

  if (profileError) throw new Error(profileError.message);

  await recordActivityEvent(supabase, {
    actorId: auth.id,
    entityType: 'user',
    entityId: auth.id,
    eventType: 'user.client_onboarded',
    payload: {
      preferred_contact_channel: payload.preferred_contact_channel,
      has_phone: Boolean(payload.phone),
      has_default_address: Boolean(payload.default_address_text),
    },
  });

  return getClientOnboardingProfile(supabase, auth.id);
}

async function getClientOnboardingProfile(
  supabase: SupabaseClient,
  clientId: string,
): Promise<ClientOnboardingProfile> {
  const { data, error } = await supabase
    .from('users')
    .select(
      `
        id,
        email,
        name,
        surname,
        client_profiles!inner(
          phone,
          whatsapp_phone,
          default_address_text,
          address_notes,
          preferred_contact_channel
        )
      `,
    )
    .eq('id', clientId)
    .eq('role', 'client')
    .single();

  if (error) throw new Error(error.message);

  const row = data as ClientOnboardingRow;
  const profile = Array.isArray(row.client_profiles)
    ? row.client_profiles[0]
    : row.client_profiles;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    surname: row.surname,
    phone: profile.phone,
    whatsapp_phone: profile.whatsapp_phone,
    default_address_text: profile.default_address_text,
    address_notes: profile.address_notes,
    preferred_contact_channel:
      profile.preferred_contact_channel === 'whatsapp' ? 'whatsapp' : 'phone',
  };
}
