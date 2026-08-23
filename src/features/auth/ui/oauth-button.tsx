"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/redirect";
import { cn } from "@/lib/utils";

/** Social providers offered on the web sign-in panel — the same two the mobile
 *  app offers (auth.store `continueWithGoogle` / `continueWithApple`). */
export type OAuthProvider = "google" | "apple";

/**
 * Shared «Continuer avec …» button. Both providers go through the identical web
 * PKCE redirect flow: Supabase sends the browser to the provider, the provider
 * returns to Supabase, and Supabase lands on /auth/callback which exchanges the
 * code for the session cookies. One code path, so Google and Apple cannot drift.
 *
 * Mobile signs in natively (`signInWithIdToken` with the bundle ID as audience);
 * the web uses the OAuth redirect (Services ID as audience). Same Supabase
 * project and the same `auth.users` row either way — one account everywhere.
 */
export function OAuthButton({
  provider,
  label,
  pendingLabel,
  icon,
  className,
  testId,
}: {
  provider: OAuthProvider;
  label: string;
  pendingLabel: string;
  icon: ReactNode;
  /** Provider-brand surface colours (Google: white, Apple: black). */
  className: string;
  testId: string;
}) {
  const next = safeRedirectPath(useSearchParams().get("next"), "/dashboard");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    // `provider` rides along so a failed exchange can name the right provider
    // in the error the panel shows.
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}&provider=${provider}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    // On success the browser navigates away — we only get here on failure.
    if (oauthError) {
      setPending(false);
      setError(oauthError.message);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        data-testid={testId}
        onClick={signIn}
        disabled={pending}
        className={cn(
          "focus-visible:ring-ring flex h-10 w-full items-center justify-center gap-2.5 rounded-full text-sm font-semibold shadow-xs transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60",
          className,
        )}
      >
        {icon}
        {pending ? pendingLabel : label}
      </button>
      {error ? (
        <p role="alert" className="text-destructive text-center text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
