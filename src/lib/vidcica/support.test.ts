import { describe, expect, it } from "vitest";
import { CONTACT_SUGGESTION, fallbackReply } from "./support";

describe("fallbackReply (AC-4)", () => {
  it("returns a canned reply that points to the contact form + handoff", () => {
    const r = fallbackReply();
    expect(r.reply).toMatch(/contact/i);
    expect(r.suggestions).toContain(CONTACT_SUGGESTION);
    expect(r.handoff).toBe(true);
  });
});
