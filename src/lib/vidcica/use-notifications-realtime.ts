"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  rowToNotification,
  type AppNotification,
  type NotificationRow,
} from "@/lib/vidcica/notification";

/** Fold a notifications change into the list: prepend a new row, patch an
 *  existing one (e.g. read flipped elsewhere). Pure — unit-tested (AC-3). */
export function mergeNotification(list: AppNotification[], n: AppNotification): AppNotification[] {
  const i = list.findIndex((x) => x.id === n.id);
  if (i === -1) return [n, ...list];
  const next = list.slice();
  next[i] = n;
  return next;
}

/**
 * Keep the seeded notifications live over the `notifications:{userId}` channel
 * (no sensitive columns, so streaming the row is safe). New rows appear at the
 * top and bump the unread count.
 */
export function useNotificationsRealtime(
  userId: string,
  initial: AppNotification[],
): AppNotification[] {
  const [items, setItems] = useState<AppNotification[]>(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setItems(initial);
  }

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            if (id) setItems((l) => l.filter((x) => x.id !== id));
            return;
          }
          setItems((l) => mergeNotification(l, rowToNotification(payload.new as NotificationRow)));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return items;
}
