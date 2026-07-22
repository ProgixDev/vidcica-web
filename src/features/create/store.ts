import { createStore } from "zustand/vanilla";
import type { GeneratePlanOutcome, VideoPlan } from "@/lib/vidcica/generation";
import type { EnqueueGenerationFailReason } from "@/lib/vidcica/generation";
import { DEFAULT_COMPOSER_INPUT, type ComposerInput } from "./schema";

/**
 * Create-flow state machine. Dependencies (plan / enqueue) are injected so the
 * whole flow — plan success/error and every enqueue block reason — is unit
 * testable without a network (spec AC-8..AC-11). provider.tsx injects the real
 * server actions; tests inject fakes.
 */
export type CreatePhase =
  | "idle"
  | "planning"
  | "review"
  | "enqueuing"
  | "blocked"
  | "error"
  | "done";

export type EnqueueResult =
  | { ok: true; videoId: string; jobId: string; charged: number }
  | { ok: false; reason: EnqueueGenerationFailReason; message?: string };

export type CreateDeps = {
  plan: (input: ComposerInput) => Promise<GeneratePlanOutcome>;
  enqueue: (input: ComposerInput, plan: VideoPlan) => Promise<EnqueueResult>;
};

export type CreateState = {
  phase: CreatePhase;
  input: ComposerInput;
  plan: VideoPlan | null;
  /** A backend-authored error message (already localized upstream), or null. */
  error: string | null;
  /** i18n key for an app-authored error — resolved with `t()` at the call site.
   *  Takes precedence over `error` when set. */
  errorKey: import("@/lib/i18n").MessageKey | null;
  blockedReason: EnqueueGenerationFailReason | null;
  result: { videoId: string; jobId: string; charged: number } | null;
  setInput: (patch: Partial<ComposerInput>) => void;
  requestPlan: () => Promise<void>;
  backToEdit: () => void;
  confirmEnqueue: () => Promise<void>;
  reset: () => void;
};

export type CreateStore = ReturnType<typeof createCreateStore>;

export function createCreateStore(deps: CreateDeps, initial?: Partial<ComposerInput>) {
  return createStore<CreateState>()((set, get) => ({
    phase: "idle",
    input: { ...DEFAULT_COMPOSER_INPUT, ...initial },
    plan: null,
    error: null,
    errorKey: null,
    blockedReason: null,
    result: null,

    setInput: (patch) => set((s) => ({ input: { ...s.input, ...patch } })),

    requestPlan: async () => {
      set({ phase: "planning", error: null, errorKey: null });
      const outcome = await deps.plan(get().input);
      if (outcome.ok) {
        set({ phase: "review", plan: outcome.plan });
        return;
      }
      // not_configured / unauthenticated / error → an actionable message, no enqueue.
      if (outcome.reason === "not_configured") {
        set({ phase: "error", error: null, errorKey: "create.errPlanUnavailable" });
      } else {
        set({
          phase: "error",
          error: outcome.message ?? null,
          errorKey: outcome.message ? null : "create.errGeneric",
        });
      }
    },

    backToEdit: () => set({ phase: "idle", error: null, errorKey: null, blockedReason: null }),

    confirmEnqueue: async () => {
      const { plan, input } = get();
      if (!plan) return;
      set({ phase: "enqueuing", error: null, errorKey: null, blockedReason: null });
      const res = await deps.enqueue(input, plan);
      if (res.ok) {
        set({
          phase: "done",
          result: { videoId: res.videoId, jobId: res.jobId, charged: res.charged },
        });
        return;
      }
      // Blocked reasons stay on the review screen with a specific recovery;
      // a hard error uses the error phase. No placeholder render is ever shown.
      if (res.reason === "error" || res.reason === "unauthenticated") {
        set({
          phase: "error",
          error: res.message ?? null,
          errorKey: res.message ? null : "create.errGeneric",
        });
      } else {
        set({ phase: "blocked", blockedReason: res.reason });
      }
    },

    reset: () =>
      set({
        phase: "idle",
        plan: null,
        error: null,
        errorKey: null,
        blockedReason: null,
        result: null,
      }),
  }));
}
