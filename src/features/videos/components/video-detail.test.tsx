import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Detail's delete action uses the router + a server action; stub both so the
// component renders in jsdom without a Next router context or Supabase client.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined, push: () => undefined }),
}));
vi.mock("../actions", () => ({ deleteVideo: async () => ({ ok: true }) }));

import { VideoDetail } from "./video-detail";

afterEach(cleanup);
import type { Video } from "@/lib/vidcica/video";

const base: Video = {
  id: "v1",
  title: "Ma vidéo",
  thumbnailUrl: null,
  status: "pret",
  format: "9:16",
  durationSec: 30,
  hashtags: [],
  createdAt: "",
  updatedAt: "",
};

describe("<VideoDetail /> (AC-14 download)", () => {
  it("a ready video renders a player and a download link to the finished MP4", () => {
    render(<VideoDetail video={{ ...base, videoUrl: "https://cdn.example/final.mp4" }} />);
    const dl = screen.getByTestId("download-btn");
    expect(dl).toHaveAttribute("href", "https://cdn.example/final.mp4");
    expect(dl).toHaveAttribute("download");
    expect(screen.getByTestId("video-player")).toBeInTheDocument();
  });

  it("without a media URL, no player or download is shown", () => {
    render(<VideoDetail video={{ ...base, videoUrl: undefined }} />);
    expect(screen.queryByTestId("download-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("video-player")).not.toBeInTheDocument();
  });
});
