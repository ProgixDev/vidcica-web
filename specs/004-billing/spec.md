# Spec 004 — Billing: subscriptions & credits (Stripe on web)

- **Status:** active
- **Type:** feature
- **Requested by / owner:** Houssem Ferrani (product)
- **Date:** 2026-07-13
- **Slice / areas touched:** `src/features/billing`; route `/billing`. Reuses the **existing** backend (no new backend): edge functions `create-checkout-session`, `create-portal-session`; the `stripe-webhook` writes entitlement server-side. Reads `profiles.tier` + `credits_accounts.balance` (RLS read-own); realtime `credits_accounts:{userId}`.

## Problem (the why)

Free users hit credit/quality limits and have no way to upgrade on the web; paying users can't manage their subscription. Mobile bills through Stripe already (the `create-checkout-session` / `create-portal-session` / `stripe-webhook` functions exist and are live), and Stripe is the correct **web** payment channel. The web just needs the front-end: show the plan, let a user subscribe, and manage it — reusing the same backend that already grants entitlement.

## Desired behavior (the what)

1. **See my plan & credits.** On a billing screen the user sees their current plan (Gratuit / Starter / Pro / Studio), this month's credit balance, and the four tiers compared (price, monthly credits, key features), with the current plan marked.
2. **Subscribe / upgrade.** The user picks a paid tier and is taken to Stripe Checkout (test mode in dev). After paying, their plan reflects the new tier **without a manual refresh** — entitlement is written server-side by the Stripe webhook, and the app detects the change.
3. **Cancelled checkout.** If the user closes checkout without paying, nothing changes and they see no error.
4. **Stripe not configured.** If billing isn't configured yet (no Stripe key), the action fails gracefully with a clear message rather than an error screen.
5. **Manage subscription.** An active subscriber can open the Stripe Billing Portal to change plan, update payment, or cancel.
6. **Live credits.** The credit balance updates live as it's spent/granted.

## Acceptance criteria

- **AC-1 (current entitlement, RSC):** Given a signed-in user, when they open `/billing`, then their current plan (`profiles.tier`) and credit balance (`credits_accounts.balance`) render server-side (RLS-scoped, no blank flash).
- **AC-2 (compare tiers):** The four tiers render with price (€0/25/45/99), monthly credits (20/150/300/600), and key features from the canonical tier matrix; the user's current plan is visually marked and offers no self-checkout.
- **AC-3 (subscribe → detect):** Given a paid tier, when the user subscribes and completes Stripe Checkout, then the plan updates to the new tier within a few seconds without a manual refresh (detected by polling `profiles.tier`, since the webhook writes it server-side before the popup returns).
- **AC-4 (cancelled — non-happy):** Given the user closes the checkout popup without paying, when they return, then the plan is unchanged and no error is shown.
- **AC-5 (not configured — non-happy):** Given `create-checkout-session` returns 503 (Stripe unset), when the user subscribes, then a clear "billing indisponible" message is shown, not an error page.
- **AC-6 (manage portal):** Given an active subscriber (tier ≠ free), when they choose "manage", then the Stripe Billing Portal opens (or a graceful message if no customer exists yet).
- **AC-7 (live credits):** Given the billing screen is open and the balance changes on the backend, then the displayed balance updates live (via the `credits_accounts` realtime channel).
- **AC-8 (states everywhere):** `/billing` renders loading (skeleton), error (inline + recovery), and success states; the checkout action shows pending + outcome feedback.

## Out of scope

- **New backend / migrations / edge-function edits.** In particular, making `create-checkout-session` accept a web return URL (instead of the `vidcica://` default) is a **follow-up needing human sign-off** — this slice uses popup + detect with zero backend change.
- **One-time credit-pack top-ups** (`{packCredits}`) — the backend supports them; deferred to a follow-up (this slice is subscriptions only).
- **Downgrade scheduling / proration UI** — the Stripe portal handles plan changes; the app doesn't reimplement the mobile's scheduled-downgrade logic.
- **Invoices / receipts / billing history UI.**
- **The pack's Stripe SDK server action, webhook route handler, and `subscriptions` migration** — Vidcica's backend already owns checkout + the webhook + entitlement (`profiles.tier`); we take only the pack's paywall UI shell and wire it to the existing functions.

## CUJ impact

- Registers new **CUJ-05 — Subscribe to a plan**: sign in → `/billing` → pick a tier → Stripe Checkout → plan reflects the upgrade. (Update `docs/product/critical-user-journeys.md` at ship; `e2e/billing.spec.ts`, `billing-*` shots.)

## Open questions

Resolved before `/plan-feature`.

- [x] **Checkout completion:** popup + detect via `profiles.tier` (no backend change). Cleaner web return URL is a signed-off follow-up.
- [x] **Scope:** subscriptions only (credit packs deferred).
- [ ] **Credits realtime publication:** confirm `credits_accounts` is in the realtime publication; if not, AC-7 falls back to `router.refresh()` after checkout (plan verifies).
