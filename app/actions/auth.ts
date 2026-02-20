"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * Clears the must_change_password flag after the user has set a new password.
 * Uses service role so it can write regardless of RLS.
 */
export async function clearMustChangePassword() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const service = createServiceClient()
  const { error } = await service
    .from("users")
    .update({ must_change_password: false })
    .eq("id", user.id)

  if (error) return { error: error.message }
  return { error: null }
}
