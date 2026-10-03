"use server";

import { createClient } from "@/lib/supabase/server";
import {
  enqueueGeneration,
  generatePlan,
  type GeneratePlanOutcome,
  type VideoPlan,
} from "@/lib/vidcica/generation";
import type { Json } from "@/lib/supabase/database.types";
import { entityId } from "@/lib/vidcica/id";
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
 *
 * `draftId` continues a draft the user already has: its row is rewritten with
 * the new plan and rendered in place, so the draft becomes the video instead of
 * lingering beside a copy. Only an unrendered, untrashed draft of the caller's
 * (RLS update-own) qualifies; anything else falls back to a fresh row.
 */
export async function enqueueAction(
  input: ComposerInput,
  plan: VideoPlan,
  draftId?: string,
): Promise<EnqueueResult> {
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

  const fields = {
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
  };

  let videoId: string | null = null;
  const draft = draftId === undefined ? null : entityId.safeParse(draftId);
  if (draft?.success) {
    // A mobile draft carries a placeholder clip; clear it so the row looks
    // exactly like a fresh one until the render replaces it.
    const { data: updated } = await supabase
      .from("videos")
      .update({ ...fields, video_url: null })
      .eq("id", draft.data)
      .eq("status", "brouillon")
      .is("deleted_at", null)
      .select("id");
    if (updated?.length === 1) videoId = draft.data;
  }

  if (!videoId) {
    videoId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from("videos")
      .insert({ id: videoId, user_id: user.id, ...fields });
    if (insertError) {
      return { ok: false, reason: "error", message: insertError.message };
    }
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
