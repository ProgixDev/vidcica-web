# Plan 006 — Support: Lia chat & contact form

- **Spec:** [spec.md](spec.md) (open questions resolved; contact form is a tab on `/support`)
- **Author:** Claude (agent) · **Date:** 2026-07-13

## Approach

One `support` slice over the shared `lib/vidcica` tier (ADR-0008). **No new backend:** the chat calls
the existing `support-chat` edge function (session-scoped) and, on 503/error, degrades to a canned FR
fallback reply pointing to the contact form (mirrors the mobile mock-bot). The contact form does a
direct RLS `INSERT` into the existing `support_tickets` table — the same write-through the mobile
`submitTicket` uses. No chat persistence (fresh greeting each session, like mobile).

`/support` is a two-tab surface: **Assistant** (the chat) and **Contact** (the form). Lia's handoff
flag surfaces a chip that switches to the Contact tab.

## Placement (module-boundaries + ADR-0008)

| What              | Where                                            | Notes                                                                                                                |
| ----------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| DB types (expand) | `src/lib/supabase/database.types.ts`             | add `support_tickets`                                                                                                |
| Chat client       | `src/lib/vidcica/support.ts`                     | `askSupport(supabase, turns)` (support-chat fetch, 503→not_configured), `SupportTurn`, `fallbackReply()` (canned FR) |
| Chat store        | `src/features/support/store.ts` + `provider.tsx` | messages + typing + `send()`; DI `ask` for tests; fallback on non-ok                                                 |
| Ticket action     | `src/features/support/actions.ts`                | `submitTicket({subject, message})` → `support_tickets` insert (zod, RLS)                                             |
| Slice             | `src/features/support/`                          | `SupportChat` (thread + input + suggestions + typing), `ContactForm`, `SupportTabs`                                  |
| Route             | `src/app/support/page.tsx`                       | thin RSC (guarded); mounts the tabs                                                                                  |

## Data & state

- **Client state:** the chat is a per-feature Zustand store (messages, typing, handoff) via context,
  DI-injected `ask` for tests. Contact form is local `useState` + a server action.
- **Writes:** chat = `support-chat` invoke (client, session token); ticket = `submitTicket` server
  action (RLS insert). No reads/queries (chat isn't persisted; tickets aren't listed here).

## Acceptance criteria → verification mapping

| AC                           | Proven by                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| AC-1 send & reply            | unit `support/store.test.ts` (send appends user turn + Lia reply from injected ask); RTL        |
| AC-2 typing indicator        | unit `store.test.ts` (typing true during, false after); RTL indicator                           |
| AC-3 suggestions             | unit `store.test.ts` (reply carries suggestions; `send(chip)` appends); RTL chip click          |
| AC-4 not-configured fallback | unit `store.test.ts` (ask → not_configured/error → fallback reply appended, not stranded)       |
| AC-5 handoff                 | unit `support.ts`/store (handoff → contact chip); RTL chip switches tab                         |
| AC-6 ticket insert           | unit `actions.test.ts` (insert shape user_id/subject/message + zod); RTL submit → confirmation  |
| AC-7 validation              | unit `store.test.ts` (blank message no-op) + `actions.test.ts` (short subject/message rejected) |
| AC-8 states                  | RTL idle/typing/error/success + `pnpm e2e:shots` + `/verify-ui`                                 |

## Risks & unknowns

- **`support-chat` requires a session** (verify_jwt true) — the web sends the session bearer; signed-out
  is impossible here (route guarded). The DI `ask` keeps the store testable without the network.
- **Real AI reply e2e** needs a seeded user + a live OPENAI key — gated on the same seeded test user
  (accepted residual risk; unit + RTL + screenshots otherwise). The fallback path is unit-tested.
- **`support_tickets` RLS** — insert-own is enforced server-side (defined in the ClipFlow migrations,
  source of truth); the action sets `user_id` server-side from the session, never client input.

## Overlap check

Active specs: 002–005. This spec adds a new `support` slice + `/support` route + new
`lib/vidcica/support.ts`, and expands `database.types.ts` with `support_tickets`. No file overlap
with 002–005. Additive.
