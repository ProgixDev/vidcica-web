import { modelById } from "./options";

/**
 * Client-side credit-cost estimate — the same formula as the app
 * (ClipFlow/src/lib/credits.ts) and the server worker; the server
 * (enqueue-generation) remains authoritative and re-computes on enqueue.
 */
export const STOCK_RENDER_COST = 1;
export const AI_CREDITS_PER_SEC = 0.8;
export const AI_MIN_COST = 12;

export function renderCostCredits(model: string, lengthSec: number): number {
  const def = modelById(model);
  if (!def || def.costFactor === 0) return STOCK_RENDER_COST;
  return Math.round(
    def.costFactor * Math.max(AI_MIN_COST, Math.round(lengthSec * AI_CREDITS_PER_SEC)),
  );
}

export type CostEstimate = {
  total: number;
  affordable: boolean;
  remaining: number;
  videosLeft: number;
};

export function estimateCost(model: string, lengthSec: number, credits: number): CostEstimate {
  const total = renderCostCredits(model, lengthSec);
  return {
    total,
    affordable: credits >= total,
    remaining: Math.max(0, credits - total),
    videosLeft: total > 0 ? Math.floor(credits / total) : 0,
  };
}
