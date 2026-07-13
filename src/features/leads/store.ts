import { createStore } from "zustand/vanilla";
import {
  pushInteraction,
  toCsv,
  type ContactKind,
  type Lead,
  type LeadStatus,
  STATUS_META,
} from "@/lib/vidcica/lead";

/**
 * Leads CRM state machine. Mirrors ClipFlow/src/store/leads.store.ts: optimistic
 * local mutations + a whole-row write-through, seeded from an RSC list and folded
 * with the `leads` realtime channel. Side-effects (upsert / id / clock / download)
 * are injected so every mutation is unit-testable without a network or the DOM.
 */
export type LeadsDeps = {
  upsert: (lead: Lead) => Promise<void>;
  newId: () => string;
  now: () => string;
  download: (filename: string, csv: string) => void;
};

export type LeadsState = {
  items: Lead[];
  byId: (id: string) => Lead | undefined;
  newCount: () => number;
  /** Re-seed from a fresh server list (render-phase, on router.refresh). */
  seed: (items: Lead[]) => void;
  setStatus: (id: string, status: LeadStatus) => void;
  addNote: (id: string, body: string) => void;
  logContact: (id: string, kind: ContactKind) => void;
  exportLeads: (ids: readonly string[]) => void;
  /** Realtime folds. */
  applyRow: (lead: Lead) => void;
  removeId: (id: string) => void;
};

export type LeadsStore = ReturnType<typeof createLeadsStore>;

const CONTACT_MESSAGE: Record<ContactKind, string> = {
  call: "Appel passé",
  email: "E-mail envoyé",
  whatsapp: "Message WhatsApp envoyé",
};

export function createLeadsStore(deps: LeadsDeps, initial: Lead[] = []) {
  /** Replace a lead in place + persist it. */
  const persist = (set: (fn: (s: LeadsState) => Partial<LeadsState>) => void, next: Lead) => {
    set((s) => ({ items: s.items.map((l) => (l.id === next.id ? next : l)) }));
    void deps.upsert(next);
  };

  return createStore<LeadsState>()((set, get) => ({
    items: initial,

    byId: (id) => get().items.find((l) => l.id === id),
    newCount: () => get().items.filter((l) => l.status === "new").length,

    seed: (items) => set({ items }),

    setStatus: (id, status) => {
      const cur = get().byId(id);
      if (!cur) return;
      persist(set, {
        ...cur,
        status,
        interactions: pushInteraction(
          cur.interactions,
          {
            kind: "status_change",
            message: `Statut : ${STATUS_META[status].label}`,
            toStatus: status,
          },
          deps.newId(),
          deps.now(),
        ),
      });
    },

    addNote: (id, body) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const cur = get().byId(id);
      if (!cur) return;
      const at = deps.now();
      persist(set, {
        ...cur,
        notes: [...cur.notes, { id: deps.newId(), at, body: trimmed }],
        interactions: pushInteraction(
          cur.interactions,
          { kind: "note", message: trimmed },
          deps.newId(),
          at,
        ),
      });
    },

    logContact: (id, kind) => {
      const cur = get().byId(id);
      if (!cur) return;
      persist(set, {
        ...cur,
        interactions: pushInteraction(
          cur.interactions,
          { kind, message: CONTACT_MESSAGE[kind] },
          deps.newId(),
          deps.now(),
        ),
      });
    },

    exportLeads: (ids) => {
      const selected = get().items.filter((l) => ids.includes(l.id));
      if (selected.length === 0) return;
      deps.download(`leads-${selected.length}.csv`, toCsv(selected));
      const at = deps.now();
      const message = `Export CSV (${selected.length})`;
      const affected = new Set(ids);
      set((s) => ({
        items: s.items.map((l) =>
          affected.has(l.id)
            ? {
                ...l,
                interactions: pushInteraction(
                  l.interactions,
                  { kind: "export", message },
                  deps.newId(),
                  at,
                ),
              }
            : l,
        ),
      }));
      selected.forEach((l) => {
        const updated = get().byId(l.id);
        if (updated) void deps.upsert(updated);
      });
    },

    applyRow: (lead) =>
      set((s) => {
        const exists = s.items.some((l) => l.id === lead.id);
        return {
          items: exists ? s.items.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...s.items],
        };
      }),

    removeId: (id) => set((s) => ({ items: s.items.filter((l) => l.id !== id) })),
  }));
}
