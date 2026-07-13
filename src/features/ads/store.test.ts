import { describe, expect, it, vi } from "vitest";
import { createBoostStore, isDraftReady, type BoostDeps } from "./store";
import type { BoostDraft } from "@/lib/vidcica/campaign";

const readyDraft: Partial<BoostDraft> = {
  videoId: "v1",
  name: "Ma campagne",
  countries: ["FR"],
  ageMin: 18,
  ageMax: 45,
};

function make(over: Partial<BoostDeps> = {}) {
  const deps: BoostDeps = {
    resolveAccount: vi.fn(async () => ({ ok: true, hasAccount: true, hasPage: true }) as const),
    createDraft: vi.fn(async () => ({ ok: true, id: "camp-1" }) as const),
    createCampaign: vi.fn(async () => ({ ok: true, status: "in_review" }) as const),
    ...over,
  };
  return { store: createBoostStore(deps), deps };
}

describe("boost store — gate (AC-2)", () => {
  it("goes ready when an ad account + page are present", async () => {
    const { store } = make();
    await store.getState().init();
    expect(store.getState().phase).toBe("ready");
  });

  it("falls back to draftOnly when ads aren't configured", async () => {
    const { store } = make({
      resolveAccount: async () => ({ ok: false, reason: "ads_not_configured" }),
    });
    await store.getState().init();
    expect(store.getState().phase).toBe("draftOnly");
  });

  it("falls back to draftOnly when there's an account but no page", async () => {
    const { store } = make({
      resolveAccount: async () => ({ ok: true, hasAccount: true, hasPage: false }),
    });
    await store.getState().init();
    expect(store.getState().phase).toBe("draftOnly");
  });
});

describe("boost store — submit (AC-3/4)", () => {
  it("creates a draft then launches it (in_review, launched)", async () => {
    const { store, deps } = make();
    store.getState().setDraft(readyDraft);
    await store.getState().submit();
    const s = store.getState();
    expect(s.phase).toBe("created");
    expect(s.launched).toBe(true);
    expect(s.campaignId).toBe("camp-1");
    expect(deps.createCampaign).toHaveBeenCalledWith("camp-1");
  });

  it("surfaces a create error but keeps the draft resumable (campaignId set)", async () => {
    const { store } = make({
      createCampaign: async () => ({ ok: false, reason: "needs_reconnect" }),
    });
    store.getState().setDraft(readyDraft);
    await store.getState().submit();
    const s = store.getState();
    expect(s.phase).toBe("error");
    expect(s.error).toMatch(/facebook/i);
    expect(s.campaignId).toBe("camp-1"); // draft saved → resumable
  });

  it("errors without a campaignId when the draft insert itself fails", async () => {
    const { store, deps } = make({ createDraft: async () => ({ ok: false, message: "échec" }) });
    store.getState().setDraft(readyDraft);
    await store.getState().submit();
    expect(store.getState().phase).toBe("error");
    expect(store.getState().campaignId).toBeNull();
    expect(deps.createCampaign).not.toHaveBeenCalled();
  });

  it("no-ops when the draft is incomplete", async () => {
    const { store, deps } = make();
    await store.getState().submit(); // EMPTY_DRAFT
    expect(deps.createDraft).not.toHaveBeenCalled();
    expect(store.getState().phase).toBe("checking");
  });
});

describe("boost store — saveDraft (draftOnly path)", () => {
  it("saves a brouillon without launching", async () => {
    const { store, deps } = make();
    store.getState().setDraft(readyDraft);
    await store.getState().saveDraft();
    expect(store.getState().phase).toBe("created");
    expect(store.getState().launched).toBe(false);
    expect(deps.createCampaign).not.toHaveBeenCalled();
  });
});

describe("isDraftReady", () => {
  it("requires a video, a name, valid ages, and a country", () => {
    expect(isDraftReady({ ...(readyDraft as BoostDraft) })).toBe(true);
    expect(isDraftReady({ ...(readyDraft as BoostDraft), videoId: "" })).toBe(false);
    expect(isDraftReady({ ...(readyDraft as BoostDraft), name: "  " })).toBe(false);
    expect(isDraftReady({ ...(readyDraft as BoostDraft), ageMax: 10, ageMin: 20 })).toBe(false);
  });
});
