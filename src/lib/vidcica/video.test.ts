import { describe, expect, it } from "vitest";
import {
  hasRenderedVideo,
  isReady,
  isRendering,
  rowToVideo,
  STATUS_META,
  type VideoRow,
} from "./video";

// A minimal fixture row shaped like the videos table (extra columns ignored).
const row = {
  id: "vid_1",
  title: "Mon script",
  description: "desc",
  thumbnail_url: "https://cdn/thumb.jpg",
  video_url: "https://cdn/final.mp4",
  status: "pret",
  format: "9:16",
  duration_sec: 30,
  hashtags: ["#ai", "#short"],
  credits_used: 12,
  created_at: "2026-07-13T10:00:00Z",
  updated_at: "2026-07-13T10:05:00Z",
} as unknown as VideoRow;

describe("rowToVideo (AC-5 shape)", () => {
  it("maps snake_case row → camelCase Video", () => {
    const v = rowToVideo(row);
    expect(v).toMatchObject({
      id: "vid_1",
      title: "Mon script",
      thumbnailUrl: "https://cdn/thumb.jpg",
      videoUrl: "https://cdn/final.mp4",
      status: "pret",
      durationSec: 30,
      creditsUsed: 12,
    });
    expect(v.hashtags).toEqual(["#ai", "#short"]);
  });

  it("coerces null optionals to undefined", () => {
    const v = rowToVideo({
      ...row,
      description: null,
      video_url: null,
      credits_used: null,
    } as unknown as VideoRow);
    expect(v.description).toBeUndefined();
    expect(v.videoUrl).toBeUndefined();
    expect(v.creditsUsed).toBeUndefined();
  });
});

describe("status helpers", () => {
  it("isRendering true only for generating/assembling", () => {
    expect(isRendering("generating")).toBe(true);
    expect(isRendering("assembling")).toBe(true);
    expect(isRendering("pret")).toBe(false);
    expect(isRendering("brouillon")).toBe(false);
  });

  it("isReady requires pret AND a videoUrl", () => {
    expect(isReady({ status: "pret", videoUrl: "https://cdn/x.mp4" })).toBe(true);
    expect(isReady({ status: "pret", videoUrl: undefined })).toBe(false);
    expect(isReady({ status: "generating", videoUrl: "https://cdn/x.mp4" })).toBe(false);
  });

  // REGRESSION (2026-08-21): the video detail page gated on `isReady`, which is
  // false once a video is published. A published video therefore rendered the
  // render-progress bar stuck at 100% — no player, no download, no delete — and
  // the publish page bounced you away from publishing to a second platform.
  it("hasRenderedVideo accepts published/scheduled videos, unlike isReady", () => {
    const published = { status: "publie", videoUrl: "https://cdn/x.mp4" } as const;
    expect(isReady(published)).toBe(false); // narrow "not yet published" meaning
    expect(hasRenderedVideo(published)).toBe(true); // but it IS watchable

    expect(hasRenderedVideo({ status: "pret", videoUrl: "https://cdn/x.mp4" })).toBe(true);
    expect(hasRenderedVideo({ status: "programme", videoUrl: "https://cdn/x.mp4" })).toBe(true);
    expect(hasRenderedVideo({ status: "publishing", videoUrl: "https://cdn/x.mp4" })).toBe(true);

    // Nothing playable yet → still the progress/draft branches.
    expect(hasRenderedVideo({ status: "generating", videoUrl: "https://cdn/x.mp4" })).toBe(false);
    expect(hasRenderedVideo({ status: "assembling", videoUrl: "https://cdn/x.mp4" })).toBe(false);
    expect(hasRenderedVideo({ status: "brouillon", videoUrl: "https://cdn/x.mp4" })).toBe(false);
    expect(hasRenderedVideo({ status: "publie", videoUrl: undefined })).toBe(false);
  });

  it("every status has badge metadata", () => {
    for (const s of Object.keys(STATUS_META)) {
      expect(STATUS_META[s as keyof typeof STATUS_META].label).toBeTruthy();
    }
  });
});
