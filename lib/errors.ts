/**
 * SEC-008: sanitize errors before they reach the client.
 *
 * Supabase/Postgres error objects carry schema details (column names, constraint
 * names, hints) that must never be sent to the browser. Log the real error
 * server-side — console.error is preserved in production builds (next.config.mjs)
 * so it still reaches Vercel/server logs — and return a generic message.
 */
export function safeError(error: unknown): string {
  console.error("[server]", error);
  return "Something went wrong";
}
