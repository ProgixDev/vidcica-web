import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("allows a same-origin relative path", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/a/b?c=1")).toBe("/a/b?c=1");
  });

  it("rejects absolute and protocol-relative URLs (open-redirect)", () => {
    expect(safeRedirectPath("https://evil.example/steal")).toBe("/");
    expect(safeRedirectPath("//evil.example")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
  });

  it("rejects backslash / whitespace / control-char bypasses (appsec)", () => {
    // Backslash is normalized to "/" by the URL parser + router → https://evil.com
    expect(safeRedirectPath("/\\evil.com")).toBe("/");
    expect(safeRedirectPath("/\\/evil.com")).toBe("/");
    expect(safeRedirectPath("/\tfoo")).toBe("/");
    expect(safeRedirectPath("/ /evil.com")).toBe("/");
    // A legitimate hyphenated path is still allowed (regression guard).
    expect(safeRedirectPath("/videos/abc-def")).toBe("/videos/abc-def");
  });

  it("falls back safely on empty / malformed input", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined, "/home")).toBe("/home");
    expect(safeRedirectPath("not a url")).toBe("/");
  });
});
