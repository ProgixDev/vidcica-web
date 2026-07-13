import { describe, expect, it } from "vitest";
import {
  leadToRow,
  pushInteraction,
  rowToLead,
  STATUS_ORDER,
  toCsv,
  type Lead,
  type LeadRow,
} from "./lead";

const row = (over: Partial<LeadRow> = {}): LeadRow =>
  ({
    id: "l1",
    campaign_id: "c1",
    campaign_name: "Promo été",
    first_name: "Marie",
    last_name: "Curie",
    email: "marie@example.com",
    phone: "+33600000000",
    city: "Paris",
    captured_at: "2026-07-10T00:00:00Z",
    score: 82,
    score_bucket: "hot",
    status: "new",
    notes: [],
    interactions: [],
    ...over,
  }) as LeadRow;

describe("rowToLead / leadToRow", () => {
  it("round-trips the core fields", () => {
    const lead = rowToLead(row());
    expect(lead).toMatchObject({
      firstName: "Marie",
      email: "marie@example.com",
      status: "new",
      scoreBucket: "hot",
    });
    const back = leadToRow(lead, "user-1");
    expect(back).toMatchObject({
      id: "l1",
      user_id: "user-1",
      first_name: "Marie",
      campaign_id: "c1",
    });
  });

  it("defaults null notes/interactions to empty arrays", () => {
    const lead = rowToLead(
      row({
        notes: null as unknown as LeadRow["notes"],
        interactions: null as unknown as LeadRow["interactions"],
      }),
    );
    expect(lead.notes).toEqual([]);
    expect(lead.interactions).toEqual([]);
  });
});

describe("pushInteraction (AC-9/10)", () => {
  it("appends an interaction with the supplied id + timestamp", () => {
    const out = pushInteraction(
      [],
      { kind: "note", message: "Rappeler demain" },
      "i1",
      "2026-07-13T00:00:00Z",
    );
    expect(out).toEqual([
      { id: "i1", at: "2026-07-13T00:00:00Z", kind: "note", message: "Rappeler demain" },
    ]);
  });
});

describe("toCsv (AC-11)", () => {
  it("emits a header row + one row per lead", () => {
    const csv = toCsv([rowToLead(row())]);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("Prénom");
    expect(lines[1]).toContain("Marie");
    expect(lines[1]).toContain("marie@example.com");
    expect(lines).toHaveLength(2);
  });

  it("escapes cells containing commas or quotes", () => {
    const csv = toCsv([rowToLead(row({ campaign_name: 'Promo "été", 2026' }))]);
    expect(csv).toContain('"Promo ""été"", 2026"');
  });

  it("neutralizes formula-injection payloads from lead form data", () => {
    const csv = toCsv([rowToLead(row({ first_name: '=HYPERLINK("http://evil","x")' }))]);
    // leading '=' → prefixed with a single quote, then quoted for the comma inside
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).not.toMatch(/(^|\n)=HYPERLINK/);
  });
});

describe("STATUS_ORDER", () => {
  it("runs new → contacted → qualified → converted → rejected", () => {
    expect(STATUS_ORDER).toEqual(["new", "contacted", "qualified", "converted", "rejected"]);
  });
});

// Type-only guard so `Lead` stays referenced if the round-trip test changes.
const _typecheck: Lead["status"] = "converted";
void _typecheck;
