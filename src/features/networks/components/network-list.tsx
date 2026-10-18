"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlatformIcon } from "@/components/platform-icon";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { startNetworkOAuth } from "@/lib/vidcica/oauth";
import {
  CONNECT_REASON_KEY,
  connectablePlatforms,
  isMetaConnectReason,
  isMetaPlatform,
  networkStatus,
  type Network,
  type NetworkStatus,
  type PlatformId,
  type PlatformMeta,
} from "@/lib/vidcica/network";
import { useT, useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { disconnectMeta, disconnectNetwork, selectMetaPage, setNetworkPublish } from "../actions";

/** What the Page picker says when the server refuses a choice. */
const PAGE_ERROR_KEY: Record<string, MessageKey> = {
  needs_reconnect: "networks.page.reconnect",
  page_unavailable: "networks.page.unavailable",
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

function NetworkCard({
  platform,
  net,
  soleAction = false,
}: {
  platform: PlatformMeta;
  net?: Network;
  /** True when this row holds the only connect/reconnect action in the list —
   *  it then gets the ink pill; several side by side stay pale. */
  soleAction?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const numberFmt = new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /** Boosts meta-disconnect could not pause: nothing was disconnected yet. */
  const [pauseFailed, setPauseFailed] = useState<{
    campaigns: string[];
    url: string | null;
  } | null>(null);
  const status = networkStatus(platform, net);
  const connected = status === "connected";
  const meta = isMetaPlatform(platform.id);
  // Why the last Meta connect left this card unconnected (no Page shared, no
  // linked Instagram account…), stored by the server on the row.
  const reason = !connected && net?.connectReason ? net.connectReason : null;
  const pageChoices = platform.id === "facebook" && connected ? (net?.pages ?? []) : [];

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
    } else if (out.reason === "incomplete") {
      // The round-trip finished but this card can't be used yet: say why. The
      // other Meta card may have connected, so re-read the rows too.
      setMessage(
        t(
          isMetaConnectReason(out.detail)
            ? CONNECT_REASON_KEY[out.detail]
            : "networks.connectFailed",
        ),
      );
      router.refresh();
    } else if (out.reason === "platform_not_configured") {
      setMessage(t("common.comingSoon"));
    } else if (out.reason !== "cancelled") {
      setMessage(t("networks.connectFailed"));
    }
  }

  async function disconnect() {
    if (!net) return;
    if (meta) {
      // One Meta login fills both cards, and its running Boosts can only be
      // paused while Vidcica still holds the token: say so before acting.
      if (!window.confirm(t("networks.meta.disconnectConfirm"))) return;
      await disconnectBothMeta(false);
      return;
    }
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

  async function disconnectBothMeta(force: boolean) {
    setPending(true);
    setMessage(null);
    setPauseFailed(null);
    const res = await disconnectMeta(force);
    setPending(false);
    if (res.ok) {
      if (res.stillRunning > 0) {
        setMessage(t("networks.meta.stillRunning", { count: String(res.stillRunning) }));
      }
      router.refresh();
      return;
    }
    if (res.reason === "pause_failed" && "campaigns" in res) {
      setPauseFailed({ campaigns: res.campaigns, url: res.adsManagerUrl });
      return;
    }
    setMessage(t("networks.meta.disconnectFailed"));
  }

  async function choosePage(pageId: string) {
    if (!pageId || pageId === net?.pageId) return;
    setPending(true);
    setMessage(null);
    const res = await selectMetaPage(pageId);
    setPending(false);
    if (!res.ok) {
      setMessage(t(PAGE_ERROR_KEY[res.reason] ?? "networks.page.failed"));
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
  const actionVariant = soleAction ? "default" : "secondary";

  return (
    <li
      className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4"
      data-testid={`network-${platform.id}`}
    >
      <PlatformIcon platform={platform.id} size={40} muted={unavailable} />
      <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3
            className={cn(
              "text-[15px] leading-tight font-semibold",
              unavailable && "text-muted-foreground",
            )}
          >
            {platform.label}
          </h3>
          <Badge
            variant={status === "needs_reconnect" ? "warning" : "muted"}
            data-testid={`network-status-${platform.id}`}
          >
            {t(STATUS_KEY[status])}
          </Badge>
        </div>
        <p className="text-muted-foreground truncate text-[13px]">
          {connected && net?.handle
            ? `${net.handle}${
                typeof net.followers === "number"
                  ? ` · ${t("networks.followers", { count: numberFmt.format(net.followers) })}`
                  : ""
              }`
            : t(TAGLINE_KEY[platform.id])}
        </p>
        {reason && !message ? (
          <p
            className="text-warning text-[13px] leading-relaxed"
            data-testid={`network-reason-${platform.id}`}
          >
            {t(CONNECT_REASON_KEY[reason])}
          </p>
        ) : null}
        {connected ? (
          <label className="text-subtle-foreground mt-2 flex w-fit items-center gap-2.5 text-[13px] font-medium">
            <Switch
              checked={pub}
              onChange={toggle}
              aria-label={t("networks.autoLabel", { platform: platform.label })}
            />
            {t("networks.publishAuto")}
          </label>
        ) : null}
        {pageChoices.length > 1 ? (
          // Several Pages shared: the person picks where posts and Boosts go.
          // One Page needs no picker (the card already names it).
          <div className="mt-2 flex max-w-xs flex-col gap-1.5">
            <label
              htmlFor={`page-${platform.id}`}
              className="text-subtle-foreground text-[13px] font-medium"
            >
              {t("networks.page.label")}
            </label>
            <Select
              id={`page-${platform.id}`}
              value={net?.pageId ?? ""}
              onChange={(e) => void choosePage(e.target.value)}
              disabled={pending}
              data-testid="network-page-select"
            >
              {net?.pageId ? null : <option value="">{t("networks.page.choose")}</option>}
              {pageChoices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.id}
                  {p.igUsername ? ` · @${p.igUsername}` : ""}
                </option>
              ))}
            </Select>
            <p className="text-muted-foreground text-[13px]">{t("networks.page.hint")}</p>
          </div>
        ) : null}
        {message ? (
          <p role="alert" className="text-destructive mt-1 text-[13px]">
            {message}
          </p>
        ) : null}
        {pauseFailed ? (
          <div
            role="alert"
            className="bg-warning-subtle mt-2 flex flex-col gap-3 rounded-md p-4 text-[13px] leading-relaxed"
            data-testid="meta-pause-failed"
          >
            <p>{t("networks.meta.pauseFailed", { campaigns: pauseFailed.campaigns.join(", ") })}</p>
            <div className="flex flex-wrap gap-2">
              {pauseFailed.url ? (
                <a
                  href={pauseFailed.url}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  {t("networks.meta.openAdsManager")}
                </a>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void disconnectBothMeta(true)}
                disabled={pending}
                data-testid="meta-disconnect-anyway"
              >
                {t("networks.meta.disconnectAnyway")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {connected ? (
        <Button variant="ghost" size="sm" onClick={disconnect} disabled={pending}>
          {pending ? t("networks.disconnecting") : t("common.disconnect")}
        </Button>
      ) : status === "needs_reconnect" ? (
        <Button variant={actionVariant} size="sm" onClick={connect} disabled={pending}>
          {pending ? "…" : t("common.reconnect")}
        </Button>
      ) : status === "disconnected" ? (
        <Button
          variant={actionVariant}
          size="sm"
          onClick={connect}
          disabled={pending}
          data-testid={`connect-${platform.id}`}
        >
          {pending ? t("networks.connecting") : t("common.connect")}
        </Button>
      ) : null}
    </li>
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
  // X is dropped (paid API, provider === null) and Threads is held back — see
  // PUBLISHING_PLATFORMS. Instagram and Facebook are open to every account
  // since Meta approved the App Review (2026-10-18).
  const platforms = connectablePlatforms();
  // One filled action per group: the ink pill only when a single row can act.
  const actionable = platforms.filter((p) => {
    const st = networkStatus(p, byPlatform.get(p.id));
    return st === "disconnected" || st === "needs_reconnect";
  }).length;
  return (
    <ul className="bg-card flex flex-col rounded-lg py-2" data-testid="network-list">
      {platforms.map((p) => (
        <NetworkCard
          key={p.id}
          platform={p}
          net={byPlatform.get(p.id)}
          soleAction={actionable === 1}
        />
      ))}
    </ul>
  );
}
