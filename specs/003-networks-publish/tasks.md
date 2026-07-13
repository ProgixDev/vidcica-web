# Tasks 003 — Connect social networks & publish

Ordered, checkboxed. Gates after each task: `pnpm lint && pnpm typecheck && pnpm test`;
`pnpm verify` at phase ends. `[P]` = parallel-safe.

## Phase 0 — data-layer

- [ ] T0 Branch `feat/003-networks-publish`; expand `database.types.ts` with `networks` + `publish_jobs` (regen via Supabase MCP) · done: `tsc` sees both tables
- [ ] T1 `lib/vidcica/network.ts`: `Network` type, `rowToNetwork`, `PLATFORMS`, `platformToProvider`, status helpers · done: `network.test.ts` green
- [ ] T2 `lib/vidcica/publishing.ts`: `enqueuePublish`, `mapPublishFailureReason`, `PlatformId`, `PublishFailureReason` (port) · done: `publishing.test.ts` green
- [ ] T3 `lib/vidcica/oauth.ts`: `startNetworkOAuth` (oauth-start invoke → popup → detect via networks read) with an injectable clock/opener for tests · done: `oauth.test.ts` (cancel / not_configured / detect)
- [ ] T4 `lib/vidcica/networks-queries.ts` (`listMyNetworks`) + realtime merge helpers (`use-networks-realtime`, `use-publish-jobs-realtime`) · done: merge unit tests green

## Phase 1 — networks slice (AC-1..AC-5, AC-12)

- [ ] T5 `features/networks`: `NetworkList` client (per-platform card: connected/needs-reconnect/unavailable; connect/reconnect/disconnect/toggle) + empty/loading/error · done: RTL states green
- [ ] T6 disconnect/toggle server action (zod rowId+platform, RLS update) · done: invalid input → typed error
- [ ] T7 `/networks/page.tsx` RSC seeds `NetworkList` with `listMyNetworks()` · done: page serves states

## Phase 2 — publish slice (AC-6..AC-11, AC-12)

- [ ] T8 `features/publish` store + provider: selected platforms, per-platform caption/hashtags, mode now|schedule, scheduledAt, youtubeAsShort, phases; deps-injected · done: `store.test.ts` (gating, now, schedule, skipped, error)
- [ ] T9 [P] `PublishFlow` UI (network picker limited to connected+enabled; captions; now/schedule; Short toggle; confirm) + per-platform status + all states · done: states render
- [ ] T10 publish server action wrapping `enqueuePublish` with the session · done: page serves; invalid → typed error
- [ ] T11 `/videos/[id]/publish/page.tsx` RSC (video must be `pret`; seeds connected networks) + a "Publier" entry from `VideoDetail` · done: route serves; non-ready → redirect/notice

## Phase 3 — verification

- [ ] T12 `e2e/networks-publish.spec.ts`: guard + `/networks` render + publish surface, `shot()` per state; authenticated flow gated on test user · done: `FEATURE=003-networks-publish pnpm e2e:shots` green
- [ ] T13 `/verify-ui 003` — screenshots vs ACs; fix
- [ ] T14 `pnpm verify` green

## Phase 4 — review & ship

- [ ] T15 `/review`; fix P0/P1
- [ ] T16 `/feature-report`; PR; `/update-docs` (CUJ-04)

## AC coverage (keep in sync)

- [ ] AC-1→T1,T5,T7 · [ ] AC-2→T3 · [ ] AC-3→T3 · [ ] AC-4→T3 · [ ] AC-5→T5,T6
- [ ] AC-6→T8 · [ ] AC-7→T8 · [ ] AC-8→T8 · [ ] AC-9→T4 · [ ] AC-10→T2,T8 · [ ] AC-11→T8 · [ ] AC-12→T5,T9,T12,T13
