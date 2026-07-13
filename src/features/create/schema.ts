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

/**
 * The AI plan is a server-action argument (comes from the client store), so it
 * is untrusted at the edge and must be parsed before it hits the videos insert.
 * Bounds cap the stored content (appsec + frontend review).
 */
export const VideoPlanSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(2000),
  hashtags: z.array(z.string().max(100)).max(30),
  script: z.string().max(20000),
  segments: z
    .array(
      z.object({
        index: z.number().int().min(0).max(200),
        narration_fr: z.string().max(2000),
        visual_prompt_en: z.string().max(2000),
        search_keywords: z.string().max(500).optional(),
        duration_sec: z.number().min(0).max(120),
      }),
    )
    .min(1)
    .max(30),
});

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
