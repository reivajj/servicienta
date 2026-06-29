import type {
  ListActivityEventsInput,
  ListActivityEventsResponse,
} from '@servicienta/types';

interface ActivityEventsApiClientDependencies {
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
}

export interface ActivityEventsApiClient {
  activityEvents: {
    admin: {
      list: (
        input: ListActivityEventsInput,
      ) => Promise<ListActivityEventsResponse>;
    };
  };
}

function buildActivityEventsQuery(input: ListActivityEventsInput) {
  const searchParams = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  if (input.entity_type) searchParams.set('entityType', input.entity_type);
  if (input.entity_id) searchParams.set('entityId', input.entity_id);
  if (input.event_type) searchParams.set('eventType', input.event_type);
  if (input.created_from) searchParams.set('createdFrom', input.created_from);
  if (input.created_to) searchParams.set('createdTo', input.created_to);

  return searchParams.toString();
}

export function createActivityEventsApiClient({
  apiFetch,
}: ActivityEventsApiClientDependencies): ActivityEventsApiClient {
  return {
    activityEvents: {
      admin: {
        list: (input) =>
          apiFetch<ListActivityEventsResponse>(
            `/api/admin/activity-events?${buildActivityEventsQuery(input)}`,
          ),
      },
    },
  };
}
