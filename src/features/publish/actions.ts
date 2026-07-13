"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enqueuePublish, type EnqueueOutcome } from "@/lib/vidcica/publishing";
import type { PlatformId } from "@/lib/vidcica/network";

// Only connectable platforms are publishable (X has no provider — never valid).
const CONNECTABLE = ["youtube", "tiktok", "instagram", "facebook", "linkedin", "threads"] as const;

const Input = z.object({
  videoId: z.string().uuid(),
  platforms: z.array(z.enum(CONNECTABLE)).min(1),
  scheduledFor: z.string().datetime().optional(),
  asShort: z.boolean().optional(),
});

/** Enqueue a publish via the existing `enqueue-publish` edge function (session-scoped). */
export async function enqueuePublishAction(input: {
  videoId: string;
  platforms: PlatformId[];
  scheduledFor?: string;
  asShort?: boolean;
}): Promise<EnqueueOutcome> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }
  const supabase = await createClient();
  return enqueuePublish(supabase, parsed.data);
}
