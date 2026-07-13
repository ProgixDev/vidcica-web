/**
 * Composer option catalogs — ported from ClipFlow/src/lib/generation-models.ts.
 * UX only: the server (enqueue-generation) is the source of truth and clamps
 * anything the user's tier can't use (returns `model_not_allowed`). We surface
 * the full set and let the server reject out-of-tier picks (spec AC-11).
 */
export type ModelOption = {
  id: string;
  label: string;
  minTier: "free" | "starter" | "pro" | "studio";
  maxQuality: "720p" | "1080p";
};

export const MODELS: ReadonlyArray<ModelOption> = [
  { id: "pexels", label: "Stock (gratuit)", minTier: "free", maxQuality: "1080p" },
  { id: "kling", label: "Kling", minTier: "starter", maxQuality: "720p" },
  { id: "seedance", label: "Seedance", minTier: "starter", maxQuality: "720p" },
  { id: "ltx", label: "LTX", minTier: "pro", maxQuality: "1080p" },
  { id: "seedance-pro", label: "Seedance Pro", minTier: "pro", maxQuality: "1080p" },
  { id: "kling-pro", label: "Kling Pro", minTier: "pro", maxQuality: "1080p" },
  { id: "veo", label: "Veo 3.1", minTier: "studio", maxQuality: "1080p" },
];

export const QUALITIES = ["720p", "1080p"] as const;
export const RATIOS = ["9:16", "1:1", "16:9"] as const;

export const VOICES = [
  { id: "aurore", label: "Aurore" },
  { id: "leo", label: "Léo" },
  { id: "mila", label: "Mila" },
  { id: "noah", label: "Noah" },
  { id: "oceane", label: "Océane" },
  { id: "gabriel", label: "Gabriel" },
  { id: "camille", label: "Camille" },
  { id: "hugo", label: "Hugo" },
] as const;

export const MUSIC_MOODS = [
  { id: "none", label: "Aucune" },
  { id: "energique", label: "Énergique" },
  { id: "chill", label: "Chill" },
  { id: "cinematique", label: "Cinématique" },
  { id: "urbain", label: "Urbain" },
  { id: "acoustique", label: "Acoustique" },
  { id: "electro", label: "Électro" },
] as const;
