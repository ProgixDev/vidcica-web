import { describe, expect, it } from "vitest";
import { mergeNotification } from "./use-notifications-realtime";
import type { AppNotification } from "./notification";

const n = (id: string, read = false): AppNotification => ({
  id,
  type: "info",
  category: "video_ready",
  title: id,
  body: "b",
  createdAt: "2026-07-13T10:00:00Z",
  read,
});

describe("mergeNotification (AC-3)", () => {
  it("prepends a new notification to the top", () => {
    const next = mergeNotification([n("a")], n("b"));
    expect(next.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("patches an existing one in place (e.g. read flipped)", () => {
    const next = mergeNotification([n("a", false), n("b")], n("a", true));
    expect(next.map((x) => x.id)).toEqual(["a", "b"]); // order preserved
    expect(next[0]?.read).toBe(true);
  });
});
