import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@/core/env.client";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Supabase client for Client Components / browser code. Uses the public
 * anon/publishable key — RLS is the authorization boundary, not key secrecy.
 * See docs/architecture/backend.md.
 */
export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
