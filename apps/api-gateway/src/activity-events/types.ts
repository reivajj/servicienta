export interface ActivityEventRow {
  id: string;
  actor_id: string;
  actor:
    | {
        email: string;
      }
    | Array<{
        email: string;
      }>
    | null;
  entity_type: string;
  entity_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}
