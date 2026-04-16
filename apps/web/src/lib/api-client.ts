import { createApiClient } from '@servicienta/api-client';
import { getSupabaseBrowserClient } from './supabase';

let browserApiClient: ReturnType<typeof createApiClient> | undefined;

export function getBrowserApiClient() {
  if (!browserApiClient) {
    browserApiClient = createApiClient({
      baseUrl: readApiBaseUrl(import.meta.env),
      getAccessToken: async () => {
        const { data } = await getSupabaseBrowserClient().auth.getSession();
        return data.session?.access_token ?? null;
      },
    });
  }

  return browserApiClient;
}

function readApiBaseUrl(env: ImportMetaEnv): string {
  const baseUrl = env.VITE_API_URL?.trim();

  if (!baseUrl) {
    throw new Error('Missing VITE_API_URL');
  }

  return baseUrl;
}
