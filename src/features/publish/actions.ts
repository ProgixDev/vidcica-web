"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { entityId } from "@/lib/vidcica/id";
import { enqueuePublish, type EnqueueOutcome } from "@/lib/vidcica/publishing";
import type { PlatformId } from "@/lib/vidcica/network";

// Only connectable platforms are publishable (X has no provider — never valid).
const CONNECTABLE = ["youtube", "tiktok", "instagram", "facebook", "linkedin", "threads"] as const;

const Input = z.object({
  videoId: entityId,
  platforms: z.array(z.enum(CONNECTABLE)).min(1),
  scheduledFor: z.string().datetime().optional(),
  asShort: z.boolean().optional(),
  // Per-platform caption overrides. Keys constrained to real platforms; the edge
  // function re-clamps each value and each publisher enforces its own char cap.
  captions: z.record(z.enum(CONNECTABLE), z.string().max(5000)).optional(),
  // Per-platform posting options in the edge function's snake_case wire shape.
  // TikTok is the only consumer today (its audit requires per-post creator
  // choices). Validated here AND re-whitelisted server-side in enqueue-publish —
  // a Server Action is a public endpoint, so neither layer trusts the other.
  options: z
    .record(
      z.enum(CONNECTABLE),
      z.object({
        privacy_level: z
          .enum(["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY"])
          .optional(),
        disable_comment: z.boolean().optional(),
        disable_duet: z.boolean().optional(),
        disable_stitch: z.boolean().optional(),
        brand_content_toggle: z.boolean().optional(),
        brand_organic_toggle: z.boolean().optional(),
      }),
    )
    .optional(),
});

/** Enqueue a publish via the existing `enqueue-publish` edge function (session-scoped). */
export async function enqueuePublishAction(input: {
  videoId: string;
  platforms: PlatformId[];
  scheduledFor?: string;
  asShort?: boolean;
  captions?: Partial<Record<PlatformId, string>>;
  options?: Partial<Record<PlatformId, Record<string, unknown>>>;
}): Promise<EnqueueOutcome> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }
  const supabase = await createClient();
  return enqueuePublish(supabase, parsed.data);
}
