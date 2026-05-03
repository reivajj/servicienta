export interface OrderRow {
  id: string;
  client_id: string;
  status: string;
  flow_type: string;
  description: string;
  service_address_text: string;
  service_lat: number | null;
  service_lng: number | null;
  address_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminOrderRow extends OrderRow {
  client: {
    email: string;
    name: string | null;
    surname: string | null;
    status: string;
  } | Array<{
    email: string;
    name: string | null;
    surname: string | null;
    status: string;
  }>;
}
