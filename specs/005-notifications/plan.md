# Plan 005 — Notification centre

- **Spec:** [spec.md](spec.md) (open questions resolved; realtime publication verified in step 0)
- **Author:** Claude (agent) · **Date:** 2026-07-13

## Approach

One `notifications` slice over the shared `lib/vidcica` tier (ADR-0008), mirroring the proven
002–004 patterns. **No new backend:** rows are minted server-side by DB triggers; the web reads them
RLS-scoped (RSC first paint), keeps the list live over `notifications:{userId}` realtime, and
write-throughs only the read state (`read = true`) via RLS `UPDATE` server actions. No client inserts.

The `notifications` table has no sensitive columns (title/body/category/type/read/links + timestamps),
so streaming its row over realtime is safe (unlike the 003 networks token-ciphertext leak).

## Placement (module-boundaries + ADR-0008)

| What                | Where                                           | Notes                                                                                            |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Notification domain | `src/lib/vidcica/notification.ts`               | `AppNotification` type, `rowToNotification`, category/type meta (icon/label/link), `unreadCount` |
| Server reads        | `src/lib/vidcica/notifications-queries.ts`      | `listMyNotifications()` (RLS, newest first)                                                      |
| Realtime            | `src/lib/vidcica/use-notifications-realtime.ts` | merge reducer (prepend new / update read) + hook                                                 |
| Actions             | `src/features/notifications/actions.ts`         | `markRead(id)`, `markAllRead()` — RLS `UPDATE read=true`, zod-validated                          |
| Slice               | `src/features/notifications/`                   | `NotificationCenter` (list + mark-all + states), `NotificationBell` (unread badge + link)        |
| Route               | `src/app/notifications/page.tsx`                | thin RSC seeds the centre                                                                        |
| Entry point         | `src/app/dashboard/page.tsx`                    | append `NotificationBell` to the header (small, additive)                                        |

## Data & state

- **Server reads:** `listMyNotifications()` (centre RSC + dashboard for the initial bell count).
- **Client state:** the centre holds the seeded list + merges realtime (prepend inserts, patch reads);
  unread count derives from the list. Bell holds a seeded count + subscribes for live increments.
- **Writes:** `markRead`/`markAllRead` server actions do the RLS `UPDATE`; the UI updates optimistically
  and `router.refresh()`/realtime reconciles.

## Acceptance criteria → verification mapping

| AC                    | Proven by                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| AC-1 list RSC         | unit `notifications-queries.test.ts` (table/order/columns); RTL center renders rows + unread mark |
| AC-2 unread count     | unit `notification.test.ts` (`unreadCount`); RTL header count                                     |
| AC-3 live arrival     | unit `use-notifications-realtime.test.ts` (insert prepends, read patch merges)                    |
| AC-4 mark one read    | unit `notifications/actions.test.ts` (RLS patch shape + non-uuid reject); RTL click marks read    |
| AC-5 mark all read    | unit `actions.test.ts` (update where read=false); RTL "tout marquer lu" clears count              |
| AC-6 navigate on open | RTL: a video-linked item has href `/videos/[id]`; an unlinked item marks read only                |
| AC-7 empty state      | RTL: `[]` → friendly empty state, not an empty list                                               |
| AC-8 states           | RTL empty/error + `pnpm e2e:shots` + `/verify-ui`                                                 |

## Risks & unknowns

- **`notifications` realtime publication** — verify in step 0; if unpublished, AC-3 degrades to
  `router.refresh()`; the merge reducer is unit-tested regardless. Safe to stream (no sensitive cols).
- **Relative time formatting** — use a small FR `Intl.RelativeTimeFormat` helper (no new dep; the
  mobile's date-fns doesn't port). Pure + unit-tested.
- **Real live-arrival e2e** needs a seeded user + a trigger firing — gated on the same seeded test
  user (accepted residual risk; unit + RTL + screenshots otherwise).

## Overlap check

Active specs: 002 (videos), 003 (networks/publish), 004 (billing). This spec adds a new
`notifications` slice + `/notifications` route + new `lib/vidcica/notification*` files. The one shared
touch is appending `NotificationBell` to `src/app/dashboard/page.tsx`'s header (additive, no logic
change) — no conflict.
