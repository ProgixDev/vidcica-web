/**
 * Shared Vidcica campaign domain type + row mapper. Lives in `lib` (ADR-0008)
 * because the ads slice, its realtime hook, and the create action all need it.
 * A web-native subset of the mobile `Campaign` entity + `rowToCampaign`
 * (ClipFlow/src/lib/db-mappers.ts) — only the fields the web ads surface renders.
 *
 * The `campaigns` table IS the ad-campaigns table (Meta columns live on it); the
 * `sync-ad-insights` cron writes the metric columns, which the web reads.
 */
import type { Database } from "@/lib/supabase/database.types";

export type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];

/** Meta objectives. Phase-1 backend only honors the first three (create-ad-campaign
 *  rejects the rest with `objective_unsupported_phase1`); legacy values kept so
 *  persisted rows don't break on hydration. */
export type CampaignObjective =
  | "notoriete"
  | "trafic"
  | "engagement"
  | "prospects"
  | "conversions"
  | "app_installs"
  | "vues_video";

/** The only objectives the boost flow offers (backend-matched — no dead controls). */
export const SUPPORTED_OBJECTIVES = ["notoriete", "trafic", "engagement"] as const;
export type SupportedObjective = (typeof SUPPORTED_OBJECTIVES)[number];

export type CampaignStatus =
  | "brouillon"
  | "in_review"
  | "active"
  | "en_pause"
  | "terminee"
  | "rejected";

export type CampaignBudgetMode = "quotidien" | "total";
export type CampaignGender = "tous" | "hommes" | "femmes";
export type CampaignCta = "en_savoir_plus" | "acheter" | "telecharger" | "s_inscrire";

/** Live metrics — honest zeros until the sync cron fills them. */
export type CampaignMetrics = {
  budgetSpent: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  leads: number;
  cpm: number;
  ctr: number;
  cpc: number;
  updatedAt?: string;
};

export type Campaign = {
  id: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  budgetMode: CampaignBudgetMode;
  budgetDaily?: number;
  budgetTotal: number;
  startDate: string;
  endDate?: string;
  videoId?: string;
  title?: string;
  primaryText?: string;
  cta?: CampaignCta;
  url?: string;
  gender?: CampaignGender;
  ageMin?: number;
  ageMax?: number;
  countries: string[];
  /** Set once create-ad-campaign has built the Meta objects (⇒ activatable). */
  externalCampaignId?: string;
  lastError?: string;
  metrics: CampaignMetrics;
  createdAt: string;
  updatedAt: string;
};

/** Pure row → domain mapper. Only own rows reach here (RLS `user_id = auth.uid()`). */
export function rowToCampaign(r: CampaignRow): Campaign {
  return {
    id: r.id,
    name: r.name,
    objective: r.objective as CampaignObjective,
    status: r.status as CampaignStatus,
    budgetMode: (r.budget_mode as CampaignBudgetMode | null) ?? "quotidien",
    budgetDaily: r.budget_daily ?? undefined,
    budgetTotal: r.budget_total,
    startDate: r.start_date,
    endDate: r.end_date ?? undefined,
    videoId: r.video_id ?? undefined,
    title: r.title ?? undefined,
    primaryText: r.primary_text ?? undefined,
    cta: (r.cta as CampaignCta | null) ?? undefined,
    url: r.url ?? undefined,
    gender: (r.gender as CampaignGender | null) ?? undefined,
    ageMin: r.age_min ?? undefined,
    ageMax: r.age_max ?? undefined,
    countries: r.countries ?? [],
    externalCampaignId: r.external_campaign_id ?? undefined,
    lastError: r.last_error ?? undefined,
    metrics: {
      budgetSpent: r.budget_spent,
      reach: r.reach,
      impressions: r.impressions,
      clicks: r.clicks,
      conversions: r.conversions ?? 0,
      leads: r.leads ?? 0,
      cpm: r.cpm,
      ctr: r.ctr,
      cpc: r.cpc ?? 0,
      updatedAt: r.metrics_updated_at ?? undefined,
    },
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** The lean boost draft the wizard collects (backend-matched Phase-1 fields only). */
export type BoostDraft = {
  name: string;
  videoId: string;
  objective: SupportedObjective;
  countries: string[];
  ageMin: number;
  ageMax: number;
  gender: CampaignGender;
  budgetMode: CampaignBudgetMode;
  budgetDaily: number;
  budgetTotal: number;
  startDate?: string;
};

/**
 * Build a `campaigns` Insert row from a boost draft. Status is always `brouillon`
 * (create-ad-campaign flips it to in_review); `user_id` + `id` are supplied by the
 * server action, never the client. Audience is Advantage+ broad (Phase-1 default).
 */
export function boostDraftToRow(draft: BoostDraft, userId: string, id: string): CampaignInsert {
  return {
    id,
    user_id: userId,
    name: draft.name,
    objective: draft.objective,
    status: "brouillon",
    budget_mode: draft.budgetMode,
    budget_daily: draft.budgetMode === "quotidien" ? draft.budgetDaily : null,
    budget_total: draft.budgetMode === "total" ? draft.budgetTotal : 0,
    start_date: draft.startDate ?? new Date().toISOString(),
    video_id: draft.videoId,
    audience_mode: "advantage",
    gender: draft.gender,
    age_min: draft.ageMin,
    age_max: draft.ageMax,
    countries: [...draft.countries],
  };
}

/** Is the campaign a created Meta campaign that can be activated/paused? */
export function isLaunched(c: Pick<Campaign, "externalCampaignId">): boolean {
  return !!c.externalCampaignId;
}

/** Badge presentation per status: FR label + shadcn role token variant. */
export const STATUS_META: Record<
  CampaignStatus,
  { label: string; variant: "muted" | "brand" | "success" | "warning" | "outline" }
> = {
  brouillon: { label: "Brouillon", variant: "muted" },
  in_review: { label: "En révision", variant: "warning" },
  active: { label: "Active", variant: "success" },
  en_pause: { label: "En pause", variant: "muted" },
  terminee: { label: "Terminée", variant: "muted" },
  rejected: { label: "Refusée", variant: "outline" },
};

export const OBJECTIVE_LABEL: Record<SupportedObjective, string> = {
  notoriete: "Notoriété",
  trafic: "Trafic",
  engagement: "Engagement",
};

/** FR label for a campaign objective (legacy values fall back to their raw key). */
export function objectiveLabel(objective: CampaignObjective): string {
  return OBJECTIVE_LABEL[objective as SupportedObjective] ?? objective;
}

/** FR budget summary — daily or lifetime. */
export function budgetLabel(
  c: Pick<Campaign, "budgetMode" | "budgetTotal" | "budgetDaily">,
): string {
  return c.budgetMode === "total" ? `${c.budgetTotal} € au total` : `${c.budgetDaily ?? 0} €/jour`;
}
