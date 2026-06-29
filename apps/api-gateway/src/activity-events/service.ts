import type {
  ActivityEventEntityType,
  ActivityEventType,
  ListActivityEventsInput,
  PaginatedActivityEvents,
} from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { mapActivityEventRow } from './mapper.js';
import type { ActivityEventRow } from './types.js';

const ACTIVITY_EVENT_SELECT =
  'id, actor_id, entity_type, entity_id, event_type, payload, created_at, actor:users!activity_events_actor_id_fkey(email)';

export interface RecordActivityEventInput {
  actorId: string;
  entityType: ActivityEventEntityType;
  entityId: string;
  eventType: ActivityEventType;
  payload?: Record<string, unknown> | null;
}

export async function recordActivityEvent(
  supabase: SupabaseClient,
  input: RecordActivityEventInput,
) {
  const { error } = await supabase.from('activity_events').insert({
    actor_id: input.actorId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    event_type: input.eventType,
    payload: input.payload ?? null,
  });

  if (error) {
    console.warn(`Could not record activity event: ${error.message}`);
  }
}

export async function listActivityEvents(
  supabase: SupabaseClient,
  input: ListActivityEventsInput,
): Promise<PaginatedActivityEvents> {
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;
  const eventsQuery = buildActivityEventsQuery(supabase, input, from, to);
  const totalQuery = buildActivityEventsCountQuery(supabase, input);
  const [eventsResult, totalResult] = await Promise.all([
    eventsQuery,
    totalQuery,
  ]);

  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (totalResult.error) throw new Error(totalResult.error.message);

  const total = totalResult.count ?? eventsResult.count ?? 0;

  return {
    items: ((eventsResult.data ?? []) as ActivityEventRow[]).map(
      mapActivityEventRow,
    ),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
  };
}

function buildActivityEventsQuery(
  supabase: SupabaseClient,
  input: ListActivityEventsInput,
  from: number,
  to: number,
) {
  let query = supabase
    .from('activity_events')
    .select(ACTIVITY_EVENT_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  query = applyActivityEventsFilters(query, input);

  return query;
}

function buildActivityEventsCountQuery(
  supabase: SupabaseClient,
  input: ListActivityEventsInput,
) {
  let query = supabase
    .from('activity_events')
    .select('id', { count: 'exact', head: true });

  query = applyActivityEventsFilters(query, input);

  return query;
}

function applyActivityEventsFilters<
  TQuery extends {
    eq(column: string, value: string): TQuery;
    gte(column: string, value: string): TQuery;
    lte(column: string, value: string): TQuery;
  },
>(query: TQuery, input: ListActivityEventsInput): TQuery {
  let nextQuery = query;

  if (input.entity_type) nextQuery = nextQuery.eq('entity_type', input.entity_type);
  if (input.entity_id) nextQuery = nextQuery.eq('entity_id', input.entity_id);
  if (input.event_type) nextQuery = nextQuery.eq('event_type', input.event_type);
  if (input.created_from)
    nextQuery = nextQuery.gte('created_at', input.created_from);
  if (input.created_to) nextQuery = nextQuery.lte('created_at', input.created_to);

  return nextQuery;
}
