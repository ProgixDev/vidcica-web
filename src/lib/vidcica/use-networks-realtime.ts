"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { rowToNetwork, type Network, type NetworkRow } from "@/lib/vidcica/network";

/** Replace the network row by id (one row per platform). Pure — unit-tested. */
export function upsertNetwork(list: Network[], n: Network): Network[] {
  const i = list.findIndex((x) => x.id === n.id);
  if (i === -1) return [...list, n];
  const next = list.slice();
  next[i] = n;
  return next;
}

/**
 * Keep the seeded networks list live: the OAuth callback writes the `networks`
 * row server-side, so subscribing here reflects a connect/disconnect without a
 * manual refresh (drives AC-2 detection alongside the popup poll).
 */
export function useNetworksRealtime(userId: string, initial: Network[]): Network[] {
  const [networks, setNetworks] = useState<Network[]>(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setNetworks(initial);
  }

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`networks:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "networks", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          setNetworks((l) => upsertNetwork(l, rowToNetwork(payload.new as NetworkRow)));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return networks;
}
