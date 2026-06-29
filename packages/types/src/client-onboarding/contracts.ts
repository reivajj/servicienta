import type { ClientPreferredContactChannel } from '../client-profiles/domain.js';
import type { ClientOnboardingProfile } from './domain.js';

export interface CompleteClientOnboardingInput {
  name: string;
  surname: string;
  phone: string | null;
  whatsapp_phone: string | null;
  default_address_text: string | null;
  address_notes: string | null;
  preferred_contact_channel: ClientPreferredContactChannel;
}

export interface CompleteClientOnboardingResponse {
  data: ClientOnboardingProfile;
}
