import { describe, expect, it } from "vitest";
import {
  networkStatus,
  platformToProvider,
  PLATFORMS,
  connectablePlatforms,
  heldConnections,
  isPlatformId,
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

describe("rowToNetwork — stored Meta fields", () => {
  const meta = (platform_metadata: unknown) =>
    rowToNetwork({ ...row, platform: "facebook", platform_metadata } as unknown as NetworkRow);

  it("reads the connect reason, the chosen Page and the shared Pages", () => {
    const n = meta({
      pageId: "111",
      connectReason: "instagram_not_linked",
      pages: [
        { id: "111", name: "Vidcica", igUsername: null },
        { id: "222", name: "Autre", igUsername: "autre" },
      ],
    });
    expect(n.connectReason).toBe("instagram_not_linked");
    expect(n.pageId).toBe("111");
    expect(n.pages).toEqual([
      { id: "111", name: "Vidcica", igUsername: null },
      { id: "222", name: "Autre", igUsername: "autre" },
    ]);
  });

  it("ignores an unknown reason without dropping the other fields", () => {
    const n = meta({ connectReason: "something_new", pageId: "111" });
    expect(n.connectReason).toBeUndefined();
    expect(n.pageId).toBe("111");
  });

  it("rows connected before the Meta fields existed have none of them", () => {
    const n = meta({ pageName: "Vidcica", userName: "Kenn" });
    expect(n.connectReason).toBeUndefined();
    expect(n.pageId).toBeUndefined();
    expect(n.pages).toBeUndefined();
    expect(meta(null).pages).toBeUndefined();
  });
});

describe("heldConnections (the plan allowance count)", () => {
  const n = (platform: Network["platform"], connected = true): Network => ({
    id: platform,
    platform,
    name: platform,
    connected,
    needsReconnect: false,
    publishesEnabled: true,
  });

  it("counts one per provider: Facebook and Instagram are one Meta login", () => {
    expect([...heldConnections([n("facebook"), n("instagram"), n("youtube")])].sort()).toEqual([
      "google",
      "meta",
    ]);
  });

  it("ignores disconnected rows, counts a row awaiting a reconnect", () => {
    const awaiting = { ...n("tiktok"), needsReconnect: true };
    expect([...heldConnections([n("linkedin", false), awaiting])]).toEqual(["tiktok"]);
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
  it("allows the platforms whose review has cleared, Meta included since 2026-10-18", () => {
    expect(isPublishingPlatformEnabled("tiktok")).toBe(true);
    expect(isPublishingPlatformEnabled("linkedin")).toBe(true);
    expect(isPublishingPlatformEnabled("youtube")).toBe(true);
    expect(isPublishingPlatformEnabled("instagram")).toBe(true);
    expect(isPublishingPlatformEnabled("facebook")).toBe(true);
  });
  it("never offers X (paid API)", () => {
    expect(isPublishingPlatformEnabled("x")).toBe(false);
  });
});

describe("isPlatformId", () => {
  it("accepts every platform in the catalog", () => {
    for (const p of PLATFORMS) expect(isPlatformId(p.id)).toBe(true);
  });
  it("rejects Threads, removed on 2026-10-19, whose rows are still in the database", () => {
    expect(isPlatformId("threads")).toBe(false);
  });
  it("rejects anything else", () => {
    expect(isPlatformId("myspace")).toBe(false);
    expect(isPlatformId("")).toBe(false);
    expect(isPlatformId(null)).toBe(false);
    expect(isPlatformId(42)).toBe(false);
  });
});

describe("connectablePlatforms", () => {
  it("drops X, keeps the five live platforms", () => {
    expect(connectablePlatforms().map((p) => p.id)).toEqual([
      "youtube",
      "linkedin",
      "instagram",
      "facebook",
      "tiktok",
    ]);
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

  it("reports X as unavailable even when a row exists", () => {
    // Every account still has a seeded x row: never present it as connectable.
    expect(networkStatus(x, net({ platform: "x", connected: true }))).toBe("unavailable");
  });

  it("offers Instagram and Facebook to every account", () => {
    const instagram = PLATFORMS.find((p) => p.id === "instagram")!;
    const facebook = PLATFORMS.find((p) => p.id === "facebook")!;
    expect(networkStatus(instagram, undefined)).toBe("disconnected");
    expect(networkStatus(facebook, undefined)).toBe("disconnected");
    expect(networkStatus(instagram, net({ platform: "instagram" }))).toBe("connected");
  });
});
