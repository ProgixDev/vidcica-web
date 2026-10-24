/**
 * Canonical subscription-tier matrix for the web — plan label / price / monthly
 * credits / headline features, and the limits shown in the interface.
 *
 * The limits are the client's table (brief "Cahier technique" of 2026-10-23,
 * section F). The SERVER enforces them from `public.plan_limits` (vidcica
 * `_shared/plans.ts`); these values only drive what the screens show and lock.
 * `tiers.test.ts` holds the client's table and fails when the two drift, and
 * vidcica `scripts/plan-limits-matrix.mjs` checks the server side. The server's
 * `create-checkout-session` + `stripe-webhook` own the actual pricing/grant.
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
  /** Longest video the plan makes (seconds): 15 / 30 / 90 / 180. */
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
  /** Connected networks the plan allows: 1 / 3 / 5 / 5, and 5 is every network
   *  there is (TikTok, Instagram, Facebook, YouTube, LinkedIn). Facebook +
   *  Instagram, one Meta login, count as one. ENFORCED by the server since
   *  2026-10-18: oauth-start and oauth-callback refuse a new connection beyond
   *  it (`network_limit`, vidcica `_shared/plan-limits.ts`: Free 1, Starter 3,
   *  Pro/Studio every network). Change both together. */
  networks: number;
  /** Connected accounts per platform. -1 = unlimited. */
  accountsPerPlatform: number;
  /** Videos the library holds (finished and rendering, trash excluded). -1 = unlimited. */
  libraryMax: number;
  /** Storage for generated + imported videos, in megabytes. */
  storageMb: number;
  /** How many days ahead a video can be scheduled. 0 = no scheduling, -1 = unlimited. */
  scheduleDaysAhead: number;
  /** Videos that can be scheduled for one day. -1 = unlimited. */
  schedulePerDay: number;
  /** Import a video from the phone / computer into the library. */
  phoneImport: boolean;
  /** The Vidcica logo is drawn on the plan's videos. */
  vidcicaLogo: boolean;
  analytics: "none" | "basic" | "advanced";
  /** In-app Meta Ads campaigns + lead capture. */
  ads: boolean;
  /** Boost campaigns running at once. -1 = unlimited. */
  activeCampaigns: number;
  brandKit: boolean;
  support: "help_center" | "email" | "priority" | "dedicated";
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
    libraryMax: 10,
    storageMb: 30,
    scheduleDaysAhead: 0,
    schedulePerDay: 0,
    phoneImport: false,
    vidcicaLogo: true,
    analytics: "none",
    ads: false,
    activeCampaigns: 0,
    brandKit: false,
    support: "help_center",
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
      "tiers.starter.f5",
      "tiers.starter.f6",
    ],
    voiceover: true,
    networks: 3,
    accountsPerPlatform: 1,
    libraryMax: 100,
    storageMb: 500,
    scheduleDaysAhead: 3,
    schedulePerDay: 2,
    phoneImport: true,
    vidcicaLogo: true,
    analytics: "basic",
    ads: false,
    activeCampaigns: 0,
    brandKit: false,
    support: "email",
  },
  pro: {
    id: "pro",
    label: "Pro",
    labelKey: "tiers.pro.label",
    priceEUR: 45,
    monthlyCredits: 300,
    maxLengthSec: 90,
    maxQuality: "1080p",
    highlights: [
      "300 crédits / mois",
      "1080p · jusqu’à 1 min 30",
      "Programmation · analytics · pubs",
    ],
    highlightKeys: ["tiers.pro.h1", "tiers.pro.h2", "tiers.pro.h3"],
    landingFeatureKeys: [
      "tiers.pro.f1",
      "tiers.pro.f2",
      "tiers.pro.f3",
      "tiers.pro.f4",
      "tiers.pro.f5",
      "tiers.pro.f6",
      "tiers.pro.f7",
    ],
    voiceover: true,
    networks: 5,
    accountsPerPlatform: 5,
    libraryMax: 500,
    storageMb: 1024,
    scheduleDaysAhead: 7,
    schedulePerDay: 4,
    phoneImport: true,
    vidcicaLogo: false,
    analytics: "advanced",
    ads: true,
    activeCampaigns: 5,
    brandKit: true,
    support: "priority",
  },
  studio: {
    id: "studio",
    label: "Studio",
    labelKey: "tiers.studio.label",
    priceEUR: 99,
    monthlyCredits: 600,
    maxLengthSec: 180,
    maxQuality: "1080p",
    highlights: [
      "600 crédits / mois",
      "Vidéos jusqu’à 3 min · bibliothèque illimitée",
      "Support dédié",
    ],
    highlightKeys: ["tiers.studio.h1", "tiers.studio.h2", "tiers.studio.h3"],
    landingFeatureKeys: [
      "tiers.studio.f1",
      "tiers.studio.f2",
      "tiers.studio.f3",
      "tiers.studio.f4",
      "tiers.studio.f5",
    ],
    voiceover: true,
    networks: 5,
    accountsPerPlatform: -1,
    libraryMax: -1,
    storageMb: 4096,
    scheduleDaysAhead: -1,
    schedulePerDay: -1,
    phoneImport: true,
    vidcicaLogo: false,
    analytics: "advanced",
    ads: true,
    activeCampaigns: -1,
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
