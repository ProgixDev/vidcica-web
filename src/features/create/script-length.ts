/**
 * How long a pasted script will take to say. A voiced video stretches to fit
 * its narration, and the render pipeline refuses anything past MAX_VIDEO_SEC
 * (enqueue-generation refuses a clearly-too-long script before charging; the
 * worker times the real voiceover and stops the rest before any footage).
 * This is the composer's early warning, at the voices' typical pace.
 */

/** The longest video the product makes; mirror of MAX_VIDEO_SEC server-side. */
export const MAX_VIDEO_SEC = 60;
/** The ElevenLabs voices' usual pace (measured 2026-10-03: 2.8 to 4.5 words/s). */
export const TYPICAL_WORDS_PER_SEC = 3;
/** Roughly how many words fit in MAX_VIDEO_SEC at that pace. */
export const MAX_SCRIPT_WORDS = MAX_VIDEO_SEC * TYPICAL_WORDS_PER_SEC;

/** Words as the voice says them: punctuation set apart ("vidéo ?") isn't one. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export type NarrationEstimate = { words: number; seconds: number; tooLong: boolean };

export function narrationEstimate(text: string): NarrationEstimate {
  const words = countWords(text);
  const seconds = Math.round(words / TYPICAL_WORDS_PER_SEC);
  return { words, seconds, tooLong: words > MAX_SCRIPT_WORDS };
}
