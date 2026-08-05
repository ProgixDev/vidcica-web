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
  hashtags,
  durationSec,
  deps,
}: {
  children: React.ReactNode;
  videoId: string;
  /** The video's hashtags — folded into per-platform caption overrides at confirm. */
  hashtags?: string[];
  /** Checked against TikTok's per-account max post duration before submitting. */
  durationSec?: number;
  deps?: PublishDeps;
}) {
  const [store] = useState<PublishStore>(() =>
    createPublishStore(deps ?? { enqueue: enqueuePublishAction }, {
      videoId,
      hashtags,
      durationSec,
    }),
  );
  return <PublishStoreContext.Provider value={store}>{children}</PublishStoreContext.Provider>;
}

export function usePublishStore<T>(selector: (state: PublishState) => T): T {
  const store = useContext(PublishStoreContext);
  if (!store) throw new Error("usePublishStore must be used within a PublishStoreProvider.");
  return useStore(store, selector);
}
