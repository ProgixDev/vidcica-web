"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand";
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
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <LogoMark className="size-12" />
      <h1 className="mt-8 text-[28px] leading-tight font-semibold tracking-[-0.03em]">
        {ok ? t("oauth.successTitle") : t("oauth.failureTitle")}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-xs text-[15px] leading-relaxed">
        {ok ? t("oauth.successBody") : t("oauth.failureBody")}
      </p>

      {stuck ? (
        <Button variant="secondary" className="mt-8" onClick={() => window.close()}>
          {t("common.close")}
        </Button>
      ) : null}
    </main>
  );
}
