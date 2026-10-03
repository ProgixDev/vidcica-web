import { LENGTHS, RATIOS } from "./options";
import type { ComposerInput } from "./schema";

/** The parts of a saved draft the composer can be seeded from. */
export type DraftPrefillSource = {
  title: string;
  script: string;
  format: string;
  durationSec: number;
};

/**
 * Seed the composer from a draft so “Generate this video” continues it instead
 * of starting from nothing. A draft with a script is planned verbatim (script
 * mode); one without falls back to its title as the idea. Ratio and length are
 * carried over only when they are values the composer offers.
 */
export function draftPrefill(draft: DraftPrefillSource): Partial<ComposerInput> {
  const script = draft.script.trim();
  const prefill: Partial<ComposerInput> = {
    kind: script ? "script" : "idea",
    prompt: (script || draft.title.trim()).slice(0, 5000),
  };
  if ((RATIOS as readonly string[]).includes(draft.format)) {
    prefill.ratio = draft.format as ComposerInput["ratio"];
  }
  if (draft.durationSec > 0) {
    prefill.length = LENGTHS.reduce((best, l) =>
      Math.abs(l - draft.durationSec) < Math.abs(best - draft.durationSec) ? l : best,
    );
  }
  return prefill;
}
