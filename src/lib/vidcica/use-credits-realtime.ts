"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`credits_accounts:${userId}`)
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
  }, [userId]);

  return credits;
}
