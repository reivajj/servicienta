import type { UserStatus } from '../users/domain.js';

export type OrderStatus = 'open' | 'in_progress' | 'en_garantia' | 'closed';

export type OrderFlowType = 'client_selects' | 'tech_applies';

export interface Order {
  id: string;
  client_id: string;
  status: OrderStatus;
  flow_type: OrderFlowType;
  description: string;
  service_address_text: string;
  service_lat: number | null;
  service_lng: number | null;
  address_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminOrder extends Order {
  client_email: string;
  client_name: string | null;
  client_surname: string | null;
  client_status: UserStatus;
}
