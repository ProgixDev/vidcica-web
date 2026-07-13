import type { GenerationJobStatus } from "@/lib/vidcica/video";

/** Ordered render stages shown to the user (queued → assembling → ready). */
export const RENDER_STAGES = [
  { status: "queued", label: "En file d’attente" },
  { status: "footage", label: "Génération des images" },
  { status: "voiceover", label: "Voix off" },
  { status: "assembling", label: "Assemblage" },
] as const;

export type StageView = {
  index: number; // -1 when failed/cancelled
  pct: number; // 0–100
  label: string;
  done: boolean; // reached "prêt"
  failed: boolean;
};

/** Map a job status onto a progress view — drives a staged bar, not a bare
 *  spinner (AC-12), and surfaces failure + refund messaging (AC-13). */
export function stageView(status: GenerationJobStatus): StageView {
  if (status === "failed" || status === "cancelled") {
    return { index: -1, pct: 0, label: "Échec du rendu", done: false, failed: true };
  }
  if (status === "succeeded") {
    return { index: RENDER_STAGES.length, pct: 100, label: "Prêt", done: true, failed: false };
  }
  const index = RENDER_STAGES.findIndex((s) => s.status === status);
  const i = index === -1 ? 0 : index;
  // Fill to the middle of the current stage so the bar always shows advancement.
  const pct = Math.round(((i + 0.5) / RENDER_STAGES.length) * 100);
  return { index: i, pct, label: RENDER_STAGES[i]!.label, done: false, failed: false };
}

/** A status is terminal when polling can stop. */
export function isTerminal(status: GenerationJobStatus): boolean {
  return status === "succeeded" || status === "failed" || status === "cancelled";
}
