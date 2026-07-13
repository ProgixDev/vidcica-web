import { createStore } from "zustand/vanilla";
import type { EnqueueOutcome } from "@/lib/vidcica/publishing";
import type { PlatformId } from "@/lib/vidcica/network";

/**
 * Publish-wizard state machine. `enqueue` is injected so gating, publish-now,
 * schedule, skipped, and error are unit-testable without a network
 * (spec AC-6..AC-11). provider.tsx injects the real server action.
 */
export type PublishMode = "now" | "schedule";
export type PublishPhase = "idle" | "submitting" | "done" | "error";

export type PublishDeps = {
  enqueue: (input: {
    videoId: string;
    platforms: PlatformId[];
    scheduledFor?: string;
    asShort?: boolean;
  }) => Promise<EnqueueOutcome>;
};

export type PublishState = {
  videoId: string;
  selected: PlatformId[];
  mode: PublishMode;
  scheduledAt: string | null;
  youtubeAsShort: boolean;
  phase: PublishPhase;
  error: string | null;
  skipped: PlatformId[];
  jobs: ReadonlyArray<{ id: string; platform: PlatformId }>;
  togglePlatform: (p: PlatformId) => void;
  setMode: (m: PublishMode) => void;
  setScheduledAt: (iso: string) => void;
  setYoutubeAsShort: (v: boolean) => void;
  canConfirm: () => boolean;
  confirm: () => Promise<void>;
};

export type PublishStore = ReturnType<typeof createPublishStore>;

export function createPublishStore(deps: PublishDeps, init: { videoId: string }) {
  return createStore<PublishState>()((set, get) => ({
    videoId: init.videoId,
    selected: [],
    mode: "now",
    scheduledAt: null,
    youtubeAsShort: true,
    phase: "idle",
    error: null,
    skipped: [],
    jobs: [],

    togglePlatform: (p) =>
      set((s) => ({
        selected: s.selected.includes(p) ? s.selected.filter((x) => x !== p) : [...s.selected, p],
      })),
    setMode: (mode) => set({ mode }),
    setScheduledAt: (scheduledAt) => set({ scheduledAt }),
    setYoutubeAsShort: (youtubeAsShort) => set({ youtubeAsShort }),

    canConfirm: () => {
      const s = get();
      if (s.selected.length === 0 || s.phase === "submitting") return false;
      if (s.mode === "schedule")
        return !!s.scheduledAt && new Date(s.scheduledAt).getTime() > Date.now();
      return true;
    },

    confirm: async () => {
      const s = get();
      if (!get().canConfirm()) return;
      set({ phase: "submitting", error: null, skipped: [] });
      const res = await deps.enqueue({
        videoId: s.videoId,
        platforms: s.selected,
        scheduledFor: s.mode === "schedule" ? (s.scheduledAt ?? undefined) : undefined,
        asShort: s.youtubeAsShort,
      });
      if (res.ok) {
        set({ phase: "done", jobs: res.jobs, skipped: [...res.skipped] });
      } else {
        set({ phase: "error", error: res.message });
      }
    },
  }));
}
