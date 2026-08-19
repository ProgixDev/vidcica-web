/**
 * Composer option catalogs — kept in lockstep with the mobile app
 * (ClipFlow/src/lib/generation-models.ts, generation-music.ts, voices.ts).
 * UX only: the server (enqueue-generation) is the source of truth and rejects
 * anything the user's tier can't use (`model_not_allowed`, spec AC-11).
 *
 * The AI model catalog moved to `@/lib/vidcica/models` so the public pricing
 * page can read it too (a feature module must not be imported from shared).
 * It is re-exported here so existing composer imports keep working.
 */
import type { MessageKey } from "@/lib/i18n";

export { MODELS, modelById, type ModelOption } from "@/lib/vidcica/models";

export const QUALITIES = ["720p", "1080p"] as const;
export const RATIOS = ["9:16", "1:1", "16:9"] as const;
export const LENGTHS = [15, 30, 60] as const;

/** The two production voices (ElevenLabs) — same catalog as the app.
 *  Labels are proper voice names + language code (not translated). */
export const VOICES = [
  { id: "aurore", label: "Aurore · FR" },
  { id: "leo", label: "Leo · EN" },
] as const;

/** Server MUSIC_CATALOG ids (the client sends the id, the server resolves the
 *  track URL) — same 10 curated tracks as the app, plus «Aucune». */
export const MUSIC_MOODS: ReadonlyArray<{ id: string; labelKey: MessageKey }> = [
  { id: "none", labelKey: "create.musicNone" },
  { id: "afro", labelKey: "create.musicAfro" },
  { id: "chill", labelKey: "create.musicChill" },
  { id: "corporate", labelKey: "create.musicCorporate" },
  { id: "pop", labelKey: "create.musicPop" },
  { id: "hiphop", labelKey: "create.musicHiphop" },
  { id: "acoustic", labelKey: "create.musicAcoustic" },
  { id: "afropop", labelKey: "create.musicAfropop" },
  { id: "inspiring", labelKey: "create.musicInspiring" },
  { id: "groove", labelKey: "create.musicGroove" },
  { id: "marketing", labelKey: "create.musicMarketing" },
];
