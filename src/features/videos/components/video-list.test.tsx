import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The card menu uses the router + server actions; stub both so the list renders
// in jsdom without a Next router context or the Supabase server client.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined, push: () => undefined }),
}));
vi.mock("../actions", () => ({
  duplicateVideo: async () => ({ ok: true, id: "copy" }),
  deleteVideo: async () => ({ ok: true }),
}));

import { VideoList } from "./video-list";

afterEach(cleanup);
import type { Video } from "@/lib/vidcica/video";

// userId="" makes the realtime hook a no-op (no Supabase channel), so the
// component renders purely from its seeded props.
const v = (id: string, status: Video["status"]): Video => ({
  id,
  title: `Vidéo ${id}`,
  thumbnailUrl: null,
  status,
  format: "9:16",
  durationSec: 20,
  hashtags: [],
  createdAt: "",
  updatedAt: "",
});

describe("<VideoList /> (AC-6 empty state)", () => {
  it("with no videos, shows the create CTA instead of an empty list", () => {
    render(<VideoList userId="" initial={[]} />);
    expect(screen.getByRole("link", { name: "Créer une vidéo" })).toHaveAttribute(
      "href",
      "/create",
    );
    expect(screen.queryByTestId("video-grid")).not.toBeInTheDocument();
  });

  it("with videos, renders a card + status badge per video", () => {
    render(<VideoList userId="" initial={[v("a", "pret"), v("b", "generating")]} />);
    expect(screen.getByTestId("video-grid")).toBeInTheDocument();
    expect(screen.getAllByTestId("video-card")).toHaveLength(2);
    expect(screen.getByText("Prêt")).toBeInTheDocument();
    expect(screen.getByText("Génération…")).toBeInTheDocument();
  });
});
