import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationCenter } from "./notification-center";
import type { AppNotification } from "@/lib/vidcica/notification";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
const markAllRead = vi.fn(async () => ({ ok: true as const }));
vi.mock("../actions", () => ({
  markRead: vi.fn(async () => ({ ok: true as const })),
  markAllRead: () => markAllRead(),
}));
afterEach(cleanup);

const n = (over: Partial<AppNotification>): AppNotification => ({
  id: "x",
  type: "info",
  category: "payment",
  title: "t",
  body: "b",
  createdAt: "2026-07-13T10:00:00Z",
  read: false,
  ...over,
});

describe("<NotificationCenter /> (AC-1/2/6/7)", () => {
  it("lists notifications, shows the unread count, and links video items", () => {
    render(
      <NotificationCenter
        userId=""
        initial={[
          n({ id: "a", category: "video_ready", videoId: "v1", title: "Vidéo prête", read: false }),
          n({ id: "b", category: "payment", title: "Paiement reçu", read: true }),
        ]}
      />,
    );
    expect(screen.getByTestId("unread-count")).toHaveTextContent("1");
    // video-linked item is an anchor to the video (AC-6)
    expect(screen.getByTestId("notification-a")).toHaveAttribute("href", "/videos/v1");
    // unlinked item is a button (no dead link)
    expect(screen.getByTestId("notification-b").tagName).toBe("BUTTON");
  });

  it("mark-all is offered when there are unread and triggers the action", () => {
    render(<NotificationCenter userId="" initial={[n({ id: "a", read: false })]} />);
    fireEvent.click(screen.getByTestId("mark-all-read"));
    expect(markAllRead).toHaveBeenCalled();
  });

  it("shows a friendly empty state when there are none (AC-7)", () => {
    render(<NotificationCenter userId="" initial={[]} />);
    expect(screen.getByText("Aucune notification")).toBeInTheDocument();
    expect(screen.queryByTestId("notification-list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mark-all-read")).not.toBeInTheDocument();
  });
});
