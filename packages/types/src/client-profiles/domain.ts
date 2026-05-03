import type { UserStatus } from '../users/domain.js';

export type ClientPreferredContactChannel = 'phone' | 'whatsapp';

export interface ClientProfile {
  id: string;
  phone: string | null;
  whatsapp_phone: string | null;
  default_address_text: string | null;
  default_lat: number | null;
  default_lng: number | null;
  address_notes: string | null;
  preferred_contact_channel: ClientPreferredContactChannel;
  created_at: string;
  updated_at: string;
}

export interface AdminClientProfile {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  status: UserStatus;
  deleted_at: string | null;
  user_created_at: string;
  phone: string | null;
  whatsapp_phone: string | null;
  default_address_text: string | null;
  default_lat: number | null;
  default_lng: number | null;
  address_notes: string | null;
  preferred_contact_channel: ClientPreferredContactChannel;
  created_at: string;
  updated_at: string;
}
