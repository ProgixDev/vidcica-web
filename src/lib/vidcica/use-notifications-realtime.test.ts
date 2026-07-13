import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mergeNotification, useNotificationsRealtime } from "./use-notifications-realtime";
import type { AppNotification, NotificationRow } from "./notification";

// Capture the postgres_changes callback to drive the subscription.
let handler: ((payload: unknown) => void) | null = null;
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      on: (_evt: string, _cfg: unknown, cb: typeof handler) => {
        handler = cb;
        return { subscribe: () => ({}) };
      },
    }),
    removeChannel: vi.fn(),
  }),
}));

const n = (id: string, read = false): AppNotification => ({
  id,
  type: "info",
  category: "video_ready",
  title: id,
  body: "b",
  createdAt: "2026-07-13T10:00:00Z",
  read,
});

const row = (id: string): NotificationRow =>
  ({
    id,
    type: "success",
    category: "video_ready",
    title: id,
    body: "b",
    created_at: "2026-07-13T11:00:00Z",
    read: false,
    video_id: null,
    campaign_id: null,
    lead_id: null,
  }) as unknown as NotificationRow;

describe("mergeNotification (AC-3)", () => {
  it("prepends a new notification to the top", () => {
    expect(mergeNotification([n("a")], n("b")).map((x) => x.id)).toEqual(["b", "a"]);
  });
  it("patches an existing one in place (e.g. read flipped)", () => {
    const next = mergeNotification([n("a", false), n("b")], n("a", true));
    expect(next.map((x) => x.id)).toEqual(["a", "b"]);
    expect(next[0]?.read).toBe(true);
  });
});

describe("useNotificationsRealtime (AC-3 live wiring)", () => {
  it("prepends an inserted row and removes a deleted one", () => {
    handler = null;
    const seed = [n("a", true)]; // stable reference (avoid render-phase reseed loop)
    const { result } = renderHook(() => useNotificationsRealtime("u1", seed));
    expect(result.current.map((x) => x.id)).toEqual(["a"]);
    expect(handler).toBeTypeOf("function");

    act(() => handler!({ eventType: "INSERT", new: row("b") }));
    expect(result.current.map((x) => x.id)).toEqual(["b", "a"]);
    expect(result.current[0]?.read).toBe(false); // new → unread

    act(() => handler!({ eventType: "DELETE", old: { id: "a" } }));
    expect(result.current.map((x) => x.id)).toEqual(["b"]);
  });
});
