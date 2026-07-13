"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { createAdCampaign, resolveAdAccount } from "@/lib/vidcica/ads";
import { createDraftCampaign } from "./actions";
import { createBoostStore, type BoostDeps, type BoostState, type BoostStore } from "./store";

const BoostStoreContext = createContext<BoostStore | null>(null);

/** One boost store per mount, wired to the real edge client + create action.
 *  `deps` overrides for tests/harness. */
export function BoostStoreProvider({
  children,
  deps,
}: {
  children: React.ReactNode;
  deps?: BoostDeps;
}) {
  const [store] = useState<BoostStore>(() =>
    createBoostStore(
      deps ?? {
        resolveAccount: () => resolveAdAccount(createClient()),
        createDraft: (draft) => createDraftCampaign(draft),
        createCampaign: (id) => createAdCampaign(createClient(), id),
      },
    ),
  );
  return <BoostStoreContext.Provider value={store}>{children}</BoostStoreContext.Provider>;
}

export function useBoostStore<T>(selector: (state: BoostState) => T): T {
  const store = useContext(BoostStoreContext);
  if (!store) throw new Error("useBoostStore must be used within a BoostStoreProvider.");
  return useStore(store, selector);
}
