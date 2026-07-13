import { describe, expect, it } from "vitest";
import { mapPublishFailureReason } from "./publishing";

// AC-10 — the recovery CTA per failed platform keys off these reasons.
describe("mapPublishFailureReason", () => {
  it("maps token/auth errors to auth_expired (→ reconnect)", () => {
    expect(mapPublishFailureReason("token_decrypt_failed")).toBe("auth_expired");
    expect(mapPublishFailureReason("network_not_connected")).toBe("auth_expired");
  });
  it("maps encode/upload errors to encoding", () => {
    expect(mapPublishFailureReason("video_url_not_ready")).toBe("encoding");
    expect(mapPublishFailureReason("upload_failed")).toBe("encoding");
  });
  it("maps rate/quota to rate_limited and rejections to rejected", () => {
    expect(mapPublishFailureReason("rate_limit_exceeded")).toBe("rate_limited");
    expect(mapPublishFailureReason("quota")).toBe("rate_limited");
    expect(mapPublishFailureReason("forbidden")).toBe("rejected");
    expect(mapPublishFailureReason("not_implemented")).toBe("rejected");
  });
  it("falls back to unknown", () => {
    expect(mapPublishFailureReason(null)).toBe("unknown");
    expect(mapPublishFailureReason("weird_new_error")).toBe("unknown");
  });
});
