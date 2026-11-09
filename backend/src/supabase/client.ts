import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.js";
import { env } from "../config/env.js";

/**
 * Creates an authenticated Supabase client for a specific user session token.
 * Passes the caller's JWT so that Supabase PostgreSQL enforces Row-Level Security (RLS).
 */
export function createScopedClient(accessToken?: string): SupabaseClient<Database> {
  return createSupabaseClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
}

/**
 * Service Role Supabase Client.
 * Bypasses RLS strictly for authorized background checkpointing and immutable audit logging.
 */
export const adminSupabase: SupabaseClient<Database> = createSupabaseClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

