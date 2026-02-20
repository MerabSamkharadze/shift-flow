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

const ROLE_HOME: Record<string, string> = {
  owner: "/owner",
  manager: "/manager",
  employee: "/employee",
};

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
  if (roleCookie && roleCookie in ROLE_HOME) {
    const myRoot = ROLE_HOME[roleCookie];
    const accessingWrongRole = Object.entries(ROLE_HOME).some(
      ([role, root]) => role !== roleCookie && pathname.startsWith(root),
    );
    if (accessingWrongRole) {
      const url = request.nextUrl.clone();
      url.pathname = myRoot;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
