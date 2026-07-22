/**
 * Analytics domain — pure, framework-free selectors + types. Ported from the
 * mobile app (ClipFlow/src/components/feature/analytics/selectors.ts +
 * src/mocks/analytics.ts), adapted to the web domain shapes.
 *
 * HONESTY: there is no reach/engagement collection pipeline, so per-video and
 * audience-demographic metrics are reported as honest zeros / empty sets — never
 * fabricated. The figures that ARE real come straight from owned rows: published-
 * video counts, connected-network follower columns, campaign spend/leads that the
 * `sync-ad-insights` cron writes. Everything here is a pure function of those.
 */
import { z } from "zod";
import type { Campaign } from "@/lib/vidcica/campaign";
import type { Network, PlatformId } from "@/lib/vidcica/network";
import type { Video } from "@/lib/vidcica/video";
import type { MessageKey } from "@/lib/i18n";

export type AnalyticsRange = "7d" | "30d" | "90d";

export const RANGE_VALUES: ReadonlyArray<AnalyticsRange> = ["7d", "30d", "90d"];

export const RANGE_DAYS: Readonly<Record<AnalyticsRange, number>> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/** i18n key per range chip (render with `t(RANGE_KEY[range])`). */
export const RANGE_KEY: Readonly<Record<AnalyticsRange, MessageKey>> = {
  "7d": "analytics.range.7d",
  "30d": "analytics.range.30d",
  "90d": "analytics.range.90d",
};

const rangeSchema = z.enum(["7d", "30d", "90d"]).catch("30d");

/** Coerce an untrusted `?range=` search param to a known range (default 30d). */
export function parseRange(value: string | string[] | undefined): AnalyticsRange {
  return rangeSchema.parse(Array.isArray(value) ? value[0] : value);
}

export type AnalyticsTab = "overview" | "videos" | "audience" | "ads";

/** Totals surfaced by the overview screen. Reach/engagement stay 0 (no pipeline);
 *  `leads`, `adSpend`, `followers` come from real owned rows. */
export type AnalyticsTotals = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  /** Engagement rate 0..1. */
  rate: number;
  followers: number;
  leads: number;
  /** Cumulated Meta Ads spend (real — `sync-ad-insights` cron). */
  adSpend: number;
};

export type DerivedAnalytics = {
  days: number;
  publishedVideos: ReadonlyArray<Video>;
  totals: AnalyticsTotals;
  /** Current-period numeric series powering the sparkline. Empty until a
   *  time-series collection lands — the hero renders a flat honest baseline. */
  series: number[];
  /** Cur-vs-prev percent delta on total views (0 until collection exists). */
  delta: number;
};

export type AnalyticsInputs = {
  range: AnalyticsRange;
  videos: ReadonlyArray<Video>;
  networks: ReadonlyArray<Network>;
  campaigns: ReadonlyArray<Campaign>;
  leadsCount: number;
};

/** Campaigns whose spend/leads count toward analytics (shared by overview + ads
 *  so the two surfaces can never disagree on the set). */
const billableCampaigns = (campaigns: ReadonlyArray<Campaign>): ReadonlyArray<Campaign> =>
  campaigns.filter((c) => c.status === "active" || c.status === "terminee");

/** Real cumulative ad spend — sum of the metric column the cron writes. NOT
 *  range-scaled: the metrics are lifetime cumulative totals from Meta, and
 *  splitting them across a window would be fabrication. */
const totalAdSpend = (campaigns: ReadonlyArray<Campaign>): number =>
  billableCampaigns(campaigns).reduce((acc, c) => acc + (c.metrics.budgetSpent || 0), 0);

/** Sum of follower counts across connected networks (real, nullable column). */
const totalFollowers = (networks: ReadonlyArray<Network>): number =>
  networks.reduce((acc, n) => acc + (n.connected ? (n.followers ?? 0) : 0), 0);

export function deriveAnalytics({
  range,
  videos,
  networks,
  campaigns,
  leadsCount,
}: AnalyticsInputs): DerivedAnalytics {
  const days = RANGE_DAYS[range];
  const publishedVideos = videos.filter((v) => v.status === "publie");

  return {
    days,
    publishedVideos,
    totals: {
      // No reach/engagement collection yet → honest zeros (not seeded numbers).
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      rate: 0,
      followers: totalFollowers(networks),
      leads: leadsCount,
      adSpend: totalAdSpend(campaigns),
    },
    // No time-series collection yet → empty curve + zero delta. The hero gates
    // on length and falls back to a flat honest baseline.
    series: [],
    delta: 0,
  };
}

export type TopVideo = {
  video: Video;
  /** First platform the video targets, if any (for the row icon). */
  platform: PlatformId | undefined;
};

/**
 * Recently published videos, newest first. Engagement metrics have no source
 * yet, so the row shows the publish date + platform, never invented views/likes.
 * Web `Video` has no per-platform target column, so `platform` stays undefined
 * (the seam is kept for when publish targets are surfaced).
 */
export function buildTopVideos(
  publishedVideos: ReadonlyArray<Video>,
  limit: number,
): ReadonlyArray<TopVideo> {
  return [...publishedVideos]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit)
    .map((video) => ({ video, platform: undefined }));
}

/**
 * Per-platform reach/engagement breakdown. No source exists yet, so this returns
 * empty and screens render an honest "data coming" state. Kept as the single
 * seam to fill once platform-analytics ingestion lands (mirrors mobile).
 */
export function buildPlatformBreakdown(): ReadonlyArray<{
  platform: PlatformId;
  views: number;
  share: number;
}> {
  return [];
}

export type CampaignAggregate = {
  totalSpend: number;
  totalLeads: number;
  totalReach: number;
  totalImpressions: number;
  totalClicks: number;
  /** Cost per lead (spend / leads), 0 when no leads. Real division — no invented LTV. */
  cpl: number;
  activeCount: number;
  /** True once the cron has written any non-zero metric (drives the honest notice). */
  hasMetrics: boolean;
};

/**
 * Aggregate real campaign metrics (spend/leads/reach/impressions/clicks) written
 * by the `sync-ad-insights` cron. We deliberately do NOT compute a ROAS: that
 * needs a per-lead revenue figure we don't have, and inventing one (the mobile
 * mock used a flat €28) would fabricate a metric. CPL is a real division instead.
 */
export function aggregateCampaigns(campaigns: ReadonlyArray<Campaign>): CampaignAggregate {
  const billable = billableCampaigns(campaigns);
  const totalSpend = billable.reduce((a, c) => a + (c.metrics.budgetSpent || 0), 0);
  const totalLeads = billable.reduce((a, c) => a + (c.metrics.leads || 0), 0);
  const totalReach = billable.reduce((a, c) => a + (c.metrics.reach || 0), 0);
  const totalImpressions = billable.reduce((a, c) => a + (c.metrics.impressions || 0), 0);
  const totalClicks = billable.reduce((a, c) => a + (c.metrics.clicks || 0), 0);
  return {
    totalSpend,
    totalLeads,
    totalReach,
    totalImpressions,
    totalClicks,
    cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
    activeCount: campaigns.filter((c) => c.status === "active").length,
    hasMetrics:
      totalSpend > 0 || totalLeads > 0 || totalReach > 0 || totalImpressions > 0 || totalClicks > 0,
  };
}

/** Follower rows for the audience screen — connected networks only, real column. */
export type FollowerRow = { platform: PlatformId; label: string; followers: number };
