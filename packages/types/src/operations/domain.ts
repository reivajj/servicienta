export type OperationStatus =
  | 'pending'
  | 'scheduled'
  | 'completed_tech'
  | 'completed'
  | 'cancelled';

export interface Operation {
  id: string;
  order_id: string;
  technician_id: string;
  status: OperationStatus;
  scheduled_at: string | null;
  description: string | null;
  completed_at: string | null;
  technician_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminOperationTechnicianReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface AdminOperation extends Operation {
  order_status:
    | 'pending'
    | 'accepted'
    | 'cancelled'
    | 'in_progress'
    | 'completed_tech'
    | 'completed';
  order_flow_type: 'client_selects' | 'tech_applies';
  service_address_text: string;
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
