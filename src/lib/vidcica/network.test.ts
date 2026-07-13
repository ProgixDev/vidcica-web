import { describe, expect, it } from "vitest";
import {
  networkStatus,
  platformToProvider,
  PLATFORMS,
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
});
