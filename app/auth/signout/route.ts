import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Signs the user out and redirects to login.
 * Used as a loop-breaker when a session exists but no users table row is found.
 */
export async function GET(request: NextRequest) {
  const loginUrl = new URL("/auth/login", request.url);

  // SEC-014: this is a state-changing GET (kept as GET because it is reached via
  // server-side redirect() loop-breakers). Reject cross-site requests so a
  // third-party `<img src="/auth/signout">` cannot force a logout (CSRF).
  // Legitimate navigations are same-origin / same-site / none (typed / bookmark).
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site" || site === "cross-origin") {
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(loginUrl);
  // Also clear the role cookie for symmetry with the client logout button.
  response.cookies.set("sf-role", "", { path: "/", maxAge: 0 });
  return response;
}
