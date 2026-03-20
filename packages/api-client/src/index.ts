import type {
  ApiErrorResponse,
  ListTechniciansResponse,
} from '@servicienta/types'

export interface ApiClientConfig {
  baseUrl: string
  fetch?: typeof fetch
  getAccessToken?: () =>
    | Promise<string | null | undefined>
    | string
    | null
    | undefined
}

export interface ApiClientErrorOptions {
  status: number
  payload: unknown
}

export class ApiClientError extends Error {
  status: number
  payload: unknown

  constructor(message: string, options: ApiClientErrorOptions) {
    super(message)
    this.name = 'ApiClientError'
    this.status = options.status
    this.payload = options.payload
  }
}

export interface ApiClient {
  technicians: {
    list: () => Promise<ListTechniciansResponse>
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const baseUrl = normalizeBaseUrl(config.baseUrl)
  const fetchImplementation = config.fetch ?? fetch

  async function apiFetch<T>(path: string): Promise<T> {
    const accessToken = await config.getAccessToken?.()
    const response = await fetchImplementation(`${baseUrl}${path}`, {
      headers: {
        Accept: 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })

    const payload = await parseResponsePayload(response)

    if (!response.ok) {
      throw new ApiClientError(getErrorMessage(response.status, payload), {
        status: response.status,
        payload,
      })
    }

    return payload as T
  }

  return {
    technicians: {
      list: () => apiFetch<ListTechniciansResponse>('/api/technicians'),
    },
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '')

  if (!normalized) {
    throw new Error('Missing API base URL')
  }

  return normalized
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function getErrorMessage(status: number, payload: unknown): string {
  if (isApiErrorResponse(payload)) {
    return payload.error
  }

  return `Request failed with status ${status}`
}

function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'string'
  )
}
