export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function validateSupabaseConfig(): { ok: boolean; reason?: string } {
  if (!SUPABASE_URL) {
    return { ok: false, reason: 'Missing EXPO_PUBLIC_SUPABASE_URL' };
  }
  if (!SUPABASE_ANON_KEY) {
    return { ok: false, reason: 'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY' };
  }
  return { ok: true };
}
