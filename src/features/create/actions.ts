"use server";

import { createClient } from "@/lib/supabase/server";
import {
  enqueueGeneration,
  generatePlan,
  type GeneratePlanOutcome,
  type VideoPlan,
} from "@/lib/vidcica/generation";
import type { Json } from "@/lib/supabase/database.types";
import { ComposerSchema, VideoPlanSchema, type ComposerInput } from "./schema";
import type { EnqueueResult } from "./store";

/**
 * Phase A — generate the plan. Validates the composer input at the edge, then
 * calls the existing `generate-plan` edge function with the user session.
 */
export async function planAction(input: ComposerInput): Promise<GeneratePlanOutcome> {
  const parsed = ComposerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "error", message: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  return generatePlan(supabase, {
    prompt: parsed.data.prompt,
    kind: parsed.data.kind,
    length: parsed.data.length,
    ratio: parsed.data.ratio,
  });
}

/**
 * Stage C — create the draft video row (RLS insert-own), then enqueue a real
 * render via the existing `enqueue-generation` edge function. No new backend:
 * the row is a direct RLS insert; the render is the edge function.
 */
export async function enqueueAction(input: ComposerInput, plan: VideoPlan): Promise<EnqueueResult> {
  const parsed = ComposerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "error", message: parsed.error.issues[0]?.message };
  }
  const opts = parsed.data;

  // The plan is client-controlled at this boundary — parse it before it reaches
  // the videos insert (a caller can invoke this action directly, skipping the
  // plan step). Bounds cap the stored JSON.
  const planParsed = VideoPlanSchema.safeParse(plan);
  if (!planParsed.success) {
    return { ok: false, reason: "no_plan", message: "Plan invalide" };
  }
  const safePlan = planParsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const videoId = crypto.randomUUID();
  const { error: insertError } = await supabase.from("videos").insert({
    id: videoId,
    user_id: user.id,
    title: safePlan.title,
    script: safePlan.script,
    description: safePlan.description,
    hashtags: safePlan.hashtags,
    format: opts.ratio,
    tone: "energique",
    status: "brouillon",
    thumbnail_url: "",
    duration_sec: opts.length,
    voice: opts.voice,
    music_mood: opts.music === "none" ? null : opts.music,
    segments: safePlan.segments as unknown as Json,
  });
  if (insertError) {
    return { ok: false, reason: "error", message: insertError.message };
  }

  const outcome = await enqueueGeneration(supabase, {
    videoId,
    segments: safePlan.segments,
    model: opts.model,
    quality: opts.quality,
    ratio: opts.ratio,
    voice: opts.voice,
    voiceover: opts.voiceover,
    captions: opts.captions,
    musicMood: opts.music === "none" ? null : opts.music,
  });

  if (outcome.ok) {
    return { ok: true, videoId, jobId: outcome.jobId, charged: outcome.charged };
  }
  return { ok: false, reason: outcome.reason, message: outcome.message };
}
