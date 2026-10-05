"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { entityId } from "@/lib/vidcica/id";
import {
  boostDraftToRow,
  isWebLink,
  MIN_DAILY_BUDGET,
  needsWebsite,
  SUPPORTED_OBJECTIVES,
  type BoostDraft,
  type CampaignInsert,
  type CampaignStatus,
} from "@/lib/vidcica/campaign";
import { MAX_COUNTRIES, NEEDS_DECLARATION, WORLDWIDE } from "@/lib/vidcica/countries";
import type { MessageKey } from "@/lib/i18n";

/** Boost draft validated at the trust boundary before it becomes a `campaigns` row. */
const boostSchema = z.object({
  name: z.string().trim().min(1).max(120),
  videoId: entityId,
  objective: z.enum(SUPPORTED_OBJECTIVES),
  // Two-letter country codes, or WORLDWIDE on its own: create-ad-campaign turns
  // it into Meta's worldwide group, which can't be combined with countries.
  countries: z
    .array(z.union([z.literal(WORLDWIDE), z.string().regex(/^[A-Z]{2}$/)]))
    .min(1)
    .max(MAX_COUNTRIES)
    .refine((cs) => !cs.includes(WORLDWIDE) || cs.length === 1),
  ageMin: z.number().int().min(13).max(65),
  ageMax: z.number().int().min(13).max(65),
  gender: z.enum(["tous", "hommes", "femmes"]),
  budgetMode: z.enum(["quotidien", "total"]),
  budgetDaily: z.number().min(1).max(100000),
  budgetTotal: z.number().min(1).max(1000000),
  startDate: z.string().datetime().optional(),
  // Defaulted so a page loaded before the field existed can still save a draft.
  url: z.string().trim().max(2048).default(""),
});

/** Failures carry an i18n key, never a sentence: the client renders it in the page's language. */
export type CreateDraftResult = { ok: true; id: string } | { ok: false; errorKey: MessageKey };

/**
 * Persist a boost draft as a `brouillon` campaigns row (RLS own-row). `user_id` is
 * set server-side from the session — never client input; `id` is server-minted.
 * Returns the id so the caller can invoke `create-ad-campaign`.
 */
export async function createDraftCampaign(input: BoostDraft): Promise<CreateDraftResult> {
  const parsed = boostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "ads.err.invalidParams" };
  if (parsed.data.ageMax < parsed.data.ageMin) {
    return { ok: false, errorKey: "ads.err.ageOrder" };
  }
  // Activation refuses a smaller daily budget, so don't save a campaign that can't run.
  if (parsed.data.budgetMode === "quotidien" && parsed.data.budgetDaily < MIN_DAILY_BUDGET) {
    return { ok: false, errorKey: "ads.err.belowMinBudget" };
  }
  // Same for a Traffic ad with nowhere to send people: Meta would refuse it.
  if (needsWebsite(parsed.data.objective) && !isWebLink(parsed.data.url)) {
    return { ok: false, errorKey: "ads.err.missingUrl" };
  }
  // And for a country Meta only serves with a declaration we can't make.
  if (parsed.data.countries.some((c) => NEEDS_DECLARATION.includes(c))) {
    return { ok: false, errorKey: "ads.err.countryUnavailable" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errorKey: "ads.err.sessionExpired" };

  const id = crypto.randomUUID();
  const row = boostDraftToRow(parsed.data, user.id, id);
  const { error } = await supabase.from("campaigns").insert(row);
  if (error) return { ok: false, errorKey: "ads.err.draftFailed" };
  return { ok: true, id };
}

const idSchema = z.object({ id: entityId });

/** Campaign fields carried over when cloning — creative + targeting + budget, never
 *  the Meta external ids or accrued metrics (a clone starts fresh as a `brouillon`). */
const CLONE_COLUMNS =
  "name, objective, budget_mode, budget_daily, budget_total, video_id, title, primary_text, cta, url, audience_mode, gender, age_min, age_max, countries";

type CloneRow = {
  name: string;
  objective: string;
  budget_mode: string | null;
  budget_daily: number | null;
  budget_total: number;
  video_id: string | null;
  title: string | null;
  primary_text: string | null;
  cta: string | null;
  url: string | null;
  audience_mode: string | null;
  gender: string | null;
  age_min: number | null;
  age_max: number | null;
  countries: string[] | null;
};

export type DuplicateResult = { ok: true; id: string } | { ok: false; errorKey: MessageKey };

/**
 * Clone a campaign (RLS own-row) into a fresh `brouillon`. Copies creative/targeting/
 * budget but drops the Meta external ids + accrued metrics so the copy is a clean
 * draft the user can review and (re)launch. `user_id`/`id` are server-minted.
 */
export async function duplicateCampaign(input: { id: string }): Promise<DuplicateResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "ads.err.notFound" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errorKey: "ads.err.sessionExpired" };

  const { data, error: readErr } = await supabase
    .from("campaigns")
    .select(CLONE_COLUMNS)
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (readErr || !data) return { ok: false, errorKey: "ads.err.notFound" };
  const src = data as unknown as CloneRow;

  const id = crypto.randomUUID();
  const clone: CampaignInsert = {
    id,
    user_id: user.id,
    name: `${src.name} (copie)`,
    objective: src.objective,
    status: "brouillon",
    budget_mode: src.budget_mode,
    budget_daily: src.budget_daily,
    budget_total: src.budget_total,
    start_date: new Date().toISOString(),
    video_id: src.video_id,
    title: src.title,
    primary_text: src.primary_text,
    cta: src.cta,
    url: src.url,
    audience_mode: src.audience_mode,
    gender: src.gender,
    age_min: src.age_min,
    age_max: src.age_max,
    countries: src.countries ?? [],
  };

  const { error } = await supabase.from("campaigns").insert(clone);
  if (error) return { ok: false, errorKey: "ads.err.duplicateFailed" };
  revalidatePath("/ads");
  return { ok: true, id };
}

export type DeleteResult = { ok: true } | { ok: false; errorKey: MessageKey };

/** Statuses that may be deleted — never a live Meta campaign (would orphan spend). */
const DELETABLE: readonly CampaignStatus[] = ["brouillon", "terminee", "rejected"];

/**
 * Delete a campaign (RLS own-row). Only drafts and ended/refused campaigns are
 * removable; a live/in-review/paused Meta campaign is refused with an honest message
 * (pause + end it first). The status guard is re-checked server-side, not trusted from
 * the client.
 */
export async function deleteCampaign(input: { id: string }): Promise<DeleteResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "ads.err.notFound" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errorKey: "ads.err.sessionExpired" };

  const { data, error: readErr } = await supabase
    .from("campaigns")
    .select("status")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (readErr || !data) return { ok: false, errorKey: "ads.err.notFound" };
  const src = data as { status: string };

  if (!DELETABLE.includes(src.status as CampaignStatus)) {
    return { ok: false, errorKey: "ads.err.deleteLive" };
  }

  const { error } = await supabase.from("campaigns").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, errorKey: "ads.err.deleteFailed" };
  revalidatePath("/ads");
  return { ok: true };
}
