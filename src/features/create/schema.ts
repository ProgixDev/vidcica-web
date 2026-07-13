import { z } from "zod";
import { MODELS, MUSIC_MOODS, QUALITIES, RATIOS, VOICES } from "./options";

const modelIds = MODELS.map((m) => m.id) as [string, ...string[]];
const voiceIds = VOICES.map((v) => v.id) as [string, ...string[]];
const musicIds = MUSIC_MOODS.map((m) => m.id) as [string, ...string[]];

/** Composer input — validated at the edge (server action) before any network call. */
export const ComposerSchema = z.object({
  kind: z.enum(["idea", "script"]),
  prompt: z.string().trim().min(10, "Écrivez au moins quelques phrases"),
  model: z.enum(modelIds),
  quality: z.enum(QUALITIES),
  ratio: z.enum(RATIOS),
  voice: z.enum(voiceIds),
  voiceover: z.boolean(),
  captions: z.boolean(),
  music: z.enum(musicIds),
  /** Target length in seconds. */
  length: z.number().int().min(10).max(120),
});

export type ComposerInput = z.infer<typeof ComposerSchema>;

export const DEFAULT_COMPOSER_INPUT: ComposerInput = {
  kind: "idea",
  prompt: "",
  model: "pexels",
  quality: "1080p",
  ratio: "9:16",
  voice: "aurore",
  voiceover: true,
  captions: true,
  music: "none",
  length: 30,
};
