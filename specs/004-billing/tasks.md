# Tasks 004 — Billing: subscriptions & credits

Gates after each task: `pnpm lint && pnpm typecheck && pnpm test`; `pnpm verify` at phase ends.

## Phase 0 — pack + data-layer

- [ ] T0 Branch `feat/004-billing`; `/add-feature payments-stripe` → copy ONLY `ui/paywall.tsx` shell into `src/features/billing/`; do NOT copy the SDK action / webhook route / migration / `stripe` dep · done: no `packs`-derived backend added
- [ ] T1 Expand `database.types.ts` with `profiles` (regen via MCP) · done: `tsc` sees `profiles.tier`
- [ ] T2 `lib/vidcica/tiers.ts`: `TIERS` matrix + `ORDERED_TIERS` + `PLAN_META` (ported) · done: `tiers.test.ts` asserts values
- [ ] T3 `lib/vidcica/billing.ts`: `startCheckout(supabase, plan, popup)` (create-checkout-session → popup+detect via tier poll) + `openBillingPortal` (create-portal-session), DI orchestrator · done: `billing.test.ts` (detect / cancelled / 503 / portal)
- [ ] T4 `lib/vidcica/billing-queries.ts` (`getMyEntitlement`) + `use-credits-realtime.ts` (merge) · done: `billing-queries.test.ts` + merge test green

## Phase 1 — billing slice (AC-1..AC-8)

- [ ] T5 `features/billing`: adapt the paywall shell → plan cards (4 tiers, current marked), credits balance, subscribe/manage, states · done: RTL renders plan+credits+cards
- [ ] T6 Subscribe/manage wired to `lib/vidcica/billing` (popup opened synchronously in the click handler); pending + not-configured message · done: states render
- [ ] T7 `/billing/page.tsx` RSC seeds paywall with `getMyEntitlement()` + guard · done: page serves states; loading/error boundaries

## Phase 2 — verification

- [ ] T8 `e2e/billing.spec.ts`: guard + `/billing` render, `shot()` per state; checkout gated on test user · done: `FEATURE=004-billing pnpm e2e:shots` green
- [ ] T9 `/verify-ui 004` — screenshots vs ACs; fix
- [ ] T10 `pnpm verify` green

## Phase 3 — review & ship

- [ ] T11 `/review`; fix P0/P1
- [ ] T12 `/feature-report`; PR; `/update-docs` (CUJ-05)

## AC coverage (keep in sync)

- [ ] AC-1→T4,T5,T7 · [ ] AC-2→T2,T5 · [ ] AC-3→T3 · [ ] AC-4→T3 · [ ] AC-5→T3
- [ ] AC-6→T3,T5 · [ ] AC-7→T4 · [ ] AC-8→T5,T8,T9
