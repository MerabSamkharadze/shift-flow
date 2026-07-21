/**
 * SEC-010: lightweight, dependency-free input validation for server actions and
 * API routes.
 *
 * Server actions are public HTTP endpoints and TypeScript types are erased at
 * runtime, so argument shapes must be checked at the boundary. This stays
 * intentionally small — Supabase/PostgREST still enforce column types; the point
 * here is to reject obviously-bad input early and to bound values that feed
 * business logic (payroll hours, free-text length).
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/; // HH:MM or HH:MM:SS
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

export function isEmail(v: unknown): v is string {
  return typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v);
}

export function isTime(v: unknown): v is string {
  return typeof v === "string" && TIME_RE.test(v);
}

export function isDate(v: unknown): v is string {
  return typeof v === "string" && DATE_RE.test(v);
}

/** Clamp extra hours to a sane, non-negative payroll range. */
export const MAX_EXTRA_HOURS = 24;
export function clampExtraHours(v: number | null): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_EXTRA_HOURS);
}

export const MAX_NAME = 100;
export const MAX_NOTE = 1000;

/** Trim + cap free text; returns null when empty. */
export function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length > 0 ? t : null;
}
