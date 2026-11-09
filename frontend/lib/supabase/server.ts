import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";
import { frontendEnv } from "../config";

export async function createClient() {
  const cookieStore = await cookies();

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // The `setAll` method was called from a Server Component.
      }
    },
  };

  return createServerClient<Database>(
    frontendEnv.NEXT_PUBLIC_SUPABASE_URL,
    frontendEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: cookieMethods }
  );
}
