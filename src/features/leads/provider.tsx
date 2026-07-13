"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useStore } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { leadToRow, rowToLead, type Lead, type LeadRow } from "@/lib/vidcica/lead";
import { createLeadsStore, type LeadsDeps, type LeadsState, type LeadsStore } from "./store";

const LeadsStoreContext = createContext<LeadsStore | null>(null);

/** Browser CSV download (no-op server-side / in tests via DI override). */
function downloadCsv(filename: string, csv: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * One leads store per mount, wired to Supabase write-through + the `leads:{userId}`
 * realtime channel. `deps` overrides for tests. Re-seeds from the server list on
 * a router.refresh (render-phase, the sanctioned prop→state adjustment).
 */
export function LeadsStoreProvider({
  userId,
  initial,
  children,
  deps,
}: {
  userId: string;
  initial: Lead[];
  children: React.ReactNode;
  deps?: LeadsDeps;
}) {
  const [store] = useState<LeadsStore>(() =>
    createLeadsStore(
      deps ?? {
        upsert: async (lead) => {
          const supabase = createClient();
          await supabase.from("leads").upsert(leadToRow(lead, userId));
        },
        newId: () => crypto.randomUUID(),
        now: () => new Date().toISOString(),
        download: downloadCsv,
      },
      initial,
    ),
  );

  // Re-seed from the server list after a router.refresh. Done in an effect (not
  // during render) because the store is external with mounted subscribers —
  // mutating it mid-render would update a component while rendering another.
  useEffect(() => {
    store.getState().seed(initial);
  }, [initial, store]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`leads:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            if (id) store.getState().removeId(id);
            return;
          }
          store.getState().applyRow(rowToLead(payload.new as LeadRow));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, store]);

  return <LeadsStoreContext.Provider value={store}>{children}</LeadsStoreContext.Provider>;
}

export function useLeadsStore<T>(selector: (state: LeadsState) => T): T {
  const store = useContext(LeadsStoreContext);
  if (!store) throw new Error("useLeadsStore must be used within a LeadsStoreProvider.");
  return useStore(store, selector);
}
