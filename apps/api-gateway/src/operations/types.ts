export interface OperationRow {
  id: string;
  order_id: string;
  technician_id: string;
  status: string;
  order?:
    | {
        status: string;
        flow_type: string;
        service_address_text: string;
        address_notes: string | null;
        zone_slug: string | null;
        appliance_type_slug: string | null;
        client_id: string;
        client?:
          | {
              email: string;
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
              email: string;
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
            }>;
      }
    | Array<{
        status: string;
        flow_type: string;
        service_address_text: string;
        address_notes: string | null;
        zone_slug: string | null;
        appliance_type_slug: string | null;
        client_id: string;
        client?:
          | {
              email: string;
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
              email: string;
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
            }>;
      }>;
  technician?:
    | {
        public_slug: string;
        phone: string | null;
        whatsapp_phone: string | null;
        user:
          | {
              email: string;
              name: string | null;
              surname: string | null;
            }
          | Array<{
              email: string;
              name: string | null;
              surname: string | null;
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
            }
          | Array<{
              email: string;
              name: string | null;
              surname: string | null;
            }>;
      }>;
  scheduled_at: string | null;
  description: string | null;
  completed_at: string | null;
  technician_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminOperationRow extends OperationRow {
  order:
    | {
        status: string;
        flow_type: string;
        service_address_text: string;
        address_notes: string | null;
        zone_slug: string | null;
        appliance_type_slug: string | null;
        client_id: string;
        client:
          | {
              email: string;
              name: string | null;
              surname: string | null;
            }
          | Array<{
              email: string;
              name: string | null;
              surname: string | null;
            }>;
      }
    | Array<{
        status: string;
        flow_type: string;
        service_address_text: string;
        address_notes: string | null;
        zone_slug: string | null;
        appliance_type_slug: string | null;
        client_id: string;
        client:
          | {
              email: string;
              name: string | null;
              surname: string | null;
            }
          | Array<{
              email: string;
              name: string | null;
              surname: string | null;
            }>;
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
            }
          | Array<{
              email: string;
              name: string | null;
              surname: string | null;
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
            }
          | Array<{
              email: string;
              name: string | null;
              surname: string | null;
            }>;
      }>;
}

export interface TechnicianReviewRow {
  id: string;
  technician_id: string;
  operation_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
