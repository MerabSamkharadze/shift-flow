import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/signout",
  "/auth/forgot-password",
  "/auth/update-password",
  "/auth/confirm",
  "/auth/error",
  "/auth/sign-up-success",
];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // ─── Not authenticated ──────────────────────────────────────────────────────
  if (!user) {
    if (isPublicPath) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // ─── Authenticated ──────────────────────────────────────────────────────────

  // Role-based route protection via sf-role cookie (set at login).
  // UX guard only — actual security is enforced by RLS policies.
  const roleCookie = request.cookies.get("sf-role")?.value;

  if (roleCookie) {
    // Owner/Manager: redirect old /owner, /manager routes → /dashboard
    if (roleCookie === "owner" || roleCookie === "manager") {
      if (pathname.startsWith("/owner") || pathname.startsWith("/manager")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
      // Block owner/manager from accessing /employee
      if (pathname.startsWith("/employee")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    // Employee: block from /owner, /manager, /dashboard
    if (roleCookie === "employee") {
      if (pathname.startsWith("/owner") || pathname.startsWith("/manager") || pathname.startsWith("/dashboard")) {
        const url = request.nextUrl.clone();
        url.pathname = "/employee";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
