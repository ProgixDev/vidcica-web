# Tasks 006 — Support: Lia chat & contact form

Gates after each task: `pnpm lint && pnpm typecheck && pnpm test`; `pnpm verify` at phase ends.

## Phase 0 — data-layer

- [ ] T0 Branch `feat/006-support`; expand `database.types.ts` with `support_tickets` · done: `tsc` sees the table
- [ ] T1 `lib/vidcica/support.ts`: `SupportTurn`, `askSupport(supabase, turns)` (support-chat fetch, 503→not_configured), `fallbackReply()` canned FR · done: `support.test.ts` (reason mapping + fallback)
- [ ] T2 `features/support/store.ts` + `provider.tsx`: messages/typing/handoff + `send()` (DI ask, fallback on non-ok, blank no-op) · done: `store.test.ts` (send/reply/typing/suggestions/fallback/blank)
- [ ] T3 `features/support/actions.ts`: `submitTicket` (zod subject/message, RLS insert, user_id server-side) · done: `actions.test.ts` (insert shape + short-input reject)

## Phase 1 — slice (AC-1..AC-8)

- [ ] T4 `SupportChat`: thread (user/Lia bubbles), input, typing indicator, suggestion chips · done: RTL send/typing/chip
- [ ] T5 `ContactForm`: subject + message, submit → confirmation, inline validation · done: RTL submit + error
- [ ] T6 `SupportTabs` (Assistant | Contact) + handoff chip switches tab; `/support/page.tsx` RSC guarded · done: route serves; states render

## Phase 2 — verification

- [ ] T7 `e2e/support.spec.ts`: guard + `/support` render, `shot()` per state; live AI reply gated on test user · done: `FEATURE=006-support pnpm e2e:shots` green
- [ ] T8 `/verify-ui 006` — screenshots vs ACs; fix
- [ ] T9 `pnpm verify` green

## Phase 3 — review & ship

- [ ] T10 `/review`; fix P0/P1
- [ ] T11 `/feature-report`; PR; `/update-docs` (CUJ-07)

## AC coverage (keep in sync)

- [ ] AC-1→T2,T4 · [ ] AC-2→T2,T4 · [ ] AC-3→T2,T4 · [ ] AC-4→T1,T2
- [ ] AC-5→T2,T6 · [ ] AC-6→T3,T5 · [ ] AC-7→T2,T3 · [ ] AC-8→T4,T5,T7,T8
