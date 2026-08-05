import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIKTOK_OPTIONS,
  isTikTokPrivacyLevel,
  tikTokBlockReason,
  toWireOptions,
  type TikTokCreatorInfo,
  type TikTokPostOptions,
} from "./tiktok";

function creator(over: Partial<TikTokCreatorInfo> = {}): TikTokCreatorInfo {
  return {
    username: "houssem",
    avatarUrl: "https://cdn.example/a.jpg",
    nickname: "Houssem",
    privacyOptions: ["PUBLIC_TO_EVERYONE", "SELF_ONLY"],
    commentDisabled: false,
    duetDisabled: false,
    stitchDisabled: false,
    maxVideoPostDurationSec: 60,
    ...over,
  };
}

function opts(over: Partial<TikTokPostOptions> = {}): TikTokPostOptions {
  return { ...DEFAULT_TIKTOK_OPTIONS, ...over };
}

describe("tikTokBlockReason", () => {
  it("blocks until the creator picks a privacy level (no default is assumed)", () => {
    expect(DEFAULT_TIKTOK_OPTIONS.privacyLevel).toBeNull();
    expect(tikTokBlockReason(opts(), creator(), 30)).toBe("privacy_required");
  });

  it("allows a post once privacy is chosen and the video fits", () => {
    expect(
      tikTokBlockReason(opts({ privacyLevel: "PUBLIC_TO_EVERYONE" }), creator(), 30),
    ).toBeNull();
  });

  it("blocks branded content on a private post (TikTok rejects the combination)", () => {
    const o = opts({ privacyLevel: "SELF_ONLY", brandContentToggle: true });
    expect(tikTokBlockReason(o, creator(), 30)).toBe("branded_content_private");
  });

  it("allows the creator's own-brand disclosure on a private post", () => {
    const o = opts({ privacyLevel: "SELF_ONLY", brandOrganicToggle: true });
    expect(tikTokBlockReason(o, creator(), 30)).toBeNull();
  });

  it("blocks a video longer than the account's max duration", () => {
    const o = opts({ privacyLevel: "PUBLIC_TO_EVERYONE" });
    expect(tikTokBlockReason(o, creator({ maxVideoPostDurationSec: 60 }), 61)).toBe("too_long");
    expect(tikTokBlockReason(o, creator({ maxVideoPostDurationSec: 60 }), 60)).toBeNull();
  });

  it("does not block on duration when TikTok did not report a cap", () => {
    const o = opts({ privacyLevel: "PUBLIC_TO_EVERYONE" });
    expect(tikTokBlockReason(o, creator({ maxVideoPostDurationSec: null }), 9999)).toBeNull();
  });

  it("still requires a privacy choice when creator info failed to load", () => {
    expect(tikTokBlockReason(opts(), null, 30)).toBe("privacy_required");
    expect(tikTokBlockReason(opts({ privacyLevel: "SELF_ONLY" }), null, 30)).toBeNull();
  });
});

describe("toWireOptions", () => {
  it("emits the snake_case shape enqueue-publish whitelists", () => {
    expect(toWireOptions(opts({ privacyLevel: "FOLLOWER_OF_CREATOR", disableDuet: true }))).toEqual(
      {
        privacy_level: "FOLLOWER_OF_CREATOR",
        disable_comment: false,
        disable_duet: true,
        disable_stitch: false,
        brand_content_toggle: false,
        brand_organic_toggle: false,
      },
    );
  });

  it("omits privacy_level entirely when unset, so the server keeps its safe default", () => {
    expect(toWireOptions(opts())).not.toHaveProperty("privacy_level");
  });
});

describe("isTikTokPrivacyLevel", () => {
  it("accepts TikTok's four levels and rejects anything else", () => {
    expect(isTikTokPrivacyLevel("PUBLIC_TO_EVERYONE")).toBe(true);
    expect(isTikTokPrivacyLevel("SELF_ONLY")).toBe(true);
    expect(isTikTokPrivacyLevel("PUBLIC")).toBe(false);
    expect(isTikTokPrivacyLevel("")).toBe(false);
  });
});
