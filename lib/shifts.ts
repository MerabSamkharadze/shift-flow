/**
 * Canonical shift time math — shared by server actions, API export routes and
 * client schedule views so payroll totals, on-screen hours and overlap checks
 * all agree on one definition.
 *
 * Times are "HH:MM" or "HH:MM:SS" strings. A shift whose end time is less than
 * or equal to its start time is treated as crossing midnight (an overnight
 * shift): 22:00→06:00 is 8h, 16:00→00:00 is 8h. Only start === end (a
 * zero-length shift) is invalid and must be rejected at the write boundary.
 *
 * This module is intentionally dependency-free so it can be imported from both
 * server code and "use client" components without pulling server-only deps.
 */

/** Minutes since midnight for an "HH:MM[:SS]" string, or NaN if malformed. */
export function toMinutes(time: string): number {
  const parts = time.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

/**
 * Shift duration in decimal hours, correctly handling midnight rollover.
 * Returns 0 for malformed input or a zero-length shift.
 *
 * IMPORTANT: this replaces the old `Math.max(0, end - start)` implementations,
 * which silently reported every overnight/closing shift as 0 hours (LOGIC-001).
 */
export function shiftDurationHours(start: string, end: string): number {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  // A zero-length shift is 0 hours, NOT a full 24h day: without this guard the
  // rollover branch below would score end === start as 1440 minutes.
  if (e === s) return 0;
  const mins = e > s ? e - s : e + 1440 - s; // end < start ⇒ crosses midnight
  return mins / 60;
}

/** True when start and end land on the same clock minute (zero-length shift). */
export function isZeroLengthShift(start: string, end: string): boolean {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return !Number.isNaN(s) && !Number.isNaN(e) && s === e;
}

/**
 * Absolute [start, end) in minutes-from-epoch for a shift, so shifts on
 * different calendar dates — and overnight shifts spilling into the next day —
 * can be compared on one timeline. The date is anchored in UTC purely as a
 * stable day index; no wall-clock timezone is implied by this.
 */
function shiftAbsRange(
  date: string,
  start: string,
  end: string,
): [number, number] | null {
  const dayMs = Date.parse(`${date}T00:00:00Z`);
  const s = toMinutes(start);
  const e0 = toMinutes(end);
  if (Number.isNaN(dayMs) || Number.isNaN(s) || Number.isNaN(e0)) return null;
  const dayMin = dayMs / 60000;
  const e = e0 <= s ? e0 + 1440 : e0; // overnight rolls into the next day
  return [dayMin + s, dayMin + e];
}

/**
 * True when two shifts occupy any overlapping instant, accounting for calendar
 * date and midnight-spanning shifts. Intervals are half-open: a shift ending
 * exactly when another starts does NOT overlap.
 */
export function shiftsOverlap(
  aDate: string,
  aStart: string,
  aEnd: string,
  bDate: string,
  bStart: string,
  bEnd: string,
): boolean {
  const a = shiftAbsRange(aDate, aStart, aEnd);
  const b = shiftAbsRange(bDate, bStart, bEnd);
  if (!a || !b) return false;
  return a[0] < b[1] && b[0] < a[1];
}
