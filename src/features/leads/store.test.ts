import { describe, expect, it, vi } from "vitest";
import { createLeadsStore, type LeadsDeps } from "./store";
import type { Lead } from "@/lib/vidcica/lead";

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: "l1",
  campaignId: "c1",
  campaignName: "Promo été",
  firstName: "Marie",
  lastName: "Curie",
  email: "marie@example.com",
  phone: "+33600000000",
  capturedAt: "2026-07-10T00:00:00Z",
  score: 80,
  scoreBucket: "hot",
  status: "new",
  notes: [],
  interactions: [],
  ...over,
});

function make(initial: Lead[] = [lead()]) {
  let n = 0;
  const upsert = vi.fn(async () => {});
  const download = vi.fn();
  const deps: LeadsDeps = {
    upsert,
    newId: () => `id${++n}`,
    now: () => "2026-07-13T00:00:00Z",
    download,
  };
  return { store: createLeadsStore(deps, initial), upsert, download };
}

describe("leads store — mutations (AC-9/10)", () => {
  it("setStatus updates status, logs a status_change, and writes through", () => {
    const { store, upsert } = make();
    store.getState().setStatus("l1", "contacted");
    const l = store.getState().byId("l1")!;
    expect(l.status).toBe("contacted");
    expect(l.interactions.at(-1)).toMatchObject({ kind: "status_change", toStatus: "contacted" });
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("addNote appends a note + interaction, and rejects blank", () => {
    const { store, upsert } = make();
    store.getState().addNote("l1", "   ");
    expect(upsert).not.toHaveBeenCalled();
    store.getState().addNote("l1", "Rappeler demain");
    const l = store.getState().byId("l1")!;
    expect(l.notes).toHaveLength(1);
    expect(l.notes[0]?.body).toBe("Rappeler demain");
    expect(l.interactions.at(-1)).toMatchObject({ kind: "note", message: "Rappeler demain" });
  });

  it("logContact appends the matching interaction", () => {
    const { store } = make();
    store.getState().logContact("l1", "whatsapp");
    expect(store.getState().byId("l1")!.interactions.at(-1)).toMatchObject({ kind: "whatsapp" });
  });

  it("newCount reflects only 'new' leads", () => {
    const { store } = make([
      lead({ id: "a", status: "new" }),
      lead({ id: "b", status: "converted" }),
    ]);
    expect(store.getState().newCount()).toBe(1);
  });
});

describe("leads store — export (AC-11)", () => {
  it("downloads a CSV and logs an export interaction on each affected lead", () => {
    const { store, download } = make();
    store.getState().exportLeads(["l1"]);
    expect(download).toHaveBeenCalledOnce();
    const [filename, csv] = download.mock.calls[0]!;
    expect(filename).toMatch(/\.csv$/);
    expect(csv).toContain("marie@example.com");
    expect(store.getState().byId("l1")!.interactions.at(-1)).toMatchObject({ kind: "export" });
  });

  it("no-ops when nothing is selected", () => {
    const { store, download } = make();
    store.getState().exportLeads([]);
    expect(download).not.toHaveBeenCalled();
  });
});

describe("leads store — realtime folds (AC-8)", () => {
  it("prepends a genuinely new lead and replaces an existing one", () => {
    const { store } = make([lead({ id: "a" })]);
    store.getState().applyRow(lead({ id: "b", firstName: "Neo" }));
    expect(store.getState().items.map((l) => l.id)).toEqual(["b", "a"]);
    store.getState().applyRow(lead({ id: "a", status: "converted" }));
    expect(store.getState().byId("a")!.status).toBe("converted");
    expect(store.getState().items).toHaveLength(2);
  });

  it("removeId drops a deleted lead", () => {
    const { store } = make([lead({ id: "a" }), lead({ id: "b" })]);
    store.getState().removeId("a");
    expect(store.getState().items.map((l) => l.id)).toEqual(["b"]);
  });
});
