import { describe, expect, it } from "vitest";
import {
  networkStatus,
  platformToProvider,
  PLATFORMS,
  connectablePlatforms,
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
});
