export interface OrderRow {
  id: string;
  client_id: string;
  client?:
    | {
        name: string | null;
        surname: string | null;
        client_profile?:
          | {
              phone: string | null;
              whatsapp_phone: string | null;
            }
          | Array<{
              phone: string | null;
              whatsapp_phone: string | null;
            }>
          | null;
      }
    | Array<{
        name: string | null;
        surname: string | null;
        client_profile?:
          | {
              phone: string | null;
              whatsapp_phone: string | null;
            }
          | Array<{
              phone: string | null;
              whatsapp_phone: string | null;
            }>
          | null;
      }>
    | null;
  technician_id: string | null;
  technician?:
    | {
        phone: string | null;
        whatsapp_phone: string | null;
        user:
          | {
              name: string | null;
              surname: string | null;
            }
          | Array<{
              name: string | null;
              surname: string | null;
            }>;
      }
    | Array<{
        phone: string | null;
        whatsapp_phone: string | null;
        user:
          | {
              name: string | null;
              surname: string | null;
            }
          | Array<{
              name: string | null;
              surname: string | null;
            }>;
      }>
    | null;
  status: string;
  flow_type: string;
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
  technician:
    | {
        public_slug: string;
        phone: string | null;
        whatsapp_phone: string | null;
        user:
          | {
              email: string;
              name: string | null;
              surname: string | null;
              status: string;
            }
          | Array<{
              email: string;
              name: string | null;
              surname: string | null;
              status: string;
            }>;
      }
    | Array<{
        public_slug: string;
        phone: string | null;
        whatsapp_phone: string | null;
        user:
          | {
              email: string;
              name: string | null;
              surname: string | null;
              status: string;
            }
          | Array<{
              email: string;
              name: string | null;
              surname: string | null;
              status: string;
            }>;
      }>
    | null;
}
