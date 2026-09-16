export const OPERATION_SCHEDULE_STEP_MINUTES = 10;

export type OperationStatus =
  | 'pending'
  | 'scheduled'
  | 'completed_tech'
  | 'completion_rejected'
  | 'completed'
  | 'cancelled';

export interface Operation {
  id: string;
  order_id: string;
  client_id: string;
  technician_id: string;
  technician_public_slug: string | null;
  status: OperationStatus;
  client_email: string | null;
  client_name: string | null;
  client_surname: string | null;
  client_phone: string | null;
  client_whatsapp_phone: string | null;
  technician_name: string | null;
  technician_surname: string | null;
  technician_email: string | null;
  technician_phone: string | null;
  technician_whatsapp_phone: string | null;
  order_status:
    | 'pending'
    | 'accepted'
    | 'cancelled'
    | 'in_progress'
    | 'completed_tech'
    | 'completion_rejected'
    | 'completed'
    | null;
  order_flow_type: 'client_selects' | 'tech_applies' | null;
  service_address_text: string | null;
  address_notes: string | null;
  zone_slug: string | null;
  appliance_type_slug: string | null;
  scheduled_at: string | null;
  description: string | null;
  completed_at: string | null;
  technician_completed_at: string | null;
  created_at: string;
  updated_at: string;
  technician_review: OperationTechnicianReview | null;
}

export interface OperationTechnicianReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export type AdminOperationTechnicianReview = OperationTechnicianReview;

export interface AdminOperation extends Operation {
  client_id: string;
  client_email: string;
  client_name: string | null;
  client_surname: string | null;
  technician_email: string;
  technician_name: string | null;
  technician_surname: string | null;
  technician_public_slug: string;
  technician_review: AdminOperationTechnicianReview | null;
}
