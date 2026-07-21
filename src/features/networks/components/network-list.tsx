"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PlatformIcon } from "@/components/platform-icon";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { startNetworkOAuth } from "@/lib/vidcica/oauth";
import {
  networkStatus,
  PLATFORMS,
  STATUS_LABEL,
  type Network,
  type PlatformMeta,
} from "@/lib/vidcica/network";
import { disconnectNetwork, setNetworkPublish } from "../actions";

const STATUS_VARIANT = {
  connected: "success",
  needs_reconnect: "warning",
  disconnected: "muted",
  unavailable: "muted",
} as const;

const numberFmt = new Intl.NumberFormat("fr-FR");

function NetworkCard({ platform, net }: { platform: PlatformMeta; net?: Network }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const status = networkStatus(platform, net);
  const connected = status === "connected";

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
      setMessage("Bientôt disponible");
    } else if (out.reason !== "cancelled") {
      setMessage("La connexion a échoué. Réessayez.");
    }
  }

  async function disconnect() {
    if (!net) return;
    setPending(true);
    await disconnectNetwork(net.id);
    setPending(false);
    router.refresh();
  }

  async function toggle(enabled: boolean) {
    if (!net) return;
    await setNetworkPublish(net.id, enabled);
    router.refresh();
  }

  return (
    <div
      className="bg-card flex flex-col gap-3 rounded-2xl border p-4"
      data-testid={`network-${platform.id}`}
    >
      <div className="flex items-center gap-3">
        <PlatformIcon platform={platform.id} size={44} muted={!connected} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{platform.label}</span>
            <Badge variant={STATUS_VARIANT[status]} data-testid={`network-status-${platform.id}`}>
              {STATUS_LABEL[status]}
            </Badge>
          </div>
          {connected && net?.handle ? (
            <p className="text-muted-foreground truncate text-xs">
              {net.handle}
              {typeof net.followers === "number"
                ? ` · ${numberFmt.format(net.followers)} abonnés`
                : ""}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              {message ??
                (status === "unavailable"
                  ? "API payante — non proposé"
                  : "Publiez vos vidéos en un clic.")}
            </p>
          )}
        </div>
      </div>

      <div className="border-border/60 flex items-center justify-between gap-3 border-t pt-3">
        {connected ? (
          <>
            <label className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
              <Switch
                checked={net?.publishesEnabled ?? false}
                onChange={toggle}
                aria-label={`Publier sur ${platform.label}`}
              />
              Publication auto
            </label>
            <Button variant="ghost" size="sm" onClick={disconnect} disabled={pending}>
              Déconnecter
            </Button>
          </>
        ) : status === "needs_reconnect" ? (
          <Button size="sm" className="rounded-full" onClick={connect} disabled={pending}>
            {pending ? "…" : "Reconnecter"}
          </Button>
        ) : status === "disconnected" ? (
          <Button
            size="sm"
            className="rounded-full"
            onClick={connect}
            disabled={pending}
            data-testid={`connect-${platform.id}`}
          >
            {pending ? "Connexion…" : "Connecter"}
          </Button>
        ) : (
          <span
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground pointer-events-none",
            )}
          >
            Bientôt disponible
          </span>
        )}
      </div>
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
  return (
    <div className="grid gap-3 sm:grid-cols-2" data-testid="network-list">
      {PLATFORMS.map((p) => (
        <NetworkCard key={p.id} platform={p} net={byPlatform.get(p.id)} />
      ))}
    </div>
  );
}
