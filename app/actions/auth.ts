"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { safeError } from "@/lib/errors"

/**
 * SEC-011: set the user's password AND clear must_change_password in a single
 * server-side step. Previously these were two separate, unlinked calls (a
 * client-side updateUser followed by a flag-clear), so the forced-change flag
 * could be cleared without ever setting a password. Here the flag is cleared
 * ONLY after the password update actually succeeds.
 */
export async function setInitialPassword(newPassword: string) {
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  // Set the password on the auth user, tied to this authenticated session.
  const { error: pwError } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (pwError) return { error: safeError(pwError) }

  // Only now — after the password was actually changed — clear the flag.
  const service = createServiceClient()
  const { error } = await service
    .from("users")
    .update({ must_change_password: false })
    .eq("id", user.id)

  if (error) return { error: safeError(error) }
  return { error: null }
}
