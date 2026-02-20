import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Signs the user out and redirects to login.
 * Used as a loop-breaker when a session exists but no users table row is found.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();

  const url = new URL("/auth/login", request.url);
  return NextResponse.redirect(url);
}
