export const mobileEnv = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL?.trim() ?? '',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '',
  get isConfigured() {
    return Boolean(this.apiUrl && this.supabaseUrl && this.supabaseAnonKey);
  },
};
