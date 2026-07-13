"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { startNetworkOAuth } from "@/lib/vidcica/oauth";
import {
  networkStatus,
  PLATFORMS,
  STATUS_LABEL,
  type Network,
  type PlatformMeta,
} from "@/lib/vidcica/network";
import { useNetworksRealtime } from "@/lib/vidcica/use-networks-realtime";
import { disconnectNetwork, setNetworkPublish } from "../actions";

const STATUS_VARIANT = {
  connected: "success",
  needs_reconnect: "warning",
  disconnected: "muted",
  unavailable: "muted",
} as const;

function NetworkRow({ platform, net }: { platform: PlatformMeta; net?: Network }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const status = networkStatus(platform, net);

  async function connect() {
    setPending(true);
    setMessage(null);
    const supabase = createClient();
    const out = await startNetworkOAuth(supabase, platform.id);
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
      className="bg-card flex items-center justify-between gap-4 rounded-xl border p-4"
      data-testid={`network-${platform.id}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{platform.label}</span>
          <Badge variant={STATUS_VARIANT[status]} data-testid={`network-status-${platform.id}`}>
            {STATUS_LABEL[status]}
          </Badge>
        </div>
        {status === "connected" && net?.handle ? (
          <span className="text-muted-foreground truncate text-xs">{net.handle}</span>
        ) : null}
        {message ? <span className="text-muted-foreground text-xs">{message}</span> : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {status === "connected" ? (
          <>
            <label className="text-muted-foreground flex items-center gap-2 text-xs">
              Publier
              <Switch
                checked={net?.publishesEnabled ?? false}
                onChange={toggle}
                aria-label={`Publier sur ${platform.label}`}
              />
            </label>
            <Button variant="ghost" size="sm" onClick={disconnect} disabled={pending}>
              Déconnecter
            </Button>
          </>
        ) : status === "needs_reconnect" ? (
          <Button size="sm" onClick={connect} disabled={pending}>
            {pending ? "…" : "Reconnecter"}
          </Button>
        ) : status === "disconnected" ? (
          <Button
            size="sm"
            onClick={connect}
            disabled={pending}
            data-testid={`connect-${platform.id}`}
          >
            {pending ? "Connexion…" : "Connecter"}
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">Indisponible</span>
        )}
      </div>
    </div>
  );
}

/** The networks screen — a fixed catalog of platforms kept live over the
 *  `networks` realtime channel (connect/disconnect reflect without refresh). */
export function NetworkList({ userId, initial }: { userId: string; initial: Network[] }) {
  const networks = useNetworksRealtime(userId, initial);
  const byPlatform = new Map(networks.map((n) => [n.platform, n]));

  return (
    <div className="flex flex-col gap-3" data-testid="network-list">
      {PLATFORMS.map((p) => (
        <NetworkRow key={p.id} platform={p} net={byPlatform.get(p.id)} />
      ))}
    </div>
  );
}
