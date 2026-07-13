import { describe, expect, it } from "vitest";
import { upsertNetwork } from "./use-networks-realtime";
import { mergePublishJob } from "./use-publish-jobs-realtime";
import type { Network } from "./network";

const net = (id: string, connected: boolean): Network => ({
  id,
  platform: "youtube",
  name: "n",
  connected,
  needsReconnect: false,
  publishesEnabled: connected,
});

describe("upsertNetwork (AC-2/AC-5 merge)", () => {
  it("replaces the row in place on a connect flip", () => {
    const list = [net("n1", false)];
    const next = upsertNetwork(list, net("n1", true));
    expect(next).toHaveLength(1);
    expect(next[0]?.connected).toBe(true);
  });
  it("appends an unseen row", () => {
    const next = upsertNetwork([net("n1", true)], { ...net("n2", false), platform: "linkedin" });
    expect(next.map((n) => n.id)).toEqual(["n1", "n2"]);
  });
});

describe("mergePublishJob (AC-9 per-platform status)", () => {
  it("records status per platform and derives a failure reason", () => {
    let m = mergePublishJob({}, { platform: "youtube", status: "running" });
    m = mergePublishJob(m, { platform: "linkedin", status: "succeeded" });
    m = mergePublishJob(m, {
      platform: "instagram",
      status: "failed",
      last_error: "token_expired",
    });
    expect(m.youtube?.status).toBe("running");
    expect(m.linkedin?.status).toBe("succeeded");
    expect(m.instagram).toEqual({ status: "failed", reason: "auth_expired" });
  });
  it("ignores a row without platform/status", () => {
    expect(mergePublishJob({}, {})).toEqual({});
  });
});
