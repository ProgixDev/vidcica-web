import { describe, expect, it } from "vitest";
import { mergePublishJob } from "./use-publish-jobs-realtime";

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
