# Plan 004 — Billing: subscriptions & credits

- **Spec:** [spec.md](spec.md) (open questions resolved: popup+detect; subs-only; credits-realtime verified in step 0)
- **Author:** Claude (agent) · **Date:** 2026-07-13

## Approach

One `billing` slice over the shared `lib/vidcica` tier (ADR-0008). **No new backend:** subscribe
drives the existing `create-checkout-session`; manage drives `create-portal-session`; entitlement is
written by the live `stripe-webhook` (service-role) — the web never writes `profiles.tier`. Reads are
RLS-scoped Server Components.

**Pack usage (`/add-feature payments-stripe`):** we take **only the paywall UI shell** and adapt it.
We deliberately DO NOT copy the pack's Stripe SDK server action, its `app/api/stripe/webhook` route
handler, or its `0010_stripe_customers` migration — Vidcica's Supabase backend already owns checkout,
the webhook, and entitlement. The pack's `stripe` dependency is **not** installed (no server-side
Stripe SDK on web; we call the edge functions over HTTPS).

**Checkout on web (the key decision):** `create-checkout-session` hard-codes `success_url`/`cancel_url`
to `STRIPE_RETURN_URL` (`vidcica://…`, unusable in a browser). The `stripe-webhook` writes
`profiles.tier` server-side regardless of that redirect, so the web opens Checkout in a **popup**
(same pattern as the 003 OAuth connect) and **detects** the upgrade by polling `profiles.tier` until
it changes, then closes the popup and refreshes. Zero backend change. The portal opens in a popup too.

## Placement (module-boundaries + ADR-0008)

| What              | Where                                     | Notes                                                                                                                             |
| ----------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| DB types (expand) | `src/lib/supabase/database.types.ts`      | add `profiles` (tier); `credits_accounts` already present                                                                         |
| Tier matrix       | `src/lib/vidcica/tiers.ts`                | canonical `TIERS` (id/label/priceEUR/monthlyCredits/features) + `ORDERED_TIERS`, ported from ClipFlow                             |
| Checkout client   | `src/lib/vidcica/billing.ts`              | `startCheckout(plan)` (create-checkout-session → popup+detect), `openBillingPortal()` (create-portal-session → popup) — DI-tested |
| Server reads      | `src/lib/vidcica/billing-queries.ts`      | `getMyEntitlement()` → `{ plan, credits }` (profiles + credits_accounts, RLS)                                                     |
| Credits realtime  | `src/lib/vidcica/use-credits-realtime.ts` | subscribe `credits_accounts:{userId}` (no sensitive columns)                                                                      |
| Billing slice     | `src/features/billing/`                   | Paywall (adapted pack shell): plan cards, subscribe/manage, states                                                                |
| Route             | `src/app/billing/page.tsx`                | thin RSC seeds the paywall with entitlement                                                                                       |

## Data & state

- **Server reads:** `getMyEntitlement()` (billing RSC) — `profiles.tier` + `credits_accounts.balance`.
- **Client state:** the paywall holds the seeded plan/credits and merges live credit changes; checkout
  is a per-action popup+poll (like OAuth), not a store — small local `useState` for pending/message.
- **Writes:** none client-side. Subscribe/manage only _open_ Stripe (server issues the URL via the
  edge function with the session); entitlement writes are the webhook's job.

## Acceptance criteria → verification mapping

| AC                    | Proven by                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| AC-1 entitlement RSC  | unit `billing-queries.test.ts` (profiles+credits shape, RLS); RTL paywall renders plan+credits              |
| AC-2 compare tiers    | unit `tiers.test.ts` (matrix values €0/25/45/99, credits 20/150/300/600); RTL 4 cards + current marked      |
| AC-3 subscribe→detect | unit `billing.test.ts` (DI: checkout start→popup→poll tier change→ok); manual/e2e gated on Stripe test mode |
| AC-4 cancelled        | unit `billing.test.ts` (popup closed, tier unchanged → cancelled)                                           |
| AC-5 not configured   | unit `billing.test.ts` (503 → `not_configured`, graceful)                                                   |
| AC-6 manage portal    | unit `billing.test.ts` (portal opens; no_customer handled); RTL manage button for active tier               |
| AC-7 live credits     | unit `use-credits-realtime.test.ts` (balance change merges)                                                 |
| AC-8 states           | RTL loading/error + `pnpm e2e:shots` + `/verify-ui`                                                         |

## Verification status (post-review, 2026-07-13)

Corrected AC→test record after the review board + fixes:

- **Running tests:** AC-1 (`billing-queries.test.ts` + RTL), AC-2 (`tiers.test.ts` + RTL incl. a
  highlight + the "Actuel" marking), AC-3/AC-4 (`billing.test.ts` runCheckout DI), AC-5
  (`billing.test.ts` HTTP mapping 503→not_configured / non-ok→error), AC-6 (`billing.test.ts`
  `openBillingPortal` branches: ok / no_customer / not_configured / null-popup), AC-7
  (`use-credits-realtime.test.ts` merge **and** the hook's live subscription wiring), AC-8
  (`paywall.test.tsx` surfaces the not-configured `role="alert"`).
- **Screenshot-only:** paywall free/paid success + the error state; `loading.tsx`/`error.tsx` route
  boundaries are captured but not RTL-asserted.
- **Accepted residual risk:** the real Stripe checkout (AC-3) + portal (AC-6) need Stripe test-mode
  keys + a seeded test user — e2e is in place and skips until `E2E_TEST_*` is set.

## ⚠️ Backend finding (out of web-repo scope — needs human sign-off)

The appsec review flagged that **`profiles.tier`** (the entitlement column) appears to be
**client-writable** on the live DB: the ClipFlow migration adds `tier` with only a CHECK constraint

- a row-ownership `UPDATE` policy — no column-scoped grant or trigger excluding `tier`. If so, a
  scripted authenticated client could `update profiles set tier='studio'` and self-grant a paid plan
  (Stripe never involved). The **web code is correct** (it only reads `tier` and sends `{plan}`;
  entitlement is webhook-written) — this is a **backend RLS gap** that must be fixed with a migration in
  the ClipFlow repo (column-scope the grant to exclude `tier`/`account_status`, or a `BEFORE UPDATE`
  trigger rejecting non-service-role `tier` changes). Could not verify the live policy directly (MCP
  `execute_sql` is permission-restricted this session). Raised for sign-off; not fixable in this repo.

## Risks & unknowns

- **Popup-detect for checkout.** De-risk: identical to the proven 003 OAuth orchestrator; the webhook
  writes `profiles.tier` before the popup's `vidcica://` return, so a `profiles.tier` poll is reliable.
  Poll fallback if `profiles` realtime isn't published (it isn't needed — poll the tier directly).
- **`credits_accounts` realtime publication** — verify in step 0; if unpublished, AC-7 uses
  `router.refresh()` after checkout instead. (credits_accounts has no sensitive columns → safe to
  stream, unlike the 003 networks token-leak.)
- **Real Stripe checkout needs test-mode keys + a Stripe test card** — the authenticated e2e is gated
  on the same seeded test user (accepted residual risk; unit + RTL + screenshots otherwise).
- **`profiles.tier` values** must match the tier ids (`free`/`starter`/`pro`/`studio`) the webhook writes.

## Overlap check

Active specs: 002 (videos), 003 (networks/publish). This spec adds a new `billing` slice + `/billing`
route + new `lib/vidcica/{tiers,billing,billing-queries,use-credits-realtime}` files, and expands
`database.types.ts` with `profiles`. No file overlap with 002/003. The 003 publish blocked-state
already links to `/billing` (created here) — additive, no conflict.
