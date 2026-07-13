import { describe, expect, it, vi } from "vitest";
import { createPublishStore, type PublishDeps } from "./store";
import type { EnqueueOutcome } from "@/lib/vidcica/publishing";
import type { PlatformId } from "@/lib/vidcica/network";

type EnqueueInput = {
  videoId: string;
  platforms: PlatformId[];
  scheduledFor?: string;
  asShort?: boolean;
};

function make(over: Partial<PublishDeps> = {}) {
  const enqueue = vi.fn(
    async (_input: EnqueueInput): Promise<EnqueueOutcome> => ({
      ok: true,
      jobs: [{ id: "j1", platform: "youtube" }],
      skipped: [],
    }),
  );
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
