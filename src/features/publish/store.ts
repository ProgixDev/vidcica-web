import { createStore } from "zustand/vanilla";
import type { EnqueueOutcome } from "@/lib/vidcica/publishing";
import type { PlatformId } from "@/lib/vidcica/network";
import {
  DEFAULT_TIKTOK_OPTIONS,
  tikTokBlockReason,
  toWireOptions,
  type TikTokBlockReason,
  type TikTokCreatorInfo,
  type TikTokPostOptions,
} from "@/lib/vidcica/tiktok";

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
    captions?: Partial<Record<PlatformId, string>>;
    options?: Partial<Record<PlatformId, Record<string, unknown>>>;
  }) => Promise<EnqueueOutcome>;
};

/**
 * Fold an edited caption body + the video's hashtags into the single override
 * string the backend stores (publish_jobs.caption). Hashtags already present in
 * the body aren't re-appended, so this is safe whether the body already contains
 * them or not.
 */
function composeCaption(body: string, hashtags: string[]): string {
  const text = body.trim();
  const extra = hashtags
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .filter((h) => !text.includes(h));
  if (extra.length === 0) return text;
  return text ? `${text}\n\n${extra.join(" ")}` : extra.join(" ");
}

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
  /**
   * Per-platform edited caption BODY (not yet composed with hashtags). A key is
   * present only once the user edits that platform; absent → the backend derives
   * the caption. Composed with the video's hashtags at confirm time.
   */
  captions: Partial<Record<PlatformId, string>>;
  /**
   * The creator's per-post TikTok choices. Required by TikTok's audit — see
   * lib/vidcica/tiktok.ts. Only sent when TikTok is among the selected
   * platforms; ignored entirely otherwise.
   */
  tiktok: TikTokPostOptions;
  /** Account-side facts from `creator-info`; null until fetched (or on error). */
  tiktokCreator: TikTokCreatorInfo | null;
  togglePlatform: (p: PlatformId) => void;
  setMode: (m: PublishMode) => void;
  setScheduledAt: (iso: string) => void;
  setYoutubeAsShort: (v: boolean) => void;
  setCaption: (p: PlatformId, body: string) => void;
  setTikTokOptions: (patch: Partial<TikTokPostOptions>) => void;
  setTikTokCreator: (creator: TikTokCreatorInfo | null) => void;
  /** Non-null when TikTok is selected but its required choices aren't valid yet. */
  tiktokBlockReason: () => TikTokBlockReason | null;
  canConfirm: () => boolean;
  confirm: () => Promise<void>;
};

export type PublishStore = ReturnType<typeof createPublishStore>;

export function createPublishStore(
  deps: PublishDeps,
  init: { videoId: string; hashtags?: string[]; durationSec?: number },
) {
  const hashtags = init.hashtags ?? [];
  const durationSec = init.durationSec ?? 0;
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
    captions: {},
    tiktok: DEFAULT_TIKTOK_OPTIONS,
    tiktokCreator: null,

    togglePlatform: (p) =>
      set((s) => ({
        selected: s.selected.includes(p) ? s.selected.filter((x) => x !== p) : [...s.selected, p],
      })),
    setMode: (mode) => set({ mode }),
    setScheduledAt: (scheduledAt) => set({ scheduledAt }),
    setYoutubeAsShort: (youtubeAsShort) => set({ youtubeAsShort }),
    setCaption: (p, body) => set((s) => ({ captions: { ...s.captions, [p]: body } })),
    setTikTokOptions: (patch) => set((s) => ({ tiktok: { ...s.tiktok, ...patch } })),
    setTikTokCreator: (creator) =>
      set((s) => {
        if (!creator) return { tiktokCreator: null };
        // The account's own locks win over any stale choice: if TikTok says
        // comments are off for this creator, we must not send disable=false.
        return {
          tiktokCreator: creator,
          tiktok: {
            ...s.tiktok,
            disableComment: creator.commentDisabled ? true : s.tiktok.disableComment,
            disableDuet: creator.duetDisabled ? true : s.tiktok.disableDuet,
            disableStitch: creator.stitchDisabled ? true : s.tiktok.disableStitch,
          },
        };
      }),

    tiktokBlockReason: () => {
      const s = get();
      if (!s.selected.includes("tiktok")) return null;
      return tikTokBlockReason(s.tiktok, s.tiktokCreator, durationSec);
    },

    canConfirm: () => {
      const s = get();
      if (s.selected.length === 0 || s.phase === "submitting") return false;
      // TikTok's required per-post choices gate the whole submit — a partially
      // valid multi-platform publish would post everywhere except TikTok and
      // read as a silent failure.
      if (get().tiktokBlockReason() !== null) return false;
      if (s.mode === "schedule")
        return !!s.scheduledAt && new Date(s.scheduledAt).getTime() > Date.now();
      return true;
    },

    confirm: async () => {
      const s = get();
      if (!get().canConfirm()) return;
      set({ phase: "submitting", error: null, skipped: [] });
      // Compose an override only for selected platforms the user actually edited;
      // untouched platforms send nothing → the backend derives their caption.
      const captions: Partial<Record<PlatformId, string>> = {};
      for (const p of s.selected) {
        const body = s.captions[p];
        if (body !== undefined) captions[p] = composeCaption(body, hashtags);
      }
      const res = await deps.enqueue({
        videoId: s.videoId,
        platforms: s.selected,
        scheduledFor: s.mode === "schedule" ? (s.scheduledAt ?? undefined) : undefined,
        asShort: s.youtubeAsShort,
        captions: Object.keys(captions).length > 0 ? captions : undefined,
        options: s.selected.includes("tiktok") ? { tiktok: toWireOptions(s.tiktok) } : undefined,
      });
      if (res.ok) {
        set({ phase: "done", jobs: res.jobs, skipped: [...res.skipped] });
      } else {
        set({ phase: "error", error: res.message });
      }
    },
  }));
}
