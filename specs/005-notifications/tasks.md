# Tasks 005 — Notification centre

Gates after each task: `pnpm lint && pnpm typecheck && pnpm test`; `pnpm verify` at phase ends.

## Phase 0 — data-layer

- [ ] T0 Branch `feat/005-notifications`; `lib/vidcica/notification.ts` (type, `rowToNotification`, category/type meta + link, `unreadCount`, relative-time helper) · done: `notification.test.ts` green
- [ ] T1 `lib/vidcica/notifications-queries.ts` (`listMyNotifications`, newest first) · done: `notifications-queries.test.ts` (table/order/columns)
- [ ] T2 `lib/vidcica/use-notifications-realtime.ts` (merge: prepend insert / patch read) + hook · done: merge unit test green
- [ ] T3 `features/notifications/actions.ts` (`markRead`/`markAllRead`, RLS update, zod) · done: `actions.test.ts` (patch shape + non-uuid)

## Phase 1 — slice (AC-1..AC-8)

- [ ] T4 `NotificationCenter` client: list (icon by type, title/body/relative-time, unread mark), mark-all, empty/loading/error, live via realtime · done: RTL states + unread count
- [ ] T5 `NotificationBell` client: unread badge + link to `/notifications` (seeded count + live) · done: RTL badge
- [ ] T6 `/notifications/page.tsx` RSC seeds the centre; append `NotificationBell` to the dashboard header · done: routes serve; bell shows count

## Phase 2 — verification

- [ ] T7 `e2e/notifications.spec.ts`: guard + `/notifications` render, `shot()` per state; live-arrival gated on test user · done: `FEATURE=005-notifications pnpm e2e:shots` green
- [ ] T8 `/verify-ui 005` — screenshots vs ACs; fix
- [ ] T9 `pnpm verify` green

## Phase 3 — review & ship

- [ ] T10 `/review`; fix P0/P1
- [ ] T11 `/feature-report`; PR; `/update-docs` (CUJ-06)

## AC coverage (keep in sync)

- [ ] AC-1→T1,T4,T6 · [ ] AC-2→T0,T4,T5 · [ ] AC-3→T2 · [ ] AC-4→T3,T4
- [ ] AC-5→T3,T4 · [ ] AC-6→T4 · [ ] AC-7→T4 · [ ] AC-8→T4,T7,T8
