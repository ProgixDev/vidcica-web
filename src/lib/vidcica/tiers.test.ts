import { describe, expect, it } from "vitest";
import { modelsAvailableTo } from "./models";
import { isUpgrade, ORDERED_TIERS, planRank, TIERS, type Plan } from "./tiers";

describe("tier matrix (AC-2)", () => {
  it("has the canonical prices and monthly credits", () => {
    expect(TIERS.free.priceEUR).toBe(0);
    expect(TIERS.starter.priceEUR).toBe(25);
    expect(TIERS.pro.priceEUR).toBe(45);
    expect(TIERS.studio.priceEUR).toBe(99);
    // Free grants NO monthly credits — the plan is pay-as-you-go (buy credit packs).
    expect(
      [TIERS.free, TIERS.starter, TIERS.pro, TIERS.studio].map((t) => t.monthlyCredits),
    ).toEqual([0, 150, 300, 600]);
  });

  it("orders free < starter < pro < studio", () => {
    expect(ORDERED_TIERS).toEqual(["free", "starter", "pro", "studio"]);
    expect(planRank("free")).toBeLessThan(planRank("studio"));
  });

  it("isUpgrade only for a higher paid tier", () => {
    expect(isUpgrade("free", "starter")).toBe(true);
    expect(isUpgrade("pro", "studio")).toBe(true);
    expect(isUpgrade("pro", "starter")).toBe(false); // downgrade
    expect(isUpgrade("free", "free")).toBe(false); // same / not paid
    expect(isUpgrade("studio", "studio")).toBe(false);
  });
});

/**
 * The client's plan table, copied from the brief "Cahier technique" (2026-10-23,
 * section F). The server enforces the same numbers from `public.plan_limits`
 * (vidcica migration 20261024113714, checked by vidcica
 * `scripts/plan-limits-matrix.mjs`). Change this table only when the client
 * changes theirs, and change the server seed with it. -1 = unlimited.
 */
const CLIENT_TABLE: Record<
  Plan,
  {
    maxLengthSec: number;
    maxQuality: "720p" | "1080p";
    models: string[];
    voiceover: boolean;
    networks: number;
    accountsPerPlatform: number;
    scheduleDaysAhead: number;
    schedulePerDay: number;
    storageMb: number;
    libraryMax: number;
    phoneImport: boolean;
    vidcicaLogo: boolean;
    ads: boolean;
    activeCampaigns: number;
    brandKit: boolean;
    support: string;
  }
> = {
  free: {
    maxLengthSec: 15,
    maxQuality: "720p",
    models: ["pexels"],
    voiceover: false,
    networks: 1,
    accountsPerPlatform: 1,
    scheduleDaysAhead: 0,
    schedulePerDay: 0,
    storageMb: 30,
    libraryMax: 10,
    phoneImport: false,
    vidcicaLogo: true,
    ads: false,
    activeCampaigns: 0,
    brandKit: false,
    support: "help_center",
  },
  starter: {
    maxLengthSec: 30,
    maxQuality: "720p",
    models: ["pexels", "kling", "seedance"],
    voiceover: true,
    networks: 3,
    accountsPerPlatform: 1,
    scheduleDaysAhead: 3,
    schedulePerDay: 2,
    storageMb: 500,
    libraryMax: 100,
    phoneImport: true,
    vidcicaLogo: true,
    ads: false,
    activeCampaigns: 0,
    brandKit: false,
    support: "email",
  },
  pro: {
    maxLengthSec: 90,
    maxQuality: "1080p",
    models: ["pexels", "kling", "seedance", "ltx", "seedance-pro", "kling-pro"],
    voiceover: true,
    networks: 5,
    accountsPerPlatform: 5,
    scheduleDaysAhead: 7,
    schedulePerDay: 4,
    storageMb: 1024,
    libraryMax: 500,
    phoneImport: true,
    vidcicaLogo: false,
    ads: true,
    activeCampaigns: 5,
    brandKit: true,
    support: "priority",
  },
  studio: {
    maxLengthSec: 180,
    maxQuality: "1080p",
    models: ["pexels", "kling", "seedance", "ltx", "seedance-pro", "kling-pro", "veo"],
    voiceover: true,
    networks: 5,
    accountsPerPlatform: -1,
    scheduleDaysAhead: -1,
    schedulePerDay: -1,
    storageMb: 4096,
    libraryMax: -1,
    phoneImport: true,
    vidcicaLogo: false,
    ads: true,
    activeCampaigns: -1,
    brandKit: true,
    support: "dedicated",
  },
};

describe("plan limits = the client's table (brief section F)", () => {
  it.each(ORDERED_TIERS)("%s matches the table", (plan) => {
    const { models, ...limits } = CLIENT_TABLE[plan];
    const tier = TIERS[plan];
    const shown = Object.fromEntries(
      Object.keys(limits).map((k) => [k, tier[k as keyof typeof limits]]),
    );
    expect(shown).toEqual(limits);
    expect(modelsAvailableTo(plan).map((m) => m.id)).toEqual(models);
  });
});
