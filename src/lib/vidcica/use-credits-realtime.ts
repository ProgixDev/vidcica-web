"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Read the balance from a credits_accounts change payload. Pure — unit-tested. */
export function nextBalance(current: number, row: { balance?: number | null }): number {
  return typeof row.balance === "number" ? row.balance : current;
}

/**
 * Keep the seeded credit balance live over the `credits_accounts` realtime
 * channel (this table has no sensitive columns, so streaming its row is safe).
 */
export function useCreditsRealtime(userId: string, initial: number): number {
  const [credits, setCredits] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setCredits(initial);
  }

  // Channel topics must be unique PER MOUNT: the browser client is a
  // singleton, and `channel(name)` returns the existing instance for a
  // duplicate topic — adding a callback to an already-subscribed channel
  // throws (the shell mounts this hook twice: sidebar card + topbar chip).
  const mountId = useId();

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`credits_accounts:${userId}:${mountId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credits_accounts", filter: `user_id=eq.${userId}` },
        (payload) => {
          setCredits((c) => nextBalance(c, payload.new as { balance?: number | null }));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, mountId]);

  return credits;
}
