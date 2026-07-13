"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { askSupport } from "@/lib/vidcica/support";
import {
  createSupportStore,
  type SupportDeps,
  type SupportState,
  type SupportStore,
} from "./store";

const SupportStoreContext = createContext<SupportStore | null>(null);

/** One store per mount, wired to the real support-chat call. `deps` overrides for tests/harness. */
export function SupportStoreProvider({
  children,
  deps,
}: {
  children: React.ReactNode;
  deps?: SupportDeps;
}) {
  const [store] = useState<SupportStore>(() =>
    createSupportStore(deps ?? { ask: (turns) => askSupport(createClient(), turns) }),
  );
  return <SupportStoreContext.Provider value={store}>{children}</SupportStoreContext.Provider>;
}

export function useSupportStore<T>(selector: (state: SupportState) => T): T {
  const store = useContext(SupportStoreContext);
  if (!store) throw new Error("useSupportStore must be used within a SupportStoreProvider.");
  return useStore(store, selector);
}
