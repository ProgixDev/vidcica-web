import { z } from "zod";

/**
 * Vidcica entity ids are **TEXT, not UUIDs**. Real values look like `vid_jujj2mkp`,
 * `rev-vid_…`, `rev-musictest-corp-…`, or `{userId}_{platform}` (networks). A
 * `z.string().uuid()` check silently rejects every one and breaks the action, so
 * server actions MUST validate ids with this shape-only schema instead. RLS
 * (`user_id = auth.uid()`) is the real ownership guard — the parse only bounds
 * the shape so a malformed id fails fast before hitting the DB.
 */
export const entityId = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/, "Identifiant invalide");
