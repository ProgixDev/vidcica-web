"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import {
  isPushSupported,
  isPushConfigured,
  getPermission,
  isSubscribed,
  subscribeBrowser,
  unsubscribeBrowser,
} from "@/lib/vidcica/web-push";
import { saveWebPushSubscription, deleteWebPushSubscription } from "../push-actions";

type State = "loading" | "hidden" | "prompt" | "denied" | "enabled";

/**
 * Enable-push control at the top of the notification center. Asks the browser
 * for permission and subscribes this device to Web Push, so notifications arrive
 * even when the tab is closed. Renders nothing when push is unavailable (no VAPID
 * key, or an unsupported browser — e.g. iOS Safari that isn't installed as a PWA).
 */
export function EnablePushBanner() {
  const t = useT();
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!isPushConfigured() || !isPushSupported()) {
        if (active) setState("hidden");
        return;
      }
      if (getPermission() === "denied") {
        if (active) setState("denied");
        return;
      }
      const subbed = await isSubscribed();
      if (active) setState(subbed && getPermission() === "granted" ? "enabled" : "prompt");
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading" || state === "hidden") return null;

  async function enable() {
    setBusy(true);
    const res = await subscribeBrowser();
    if (!res.ok) {
      setBusy(false);
      if (res.reason === "denied") setState("denied");
      return;
    }
    // Persist server-side; roll the browser subscription back if the write fails
    // so local and server state never diverge.
    const saved = await saveWebPushSubscription(res.subscription);
    setBusy(false);
    if (saved.ok) {
      setState("enabled");
    } else {
      await unsubscribeBrowser();
      setState("prompt");
    }
  }

  async function disable() {
    setBusy(true);
    const { endpoint } = await unsubscribeBrowser();
    if (endpoint) await deleteWebPushSubscription(endpoint);
    setBusy(false);
    setState("prompt");
  }

  if (state === "enabled") {
    return (
      <div
        className="border-primary/30 bg-accent/40 flex items-center gap-3 rounded-xl border p-3"
        data-testid="push-banner"
        data-state="enabled"
      >
        <BellIcon className="text-primary size-4 shrink-0" filled />
        <span className="flex-1 text-sm font-medium">{t("push.enabledTitle")}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={disable}
          disabled={busy}
          data-testid="push-disable"
        >
          {t("push.disable")}
        </Button>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div
        className="bg-muted/40 flex items-start gap-3 rounded-xl border p-3"
        data-testid="push-banner"
        data-state="denied"
      >
        <BellOffIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{t("push.blockedTitle")}</span>
          <span className="text-muted-foreground text-xs">{t("push.blockedBody")}</span>
        </div>
      </div>
    );
  }

  // prompt
  return (
    <div
      className={cn(
        "border-primary/30 bg-accent/40 flex flex-col gap-3 rounded-xl border p-4",
        "sm:flex-row sm:items-center",
      )}
      data-testid="push-banner"
      data-state="prompt"
    >
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
        <BellIcon className="size-4.5" />
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold">{t("push.promptTitle")}</span>
        <span className="text-muted-foreground text-xs">{t("push.promptBody")}</span>
      </div>
      <Button
        size="sm"
        className="rounded-full"
        onClick={enable}
        disabled={busy}
        data-testid="push-enable"
      >
        {busy ? t("push.enabling") : t("push.enable")}
      </Button>
    </div>
  );
}

function BellIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function BellOffIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M8.7 3A6 6 0 0 1 18 8c0 3 .6 5 1.4 6.5M17 17H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
