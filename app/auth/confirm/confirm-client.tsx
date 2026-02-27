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

      // ── PKCE flow ──────────────────────────────────────────────────────────
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type });
        if (error) {
          router.replace(
            `/auth/error?error=${encodeURIComponent(error.message)}`,
          );
        } else {
          router.replace(next);
        }
        return;
      }

      // ── Implicit flow (hash fragment) ──────────────────────────────────────
      // Supabase redirects here with #access_token=...&refresh_token=...
      // Parse the hash fragment and set the session manually.
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);

        // Check for errors in hash fragment (e.g. expired token)
        const hashError = params.get("error_description") || params.get("error");
        if (hashError) {
          router.replace(
            `/auth/error?error=${encodeURIComponent(hashError)}`,
          );
          return;
        }

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            router.replace(
              `/auth/error?error=${encodeURIComponent(error.message)}`,
            );
          } else {
            // Invited users must set a password before proceeding.
            router.replace("/auth/change-password");
          }
          return;
        }
      }

      // ── Fallback: check existing session ───────────────────────────────────
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