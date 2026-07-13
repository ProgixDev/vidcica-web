import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationCenter } from "./notification-center";
import type { AppNotification } from "@/lib/vidcica/notification";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
const markRead = vi.fn(async () => ({ ok: true as const }));
const markAllRead = vi.fn(async () => ({ ok: true as const }));
vi.mock("../actions", () => ({
  markRead: (...a: unknown[]) => markRead(...(a as [])),
  markAllRead: (...a: unknown[]) => markAllRead(...(a as [])),
}));
afterEach(() => {
  cleanup();
  markRead.mockClear();
  markAllRead.mockClear();
});

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
    expect(screen.getByTestId("notification-a")).toHaveAttribute("href", "/videos/v1");
    expect(screen.getByTestId("notification-b").tagName).toBe("BUTTON");
  });

  it("AC-4: clicking an unread row marks it read (optimistic) and calls the action", () => {
    render(<NotificationCenter userId="" initial={[n({ id: "a", read: false })]} />);
    expect(screen.getByTestId("unread-count")).toHaveTextContent("1");
    fireEvent.click(screen.getByTestId("notification-a"));
    expect(markRead).toHaveBeenCalledWith("a");
    expect(screen.getByTestId("unread-count")).toHaveTextContent("0"); // optimistic flip
    expect(screen.getByTestId("notification-a")).toHaveAttribute("data-read", "true");
  });

  it("AC-5: mark-all clears the unread count and calls the action", () => {
    render(
      <NotificationCenter
        userId=""
        initial={[n({ id: "a", read: false }), n({ id: "c", read: false })]}
      />,
    );
    expect(screen.getByTestId("unread-count")).toHaveTextContent("2");
    fireEvent.click(screen.getByTestId("mark-all-read"));
    expect(markAllRead).toHaveBeenCalled();
    expect(screen.getByTestId("unread-count")).toHaveTextContent("0");
  });

  it("AC-7: shows a friendly empty state when there are none", () => {
    render(<NotificationCenter userId="" initial={[]} />);
    expect(screen.getByText("Aucune notification")).toBeInTheDocument();
    expect(screen.queryByTestId("notification-list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mark-all-read")).not.toBeInTheDocument();
  });
});
