import { describe, expect, it } from "vitest";
import {
  notificationHref,
  relativeTime,
  rowToNotification,
  unreadCount,
  type AppNotification,
  type NotificationRow,
} from "./notification";

const row = {
  id: "n1",
  type: "success",
  category: "video_ready",
  title: "Votre vidéo est prête",
  body: "…",
  created_at: "2026-07-13T10:00:00Z",
  read: false,
  video_id: "vid_1",
  campaign_id: null,
  lead_id: null,
} as unknown as NotificationRow;

const n = (over: Partial<AppNotification>): AppNotification => ({
  id: "x",
  type: "info",
  category: "payment",
  title: "t",
  body: "b",
  createdAt: "",
  read: false,
  ...over,
});

describe("rowToNotification", () => {
  it("maps a row and coerces an unknown type to info", () => {
    expect(rowToNotification(row)).toMatchObject({
      id: "n1",
      type: "success",
      category: "video_ready",
      read: false,
      videoId: "vid_1",
    });
    expect(rowToNotification({ ...row, type: "weird" } as NotificationRow).type).toBe("info");
  });
});

describe("unreadCount (AC-2)", () => {
  it("counts unread items", () => {
    expect(unreadCount([n({ read: false }), n({ read: true }), n({ read: false })])).toBe(2);
    expect(unreadCount([])).toBe(0);
  });
});

describe("notificationHref (AC-6)", () => {
  it("links video notifications to the video, others to null", () => {
    expect(notificationHref(n({ category: "video_ready", videoId: "v1" }))).toBe("/videos/v1");
    expect(notificationHref(n({ category: "publish_success", videoId: "v2" }))).toBe("/videos/v2");
    expect(notificationHref(n({ category: "video_ready" }))).toBeNull(); // no videoId
    expect(notificationHref(n({ category: "new_lead", leadId: "l1" }))).toBeNull();
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-07-13T10:00:00Z").getTime();
  it("formats recent times in French", () => {
    expect(relativeTime("2026-07-13T09:59:40Z", now)).toBe("à l’instant");
    expect(relativeTime("2026-07-13T09:30:00Z", now)).toMatch(/min/);
    expect(relativeTime("2026-07-13T07:00:00Z", now)).toMatch(/h|heure/);
    expect(relativeTime("2026-07-10T10:00:00Z", now)).toMatch(/jour/); // 3 j → "il y a 3 jours"
  });
});
