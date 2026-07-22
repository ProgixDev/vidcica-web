"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { rowToCampaign, type Campaign, type CampaignRow } from "@/lib/vidcica/campaign";

/** Replace the campaign in place if present (no reorder on a status/metric change),
 *  else prepend it. Pure — unit-tested. */
export function upsertCampaign(list: Campaign[], c: Campaign): Campaign[] {
  const i = list.findIndex((x) => x.id === c.id);
  if (i === -1) return [c, ...list];
  const next = list.slice();
  next[i] = c;
  return next;
}

/** Remove a campaign by id. Pure. */
export function removeCampaign(list: Campaign[], id: string): Campaign[] {
  return list.filter((x) => x.id !== id);
}

/**
 * Keep the server-seeded campaigns list live over the `campaigns:{userId}` channel
 * — the sync-ad-insights cron writes status/metrics, and this reflects them without
 * a refresh. Campaign rows carry no secrets, so streaming the row is safe.
 */
export function useCampaignsRealtime(userId: string, initial: Campaign[]): Campaign[] {
  const [items, setItems] = useState<Campaign[]>(initial);
  // Re-seed from the server during render (not an effect) when a router.refresh()
  // hands down a new `initial` — the sanctioned "adjust state on prop change".
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setItems(initial);
  }

  // Unique-per-mount topic — the singleton client returns the existing channel
  // for a duplicate topic and a second `.on()` after subscribe() throws.
  // See [[supabase-realtime-channel-gotcha]].
  const mountId = useId();

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`campaigns:${userId}:${mountId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            if (id) setItems((l) => removeCampaign(l, id));
            return;
          }
          setItems((l) => upsertCampaign(l, rowToCampaign(payload.new as CampaignRow)));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, mountId]);

  return items;
}
