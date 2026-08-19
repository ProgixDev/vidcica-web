/**
 * Live AI video-model catalog — the models the pipeline can actually render
 * today, and the tier each one unlocks. Kept in lockstep with the mobile app
 * (ClipFlow/src/lib/generation-models.ts); only entries with `status: 'live'`
 * there appear here, so we never advertise a model we cannot render.
 *
 * UX only: `supabase/functions/enqueue-generation` keeps its own copy of the
 * gate facts and re-validates every request (`model_not_allowed`).
 *
 * Lives in `lib/` rather than `features/create/` because two surfaces read it:
 * the composer's model menu and the public pricing page. `features/create/options`
 * re-exports it so existing composer imports keep working unchanged.
 */
import type { MessageKey } from "@/lib/i18n";
// Type-only import: erased at build time, so there is no runtime cycle with
// tiers.ts (which imports the model helpers below).
import type { Plan } from "./tiers";

export type ModelOption = {
  id: string;
  labelKey: MessageKey;
  minTier: Plan;
  maxQuality: "720p" | "1080p";
  /** Multiplier in the credit-cost estimate (0 = flat stock cost). */
  costFactor: number;
};

export const MODELS: ReadonlyArray<ModelOption> = [
  {
    id: "pexels",
    labelKey: "create.modelPexels",
    minTier: "free",
    maxQuality: "1080p",
    costFactor: 0,
  },
  {
    id: "kling",
    labelKey: "create.modelKling",
    minTier: "starter",
    maxQuality: "720p",
    costFactor: 1.1,
  },
  {
    id: "seedance",
    labelKey: "create.modelSeedance",
    minTier: "starter",
    maxQuality: "720p",
    costFactor: 0.45,
  },
  { id: "ltx", labelKey: "create.modelLtx", minTier: "pro", maxQuality: "1080p", costFactor: 1.9 },
  {
    id: "seedance-pro",
    labelKey: "create.modelSeedancePro",
    minTier: "pro",
    maxQuality: "1080p",
    costFactor: 1,
  },
  {
    id: "kling-pro",
    labelKey: "create.modelKlingPro",
    minTier: "pro",
    maxQuality: "1080p",
    costFactor: 1.4,
  },
  {
    id: "veo",
    labelKey: "create.modelVeo",
    minTier: "studio",
    maxQuality: "1080p",
    costFactor: 2.1,
  },
];

export const modelById = (id: string): ModelOption | undefined => MODELS.find((m) => m.id === id);

const RANK: ReadonlyArray<Plan> = ["free", "starter", "pro", "studio"];

/** Models a tier unlocks for the FIRST time — drives the pricing card badges. */
export const modelsUnlockedAt = (plan: Plan): ReadonlyArray<ModelOption> =>
  MODELS.filter((m) => m.minTier === plan);

/** Every model a tier can use (its own plus everything below it). */
export const modelsAvailableTo = (plan: Plan): ReadonlyArray<ModelOption> =>
  MODELS.filter((m) => RANK.indexOf(m.minTier) <= RANK.indexOf(plan));

/**
 * Credit cost of one render — mirror of ClipFlow/src/lib/credits.ts, which
 * itself mirrors the authoritative charge in `enqueue-generation`.
 * Stock footage is a flat near-zero cost; AI footage is billed per second.
 */
export const STOCK_RENDER_COST = 1;
export const AI_CREDITS_PER_SEC = 0.8;
export const AI_MIN_COST = 12;

export const renderCostCredits = (opts: {
  isStock: boolean;
  lengthSec: number;
  costFactor?: number;
}): number =>
  opts.isStock
    ? STOCK_RENDER_COST
    : Math.max(
        1,
        Math.round(
          (opts.costFactor ?? 1) *
            Math.max(AI_MIN_COST, Math.round(opts.lengthSec * AI_CREDITS_PER_SEC)),
        ),
      );

/** Cheapest live AI model a tier can use — the yardstick for "videos / month". */
export const bestValueModelFor = (plan: Plan): ModelOption | undefined =>
  modelsAvailableTo(plan)
    .filter((m) => m.costFactor > 0)
    .sort((a, b) => a.costFactor - b.costFactor)[0];
