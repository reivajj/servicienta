import type { ApiErrorResponse } from '@servicienta/types';

export interface ApiClientConfig {
  baseUrl: string;
  fetch?: typeof fetch;
  getAccessToken?: () =>
    | Promise<string | null | undefined>
    | string
    | null
    | undefined;
}

export interface ApiClientErrorOptions {
  status: number;
  payload: unknown;
}

export class ApiClientError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, options: ApiClientErrorOptions) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.payload = options.payload;
  }
}

export function normalizeBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '');

  if (!normalized) {
    throw new Error('Missing API base URL');
  }

  return normalized;
}

export async function parseResponsePayload(
  response: Response,
): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export function getErrorMessage(status: number, payload: unknown): string {
  if (isApiErrorResponse(payload)) {
    return payload.error;
  }

  return `Request failed with status ${status}`;
}

function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'string'
  );
}
