export interface AdminClientProfileRow {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  status: string;
  deleted_at: string | null;
  user_created_at: string;
  phone: string | null;
  whatsapp_phone: string | null;
  default_address_text: string | null;
  default_lat: number | null;
  default_lng: number | null;
  address_notes: string | null;
  preferred_contact_channel: string;
  created_at: string;
  updated_at: string;
}
