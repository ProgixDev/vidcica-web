import { createStore } from "zustand/vanilla";
import type { AdAccountOutcome, CreateCampaignOutcome } from "@/lib/vidcica/ads";
import { adsErrorMessage } from "@/lib/vidcica/ads";
import type {
  BoostDraft,
  CampaignGender,
  CampaignBudgetMode,
  SupportedObjective,
} from "@/lib/vidcica/campaign";

/**
 * Boost-a-video state machine. Dependencies (resolve account / create draft /
 * create campaign) are injected so the gate, the honest draft fallback, and every
 * create outcome are unit-testable without a network (AC-2..AC-4). provider.tsx
 * injects the real edge client + server action.
 */
export type BoostPhase =
  | "checking" // resolving the ad account (gate)
  | "ready" // account + page present → real create path
  | "draftOnly" // ads not configured / no account → honest save-draft path
  | "creating" // submitting
  | "created" // done: real in_review, or a saved draft
  | "error"; // hard error (draft may still be saved → resumable)

export type BoostDeps = {
  resolveAccount: () => Promise<AdAccountOutcome>;
  createDraft: (
    draft: BoostDraft,
  ) => Promise<{ ok: true; id: string } | { ok: false; message: string }>;
  createCampaign: (campaignId: string) => Promise<CreateCampaignOutcome>;
};

export const BOOST_STEPS = ["video", "objective", "audience", "budget", "review"] as const;
export type BoostStep = (typeof BOOST_STEPS)[number];

export const EMPTY_DRAFT: BoostDraft = {
  name: "",
  videoId: "",
  objective: "notoriete",
  countries: ["FR"],
  ageMin: 18,
  ageMax: 45,
  gender: "tous",
  budgetMode: "quotidien",
  budgetDaily: 20,
  budgetTotal: 200,
};

export type BoostState = {
  phase: BoostPhase;
  gate: AdAccountOutcome | null;
  step: number;
  draft: BoostDraft;
  error: string | null;
  /** Set once a campaigns row exists (real in_review OR a saved draft) — the UI links to it. */
  campaignId: string | null;
  /** True when the created campaign is a real Meta in_review (vs a saved draft). */
  launched: boolean;
  init: () => Promise<void>;
  setStep: (step: number) => void;
  setDraft: (patch: Partial<BoostDraft>) => void;
  /** Real path: create draft → create-ad-campaign. */
  submit: () => Promise<void>;
  /** Draft-only path: persist the brouillon without launching. */
  saveDraft: () => Promise<void>;
};

export type BoostStore = ReturnType<typeof createBoostStore>;

/** Minimum a draft needs before it can be submitted (server re-validates). */
export function isDraftReady(d: BoostDraft): boolean {
  return (
    d.videoId.length > 0 &&
    d.name.trim().length > 0 &&
    d.ageMax >= d.ageMin &&
    d.countries.length > 0
  );
}

export function createBoostStore(deps: BoostDeps) {
  return createStore<BoostState>()((set, get) => ({
    phase: "checking",
    gate: null,
    step: 0,
    draft: { ...EMPTY_DRAFT },
    error: null,
    campaignId: null,
    launched: false,

    init: async () => {
      set({ phase: "checking", error: null });
      const gate = await deps.resolveAccount();
      const canLaunch = gate.ok && gate.hasAccount && gate.hasPage;
      set({ gate, phase: canLaunch ? "ready" : "draftOnly" });
    },

    setStep: (step) => set({ step: Math.max(0, Math.min(step, BOOST_STEPS.length - 1)) }),
    setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

    submit: async () => {
      const { draft } = get();
      if (!isDraftReady(draft)) return;
      set({ phase: "creating", error: null });
      const created = await deps.createDraft(draft);
      if (!created.ok) {
        set({ phase: "error", error: created.message });
        return;
      }
      const out = await deps.createCampaign(created.id);
      if (out.ok) {
        set({ phase: "created", campaignId: created.id, launched: true });
        return;
      }
      // The draft IS saved (created.id) — surface the reason but keep it resumable.
      set({ phase: "error", error: adsErrorMessage(out.reason), campaignId: created.id });
    },

    saveDraft: async () => {
      const { draft } = get();
      if (!isDraftReady(draft)) return;
      set({ phase: "creating", error: null });
      const created = await deps.createDraft(draft);
      if (!created.ok) {
        set({ phase: "error", error: created.message });
        return;
      }
      set({ phase: "created", campaignId: created.id, launched: false });
    },
  }));
}

export type { CampaignGender, CampaignBudgetMode, SupportedObjective };
