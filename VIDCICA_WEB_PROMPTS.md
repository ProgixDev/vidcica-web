# Vidcica Web — Copy-Paste Prompt Pack

Run Claude Code in `NEXTJS-SKELETON/` with `ClipFlow/` reachable. Copy each block below into Claude
Code **one at a time, in order.** After each one, make it run `pnpm verify` (and show screenshots
for UI) before you paste the next. If it drifts, use a guard block at the bottom.

---

## 1 — Ground (no code yet)

```
Read VIDCICA_WEB_BUILD_BRIEF.md end to end, then AGENTS.md, then these files in the ClipFlow/ repo: supabase/functions/README.md, src/theme/tokens.ts, src/theme/palette.ts, src/lib/ai-generation.ts, src/lib/publishing.ts, src/lib/stripe-checkout.ts, and src/store/index.ts. Then summarise back to me in your own words: (1) the "one backend, two front-ends" rule and what it forbids, (2) which parts of the skeleton's supabase/ folder we ignore and why, (3) the P0 critical user journey. Do NOT write any code or run any skill yet — confirm you understood first.
```

## 2 — Project setup + backend wiring

```
Run /setup-project vidcica-web. Set the app name to "Vidcica", French default locale (fr_FR), and update src/core/site.ts + NEXT_PUBLIC_SITE_URL. Then wire the backend per Section 1–2 of VIDCICA_WEB_BUILD_BRIEF.md: create .env.local mapping EXPO_PUBLIC_SUPABASE_URL/ANON_KEY to NEXT_PUBLIC_SUPABASE_URL/ANON_KEY (I will paste the real values when you ask), and generate DB types with: supabase gen types typescript --project-id scoozakhhmowpzwotxgp > src/lib/supabase/database.types.ts. Do NOT create or run any migration in this repo. Then prove it works: add one throwaway Server Component that reads a single RLS-scoped row from the real DB, run pnpm dev, show me it renders, then delete the throwaway.
```

## 3 — Design system (the "Claude Design" step)

```
Run /design-prompt. Source the brand ONLY from ClipFlow/src/theme/ (tokens.ts, palette.ts, theme.ts, typography.ts) plus Section 3 of VIDCICA_WEB_BUILD_BRIEF.md — not from ClipFlow/CLAUDE.md, which is stale. Rebrand src/app/globals.css: translate the warm palette (#FF8A3D, #FFB070, #FFD9B0; deep neutral #0E0B08 dark / #FFF8F1 light) into the oklch role tokens for BOTH light and dark, keeping the shadcn role names. Radii: sm 10 / md 16 / lg 28, full only for circular elements. Load Outfit via next/font as the brand face. Then self-critique against docs/design/quality-bar.md and fix anything that reads as the default shadcn/purple template. Show me the token file and a screenshot of the restyled sign-in page.
```

## 4 — P0 journey: write the spec

```
Feature-track the P0 journey using the skeleton skills — do NOT hand-roll. Run /create-spec for: sign in → dashboard (list my videos with live status) → create a video (script → generate-plan → enqueue-generation) → watch it render via realtime status → download the finished MP4. Ground it in Section 5 of VIDCICA_WEB_BUILD_BRIEF.md and reuse the mobile call sites (ClipFlow/src/lib/ai-generation.ts, src/store/videos.store.ts, src/lib/db-mappers.ts) for the exact request/response shapes and realtime channels. Reads are Server Components (RLS-scoped); the generate action calls the existing edge function via functions.invoke — no new backend. Every screen needs empty/loading/error/success states. Stop after the spec and show it to me before planning.
```

## 5 — P0 journey: build it

```
Proceed: /plan-feature, then /implement-feature, in small commits, keeping pnpm verify green at every step. When built, run /verify-ui to capture Playwright screenshots of each state, then /review. Show me the screenshots and the pnpm verify output. Do not claim done without both.
```

## 6 — P1: connect networks + publish

```
Next feature, full loop (/create-spec → /plan-feature → /implement-feature → /verify-ui → /review): connect social networks + publish (networks + publish slices). Reuse ClipFlow/src/lib/oauth.ts, src/lib/publishing.ts, src/store/networks.store.ts, publish.store.ts. It calls the existing oauth-start / oauth-callback and enqueue-publish functions — no new backend. Show me pnpm verify output and screenshots before you call it done.
```

## 7 — P1: billing (credits + subscription)

```
Next feature, full loop: billing (billing slice). Use Stripe on web — create-checkout-session and create-portal-session already exist. Run /add-feature payments-stripe to get the pack's UI shell, then adapt it to those functions. Reuse ClipFlow/src/lib/stripe-checkout.ts, src/lib/credits.ts, src/lib/tiers.ts, src/store/billing.store.ts. Show me pnpm verify output and screenshots before done.
```

## 8 — P1: notifications

```
Next feature, full loop: notifications (notifications slice) over the notifications table + realtime, mirroring ClipFlow/src/store/notifications.store.ts. Show me pnpm verify output and screenshots before done.
```

## 9 — P2: support chat (only after P0/P1 solid)

```
Next feature, full loop: support (support slice) calling the existing support-chat function, mirroring ClipFlow/src/store/support.store.ts and src/lib/support-chat.ts. Show me pnpm verify output and screenshots before done.
```

## 10 — P2: ads (Meta campaigns — most complex, expect questions)

```
Next feature, full loop: ads (ads + leads slices) using ClipFlow/src/lib/ads-launch.ts, src/store/ads.store.ts, leads.store.ts, calling the existing create-ad-campaign, set-campaign-status, and sync-ad-insights functions — no new backend. This one is complex; write the spec carefully and ask me anything ambiguous before planning. Show me pnpm verify output and screenshots before done.
```

## 11 — Ship gate

```
We've built the P0 + P1 (+ any P2) features. Run pnpm verify, pnpm e2e, and pnpm web:check. Fix any failures without weakening a gate. Then generate a /feature-report for the P0 journey and give me a punch list of anything not production-ready (SEO, a11y, error pages, perf) from docs/web/checklist.md.
```

---

## Guard blocks (paste if it drifts)

If it starts writing migrations or DB schema:

```
Stop. Per rule 0 of VIDCICA_WEB_BUILD_BRIEF.md, this repo does not own the database — we reuse the live Supabase project and never run the skeleton's migrations. Revert that and integrate against the existing schema and edge functions instead.
```

If it re-implements backend logic:

```
Don't re-implement this — the edge function already exists. Call it with functions.invoke and mirror the request body from the matching file in ClipFlow/src/lib/.
```

If the UI looks like a generic template:

```
This is reading as the default shadcn/purple template. Re-check against docs/design/quality-bar.md and the Vidcica tokens from ClipFlow/src/theme/ — warm palette, Outfit font, our radii, designed dark mode. Rework it.
```

If it claims done without proof:

```
Not done until I see it: run pnpm verify and show the output, and /verify-ui screenshots of every state (empty/loading/error/success). Paste both.
```

If it tries to do too much at once:

```
One feature at a time. Finish the current spec's verify + review before starting the next slice.
```
