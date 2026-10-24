import { describe, expect, it } from "vitest";
import { makeT } from "@/lib/i18n";
import { formatMegabytes, formatVideoLength } from "./units";

const fr = makeT("fr");
const en = makeT("en");

describe("formatVideoLength", () => {
  it("writes the mockup's duration labels", () => {
    expect([15, 30, 60, 90, 120, 180].map((s) => formatVideoLength(s, fr))).toEqual([
      "15 s",
      "30 s",
      "60 s",
      "1 min 30",
      "2 min",
      "3 min",
    ]);
  });

  it("has English labels", () => {
    expect(formatVideoLength(15, en)).toBe("15s");
    expect(formatVideoLength(90, en)).toBe("1 min 30s");
    expect(formatVideoLength(180, en)).toBe("3 min");
  });

  it("pads the seconds and rounds", () => {
    expect(formatVideoLength(65, fr)).toBe("1 min 05");
    expect(formatVideoLength(29.6, fr)).toBe("30 s");
  });
});

describe("formatMegabytes", () => {
  it("writes the plan storage sizes", () => {
    expect([30, 500, 1024, 4096].map((mb) => formatMegabytes(mb, fr))).toEqual([
      "30 Mo",
      "500 Mo",
      "1 Go",
      "4 Go",
    ]);
    expect(formatMegabytes(4096, en)).toBe("4 GB");
    expect(formatMegabytes(312.4, en)).toBe("312 MB");
  });
});
