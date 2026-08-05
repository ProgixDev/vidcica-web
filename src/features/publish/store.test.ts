import { describe, expect, it, vi } from "vitest";
import { createPublishStore, type PublishDeps } from "./store";
import type { EnqueueOutcome } from "@/lib/vidcica/publishing";
import type { PlatformId } from "@/lib/vidcica/network";

type EnqueueInput = {
  videoId: string;
  platforms: PlatformId[];
  scheduledFor?: string;
  asShort?: boolean;
  captions?: Partial<Record<PlatformId, string>>;
  options?: Partial<Record<PlatformId, Record<string, unknown>>>;
};

function make(over: Partial<PublishDeps> = {}) {
  const enqueue = vi.fn<(input: EnqueueInput) => Promise<EnqueueOutcome>>(async () => ({
    ok: true,
    jobs: [{ id: "j1", platform: "youtube" }],
    skipped: [],
  }));
  const store = createPublishStore({ enqueue, ...over }, { videoId: "v1" });
  return { store, enqueue };
}

describe("publish store (AC-6..AC-11)", () => {
  it("AC-6: cannot confirm with nothing selected", () => {
    const { store } = make();
    expect(store.getState().canConfirm()).toBe(false);
    store.getState().togglePlatform("youtube");
    expect(store.getState().canConfirm()).toBe(true);
  });

  it("AC-7: publish now → enqueue with no scheduledFor, phase done", async () => {
    const { store, enqueue } = make();
    store.getState().togglePlatform("youtube");
    store.getState().togglePlatform("linkedin");
    await store.getState().confirm();
    expect(enqueue).toHaveBeenCalledWith({
      videoId: "v1",
      platforms: ["youtube", "linkedin"],
      scheduledFor: undefined,
      asShort: true,
    });
    expect(store.getState().phase).toBe("done");
  });

  it("AC-8: schedule → scheduledFor passed; a past datetime blocks confirm", async () => {
    const { store, enqueue } = make();
    store.getState().togglePlatform("youtube");
    store.getState().setMode("schedule");
    store.getState().setScheduledAt("2020-01-01T00:00:00Z"); // past
    expect(store.getState().canConfirm()).toBe(false);
    store.getState().setScheduledAt("2030-01-01T00:00:00Z"); // future
    expect(store.getState().canConfirm()).toBe(true);
    await store.getState().confirm();
    expect(enqueue.mock.calls[0]![0].scheduledFor).toBe("2030-01-01T00:00:00Z");
  });

  it("AC-11: skipped set is surfaced", async () => {
    const { store } = make({
      enqueue: async () => ({ ok: true, jobs: [], skipped: ["youtube"] }),
    });
    store.getState().togglePlatform("youtube");
    await store.getState().confirm();
    expect(store.getState().skipped).toEqual(["youtube"]);
  });

  it("a failed enqueue → error phase with message", async () => {
    const { store } = make({ enqueue: async () => ({ ok: false, message: "boom" }) });
    store.getState().togglePlatform("youtube");
    await store.getState().confirm();
    expect(store.getState().phase).toBe("error");
    expect(store.getState().error).toBe("boom");
  });
});

describe("publish store — per-platform caption override", () => {
  function makeWith(hashtags: string[]) {
    const enqueue = vi.fn<(input: EnqueueInput) => Promise<EnqueueOutcome>>(async () => ({
      ok: true,
      jobs: [],
      skipped: [],
    }));
    const store = createPublishStore({ enqueue }, { videoId: "v1", hashtags });
    return { store, enqueue };
  }

  it("sends no captions key when nothing is edited", async () => {
    const { store, enqueue } = makeWith([]);
    store.getState().togglePlatform("youtube");
    await store.getState().confirm();
    expect(enqueue.mock.calls[0]![0].captions).toBeUndefined();
  });

  it("sends an override only for the edited platform", async () => {
    const { store, enqueue } = makeWith([]);
    store.getState().togglePlatform("youtube");
    store.getState().togglePlatform("linkedin");
    store.getState().setCaption("youtube", "Mon texte YouTube");
    await store.getState().confirm();
    expect(enqueue.mock.calls[0]![0].captions).toEqual({ youtube: "Mon texte YouTube" });
  });

  it("appends the video hashtags to the override (without duplicating present ones)", async () => {
    const { store, enqueue } = makeWith(["#ai", "#short"]);
    store.getState().togglePlatform("youtube");
    // Body already contains #ai — only #short should be appended.
    store.getState().setCaption("youtube", "Regardez ça #ai");
    await store.getState().confirm();
    expect(enqueue.mock.calls[0]![0].captions).toEqual({ youtube: "Regardez ça #ai\n\n#short" });
  });

  it("ignores an override for a platform that isn't selected", async () => {
    const { store, enqueue } = makeWith([]);
    store.getState().togglePlatform("youtube");
    store.getState().setCaption("tiktok", "orphan");
    await store.getState().confirm();
    expect(enqueue.mock.calls[0]![0].captions).toBeUndefined();
  });
});

