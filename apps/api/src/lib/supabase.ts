import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
  );
}

/**
 * Supabase server-side client with service role key.
 * Use ONLY in server-side code — never expose to the client.
 * Has full database access, bypasses RLS.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Verify a JWT token issued by Supabase Auth.
 * Returns the user payload or throws on invalid/expired token.
 */
export async function verifySupabaseToken(token: string) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error(error?.message ?? 'Invalid token');
  }
  return data.user;
}
