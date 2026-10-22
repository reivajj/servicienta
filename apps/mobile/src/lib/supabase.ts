import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createServicientaSupabaseClient,
  type ServicientaSupabaseClient,
} from '@servicienta/supabase';
import { mobileEnv } from './env';

let mobileClient: ServicientaSupabaseClient | null | undefined;

export function getMobileSupabaseClient() {
  if (mobileClient !== undefined) return mobileClient;

  if (!mobileEnv.supabaseUrl || !mobileEnv.supabaseAnonKey) {
    mobileClient = null;
    return mobileClient;
  }

  mobileClient = createServicientaSupabaseClient({
    url: mobileEnv.supabaseUrl,
    anonKey: mobileEnv.supabaseAnonKey,
    options: {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    },
  });

  return mobileClient;
}
