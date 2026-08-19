/**
 * Canonical subscription-tier matrix for the web — the single source of truth
 * for plan label / price / monthly credits / headline features. Ported from
 * ClipFlow/src/lib/tiers.ts (values kept in lockstep; the server's
 * `create-checkout-session` + `stripe-webhook` own the actual pricing/grant).
 */
import type { MessageKey } from "@/lib/i18n";

export type Plan = "free" | "starter" | "pro" | "studio";

export type TierDef = {
  id: Plan;
  label: string;
  /** i18n key for the plan label (render with `t(labelKey)`). */
  labelKey: MessageKey;
  /** Monthly price in EUR (0 = free). */
  priceEUR: number;
  /** Credits granted each month. */
  monthlyCredits: number;
  /** Max video length the composer offers (seconds). */
  maxLengthSec: number;
  /** Quality cap. */
  maxQuality: "720p" | "1080p";
  /** Headline features for the plan card (French). */
  highlights: string[];
  /** i18n keys for the headline features (render each with `t(key)`). */
  highlightKeys: MessageKey[];
  /** Richer feature list for the public pricing card (landing page only).
   *  Reads as a delta on the tier below it — see `landing.pricing.includesPrev`. */
  landingFeatureKeys: MessageKey[];
  /** AI voiceover + burned-in captions. Free is silent stock footage only. */
  voiceover: boolean;
  /** Connectable social platforms. */
  networks: number;
  /** Connected accounts per platform. -1 = unlimited. */
  accountsPerPlatform: number;
  /** Saved-video library cap. -1 = unlimited. */
  storageLimit: number;
  /** Scheduled publishing. */
  scheduling: boolean;
  analytics: "none" | "basic" | "advanced";
  /** In-app Meta Ads campaigns + lead capture. */
  ads: boolean;
  brandKit: boolean;
  support: "none" | "email" | "priority" | "dedicated";
};

export const TIERS: Readonly<Record<Plan, TierDef>> = {
  free: {
    id: "free",
    label: "Gratuit",
    labelKey: "tiers.free.label",
    priceEUR: 0,
    monthlyCredits: 0,
    maxLengthSec: 15,
    maxQuality: "720p",
    highlights: ["Crédits à la carte", "Vidéos jusqu’à 15 s", "Banque d’images (sans voix)"],
    highlightKeys: ["tiers.free.h1", "tiers.free.h2", "tiers.free.h3"],
    landingFeatureKeys: ["tiers.free.f1", "tiers.free.f2", "tiers.free.f3", "tiers.free.f4"],
    voiceover: false,
    networks: 1,
    accountsPerPlatform: 1,
    storageLimit: 10,
    scheduling: false,
    analytics: "none",
    ads: false,
    brandKit: false,
    support: "none",
  },
  starter: {
    id: "starter",
    label: "Starter",
    labelKey: "tiers.starter.label",
    priceEUR: 25,
    monthlyCredits: 150,
    maxLengthSec: 30,
    maxQuality: "720p",
    highlights: ["150 crédits / mois", "Voix off IA + sous-titres", "Jusqu’à 30 s · 3 réseaux"],
    highlightKeys: ["tiers.starter.h1", "tiers.starter.h2", "tiers.starter.h3"],
    landingFeatureKeys: [
      "tiers.starter.f1",
      "tiers.starter.f2",
      "tiers.starter.f3",
      "tiers.starter.f4",
    ],
    voiceover: true,
    networks: 3,
    accountsPerPlatform: 1,
    storageLimit: 100,
    scheduling: false,
    analytics: "basic",
    ads: false,
    brandKit: false,
    support: "email",
  },
  pro: {
    id: "pro",
    label: "Pro",
    labelKey: "tiers.pro.label",
    priceEUR: 45,
    monthlyCredits: 300,
    maxLengthSec: 60,
    maxQuality: "1080p",
    highlights: ["300 crédits / mois", "1080p · jusqu’à 60 s", "Programmation · analytics · pubs"],
    highlightKeys: ["tiers.pro.h1", "tiers.pro.h2", "tiers.pro.h3"],
    landingFeatureKeys: [
      "tiers.pro.f1",
      "tiers.pro.f2",
      "tiers.pro.f3",
      "tiers.pro.f4",
      "tiers.pro.f5",
    ],
    voiceover: true,
    networks: 7,
    accountsPerPlatform: 5,
    storageLimit: 500,
    scheduling: true,
    analytics: "advanced",
    ads: true,
    brandKit: true,
    support: "priority",
  },
  studio: {
    id: "studio",
    label: "Studio",
    labelKey: "tiers.studio.label",
    priceEUR: 99,
    monthlyCredits: 600,
    maxLengthSec: 60,
    maxQuality: "1080p",
    highlights: ["600 crédits / mois", "Bibliothèque illimitée", "Support dédié"],
    highlightKeys: ["tiers.studio.h1", "tiers.studio.h2", "tiers.studio.h3"],
    landingFeatureKeys: [
      "tiers.studio.f1",
      "tiers.studio.f2",
      "tiers.studio.f3",
      "tiers.studio.f4",
    ],
    voiceover: true,
    networks: 7,
    accountsPerPlatform: -1,
    storageLimit: -1,
    scheduling: true,
    analytics: "advanced",
    ads: true,
    brandKit: true,
    support: "dedicated",
  },
};

export const ORDERED_TIERS: ReadonlyArray<Plan> = ["free", "starter", "pro", "studio"];

/** Current entitlement (kept here, not in the server-only queries module, so the
 *  client paywall can import the type without touching `server-only`). */
export type Entitlement = { plan: Plan; credits: number };

/** Coerce an untrusted tier string (from the DB) to a known plan; unknown → free. */
export function toPlan(tier: string | null | undefined): Plan {
  return (ORDERED_TIERS as readonly string[]).includes(tier ?? "") ? (tier as Plan) : "free";
}

export const tierDef = (plan: Plan): TierDef => TIERS[plan];

/** Rank for upgrade/downgrade comparisons (free < starter < pro < studio). */
export function planRank(plan: Plan): number {
  return ORDERED_TIERS.indexOf(plan);
}

/** A plan the caller can self-checkout into: a paid tier above their current one. */
export function isUpgrade(current: Plan, target: Plan): boolean {
  return TIERS[target].priceEUR > 0 && planRank(target) > planRank(current);
}
