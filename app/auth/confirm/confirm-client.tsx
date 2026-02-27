"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

export function ConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = searchParams.get("next") ?? "/";

    // ── PKCE flow ────────────────────────────────────────────────────────────
    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
        if (error) {
          router.replace(
            `/auth/error?error=${encodeURIComponent(error.message)}`,
          );
        } else {
          router.replace(next);
        }
      });
      return;
    }

    // ── Implicit flow ────────────────────────────────────────────────────────
    // Supabase invite emails redirect here with access_token + refresh_token
    // in the URL hash fragment (#access_token=...&type=invite).
    // We listen for onAuthStateChange so the client has time to pick up
    // and exchange the hash-fragment tokens into a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          subscription.unsubscribe();
          router.replace(next);
        }
      },
    );

    // Fallback: if no auth event fires within 5 seconds, show error.
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      router.replace(
        "/auth/error?error=Unable+to+confirm+your+account.+The+link+may+have+expired.",
      );
    }, 5000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Confirming your account…
      </p>
    </div>
  );
}