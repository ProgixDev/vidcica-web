import { describe, expect, it } from "vitest";
import { isTerminal, RENDER_STAGES, stageView } from "./progress";

describe("stageView (AC-12, AC-13)", () => {
  it("advances the bar through each stage, monotonically", () => {
    const pcts = RENDER_STAGES.map((s) => stageView(s.status).pct);
    for (let i = 1; i < pcts.length; i++) {
      expect(pcts[i]!).toBeGreaterThan(pcts[i - 1]!);
    }
    expect(stageView("queued").pct).toBeGreaterThan(0); // never a bare 0/spinner
  });

  it("succeeded → 100% and done", () => {
    const v = stageView("succeeded");
    expect(v.pct).toBe(100);
    expect(v.done).toBe(true);
    expect(v.failed).toBe(false);
  });

  it("failed/cancelled → failed with no progress (AC-13)", () => {
    for (const s of ["failed", "cancelled"] as const) {
      const v = stageView(s);
      expect(v.failed).toBe(true);
      expect(v.done).toBe(false);
    }
  });

  it("isTerminal only for succeeded/failed/cancelled", () => {
    expect(isTerminal("succeeded")).toBe(true);
    expect(isTerminal("failed")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("footage")).toBe(false);
    expect(isTerminal("queued")).toBe(false);
  });
});
