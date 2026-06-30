import type { UserStatus } from '../users/domain.js';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'cancelled'
  | 'in_progress'
  | 'completed_tech'
  | 'completed';

export type OrderFlowType = 'client_selects' | 'tech_applies';

export interface Order {
  id: string;
  client_id: string;
  client_name: string | null;
  client_surname: string | null;
  client_phone: string | null;
  client_whatsapp_phone: string | null;
  technician_id: string | null;
  technician_public_slug: string | null;
  technician_name: string | null;
  technician_surname: string | null;
  technician_phone: string | null;
  technician_whatsapp_phone: string | null;
  status: OrderStatus;
  flow_type: OrderFlowType;
  description: string;
  service_address_text: string;
  service_lat: number | null;
  service_lng: number | null;
  address_notes: string | null;
  zone_slug: string | null;
  appliance_type_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminOrder extends Order {
  client_email: string;
  client_name: string | null;
  client_surname: string | null;
  client_status: UserStatus;
  technician_email: string | null;
  technician_status: UserStatus | null;
}
