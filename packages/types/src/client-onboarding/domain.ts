export interface ClientOnboardingProfile {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone: string | null;
  whatsapp_phone: string | null;
  default_address_text: string | null;
  address_notes: string | null;
  preferred_contact_channel: 'phone' | 'whatsapp';
}
