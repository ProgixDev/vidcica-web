import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NotificationBell } from "./notification-bell";
import type { AppNotification } from "@/lib/vidcica/notification";

afterEach(cleanup);

const n = (read: boolean): AppNotification => ({
  id: Math.random().toString(),
  type: "info",
  category: "payment",
  title: "t",
  body: "b",
  createdAt: "",
  read,
});

describe("<NotificationBell /> (AC-2)", () => {
  it("shows the unread badge with the count", () => {
    render(<NotificationBell userId="" initial={[n(false), n(false), n(true)]} />);
    expect(screen.getByTestId("notification-bell")).toHaveAttribute("href", "/notifications");
    expect(screen.getByTestId("bell-count")).toHaveTextContent("2");
  });

  it("hides the badge when nothing is unread", () => {
    render(<NotificationBell userId="" initial={[n(true)]} />);
    expect(screen.queryByTestId("bell-count")).not.toBeInTheDocument();
  });

  it("caps the badge at 99+", () => {
    render(<NotificationBell userId="" initial={Array.from({ length: 100 }, () => n(false))} />);
    expect(screen.getByTestId("bell-count")).toHaveTextContent("99+");
  });
});
