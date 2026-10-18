// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { clientEnv } from "@/core/env.client";
import { POST } from "./route";

const ROUTE = "https://www.vidcica.com/oauth/meta-deauthorize";
const FORM = "signed_request=abc.def";
const FUNCTION_URL = new URL(
  "/functions/v1/meta-deauthorize",
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
).toString();

function metaPost(body: string, headers: Record<string, string> = {}) {
  return new NextRequest(ROUTE, {
    method: "POST",
    body,
    headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("POST /oauth/meta-deauthorize", () => {
  it("forwards Meta’s body and type to the function, and mirrors its answer", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response('{"error":"invalid_signature"}', {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(metaPost(FORM, { cookie: "sb-access-token=secret" }));

    expect(res.status).toBe(400);
    expect(await res.text()).toBe('{"error":"invalid_signature"}');
    const [target, init] = fetchMock.mock.calls[0]!;
    expect(String(target)).toBe(FUNCTION_URL);
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(FORM);
    // Only the content type travels on: never the caller's cookies.
    expect(init?.headers).toEqual({ "content-type": "application/x-www-form-urlencoded" });
  });

  it("refuses an oversized body without calling the function", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    const res = await POST(metaPost(`signed_request=${"x".repeat(20 * 1024)}`));
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 502 when the function can’t be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => {
        throw new Error("network down");
      }),
    );
    const res = await POST(metaPost(FORM));
    expect(res.status).toBe(502);
  });
});
