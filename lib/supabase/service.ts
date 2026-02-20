import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database.types"

/**
 * Service-role Supabase client — bypasses RLS entirely.
 *
 * ONLY use inside server-side code (API routes, Server Actions).
 * NEVER import this in client components or expose to the browser.
 */
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
