import { describe, expect, it } from "vitest";
import { mapPublishFailureReason, mapUnpublishReason } from "./publishing";

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
  it("reads Meta failures by their reason prefix, not by words in Meta’s message", () => {
    // Real last_error shapes written by publish-job since 2026-10-18.
    expect(mapPublishFailureReason("meta_no_page")).toBe("meta_no_page");
    expect(mapPublishFailureReason("meta_page_unavailable")).toBe("meta_no_page");
    expect(mapPublishFailureReason("instagram_not_linked")).toBe("instagram_not_linked");
    expect(mapPublishFailureReason("instagram_format")).toBe("encoding");
    expect(
      mapPublishFailureReason(
        "instagram_container_error: ERROR: Error: aspect ratio not supported",
      ),
    ).toBe("rejected");
    expect(
      mapPublishFailureReason(
        "meta_permission: facebook upload — (#200) Requires pages_manage_posts [code 200]",
      ),
    ).toBe("permission");
    expect(mapPublishFailureReason("meta_rate_limited: instagram container [code 4]")).toBe(
      "rate_limited",
    );
    // A generic Meta error whose text mentions a token is NOT a reconnect.
    expect(
      mapPublishFailureReason(
        "meta_error: facebook upload — Invalid OAuth access token data [code 100]",
      ),
    ).toBe("unknown");
    // Only a dead token (190) asks for a reconnect.
    expect(mapPublishFailureReason("needs_reconnect")).toBe("auth_expired");
  });
  it("falls back to unknown", () => {
    expect(mapPublishFailureReason(null)).toBe("unknown");
    expect(mapPublishFailureReason("weird_new_error")).toBe("unknown");
  });
});

describe("mapUnpublishReason", () => {
  it("names a Facebook Page that is no longer shared", () => {
    expect(mapUnpublishReason("page_unavailable")).toBe("page_unavailable");
    expect(mapUnpublishReason("not_deletable")).toBe("not_deletable");
    expect(mapUnpublishReason("reconnect_required")).toBe("reconnect_required");
    expect(mapUnpublishReason("something_else")).toBe("error");
  });
});
