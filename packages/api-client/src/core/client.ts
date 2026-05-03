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
import { createOrdersApiClient, type OrdersApiClient } from '../orders/client.js';
import {
  createTechnicianProfilesApiClient,
  type TechnicianProfilesApiClient,
} from '../technician-profiles/client.js';

export interface ApiClient {
  users: UsersApiClient['users'];
  clientProfiles: ClientProfilesApiClient['clientProfiles'];
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
    ...createUsersApiClient({ apiFetch }),
    ...createClientProfilesApiClient({ apiFetch }),
    ...createOrdersApiClient({ apiFetch }),
    ...createTechnicianProfilesApiClient({ apiFetch }),
  };
}
