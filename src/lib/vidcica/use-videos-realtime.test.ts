import { describe, expect, it } from "vitest";
import { removeVideo, upsertVideo } from "./use-videos-realtime";
import type { Video } from "./video";

const v = (id: string, status: Video["status"]): Video => ({
  id,
  title: id,
  thumbnailUrl: null,
  status,
  format: "9:16",
  durationSec: 10,
  hashtags: [],
  createdAt: "2026-07-13T00:00:00Z",
  updatedAt: "2026-07-13T00:00:00Z",
});

describe("realtime merge (AC-7)", () => {
  it("replaces in place on a status change — no reorder", () => {
    const list = [v("a", "generating"), v("b", "pret")];
    const next = upsertVideo(list, v("a", "pret"));
    expect(next.map((x) => x.id)).toEqual(["a", "b"]); // order preserved
    expect(next[0]?.status).toBe("pret"); // badge flipped
  });

  it("prepends a brand-new video", () => {
    const list = [v("a", "pret")];
    const next = upsertVideo(list, v("c", "generating"));
    expect(next.map((x) => x.id)).toEqual(["c", "a"]);
  });

  it("removes a video by id", () => {
    const list = [v("a", "pret"), v("b", "generating")];
    expect(removeVideo(list, "a").map((x) => x.id)).toEqual(["b"]);
  });
});
