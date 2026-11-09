import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";
import { frontendEnv } from "../config";

export function createClient() {
  return createBrowserClient<Database>(
    frontendEnv.NEXT_PUBLIC_SUPABASE_URL,
    frontendEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
