/**
 * Composer option catalogs — kept in lockstep with the mobile app
 * (ClipFlow/src/lib/generation-models.ts, generation-music.ts, voices.ts).
 * UX only: the server (enqueue-generation) is the source of truth and rejects
 * anything the user's tier can't use (`model_not_allowed`, spec AC-11).
 */
export type ModelOption = {
  id: string;
  label: string;
  minTier: "free" | "starter" | "pro" | "studio";
  maxQuality: "720p" | "1080p";
  /** Multiplier in the credit-cost estimate (0 = flat stock cost). */
  costFactor: number;
};

export const MODELS: ReadonlyArray<ModelOption> = [
  { id: "pexels", label: "Stock (gratuit)", minTier: "free", maxQuality: "1080p", costFactor: 0 },
  { id: "kling", label: "Kling", minTier: "starter", maxQuality: "720p", costFactor: 1.1 },
  { id: "seedance", label: "Seedance", minTier: "starter", maxQuality: "720p", costFactor: 0.45 },
  { id: "ltx", label: "LTX", minTier: "pro", maxQuality: "1080p", costFactor: 1.9 },
  { id: "seedance-pro", label: "Seedance Pro", minTier: "pro", maxQuality: "1080p", costFactor: 1 },
  { id: "kling-pro", label: "Kling Pro", minTier: "pro", maxQuality: "1080p", costFactor: 1.4 },
  { id: "veo", label: "Veo 3.1", minTier: "studio", maxQuality: "1080p", costFactor: 2.1 },
];

export const modelById = (id: string): ModelOption | undefined => MODELS.find((m) => m.id === id);

export const QUALITIES = ["720p", "1080p"] as const;
export const RATIOS = ["9:16", "1:1", "16:9"] as const;
export const LENGTHS = [15, 30, 60] as const;

/** The two production voices (ElevenLabs) — same catalog as the app. */
export const VOICES = [
  { id: "aurore", label: "Aurore · FR" },
  { id: "leo", label: "Leo · EN" },
] as const;

/** Server MUSIC_CATALOG ids (the client sends the id, the server resolves the
 *  track URL) — same 10 curated tracks as the app, plus «Aucune». */
export const MUSIC_MOODS = [
  { id: "none", label: "Aucune" },
  { id: "afro", label: "Afrobeat" },
  { id: "chill", label: "Chill" },
  { id: "corporate", label: "Corporate" },
  { id: "pop", label: "Pop" },
  { id: "hiphop", label: "Hip-hop" },
  { id: "acoustic", label: "Acoustique" },
  { id: "afropop", label: "Afro pop" },
  { id: "inspiring", label: "Inspirant" },
  { id: "groove", label: "Groove" },
  { id: "marketing", label: "Tendance" },
] as const;
