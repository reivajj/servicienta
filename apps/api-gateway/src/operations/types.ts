export interface OperationRow {
  id: string;
  order_id: string;
  technician_id: string;
  status: string;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminOperationRow extends OperationRow {
  order: {
    status: string;
    flow_type: string;
    service_address_text: string;
    client_id: string;
    client: {
      email: string;
      name: string | null;
      surname: string | null;
    } | Array<{
      email: string;
      name: string | null;
      surname: string | null;
    }>;
  } | Array<{
    status: string;
    flow_type: string;
    service_address_text: string;
    client_id: string;
    client: {
      email: string;
      name: string | null;
      surname: string | null;
    } | Array<{
      email: string;
      name: string | null;
      surname: string | null;
    }>;
  }>;
  technician: {
    public_slug: string;
    user: {
      email: string;
      name: string | null;
      surname: string | null;
    } | Array<{
      email: string;
      name: string | null;
      surname: string | null;
    }>;
  } | Array<{
    public_slug: string;
    user: {
      email: string;
      name: string | null;
      surname: string | null;
    } | Array<{
      email: string;
      name: string | null;
      surname: string | null;
    }>;
  }>;
}
