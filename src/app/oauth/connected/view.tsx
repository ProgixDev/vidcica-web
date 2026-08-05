"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

/** Grace period before self-closing, so the reviewer/user sees the confirmation
 *  rather than a window that blinks shut. The opener's poll notices the closed
 *  popup and re-reads the `networks` row, so this is purely cosmetic timing. */
const AUTO_CLOSE_MS = 1500;

/**
 * The popup's last frame: confirm, then close itself. `window.close()` is
 * permitted here because the window was script-opened by the networks screen.
 * If the browser refuses (or the page was reached directly, with no opener),
 * we fall back to a manual button rather than stranding the user.
 */
export function OAuthConnectedView({ ok }: { ok: boolean }) {
  const t = useT();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.close();
      // Still here a beat later => the browser blocked the close.
      setTimeout(() => setStuck(true), 400);
    }, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 p-8 text-center">
      <span
        aria-hidden
        className={`flex size-16 items-center justify-center rounded-full ${
          ok ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ok ? <path d="M20 6 9 17l-5-5" /> : <path d="M18 6 6 18M6 6l12 12" />}
        </svg>
      </span>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold tracking-tight">
          {ok ? t("oauth.successTitle") : t("oauth.failureTitle")}
        </h1>
        <p className="text-muted-foreground max-w-xs text-sm">
          {ok ? t("oauth.successBody") : t("oauth.failureBody")}
        </p>
      </div>

      {stuck ? (
        <Button variant="outline" className="rounded-full" onClick={() => window.close()}>
          {t("common.close")}
        </Button>
      ) : null}
    </main>
  );
}
