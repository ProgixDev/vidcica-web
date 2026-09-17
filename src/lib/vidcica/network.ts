/**
 * Social-network domain: type + row mapper + platform catalog. Shared (used by
 * the `networks` and `publish` slices). Ported from ClipFlow entities +
 * db-mappers `rowToNetwork`.
 */
import type { Database } from "@/lib/supabase/database.types";

export type NetworkRow = Database["public"]["Tables"]["networks"]["Row"];

/** The seven social platforms (brand names stay English). */
export type PlatformId =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "x"
  | "threads";

/** OAuth provider key that `oauth-start` expects (a platform maps to a provider). */
export type OAuthProvider = "google" | "meta" | "linkedin" | "tiktok" | "threads";

export type Network = {
  id: string; // DB row id (needed for RLS updates)
  platform: PlatformId;
  name: string;
  handle?: string;
  avatarUrl?: string;
  connected: boolean;
  needsReconnect: boolean;
  publishesEnabled: boolean;
  lastSync?: string;
  followers?: number;
};

export function rowToNetwork(r: NetworkRow): Network {
  return {
    id: r.id,
    platform: r.platform as PlatformId,
    name: r.name,
    handle: r.handle ?? undefined,
    avatarUrl: r.avatar_url ?? undefined,
    connected: r.connected,
    needsReconnect: r.needs_reconnect,
    publishesEnabled: r.publishes_enabled,
    lastSync: r.last_sync ?? undefined,
    followers: r.followers ?? undefined,
  };
}

export type PlatformMeta = {
  id: PlatformId;
  label: string;
  /** OAuth provider, or null when the platform isn't connectable (X is dropped). */
  provider: OAuthProvider | null;
};

/** Catalog + platform→provider mapping. `oauth-start` still returns
 *  `platform_not_configured` (503) for any provider whose secrets are unset. */
export const PLATFORMS: ReadonlyArray<PlatformMeta> = [
  { id: "youtube", label: "YouTube", provider: "google" },
  { id: "linkedin", label: "LinkedIn", provider: "linkedin" },
  { id: "instagram", label: "Instagram", provider: "meta" },
  { id: "facebook", label: "Facebook", provider: "meta" },
  { id: "tiktok", label: "TikTok", provider: "tiktok" },
  { id: "threads", label: "Threads", provider: "threads" },
  { id: "x", label: "X", provider: null }, // paid API — not offered
];

/**
 * Platforms a PUBLIC user can actually connect and publish to today.
 *
 * Mirrors `PUBLISHING_PLATFORMS` in the mobile app (`src/lib/features.ts`,
 * commit `f32f55e`) — keep the two in sync. The catalog above stays complete:
 * this is availability, not existence.
 *
 * Status as of 2026-09-17 — move a platform up ONLY when its gate clears:
 *
 *  ENABLED
 *   - tiktok    App details Live (20 Aug) + Content Posting API audited.
 *   - linkedin  No review exists — `w_member_social` is self-serve, no user cap.
 *   - youtube   OAuth verification approved 2026-08-25.
 *
 *  HELD BACK
 *   - instagram Meta app is in Dev Mode — only people holding a role on the app
 *   - facebook  can connect; public users fail. Blocked on Meta Business
 *               Verification, itself blocked on the company NEQ.
 *   - threads   Same Meta app; its permissions were never submitted for review.
 *   - x         Dropped for good (paid API) — `provider: null` already hides it.
 *
 * Without this gate the Networks page renders a Connecter button that cannot
 * succeed, and the publish picker offers a platform the backend will reject.
 */
export const PUBLISHING_PLATFORMS: readonly PlatformId[] = ["tiktok", "linkedin", "youtube"];

/** True when a public user may connect/publish to this platform today. */
export function isPublishingPlatformEnabled(platform: PlatformId): boolean {
  return PUBLISHING_PLATFORMS.includes(platform);
}

/** The platforms to render in a connect/publish surface (catalog minus gates). */
export const connectablePlatforms = (): PlatformMeta[] =>
  PLATFORMS.filter((p) => p.provider !== null && isPublishingPlatformEnabled(p.id));

export function platformToProvider(id: PlatformId): OAuthProvider | null {
  return PLATFORMS.find((p) => p.id === id)?.provider ?? null;
}

export type NetworkStatus = "connected" | "needs_reconnect" | "disconnected" | "unavailable";

/** Presentation status for a platform given its (optional) row. */
export function networkStatus(platform: PlatformMeta, net: Network | undefined): NetworkStatus {
  if (!platform.provider) return "unavailable"; // e.g. X
  // Held back behind a platform approval (see PUBLISHING_PLATFORMS) — never
  // offer a connect affordance that cannot complete.
  if (!isPublishingPlatformEnabled(platform.id)) return "unavailable";
  if (!net || !net.connected) return "disconnected";
  return net.needsReconnect ? "needs_reconnect" : "connected";
}

export const STATUS_LABEL: Record<NetworkStatus, string> = {
  connected: "Connecté",
  needs_reconnect: "Reconnexion requise",
  disconnected: "Non connecté",
  unavailable: "Bientôt disponible",
};
