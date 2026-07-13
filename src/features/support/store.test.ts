import { describe, expect, it, vi } from "vitest";
import { createSupportStore, type SupportDeps } from "./store";
import { CONTACT_SUGGESTION, type AskSupportOutcome } from "@/lib/vidcica/support";

function make(over: Partial<SupportDeps> = {}) {
  const ask = vi.fn(
    async (): Promise<AskSupportOutcome> => ({
      ok: true,
      reply: "Voici comment faire…",
      suggestions: ["Créer une vidéo"],
      handoff: false,
    }),
  );
  return { store: createSupportStore({ ask, ...over }), ask };
}

describe("support store (AC-1..AC-4, AC-7)", () => {
  it("AC-1: sending appends the user turn then Lia's reply", async () => {
    const { store, ask } = make();
    await store.getState().send("Comment créer une vidéo ?");
    const msgs = store.getState().messages;
    expect(msgs.at(-2)).toMatchObject({ author: "user", body: "Comment créer une vidéo ?" });
    expect(msgs.at(-1)).toMatchObject({ author: "lia", body: "Voici comment faire…" });
    expect(ask).toHaveBeenCalledOnce();
  });

  it("AC-2: typing is true during the request and false after", async () => {
    let resolve!: (v: AskSupportOutcome) => void;
    const { store } = make({ ask: () => new Promise<AskSupportOutcome>((r) => (resolve = r)) });
    const p = store.getState().send("hello");
    expect(store.getState().typing).toBe(true);
    resolve({ ok: true, reply: "ok", suggestions: [], handoff: false });
    await p;
    expect(store.getState().typing).toBe(false);
  });

  it("AC-3: Lia replies carry suggestion chips", async () => {
    const { store } = make();
    await store.getState().send("hi");
    expect(store.getState().messages.at(-1)?.suggestions).toContain("Créer une vidéo");
  });

  it("AC-4: a not-configured/error outcome degrades to the fallback reply", async () => {
    const { store } = make({ ask: async () => ({ ok: false, reason: "not_configured" }) });
    await store.getState().send("hi");
    const last = store.getState().messages.at(-1);
    expect(last?.author).toBe("lia");
    expect(last?.body).toMatch(/contact/i);
    expect(last?.suggestions).toContain(CONTACT_SUGGESTION);
    expect(store.getState().handoff).toBe(true);
  });

  it("AC-5: a handoff reply appends the contact chip", async () => {
    const { store } = make({
      ask: async () => ({ ok: true, reply: "Je transfère…", suggestions: [], handoff: true }),
    });
    await store.getState().send("mon paiement a échoué");
    expect(store.getState().messages.at(-1)?.suggestions).toContain(CONTACT_SUGGESTION);
    expect(store.getState().handoff).toBe(true);
  });

  it("AC-7: a blank message is a no-op", async () => {
    const { store, ask } = make();
    const before = store.getState().messages.length;
    await store.getState().send("   ");
    expect(store.getState().messages.length).toBe(before);
    expect(ask).not.toHaveBeenCalled();
  });
});
