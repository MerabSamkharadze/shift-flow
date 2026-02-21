import { Suspense } from "react";
import { ConfirmClient } from "./confirm-client";

// This page handles all Supabase auth confirmation redirects:
//   - PKCE flow:     ?token_hash=xxx&type=invite (or signup, recovery, etc.)
//   - Implicit flow: #access_token=xxx&refresh_token=yyy&type=invite
//
// A client component is required because hash fragments are invisible to the
// server — the browser Supabase client must read and exchange them.
export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Confirming your account…
          </p>
        </div>
      }
    >
      <ConfirmClient />
    </Suspense>
  );
}
