import type { GenerationJobStatus } from "@/lib/vidcica/video";
import type { MessageKey } from "@/lib/i18n";

/** Ordered render stages shown to the user (queued → assembling → ready).
 *  `labelKey` is resolved with `t()` at the render site. */
export const RENDER_STAGES = [
  { status: "queued", labelKey: "videos.stage.queued" },
  { status: "footage", labelKey: "videos.stage.footage" },
  { status: "voiceover", labelKey: "videos.stage.voiceover" },
  { status: "assembling", labelKey: "videos.stage.assembling" },
] as const satisfies ReadonlyArray<{ status: string; labelKey: MessageKey }>;

export type StageView = {
  index: number; // -1 when failed/cancelled
  pct: number; // 0–100
  labelKey: MessageKey;
  done: boolean; // reached "prêt"
  failed: boolean;
};

/** Map a job status onto a progress view — drives a staged bar, not a bare
 *  spinner (AC-12), and surfaces failure + refund messaging (AC-13). */
export function stageView(status: GenerationJobStatus): StageView {
  if (status === "failed" || status === "cancelled") {
    return { index: -1, pct: 0, labelKey: "videos.stage.failed", done: false, failed: true };
  }
  if (status === "succeeded") {
    return {
      index: RENDER_STAGES.length,
      pct: 100,
      labelKey: "videos.stage.ready",
      done: true,
      failed: false,
    };
  }
  const index = RENDER_STAGES.findIndex((s) => s.status === status);
  const i = index === -1 ? 0 : index;
  // Fill to the middle of the current stage so the bar always shows advancement.
  const pct = Math.round(((i + 0.5) / RENDER_STAGES.length) * 100);
  return { index: i, pct, labelKey: RENDER_STAGES[i]!.labelKey, done: false, failed: false };
}

/** A status is terminal when polling can stop. */
export function isTerminal(status: GenerationJobStatus): boolean {
  return status === "succeeded" || status === "failed" || status === "cancelled";
}
