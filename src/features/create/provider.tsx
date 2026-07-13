"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createCreateStore, type CreateState, type CreateStore } from "./store";
import { planAction, enqueueAction } from "./actions";
import type { ComposerInput } from "./schema";

const CreateStoreContext = createContext<CreateStore | null>(null);

/** One store per mount, wired to the real server actions (SSR-request safe). */
export function CreateStoreProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Partial<ComposerInput>;
}) {
  const [store] = useState<CreateStore>(() =>
    createCreateStore({ plan: planAction, enqueue: enqueueAction }, initial),
  );
  return <CreateStoreContext.Provider value={store}>{children}</CreateStoreContext.Provider>;
}

/** Always subscribe through a selector — whole-store subscriptions fail review. */
export function useCreateStore<T>(selector: (state: CreateState) => T): T {
  const store = useContext(CreateStoreContext);
  if (!store) throw new Error("useCreateStore must be used within a CreateStoreProvider.");
  return useStore(store, selector);
}
