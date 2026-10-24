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
import { z } from "zod";
import { clientEnv } from "@/core/env.client";
import type { Database } from "@/lib/supabase/database.types";
import type { GenerationJobStatus } from "@/lib/vidcica/video";
import type { Plan } from "@/lib/vidcica/tiers";

type DB = SupabaseClient<Database>;

const SUPABASE_URL = clientEnv.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Sent as `v` with every request: this client shows the plan refusals (brief
 * "Cahier technique" B3–B5), so the server refuses what the person's plan
 * doesn't include (a longer video, voice-over on Free) instead of quietly
 * capping or dropping it, as it still does for older app builds.
 */
export const CLIENT_VERSION = 2;

async function token(supabase: DB): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// ── Plan refusals ──────────────────────────────────────────────────────

/**
 * What a plan refusal (HTTP 403 from the server's `planRefusal`) tells the
 * screen: the person's plan, the cheapest plan that unlocks the request (null
 * when none does) and the limit reached — seconds for a duration (and for
 * `script_too_long`, the longest video allowed), videos for the library,
 * megabytes for storage.
 */
export type PlanBlock = { plan: Plan | null; requiredPlan: Plan | null; limit?: number };

const PlanName = z.enum(["free", "starter", "pro", "studio"]);
const PlanRefusalBody = z.object({
  plan: PlanName.nullable().catch(null),
  requiredPlan: PlanName.nullable().catch(null),
  limit: z.number().optional().catch(undefined),
  limitMb: z.number().optional().catch(undefined),
  maxSeconds: z.number().optional().catch(undefined),
});

/** Read a refusal body defensively: a missing or odd field reads as unknown. */
export function readPlanBlock(body: unknown): PlanBlock {
  const parsed = PlanRefusalBody.safeParse(body);
  if (!parsed.success) return { plan: null, requiredPlan: null };
  const { plan, requiredPlan, limit, limitMb, maxSeconds } = parsed.data;
  const value = limit ?? limitMb ?? maxSeconds;
  return value === undefined ? { plan, requiredPlan } : { plan, requiredPlan, limit: value };
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
  /** The app's language: what the AI writes an idea in. A supplied script
   *  keeps its own language (generate-plan detects it). Absent → French. */
  language?: "fr" | "en";
};

export type GeneratePlanOutcome =
  | { ok: true; plan: VideoPlan }
  | {
      ok: false;
      reason:
        | "not_configured"
        | "unauthenticated"
        | "content_blocked"
        | "duration_locked"
        | "error";
      message?: string;
      /** Set when the plan refused the request (`duration_locked`). */
      block?: PlanBlock;
    };

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
      body: JSON.stringify({ ...input, v: CLIENT_VERSION }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      plan?: VideoPlan;
      error?: string;
    };
    if (res.status === 503) return { ok: false, reason: "not_configured" };
    // The content filter, or OpenAI itself, refused the request: a rule the user
    // can act on, not a raw code to print.
    if (body.error === "content_blocked" || body.error === "ai_refused") {
      return { ok: false, reason: "content_blocked" };
    }
    // A length above the plan's: refused before any work, naming the plan that allows it.
    if (body.error === "duration_not_allowed") {
      return { ok: false, reason: "duration_locked", block: readPlanBlock(body) };
    }
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
  /** The app language. Captions come from the script's timed words; this is
   *  the language JSON2Video transcribes in when those timings are missing.
   *  Absent → French. */
  language?: "fr" | "en";
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
  | "duration_locked"
  | "voice_locked"
  | "library_full"
  | "storage_full"
  | "image_not_supported"
  | "script_too_long"
  | "content_blocked"
  | "error";

/** The reasons that come from the person's plan, each naming the plan that unlocks it. */
export const PLAN_REASONS: ReadonlySet<EnqueueGenerationFailReason> = new Set([
  "model_locked",
  "duration_locked",
  "voice_locked",
  "library_full",
  "storage_full",
]);

export type EnqueueGenerationOutcome =
  | { ok: true; jobId: string; charged: number }
  | {
      ok: false;
      reason: EnqueueGenerationFailReason;
      message?: string;
      /** Set for the plan reasons (`PLAN_REASONS`) and `script_too_long`
       *  (its limit: the longest video the plan allows, in seconds). */
      block?: PlanBlock;
    };

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
      body: JSON.stringify({ ...input, v: CLIENT_VERSION }),
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
    const reason = mapEnqueueReason(body.error);
    return {
      ok: false,
      reason,
      message: body.error ?? `HTTP ${res.status}`,
      ...(PLAN_REASONS.has(reason) || reason === "script_too_long"
        ? { block: readPlanBlock(body) }
        : {}),
    };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message };
  }
}

/** Map the function's error string → a caller-actionable reason (mirrors mobile). */
export function mapEnqueueReason(error: string | undefined): EnqueueGenerationFailReason {
  switch (error) {
    case "generation_not_live":
    // The plan table could not be read: a passing server problem, not a refusal.
    case "plan_unavailable":
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
    // The plan rules (brief section F): each refusal names the plan that unlocks it.
    case "duration_not_allowed":
      return "duration_locked";
    case "voice_not_allowed":
      return "voice_locked";
    case "library_full":
      return "library_full";
    case "storage_full":
      return "storage_full";
    case "image_not_supported":
      return "image_not_supported";
    case "script_too_long":
      return "script_too_long";
    case "content_blocked":
      return "content_blocked";
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
