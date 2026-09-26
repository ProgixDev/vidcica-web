import { describe, expect, it } from "vitest";
import {
  networkStatus,
  platformToProvider,
  PLATFORMS,
  connectablePlatforms,
  hasMetaReviewAccess,
  isPublishingPlatformEnabled,
  rowToNetwork,
  type Network,
  type NetworkRow,
} from "./network";

const row = {
  id: "n1",
  platform: "youtube",
  name: "Ma chaîne",
  handle: "@moi",
  avatar_url: null,
  connected: true,
  needs_reconnect: false,
  publishes_enabled: true,
  last_sync: "2026-07-13T00:00:00Z",
  followers: 1200,
} as unknown as NetworkRow;

describe("rowToNetwork", () => {
  it("maps a row to the domain type", () => {
    const n = rowToNetwork(row);
    expect(n).toMatchObject({
      id: "n1",
      platform: "youtube",
      handle: "@moi",
      connected: true,
      publishesEnabled: true,
    });
  });
});

describe("platformToProvider (AC-2/AC-4 mapping)", () => {
  it("maps platforms to their OAuth provider", () => {
    expect(platformToProvider("youtube")).toBe("google");
    expect(platformToProvider("instagram")).toBe("meta");
    expect(platformToProvider("facebook")).toBe("meta");
    expect(platformToProvider("linkedin")).toBe("linkedin");
  });
  it("returns null for the dropped X platform", () => {
    expect(platformToProvider("x")).toBeNull();
  });
});

describe("isPublishingPlatformEnabled", () => {
  it("allows only the platforms whose review has cleared", () => {
    expect(isPublishingPlatformEnabled("tiktok")).toBe(true);
    expect(isPublishingPlatformEnabled("linkedin")).toBe(true);
    expect(isPublishingPlatformEnabled("youtube")).toBe(true);
  });
  it("holds back the platforms still waiting on Meta", () => {
    // Meta app is in Dev Mode (business verification outstanding); Threads was
    // never submitted. Offering these ships a button that cannot succeed.
    expect(isPublishingPlatformEnabled("instagram")).toBe(false);
    expect(isPublishingPlatformEnabled("facebook")).toBe(false);
    expect(isPublishingPlatformEnabled("threads")).toBe(false);
  });
});

describe("connectablePlatforms", () => {
  it("drops X and every platform still held back", () => {
    expect(connectablePlatforms().map((p) => p.id)).toEqual(["youtube", "linkedin", "tiktok"]);
  });
});

describe("networkStatus", () => {
  const meta = PLATFORMS.find((p) => p.id === "youtube")!;
  const x = PLATFORMS.find((p) => p.id === "x")!;
  const net = (over: Partial<Network>): Network => ({
    id: "n",
    platform: "youtube",
    name: "n",
    connected: true,
    needsReconnect: false,
    publishesEnabled: true,
    ...over,
  });

  it("classifies connected / needs-reconnect / disconnected / unavailable", () => {
    expect(networkStatus(meta, net({}))).toBe("connected");
    expect(networkStatus(meta, net({ needsReconnect: true }))).toBe("needs_reconnect");
    expect(networkStatus(meta, net({ connected: false }))).toBe("disconnected");
    expect(networkStatus(meta, undefined)).toBe("disconnected");
    expect(networkStatus(x, undefined)).toBe("unavailable");
  });

  it("reports a held-back platform as unavailable even when a row exists", () => {
    // A row can exist from before the gate (or from a dev-mode connect): the UI
    // must still not present it as connected/publishable.
    const instagram = PLATFORMS.find((p) => p.id === "instagram")!;
    expect(networkStatus(instagram, net({ platform: "instagram" }))).toBe("unavailable");
    expect(networkStatus(instagram, undefined)).toBe("unavailable");
  });

  it("opens Instagram/Facebook for a Meta App Review account", () => {
    const instagram = PLATFORMS.find((p) => p.id === "instagram")!;
    const facebook = PLATFORMS.find((p) => p.id === "facebook")!;
    expect(networkStatus(instagram, undefined, true)).toBe("disconnected");
    expect(networkStatus(facebook, undefined, true)).toBe("disconnected");
    expect(networkStatus(instagram, net({ platform: "instagram" }), true)).toBe("connected");
  });

  it("never opens Threads or X, even for a review account", () => {
    // Threads sits on the same Meta app but was never submitted, and X is gone
    // for good. Review access must not widen past what is being reviewed.
    const threads = PLATFORMS.find((p) => p.id === "threads")!;
    expect(networkStatus(threads, undefined, true)).toBe("unavailable");
    expect(networkStatus(x, undefined, true)).toBe("unavailable");
  });
});

describe("hasMetaReviewAccess", () => {
  it("is closed by default — no allowlist, no access", () => {
    expect(hasMetaReviewAccess("someone@example.com", undefined)).toBe(false);
    expect(hasMetaReviewAccess("someone@example.com", "")).toBe(false);
  });

  it("matches an allowlisted address regardless of case and padding", () => {
    const list = " Reviewer@Example.com , second@example.com ";
    expect(hasMetaReviewAccess("reviewer@example.com", list)).toBe(true);
    expect(hasMetaReviewAccess("  SECOND@EXAMPLE.COM  ", list)).toBe(true);
  });

  it("rejects anyone not on the list, and a missing address", () => {
    const list = "reviewer@example.com";
    expect(hasMetaReviewAccess("someone.else@example.com", list)).toBe(false);
    expect(hasMetaReviewAccess(null, list)).toBe(false);
    expect(hasMetaReviewAccess(undefined, list)).toBe(false);
    expect(hasMetaReviewAccess("   ", list)).toBe(false);
  });

  it("does not let an empty allowlist entry match an empty address", () => {
    // A trailing comma yields an empty entry; it must not become a wildcard.
    expect(hasMetaReviewAccess("", "reviewer@example.com,")).toBe(false);
  });
});
