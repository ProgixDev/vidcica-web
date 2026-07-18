"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/redirect";

/** Official Google “G” — 4-colour mark per Google's brand spec (as on mobile). */
function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

/**
 * «Continuer avec Google» — the same Supabase Google provider the mobile app
 * uses (auth.store continueWithGoogle), via the web PKCE redirect flow: Supabase
 * sends the browser to Google, then back to /auth/callback which exchanges the
 * code for the session cookies.
 */
export function GoogleButton() {
  const next = safeRedirectPath(useSearchParams().get("next"), "/dashboard");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
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
        onClick={signInWithGoogle}
        disabled={pending}
        className="focus-visible:ring-ring flex h-10 w-full items-center justify-center gap-2.5 rounded-full border border-black/10 bg-white text-sm font-semibold text-[#1A130C] shadow-xs transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
      >
        <GoogleG />
        {pending ? "Redirection vers Google…" : "Continuer avec Google"}
      </button>
      {error ? (
        <p role="alert" className="text-destructive text-center text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
