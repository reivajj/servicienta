import {
  ApiClientError,
  type ApiClientConfig,
  getErrorMessage,
  normalizeBaseUrl,
  parseResponsePayload,
} from './http.js';
import { createUsersApiClient, type UsersApiClient } from '../users/client.js';
import {
  createClientProfilesApiClient,
  type ClientProfilesApiClient,
} from '../client-profiles/client.js';
import {
  createClientOnboardingApiClient,
  type ClientOnboardingApiClient,
} from '../client-onboarding/client.js';
import {
  createActivityEventsApiClient,
  type ActivityEventsApiClient,
} from '../activity-events/client.js';
import {
  createOperationsApiClient,
  type OperationsApiClient,
} from '../operations/client.js';
import { createOrdersApiClient, type OrdersApiClient } from '../orders/client.js';
import {
  createTechnicianProfilesApiClient,
  type TechnicianProfilesApiClient,
} from '../technician-profiles/client.js';

export interface ApiClient {
  activityEvents: ActivityEventsApiClient['activityEvents'];
  clientOnboarding: ClientOnboardingApiClient['clientOnboarding'];
  users: UsersApiClient['users'];
  clientProfiles: ClientProfilesApiClient['clientProfiles'];
  operations: OperationsApiClient['operations'];
  orders: OrdersApiClient['orders'];
  technicianProfiles: TechnicianProfilesApiClient['technicianProfiles'];
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const fetchImplementation = config.fetch ?? fetch;

  async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const accessToken = await config.getAccessToken?.();
    const response = await fetchImplementation(`${baseUrl}${path}`, {
      method: init?.method,
      body: init?.body,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers,
      },
    });

    const payload = await parseResponsePayload(response);

    if (!response.ok) {
      throw new ApiClientError(getErrorMessage(response.status, payload), {
        status: response.status,
        payload,
      });
    }

    return payload as T;
  }

  return {
    ...createActivityEventsApiClient({ apiFetch }),
    ...createUsersApiClient({ apiFetch }),
    ...createClientOnboardingApiClient({ apiFetch }),
    ...createClientProfilesApiClient({ apiFetch }),
    ...createOperationsApiClient({ apiFetch }),
    ...createOrdersApiClient({ apiFetch }),
    ...createTechnicianProfilesApiClient({ apiFetch }),
  };
}
