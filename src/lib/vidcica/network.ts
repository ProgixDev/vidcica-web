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

/**
 * Platforms un-gated for Meta App Review, per account.
 *
 * Meta will not approve `instagram_content_publish` without seeing the connect
 * flow work, and the gate above hides the button from EVERYONE — including an
 * app Admin who can actually complete the flow in Dev Mode. So today the
 * screencast App Review requires cannot even be filmed: the reviewer's own
 * step "click Connect on Facebook / Instagram" has no button to click.
 *
 * Opening it per-account breaks that circle without putting a dead affordance
 * in front of the public, who still cannot finish the flow while the Meta app
 * is in Dev Mode.
 *
 * DELETE THIS, and move the two platforms into PUBLISHING_PLATFORMS, as soon as
 * Meta grants Advanced Access.
 */
export const META_REVIEW_PLATFORMS: readonly PlatformId[] = ["instagram", "facebook"];

/**
 * Whether this signed-in address is on the Meta App Review allowlist.
 *
 * Pure on purpose — the caller supplies the raw allowlist so it can be unit
 * tested, and so the value is read from a SERVER-only env var. It must never
 * become NEXT_PUBLIC: that would ship the reviewer's address to every visitor.
 */
export function hasMetaReviewAccess(
  email: string | null | undefined,
  allowlist: string | undefined,
): boolean {
  if (!email) return false;
  const needle = email.trim().toLowerCase();
  if (!needle) return false;
  return (allowlist ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(needle);
}

/** True when this user may connect/publish to this platform today. */
export function isPublishingPlatformEnabled(platform: PlatformId, reviewAccess = false): boolean {
  if (PUBLISHING_PLATFORMS.includes(platform)) return true;
  return reviewAccess && META_REVIEW_PLATFORMS.includes(platform);
}

/** The platforms to render in a connect/publish surface (catalog minus gates). */
export const connectablePlatforms = (reviewAccess = false): PlatformMeta[] =>
  PLATFORMS.filter((p) => p.provider !== null && isPublishingPlatformEnabled(p.id, reviewAccess));

export function platformToProvider(id: PlatformId): OAuthProvider | null {
  return PLATFORMS.find((p) => p.id === id)?.provider ?? null;
}

export type NetworkStatus = "connected" | "needs_reconnect" | "disconnected" | "unavailable";

/** Presentation status for a platform given its (optional) row. */
export function networkStatus(
  platform: PlatformMeta,
  net: Network | undefined,
  reviewAccess = false,
): NetworkStatus {
  if (!platform.provider) return "unavailable"; // e.g. X
  // Held back behind a platform approval (see PUBLISHING_PLATFORMS) — never
  // offer a connect affordance that cannot complete.
  if (!isPublishingPlatformEnabled(platform.id, reviewAccess)) return "unavailable";
  if (!net || !net.connected) return "disconnected";
  return net.needsReconnect ? "needs_reconnect" : "connected";
}

export const STATUS_LABEL: Record<NetworkStatus, string> = {
  connected: "Connecté",
  needs_reconnect: "Reconnexion requise",
  disconnected: "Non connecté",
  unavailable: "Bientôt disponible",
};
