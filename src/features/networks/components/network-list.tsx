"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PlatformIcon, PLATFORM_ACCENT } from "@/components/platform-icon";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { startNetworkOAuth } from "@/lib/vidcica/oauth";
import {
  networkStatus,
  PLATFORMS,
  type Network,
  type NetworkStatus,
  type PlatformId,
  type PlatformMeta,
} from "@/lib/vidcica/network";
import { useT, useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { disconnectNetwork, setNetworkPublish } from "../actions";

/** Status-dot colour class (a small pulse-free indicator beside the label). */
const STATUS_DOT: Record<NetworkStatus, string> = {
  connected: "bg-success",
  needs_reconnect: "bg-warning",
  disconnected: "bg-muted-foreground/40",
  unavailable: "bg-muted-foreground/40",
};

/** Status label i18n key per connection state. */
const STATUS_KEY: Record<NetworkStatus, MessageKey> = {
  connected: "networks.status.connected",
  needs_reconnect: "networks.status.needsReconnect",
  disconnected: "networks.status.disconnected",
  unavailable: "common.comingSoon",
};

/** Short per-platform value line (replaces the repeated filler copy). */
const TAGLINE_KEY: Record<PlatformId, MessageKey> = {
  youtube: "networks.tagline.youtube",
  linkedin: "networks.tagline.linkedin",
  instagram: "networks.tagline.instagram",
  facebook: "networks.tagline.facebook",
  tiktok: "networks.tagline.tiktok",
  threads: "networks.tagline.threads",
  x: "common.comingSoon", // filtered out of the list anyway
};

function NetworkCard({ platform, net }: { platform: PlatformMeta; net?: Network }) {
  const t = useT();
  const locale = useLocale();
  const numberFmt = new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const status = networkStatus(platform, net);
  const connected = status === "connected";

  // Optimistic publish-toggle state so the switch flips instantly (a server
  // round-trip + router.refresh() otherwise leaves it frozen mid-click). Re-sync
  // from the server value on prop change (render-phase, not an effect).
  const serverPub = net?.publishesEnabled ?? false;
  const [pub, setPub] = useState(serverPub);
  const [prevPub, setPrevPub] = useState(serverPub);
  if (serverPub !== prevPub) {
    setPrevPub(serverPub);
    setPub(serverPub);
  }

  // Abort an in-flight OAuth poll if the user navigates away (no leaked popup /
  // setState-after-unmount).
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  async function connect() {
    // The popup MUST be opened synchronously in the click handler, or the
    // browser blocks it (oauth-start is an async call that would break that).
    const popup =
      typeof window !== "undefined"
        ? window.open("", "vidcica-oauth", "width=600,height=720")
        : null;
    const controller = new AbortController();
    abortRef.current = controller;
    setPending(true);
    setMessage(null);
    const supabase = createClient();
    const out = await startNetworkOAuth(supabase, platform.id, popup, {
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;
    setPending(false);
    if (out.ok) {
      router.refresh();
    } else if (out.reason === "platform_not_configured") {
      setMessage(t("common.comingSoon"));
    } else if (out.reason !== "cancelled") {
      setMessage(t("networks.connectFailed"));
    }
  }

  async function disconnect() {
    if (!net) return;
    setPending(true);
    setMessage(null);
    const res = await disconnectNetwork(net.id);
    setPending(false);
    if (!res.ok) {
      setMessage(res.message);
      return;
    }
    router.refresh();
  }

  async function toggle(enabled: boolean) {
    if (!net) return;
    setPub(enabled); // optimistic — snap the switch immediately
    setMessage(null);
    const res = await setNetworkPublish(net.id, enabled);
    if (!res.ok) {
      setPub(!enabled); // revert on failure
      setMessage(res.message);
      return;
    }
    router.refresh();
  }

  const unavailable = status === "unavailable";
  const accent = PLATFORM_ACCENT[platform.id];

  return (
    <div
      style={{ "--accent": accent } as React.CSSProperties}
      className={cn(
        "group bg-card relative flex flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300",
        !unavailable &&
          "hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[0_18px_44px_-18px_var(--accent)]",
      )}
      data-testid={`network-${platform.id}`}
    >
      {/* Soft brand glow — intensifies on hover for depth. */}
      <div
        aria-hidden
        style={{ background: "var(--accent)" }}
        className={cn(
          "pointer-events-none absolute -top-14 -right-10 size-36 rounded-full opacity-10 blur-2xl transition-opacity duration-300",
          !unavailable && "group-hover:opacity-25",
        )}
      />

      <div className="relative flex items-start gap-3.5">
        <PlatformIcon platform={platform.id} size={48} muted={unavailable} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="leading-tight font-semibold">{platform.label}</h3>
            <span
              className="text-muted-foreground bg-muted/70 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
              data-testid={`network-status-${platform.id}`}
            >
              <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
              {t(STATUS_KEY[status])}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {connected && net?.handle
              ? `${net.handle}${
                  typeof net.followers === "number"
                    ? ` · ${t("networks.followers", { count: numberFmt.format(net.followers) })}`
                    : ""
                }`
              : t(TAGLINE_KEY[platform.id])}
          </p>
        </div>
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        {connected ? (
          <>
            <label className="text-muted-foreground flex flex-1 items-center gap-2 text-xs font-medium">
              <Switch
                checked={pub}
                onChange={toggle}
                aria-label={t("networks.autoLabel", { platform: platform.label })}
              />
              {t("networks.publishAuto")}
            </label>
            <Button variant="ghost" size="sm" onClick={disconnect} disabled={pending}>
              {pending ? t("networks.disconnecting") : t("common.disconnect")}
            </Button>
          </>
        ) : status === "needs_reconnect" ? (
          <Button className="w-full rounded-full" onClick={connect} disabled={pending}>
            {pending ? "…" : t("common.reconnect")}
          </Button>
        ) : status === "disconnected" ? (
          <Button
            className="w-full rounded-full"
            onClick={connect}
            disabled={pending}
            data-testid={`connect-${platform.id}`}
          >
            {pending ? t("networks.connecting") : t("common.connect")}
          </Button>
        ) : (
          <span className="text-muted-foreground bg-muted/50 w-full rounded-full py-2 text-center text-sm font-medium">
            {t("common.comingSoon")}
          </span>
        )}
      </div>

      {message ? (
        <p role="alert" className="text-destructive relative mt-2 text-xs">
          {message}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The networks screen — a fixed catalog of platforms rendered from the
 * server-seeded rows. Connect (via popup) / disconnect / toggle each call
 * router.refresh() to re-read; we deliberately do NOT subscribe to the
 * `networks` realtime channel because it would stream token-ciphertext columns
 * to the browser (RLS gates rows, not columns).
 */
export function NetworkList({ initial }: { initial: Network[] }) {
  const byPlatform = new Map(initial.map((n) => [n.platform, n]));
  // X is dropped (paid API, provider === null) — don't surface it at all.
  const platforms = PLATFORMS.filter((p) => p.provider !== null);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="network-list">
      {platforms.map((p) => (
        <NetworkCard key={p.id} platform={p} net={byPlatform.get(p.id)} />
      ))}
    </div>
  );
}
