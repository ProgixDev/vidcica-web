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

## Verification status (post-review, 2026-07-13)

Corrected AC→test record after the review board + fixes:

- **Running tests:** AC-1 (`notifications-queries.test.ts` + RTL), AC-2 (`notification.test.ts` +
  RTL + bell incl. the 99+ cap), AC-3 (`use-notifications-realtime.test.ts` merge **and** the mounted
  hook: fake INSERT prepends, DELETE removes), AC-4 (`notification-center.test.tsx` — clicking a row
  calls `markRead` and optimistically flips read), AC-5 (`actions.test.ts` + RTL count→0),
  AC-6 (`notification.test.ts` + RTL href/button), AC-7 (RTL empty state).
- **Optimistic UI:** the centre now flips read locally on click / mark-all and rolls back on a failed
  write (surfacing the action's FR error via `role="alert"`); no `router.refresh()` (realtime/next
  load reconciles).
- **AC-8 error path (corrected):** `listMyNotifications` degrades a query failure to `[]` (graceful,
  consistent with the videos/networks reads), so the route `error.tsx` boundary covers render/auth
  throws, not load-failure. A **failed write** now shows an inline `role="alert"`. Loading + error
  boundary states are screenshotted.
- **Accepted residual risk:** real live-arrival + mark-read e2e needs a seeded user + a trigger firing.

## Security note (appsec P1 — verified safe)

The review flagged that no `notifications` RLS migration exists — but it read the **skeleton's**
`supabase/migrations` (0001–0004), not the source-of-truth **ClipFlow** repo. ClipFlow's
`20260603140000_notifications_table_and_triggers.sql` creates `notifications` with **RLS enabled**,
own-row `SELECT/INSERT/UPDATE/DELETE` policies (`user_id = auth.uid()`), server-side trigger minting,
and adds the table to the `supabase_realtime` publication. So the cross-user isolation the web
delegates to RLS **is** enforced on the live DB. Confirmed clean: no client INSERT path, title/body
rendered as text (no XSS), realtime carries no sensitive columns.

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
