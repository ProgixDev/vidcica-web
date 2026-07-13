import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BoostDraft } from "@/lib/vidcica/campaign";

type Call = { method: string; args: unknown[] };
let calls: Call[] = [];
let insertError: unknown = null;
let user: { id: string } | null = { id: "user-1" };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user } }) },
    from: (...args: unknown[]) => {
      calls.push({ method: "from", args });
      return {
        insert: (row: unknown) => {
          calls.push({ method: "insert", args: [row] });
          return Promise.resolve({ error: insertError });
        },
      };
    },
  })),
}));

import { createDraftCampaign } from "./actions";

const valid: BoostDraft = {
  name: "Boost été",
  videoId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  objective: "trafic",
  countries: ["FR", "BE"],
  ageMin: 18,
  ageMax: 45,
  gender: "tous",
  budgetMode: "quotidien",
  budgetDaily: 25,
  budgetTotal: 200,
};

beforeEach(() => {
  calls = [];
  insertError = null;
  user = { id: "user-1" };
});

describe("createDraftCampaign (AC-3)", () => {
  it("inserts a brouillon row with the server-set user_id", async () => {
    const out = await createDraftCampaign(valid);
    expect(out.ok).toBe(true);
    const insert = calls.find((c) => c.method === "insert");
    const row = insert?.args[0] as Record<string, unknown>;
    expect(row.user_id).toBe("user-1"); // never from client input
    expect(row.status).toBe("brouillon");
    expect(row.objective).toBe("trafic");
    expect(row.audience_mode).toBe("advantage");
    expect(typeof row.id).toBe("string");
  });

  it("rejects an unsupported objective without touching the DB", async () => {
    const out = await createDraftCampaign({
      ...valid,
      objective: "conversions" as BoostDraft["objective"],
    });
    expect(out.ok).toBe(false);
    expect(calls.find((c) => c.method === "insert")).toBeUndefined();
  });

  it("rejects an inverted age range", async () => {
    const out = await createDraftCampaign({ ...valid, ageMin: 50, ageMax: 20 });
    expect(out.ok).toBe(false);
    expect(calls.find((c) => c.method === "insert")).toBeUndefined();
  });

  it("fails closed with no session", async () => {
    user = null;
    const out = await createDraftCampaign(valid);
    expect(out.ok).toBe(false);
    expect(calls.find((c) => c.method === "insert")).toBeUndefined();
  });

  it("reports a DB failure generically", async () => {
    insertError = { message: "boom" };
    const out = await createDraftCampaign(valid);
    expect(out).toEqual({ ok: false, message: "La création du brouillon a échoué. Réessayez." });
  });
});
