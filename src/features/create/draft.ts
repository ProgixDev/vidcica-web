import { planRank, type Plan } from "@/lib/vidcica/tiers";
import { LENGTHS, MUSIC_MOODS, RATIOS, VOICES, modelById } from "./options";
import type { ComposerInput } from "./schema";

/** The parts of a saved draft the composer can be seeded from. */
export type DraftPrefillSource = {
  title: string;
  script: string;
  format: string;
  durationSec: number;
  /** What it was last rendered with, if it ever was. */
  model?: string | null;
  voice?: string | null;
  music?: string | null;
};

/**
 * Seed the composer from a draft so “Generate this video” continues it instead
 * of starting from nothing. A draft with a script is planned verbatim (script
 * mode); one without falls back to its title as the idea. Ratio and length are
 * carried over only when they are values the composer offers.
 *
 * A draft back from a failed render also keeps the model, voice and music it
 * was rendered with (“Shorten the script” used to reopen it on Stock). A model
 * the user's plan no longer covers falls back to the default.
 */
export function draftPrefill(draft: DraftPrefillSource, plan?: Plan): Partial<ComposerInput> {
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
  const model = draft.model ? modelById(draft.model) : undefined;
  if (model && (!plan || planRank(plan) >= planRank(model.minTier))) prefill.model = model.id;
  if (draft.voice && VOICES.some((v) => v.id === draft.voice)) {
    prefill.voice = draft.voice as ComposerInput["voice"];
  }
  if (draft.music && MUSIC_MOODS.some((m) => m.id === draft.music)) {
    prefill.music = draft.music as ComposerInput["music"];
  }
  return prefill;
}
