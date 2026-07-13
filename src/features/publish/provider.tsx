"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import {
  createPublishStore,
  type PublishDeps,
  type PublishState,
  type PublishStore,
} from "./store";
import { enqueuePublishAction } from "./actions";

const PublishStoreContext = createContext<PublishStore | null>(null);

/** One store per mount, wired to the real enqueue action. `deps` overrides for tests/harness. */
export function PublishStoreProvider({
  children,
  videoId,
  deps,
}: {
  children: React.ReactNode;
  videoId: string;
  deps?: PublishDeps;
}) {
  const [store] = useState<PublishStore>(() =>
    createPublishStore(deps ?? { enqueue: enqueuePublishAction }, { videoId }),
  );
  return <PublishStoreContext.Provider value={store}>{children}</PublishStoreContext.Provider>;
}

export function usePublishStore<T>(selector: (state: PublishState) => T): T {
  const store = useContext(PublishStoreContext);
  if (!store) throw new Error("usePublishStore must be used within a PublishStoreProvider.");
  return useStore(store, selector);
}
