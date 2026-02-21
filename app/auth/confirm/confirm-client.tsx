"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

export function ConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function confirm() {
      const supabase = createClient();
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;
      const next = searchParams.get("next") ?? "/";

      // ── PKCE flow ────────────────────────────────────────────────────────────
      // Magic links, password recovery, sign-up confirmation, and invite links
      // on projects that send token_hash directly in the redirect URL.
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type });
        if (error) {
          router.replace(
            `/auth/error?error=${encodeURIComponent(error.message)}`,
          );
          return;
        }
        router.replace(next);
        return;
      }

      // ── Implicit flow ────────────────────────────────────────────────────────
      // Supabase invite emails go through the Supabase auth server first
      // (supabase.co/auth/v1/verify), which verifies the token server-side and
      // then redirects here with access_token + refresh_token in the URL hash
      // fragment (#access_token=...&type=invite).
      //
      // Hash fragments are never sent to the server, so route.ts can't see them.
      // The browser Supabase client (createBrowserClient) automatically detects
      // and exchanges hash-fragment tokens into a cookie session on init.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace(next);
      } else {
        router.replace(
          "/auth/error?error=Unable+to+confirm+your+account.+The+link+may+have+expired.",
        );
      }
    }

    confirm();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Confirming your account…
      </p>
    </div>
  );
}
