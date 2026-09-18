import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `public/.well-known/assetlinks.json` is what lets Android open vidcica.com
 * links straight in the app. Android reads it silently and a typo just makes
 * every link fall back to the browser, so the shape is pinned here instead.
 */
const statements = JSON.parse(
  readFileSync(join(process.cwd(), "public/.well-known/assetlinks.json"), "utf8"),
) as Array<{
  relation: string[];
  target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] };
}>;

// Play App Signing: Google re-signs every install with this key, so it is the
// one real users' phones present. Read from Play Console → Protected with Play.
const PLAY_APP_SIGNING =
  "73:76:09:52:4C:8D:31:D0:A5:B7:8F:50:23:2F:24:90:55:A0:91:10:50:1D:3A:0E:CC:24:94:74:60:CF:FA:A8";

const statement = statements[0];
if (!statement) throw new Error("assetlinks.json holds no statement");

describe("assetlinks.json", () => {
  it("delegates link handling to the Vidcica app", () => {
    expect(statements).toHaveLength(1);
    expect(statement.relation).toEqual(["delegate_permission/common.handle_all_urls"]);
    expect(statement.target.namespace).toBe("android_app");
    expect(statement.target.package_name).toBe("com.progix.vidcica");
  });

  it("trusts the Play app signing key", () => {
    expect(statement.target.sha256_cert_fingerprints).toContain(PLAY_APP_SIGNING);
  });

  it("lists only well-formed SHA-256 fingerprints", () => {
    for (const fp of statement.target.sha256_cert_fingerprints) {
      expect(fp).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    }
  });
});
