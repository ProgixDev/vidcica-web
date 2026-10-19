import { describe, expect, it } from "vitest";
import { packViews } from "./packs";

// The live packs (credit_products, 2026-10-19).
const LIVE = [
  { credits: 500, priceEur: 75, label: "Pro — 500 crédits" },
  { credits: 50, priceEur: 10, label: "Découverte — 50 crédits" },
  { credits: 150, priceEur: 25, label: "Populaire — 150 crédits" },
];

describe("packViews", () => {
  it("orders packs by size, prices them per credit and marks the middle one", () => {
    const views = packViews(LIVE);
    expect(views.map((v) => v.credits)).toEqual([50, 150, 500]);
    expect(views.map((v) => v.priceCents)).toEqual([1000, 2500, 7500]);
    expect(views.map((v) => v.unitCents)).toEqual([20, 17, 15]);
    expect(views.map((v) => v.popular)).toEqual([false, true, false]);
  });

  it("shows the saving against the smallest pack, from 5 %", () => {
    expect(packViews(LIVE).map((v) => v.savePct)).toEqual([null, 17, 25]);
    const close = packViews([
      { credits: 100, priceEur: 20, label: "A — 100" },
      { credits: 200, priceEur: 39, label: "B — 200" },
    ]);
    expect(close[1]?.savePct).toBeNull(); // 2.5 % is not worth a badge
  });

  it("a single pack is not 'popular'", () => {
    const [only] = packViews([{ credits: 50, priceEur: 10, label: "50 crédits" }]);
    expect(only).toMatchObject({ popular: false, savePct: null });
  });

  it("no packs, no cards", () => {
    expect(packViews([])).toEqual([]);
  });
});