describe("publish store — TikTok per-post options", () => {
  function makeTikTok(durationSec = 30) {
    const enqueue = vi.fn<(input: EnqueueInput) => Promise<EnqueueOutcome>>(async () => ({
      ok: true,
      jobs: [],
      skipped: [],
    }));
    const store = createPublishStore({ enqueue }, { videoId: "v1", durationSec });
    return { store, enqueue };
  }

  const creator = {
    username: "houssem",
    avatarUrl: null,
    nickname: null,
    privacyOptions: ["PUBLIC_TO_EVERYONE", "SELF_ONLY"] as const,
    commentDisabled: false,
    duetDisabled: false,
    stitchDisabled: false,
    maxVideoPostDurationSec: 60,
  };

  it("does not gate a publish that doesn't include TikTok", () => {
    const { store } = makeTikTok();
    store.getState().togglePlatform("youtube");
    expect(store.getState().tiktokBlockReason()).toBeNull();
    expect(store.getState().canConfirm()).toBe(true);
  });

  it("blocks confirm until a privacy level is chosen for TikTok", () => {
    const { store } = makeTikTok();
    store.getState().togglePlatform("tiktok");
    expect(store.getState().tiktokBlockReason()).toBe("privacy_required");
    expect(store.getState().canConfirm()).toBe(false);
    store.getState().setTikTokOptions({ privacyLevel: "PUBLIC_TO_EVERYONE" });
    expect(store.getState().canConfirm()).toBe(true);
  });

  it("blocks the WHOLE publish, not just TikTok, so nothing posts half-configured", () => {
    const { store } = makeTikTok();
    store.getState().togglePlatform("youtube");
    store.getState().togglePlatform("tiktok");
    expect(store.getState().canConfirm()).toBe(false);
  });

  it("sends the wire options only when TikTok is selected", async () => {
    const { store, enqueue } = makeTikTok();
    store.getState().togglePlatform("youtube");
    await store.getState().confirm();
    expect(enqueue.mock.calls[0]![0].options).toBeUndefined();

    const second = makeTikTok();
    second.store.getState().togglePlatform("tiktok");
    second.store.getState().setTikTokOptions({ privacyLevel: "SELF_ONLY", disableStitch: true });
    await second.store.getState().confirm();
    expect(second.enqueue.mock.calls[0]![0].options).toEqual({
      tiktok: {
        privacy_level: "SELF_ONLY",
        disable_comment: false,
        disable_duet: false,
        disable_stitch: true,
        brand_content_toggle: false,
        brand_organic_toggle: false,
      },
    });
  });

  it("forces an account-disabled interaction off and never lets the app re-enable it", () => {
    const { store } = makeTikTok();
    store.getState().setTikTokOptions({ disableComment: false });
    store.getState().setTikTokCreator({ ...creator, commentDisabled: true, privacyOptions: [] });
    expect(store.getState().tiktok.disableComment).toBe(true);
  });

  it("blocks a video longer than the account's TikTok cap", () => {
    const { store } = makeTikTok(90);
    store.getState().togglePlatform("tiktok");
    store.getState().setTikTokCreator({ ...creator, privacyOptions: [] });
    store.getState().setTikTokOptions({ privacyLevel: "PUBLIC_TO_EVERYONE" });
    expect(store.getState().tiktokBlockReason()).toBe("too_long");
    expect(store.getState().canConfirm()).toBe(false);
  });
});
