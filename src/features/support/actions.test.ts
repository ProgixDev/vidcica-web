import { beforeEach, describe, expect, it, vi } from "vitest";

type Call = { method: string; args: unknown[] };
let calls: Call[] = [];
let result: { error: unknown } = { error: null };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: (...args: unknown[]) => {
      calls.push({ method: "from", args });
      return {
        insert: (row: unknown) => {
          calls.push({ method: "insert", args: [row] });
          return Promise.resolve(result);
        },
      };
    },
  })),
}));

import { submitTicket } from "./actions";

beforeEach(() => {
  calls = [];
  result = { error: null };
});

describe("submitTicket (AC-6, AC-7)", () => {
  it("inserts a ticket with the session user_id and status open", async () => {
    const out = await submitTicket({
      subject: "Problème de publication",
      message: "Rien ne se passe.",
    });
    expect(out).toEqual({ ok: true });
    expect(calls.find((c) => c.method === "from")?.args[0]).toBe("support_tickets");
    const row = calls.find((c) => c.method === "insert")?.args[0] as Record<string, unknown>;
    expect(row).toMatchObject({
      user_id: "u1",
      subject: "Problème de publication",
      message: "Rien ne se passe.",
      status: "open",
    });
  });

  it("rejects a too-short subject/message without inserting (AC-7)", async () => {
    expect((await submitTicket({ subject: "x", message: "court" })).ok).toBe(false);
    expect(calls.find((c) => c.method === "insert")).toBeUndefined();
  });

  it("surfaces a generic error on a DB failure", async () => {
    result = { error: { message: "boom" } };
    const out = await submitTicket({ subject: "Sujet valide", message: "Un message assez long." });
    expect(out.ok).toBe(false);
  });
});
