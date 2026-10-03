import { describe, expect, it } from "vitest";
import { MAX_SCRIPT_WORDS, countWords, lengthFor, narrationEstimate } from "./script-length";

describe("lengthFor", () => {
  // A script is narrated word for word: picking 15 s for 33 s of voice stretches
  // the video over 15 s of footage, so the composer names the length that fits.
  it("names the shortest length that holds the voice", () => {
    expect(lengthFor(12)).toBe(15);
    expect(lengthFor(15)).toBe(15);
    expect(lengthFor(33)).toBe(60);
    expect(lengthFor(61)).toBeNull();
  });
});

describe("countWords", () => {
  it("counts spoken words, not punctuation set apart by French spacing", () => {
    expect(countWords("Une idée de vidéo ? Vidcica s’occupe du reste.")).toBe(8);
    expect(countWords("  \n ")).toBe(0);
  });
});

describe("narrationEstimate", () => {
  // Regression: a long pasted script made a voiced video past 60 s, which the
  // render refused at the very end, after the AI footage was paid for.
  it("flags a script that won't fit in a 60-second video", () => {
    const words = (n: number) => Array.from({ length: n }, () => "mot").join(" ");
    expect(narrationEstimate(words(MAX_SCRIPT_WORDS))).toMatchObject({
      words: MAX_SCRIPT_WORDS,
      seconds: 60,
      tooLong: false,
    });
    expect(narrationEstimate(words(MAX_SCRIPT_WORDS + 1)).tooLong).toBe(true);
    expect(narrationEstimate(words(45))).toEqual({ words: 45, seconds: 15, tooLong: false });
  });
});
