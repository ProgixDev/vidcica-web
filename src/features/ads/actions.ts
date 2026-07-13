"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { boostDraftToRow, SUPPORTED_OBJECTIVES, type BoostDraft } from "@/lib/vidcica/campaign";

/** Boost draft validated at the trust boundary before it becomes a `campaigns` row. */
const boostSchema = z.object({
  name: z.string().trim().min(1).max(120),
  videoId: z.string().uuid(),
  objective: z.enum(SUPPORTED_OBJECTIVES),
  countries: z.array(z.string().length(2)).min(1).max(25),
  ageMin: z.number().int().min(13).max(65),
  ageMax: z.number().int().min(13).max(65),
  gender: z.enum(["tous", "hommes", "femmes"]),
  budgetMode: z.enum(["quotidien", "total"]),
  budgetDaily: z.number().min(1).max(100000),
  budgetTotal: z.number().min(1).max(1000000),
  startDate: z.string().datetime().optional(),
});

export type CreateDraftResult = { ok: true; id: string } | { ok: false; message: string };

/**
 * Persist a boost draft as a `brouillon` campaigns row (RLS own-row). `user_id` is
 * set server-side from the session — never client input; `id` is server-minted.
 * Returns the id so the caller can invoke `create-ad-campaign`.
 */
export async function createDraftCampaign(input: BoostDraft): Promise<CreateDraftResult> {
  const parsed = boostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Paramètres de campagne invalides." };
  if (parsed.data.ageMax < parsed.data.ageMin) {
    return { ok: false, message: "L’âge maximum doit être supérieur à l’âge minimum." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Session expirée. Reconnectez-vous." };

  const id = crypto.randomUUID();
  const row = boostDraftToRow(parsed.data, user.id, id);
  const { error } = await supabase.from("campaigns").insert(row);
  if (error) return { ok: false, message: "La création du brouillon a échoué. Réessayez." };
  return { ok: true, id };
}
