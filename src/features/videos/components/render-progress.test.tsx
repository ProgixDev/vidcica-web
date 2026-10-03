import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push }) }));
// A failed job is terminal, so nothing polls; stub the browser client anyway.
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));

import { RenderProgress } from "./render-progress";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("<RenderProgress /> when the render failed", () => {
  // Regression: a script too long for 60 s failed with the generic "something
  // went wrong", after the AI footage was paid for. The worker now stops it
  // before any footage; the page has to say why and how to fix it.
  it("explains a script that was too long and reopens it to shorten", () => {
    render(
      <RenderProgress
        videoId="vid_x"
        jobId="job-1"
        initialStatus="failed"
        initialLastError="script_too_long:72"
      />,
    );
    expect(screen.getByText("Script trop long")).toBeInTheDocument();
    expect(screen.getByText(/72 s/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Raccourcir le script" }));
    expect(push).toHaveBeenCalledWith("/create?draft=vid_x");
  });

  it("keeps the generic message for any other failure", () => {
    render(
      <RenderProgress
        videoId="vid_x"
        jobId="job-1"
        initialStatus="failed"
        initialLastError="assembly_failed: boom"
      />,
    );
    expect(screen.queryByText("Script trop long")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nouvelle vidéo" })).toBeInTheDocument();
  });
});
