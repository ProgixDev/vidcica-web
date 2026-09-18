import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `public/.well-known/apple-app-site-association` is what lets iOS open
 * www.vidcica.com links straight in the app (universal links). iOS reads it
 * silently and a mistake just sends every link to Safari, so its shape is
 * pinned here, like assetlinks.json for Android.
 */
const aasa = JSON.parse(
  readFileSync(join(process.cwd(), "public/.well-known/apple-app-site-association"), "utf8"),
) as {
  applinks: { details: Array<{ appIDs: string[]; components: Array<Record<string, string>> }> };
};

describe("apple-app-site-association", () => {
  const detail = aasa.applinks.details[0];
  if (!detail) throw new Error("apple-app-site-association holds no applinks detail");

  it("names the Vidcica app by team and bundle id", () => {
    expect(detail.appIDs).toEqual(["89884BGNZR.com.progix.vidcica"]);
  });

  it("claims only paths the app handles, never website pages", () => {
    // Same set as the Android App Links in the app's app.json. Claiming a path
    // the website serves (/billing, /ads, /videos…) would hijack those links
    // into the app, where no screen exists for them.
    expect(detail.components.map((c) => c["/"])).toEqual(["/auth/confirm"]);
  });
});
