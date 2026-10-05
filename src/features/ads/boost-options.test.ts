import { describe, expect, it } from "vitest";
import { boostOptions } from "./boost-options";

const url = "https://cdn/x.mp4";

describe("boostOptions", () => {
  // Regression: the Boost page filtered on isReady, so a published video could
  // no longer be boosted, not even from its own Boost button.
  it("offers published and scheduled videos, not only unpublished ones", () => {
    const options = boostOptions([
      { id: "ready", title: "Ready", status: "pret", videoUrl: url },
      { id: "published", title: "Published", status: "publie", videoUrl: url },
      { id: "scheduled", title: "Scheduled", status: "programme", videoUrl: url },
      { id: "publishing", title: "Publishing", status: "publishing", videoUrl: url },
    ]);
    expect(options.map((o) => o.id)).toEqual(["ready", "published", "scheduled", "publishing"]);
  });

  it("leaves out drafts, renders in progress and videos without a file", () => {
    const options = boostOptions([
      { id: "draft", title: "Draft", status: "brouillon", videoUrl: url },
      { id: "generating", title: "Generating", status: "generating", videoUrl: url },
      { id: "assembling", title: "Assembling", status: "assembling", videoUrl: url },
      { id: "no-file", title: "No file", status: "pret" },
    ]);
    expect(options).toEqual([]);
  });

  it("returns only what the wizard needs", () => {
    expect(
      boostOptions([{ id: "v1", title: "Grow Your Business", status: "publie", videoUrl: url }]),
    ).toEqual([{ id: "v1", title: "Grow Your Business" }]);
  });
});
