import { createApiClient } from '@servicienta/api-client';
import { mobileEnv } from './env';
import { getMobileSupabaseClient } from './supabase';

const FALLBACK_API_URL = 'http://127.0.0.1:3000';

export function createMobileApiClient() {
  return createApiClient({
    baseUrl: mobileEnv.apiUrl || FALLBACK_API_URL,
    getAccessToken: async () => {
      const supabase = getMobileSupabaseClient();
      if (!supabase) return null;

      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
  });
}
