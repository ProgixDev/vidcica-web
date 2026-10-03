import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined, push }),
}));
const deleteVideo = vi.fn(async (_id: string) => ({ ok: true as const }));
vi.mock("../actions", () => ({ deleteVideo: (id: string) => deleteVideo(id) }));

import { DraftCard } from "./draft-card";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const draft = {
  id: "vid_9tl7z65s",
  title: "Boost Your Review Game Quick Tips",
  script: "Want better reviews? Here’s how to get them fast.",
};

describe("<DraftCard />", () => {
  // Regression: a draft's only action was “Create a video”, a link to a blank
  // composer, so a script the user already had could never be rendered.
  it("continues this draft instead of starting a blank video", () => {
    render(<DraftCard draft={draft} />);
    expect(screen.getByText(draft.title)).toBeInTheDocument();
    expect(screen.getByText(draft.script)).toBeInTheDocument();
    const generate = screen.getByRole("link", { name: "Générer cette vidéo" });
    expect(generate).toHaveAttribute("href", "/create?draft=vid_9tl7z65s");
  });

  it("deletes the draft after confirmation and returns to the library", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<DraftCard draft={draft} />);
    fireEvent.click(screen.getByRole("button", { name: "Supprimer le brouillon" }));
    await waitFor(() => expect(deleteVideo).toHaveBeenCalledWith("vid_9tl7z65s"));
    expect(push).toHaveBeenCalledWith("/videos");
  });

  it("keeps the draft when the confirmation is declined", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DraftCard draft={draft} />);
    fireEvent.click(screen.getByRole("button", { name: "Supprimer le brouillon" }));
    expect(deleteVideo).not.toHaveBeenCalled();
  });
});
