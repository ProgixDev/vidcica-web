import { beforeEach, describe, expect, it, vi } from "vitest";

// Captures the row passed to .insert() so we can assert what would hit the DB.
let insertArg: Record<string, unknown> | null = null;
let result: { data: unknown; error: unknown } = { data: { id: "vid_new" }, error: null };

function builder() {
  const node: Record<string, unknown> = {};
  node.insert = (arg: Record<string, unknown>) => {
    insertArg = arg;
    return node;
  };
  node.select = () => node;
  node.single = async () => result;
  return node;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: () => builder(),
  })),
}));

vi.mock("@/core/env.client", () => ({
  clientEnv: { NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co" },
}));

import { createUploadedVideo } from "./actions";

const OWN = "https://proj.supabase.co/storage/v1/object/public/user-uploads/u1/abc.mp4";

beforeEach(() => {
  insertArg = null;
  result = { data: { id: "vid_new" }, error: null };
});

describe("createUploadedVideo", () => {
  it("registers an own-folder upload as a ready ('pret') video", async () => {
    const out = await createUploadedVideo({
      title: "Mon clip",
      videoUrl: OWN,
      durationSec: 12,
      format: "9:16",
    });
    expect(out).toEqual({ ok: true, id: "vid_new" });
    expect(insertArg?.status).toBe("pret");
    expect(insertArg?.video_url).toBe(OWN);
    expect(insertArg?.user_id).toBe("u1");
    expect(insertArg?.format).toBe("9:16");
    expect(insertArg?.duration_sec).toBe(12);
  });

  it("rejects a video URL outside our storage (SSRF guard) — no insert", async () => {
    const out = await createUploadedVideo({
      title: "x",
      videoUrl: "https://evil.example.com/pwn.mp4",
      durationSec: 10,
      format: "9:16",
    });
    expect(out.ok).toBe(false);
    expect(insertArg).toBeNull();
  });

  it("rejects another user's folder", async () => {
    const out = await createUploadedVideo({
      title: "x",
      videoUrl: "https://proj.supabase.co/storage/v1/object/public/user-uploads/u2/abc.mp4",
      durationSec: 10,
      format: "9:16",
    });
    expect(out.ok).toBe(false);
    expect(insertArg).toBeNull();
  });

  it("drops a foreign thumbnail URL but still saves the video", async () => {
    const out = await createUploadedVideo({
      title: "x",
      videoUrl: OWN,
      thumbnailUrl: "https://evil.example.com/t.jpg",
      durationSec: 10,
      format: "1:1",
    });
    expect(out.ok).toBe(true);
    expect(insertArg?.thumbnail_url).toBe("");
  });

  it("rejects an invalid aspect ratio", async () => {
    const out = await createUploadedVideo({
      title: "x",
      videoUrl: OWN,
      durationSec: 10,
      // @ts-expect-error — invalid ratio on purpose
      format: "4:3",
    });
    expect(out.ok).toBe(false);
    expect(insertArg).toBeNull();
  });
});
