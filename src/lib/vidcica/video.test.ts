import { describe, expect, it } from "vitest";
import { isReady, isRendering, rowToVideo, STATUS_META, type VideoRow } from "./video";

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

  it("every status has badge metadata", () => {
    for (const s of Object.keys(STATUS_META)) {
      expect(STATUS_META[s as keyof typeof STATUS_META].label).toBeTruthy();
    }
  });
});
