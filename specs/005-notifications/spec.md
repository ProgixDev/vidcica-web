# Spec 005 — Notification centre

- **Status:** active
- **Type:** feature
- **Requested by / owner:** Houssem Ferrani (product)
- **Date:** 2026-07-13
- **Slice / areas touched:** `src/features/notifications`; route `/notifications`; a bell entry point appended to the dashboard header. Reuses the **existing** backend (no new backend): the `notifications` table (RLS read/update-own; rows minted server-side by DB triggers) + `notifications:{userId}` realtime.

## Problem (the why)

Things happen asynchronously in Vidcica — a render finishes, a publish succeeds or fails, a lead arrives, a payment goes through. On the web the user has no way to see these; they'd have to sit on the render page or refresh. The backend already mints notification rows (DB triggers write `notifications`) and the mobile app has a full notification centre. The web just needs the front-end: a centre that lists them, shows an unread count, updates live, and lets the user mark them read — mirroring `ClipFlow/src/store/notifications.store.ts`.

## Desired behavior (the what)

1. **See my notifications.** On a notifications screen the user sees their notifications newest-first, each with an icon reflecting its kind (success / warning / info), a title, a short body, and a relative time. Unread ones are visually marked.
2. **Unread count.** A bell entry point (on the dashboard) shows the number of unread notifications; it updates live.
3. **Live arrival.** When a new notification is minted on the backend, it appears at the top of the centre and bumps the unread count **without a manual refresh**.
4. **Mark read.** The user can mark a single notification read, or mark all read; the state persists. Opening a notification that links to content (e.g. a finished video) marks it read and navigates there.
5. **Empty state.** A user with no notifications sees a friendly empty state, not a blank list.

## Acceptance criteria

- **AC-1 (list, RSC):** Given a signed-in user, when they open `/notifications`, then their notifications render server-side (RLS-scoped read-own), newest first, with unread ones marked — no blank flash.
- **AC-2 (unread count):** The centre header and the dashboard bell show the count of unread notifications, derived from the list.
- **AC-3 (live arrival):** Given the centre is open and a new notification row is inserted on the backend, then it appears at the top and the unread count increments within a few seconds (via `notifications:{userId}` realtime).
- **AC-4 (mark one read):** Given an unread notification, when the user marks it read (or opens it), then it becomes read locally and the `notifications` row is updated (`read = true`) — persisted across reload.
- **AC-5 (mark all read):** Given unread notifications, when the user marks all read, then all show read and the rows are updated; the unread count drops to zero.
- **AC-6 (navigate on open — non-happy-adjacent):** Given a notification linked to a video, when opened, then it marks read and navigates to `/videos/[id]`; a notification with no navigable link just marks read (no dead click).
- **AC-7 (empty state):** Given zero notifications, when the centre loads, then a friendly empty state with an explanation renders, not an empty list.
- **AC-8 (states everywhere):** `/notifications` renders empty, loading (skeleton), error (inline + recovery), and success states.

## Out of scope

- **Minting notifications** — rows are created server-side by DB triggers; the web only reads + write-throughs read state. No inserts from the client.
- **Notification preferences / channels matrix** — removed product-wide (in-app centre is always on; push is OS-permission-only; email is a future stub). No prefs UI.
- **Push (web push / OS)** and **email** delivery.
- **Dismiss/delete** of a notification — mark-read only (the table's delete policy is not relied on); deletion is a possible follow-up.
- **Deep links to unbuilt destinations** (leads, ads) — those notifications mark read without navigating until those routes exist.

## CUJ impact

- Registers new **CUJ-06 — Read a notification**: a background event mints a notification → it appears live in the centre → the user opens it → marks read / navigates. (Update `docs/product/critical-user-journeys.md` at ship; `e2e/notifications.spec.ts`, `notifications-*` shots.)

## Open questions

Resolved before `/plan-feature`.

- [x] **Scope:** in-app centre (list + unread + mark-read + realtime) + a dashboard bell. No prefs, push, or email.
- [x] **Dismiss:** mark-read only (no client delete).
- [ ] **`notifications` realtime publication** — confirm the table is published; if not, AC-3 degrades to `router.refresh()`/poll (plan verifies; the merge reducer is unit-tested regardless).
