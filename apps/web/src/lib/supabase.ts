import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase browser client singleton.
 * Uses @supabase/ssr for Next.js App Router compatibility.
 * Handles cookie-based session management automatically.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

let _client: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!_client) _client = createSupabaseBrowserClient();
  return _client;
}

export type { User, Session } from '@supabase/supabase-js';
