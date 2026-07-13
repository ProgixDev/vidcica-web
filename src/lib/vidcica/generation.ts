/**
 * Web client for the AI generation pipeline — a port of
 * ClipFlow/src/lib/ai-generation.ts. Calls the EXISTING edge functions
 * (`generate-plan`, `enqueue-generation`); it never re-implements them.
 *
 * Uses raw fetch with the caller's session access token (mirrors mobile) so we
 * can read the 503 / structured error codes the functions return — the reason
 * codes drive the "block with recovery" UX (spec AC-11). Pass a Supabase client
 * (server or browser); its session provides the bearer token and RLS scope.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/core/env.client";
import type { Database } from "@/lib/supabase/database.types";
import type { GenerationJobStatus } from "@/lib/vidcica/video";

type DB = SupabaseClient<Database>;

const SUPABASE_URL = clientEnv.NEXT_PUBLIC_SUPABASE_URL;

async function token(supabase: DB): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// ── Phase A: plan ──────────────────────────────────────────────────────

export type PlanSegment = {
  index: number;
  narration_fr: string;
  visual_prompt_en: string;
  search_keywords?: string;
  duration_sec: number;
};

export type VideoPlan = {
  title: string;
  description: string;
  hashtags: string[];
  script: string;
  segments: PlanSegment[];
};

export type GeneratePlanInput = {
  prompt: string;
  /** 'idea' = topic → AI writes the script; 'script' = kept verbatim. */
  kind?: "idea" | "script";
  niche?: string;
  tone?: string;
  length?: number;
  ratio?: string;
  secondsPerScene?: number;
};

export type GeneratePlanOutcome =
  | { ok: true; plan: VideoPlan }
  | { ok: false; reason: "not_configured" | "unauthenticated" | "error"; message?: string };

export async function generatePlan(
  supabase: DB,
  input: GeneratePlanInput,
): Promise<GeneratePlanOutcome> {
  const t = await token(supabase);
  if (!t) return { ok: false, reason: "unauthenticated" };
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-plan`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      plan?: VideoPlan;
      error?: string;
    };
    if (res.status === 503) return { ok: false, reason: "not_configured" };
    if (!res.ok || !body.ok || !body.plan) {
      return { ok: false, reason: "error", message: body.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, plan: body.plan };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message };
  }
}

// ── Stage C: enqueue a real render ─────────────────────────────────────

export type EnqueueGenerationInput = {
  videoId: string;
  segments: PlanSegment[];
  musicMood?: string | null;
  model?: string;
  quality?: string;
  ratio?: string;
  voice?: string;
  voiceover?: boolean;
  captions?: boolean;
  imagePath?: string;
};

export type EnqueueGenerationFailReason =
  | "not_live"
  | "unauthenticated"
  | "insufficient_credits"
  | "daily_cap"
  | "disabled"
  | "in_progress"
  | "no_plan"
  | "model_locked"
  | "image_not_supported"
  | "error";

export type EnqueueGenerationOutcome =
  | { ok: true; jobId: string; charged: number }
  | { ok: false; reason: EnqueueGenerationFailReason; message?: string };

export async function enqueueGeneration(
  supabase: DB,
  input: EnqueueGenerationInput,
): Promise<EnqueueGenerationOutcome> {
  const t = await token(supabase);
  if (!t) return { ok: false, reason: "unauthenticated" };
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/enqueue-generation`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      jobId?: string;
      charged?: number;
      error?: string;
    };
    if (res.ok && body.ok && body.jobId) {
      return { ok: true, jobId: body.jobId, charged: body.charged ?? 0 };
    }
    return {
      ok: false,
      reason: mapEnqueueReason(body.error),
      message: body.error ?? `HTTP ${res.status}`,
    };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message };
  }
}

/** Map the function's error string → a caller-actionable reason (mirrors mobile). */
export function mapEnqueueReason(error: string | undefined): EnqueueGenerationFailReason {
  switch (error) {
    case "generation_not_live":
      return "not_live";
    case "generation_disabled":
      return "disabled";
    case "insufficient_credits":
      return "insufficient_credits";
    case "daily_cap_reached":
      return "daily_cap";
    case "already_in_progress":
      return "in_progress";
    case "video_has_no_plan":
    case "too_many_segments":
      return "no_plan";
    case "model_not_allowed":
      return "model_locked";
    case "image_not_supported":
      return "image_not_supported";
    default:
      return "error";
  }
}

// ── Job + finished media reads (RLS: read-own) ─────────────────────────

export type GenerationJobState = {
  status: GenerationJobStatus;
  lastError: string | null;
  videoId: string;
};

export async function fetchGenerationJob(
  supabase: DB,
  jobId: string,
): Promise<GenerationJobState | null> {
  const { data, error } = await supabase
    .from("generation_jobs")
    .select("status, last_error, video_id")
    .eq("id", jobId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    status: data.status as GenerationJobStatus,
    lastError: data.last_error ?? null,
    videoId: data.video_id,
  };
}

export type FinishedVideoMedia = {
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSec: number | null;
  status: string;
};

export async function fetchVideoMedia(
  supabase: DB,
  videoId: string,
): Promise<FinishedVideoMedia | null> {
  const { data, error } = await supabase
    .from("videos")
    .select("video_url, thumbnail_url, duration_sec, status")
    .eq("id", videoId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    videoUrl: data.video_url ?? null,
    thumbnailUrl: data.thumbnail_url ?? null,
    durationSec: data.duration_sec ?? null,
    status: data.status,
  };
}
