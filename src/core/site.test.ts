import { describe, expect, it } from "vitest";
import { canonicalOrigin } from "./site";

describe("canonicalOrigin", () => {
  it("moves the apex onto the host that serves without redirecting", () => {
    // vidcica.com 308s to www.vidcica.com, so a canonical naming the apex points
    // at a redirect.
    expect(canonicalOrigin("https://vidcica.com")).toBe("https://www.vidcica.com");
    expect(canonicalOrigin("https://vidcica.com/")).toBe("https://www.vidcica.com");
  });

  it("leaves the canonical host and localhost alone", () => {
    expect(canonicalOrigin("https://www.vidcica.com")).toBe("https://www.vidcica.com");
    expect(canonicalOrigin("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("strips a trailing slash so URLs never double up", () => {
    expect(canonicalOrigin("http://localhost:3000/")).toBe("http://localhost:3000");
  });

  it("does not throw on a misconfigured value", () => {
    expect(canonicalOrigin("not-a-url")).toBe("not-a-url");
  });
});
