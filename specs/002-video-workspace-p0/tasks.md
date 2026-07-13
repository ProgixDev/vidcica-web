# Tasks 002 — P0 video workspace

Ordered, executable, checkboxed. Work top-to-bottom; tick on commit. `[P]` = parallel-safe.
Gates after every task: `pnpm lint && pnpm typecheck && pnpm test`; `pnpm verify` at phase ends.

## Phase 0 — setup & shared data-layer

- [ ] T0 Branch `feat/002-video-workspace-p0`; copy interim `src/lib/supabase/database.types.ts` from ClipFlow (TODO regen) · done: `tsc` sees `Database['public']['Tables']['videos']`
- [ ] T1 Shared `src/lib/vidcica/video.ts`: `Video`, `VideoStatus`, `GenerationJobStatus`, `rowToVideo` (subset) · done: unit `video.test.ts` maps a fixture row
- [ ] T2 Shared `src/lib/vidcica/generation.ts`: `generatePlan`/`enqueueGeneration`/`fetchGenerationJob`/`fetchVideoMedia` via `functions.invoke` (shapes mirror ClipFlow) · done: typechecks; reason-code mapping unit-tested
- [ ] T3 Shared `src/lib/vidcica/queries.ts`: `listMyVideos`/`getMyVideo`/`getLatestJob` (server client, RLS) · done: `queries.test.ts` asserts table+order+columns
- [ ] T4 UI primitives via shadcn: `badge`, `label`, `textarea`, `select`, `tabs`, `progress` · done: components exist, tokens-driven, build green

## Phase 1a — auth: phone OTP (AC-2, AC-4)

- [ ] T5 `features/auth`: add OTP request+verify (Supabase `signInWithOtp`/`verifyOtp`) alongside email/password; tabbed UI · done: `otp.test.ts` state machine green
- [ ] T6 `/sign-in` shows both methods; guard redirect `?next=` honored · done: e2e guard step green (AC-3)

## Phase 1b — dashboard: live list (AC-5, AC-6, AC-7, AC-15)

- [ ] T7 `features/videos`: `VideoList` client component (badges per `VideoStatus`) + empty/loading/error states · done: renders from seeded props
- [ ] T8 `use-videos-realtime` hook merges `videos:{userId}` `postgres_changes` · done: `use-videos-realtime.test.ts` flips a badge on synthetic payload (AC-7)
- [ ] T9 `/dashboard/page.tsx` RSC: `listMyVideos()` seeds `VideoList` · done: page serves seeded rows server-side (AC-5)

## Phase 1c — create: composer → plan → enqueue (AC-8..AC-11, AC-15)

- [ ] T10 `features/create` store + provider: input(idea|script) + full composer options + phases (idle/planning/review/enqueuing/blocked/error) · done: `store.test.ts` covers plan ok/err + enqueue ok + each blocked reason
- [ ] T11 [P] Composer + PlanReview UI (all states; blocked → specific message + billing link) · done: states render in route
- [ ] T12 `/create/page.tsx` RSC seeds provider; server action wraps `generatePlan`/`enqueueGeneration` with session · done: page serves; invalid input → typed error

## Phase 1d — render progress + detail + download (AC-12, AC-13, AC-14, AC-15)

- [ ] T13 `RenderProgress` client: stage map (queued→footage→voiceover→assembling→ready) via realtime/poll; failed→refund message · done: `progress.test.ts` green
- [ ] T14 `VideoDetail`: player + "download MP4" anchor (finished URL, `download` attr) · done: ready state renders player+download (AC-14)
- [ ] T15 `/videos/[id]/page.tsx` RSC: `getMyVideo`+`getLatestJob` → detail or progress · done: page serves both states

## Phase 2 — verification

- [ ] T16 `e2e/create-video.spec.ts`: sign-in → dashboard → create → (mocked) render → download, with `shot()` per state · done: `FEATURE=002-video-workspace-p0 pnpm e2e:shots` green
- [ ] T17 Run `/verify-ui 002` — inspect screenshots vs ACs; fix what you see
- [ ] T18 `pnpm verify` green; conventional history

## Phase 3 — review & ship

- [ ] T19 Run `/review`; fix P0/P1 findings
- [ ] T20 `/feature-report` → `docs/reports/002-video-workspace-p0.md`
- [ ] T21 Open PR (spec + report linked); after merge `/update-docs` (CUJ-03, feature doc, specs status)

## AC coverage (keep in sync)

- [ ] AC-1→T6,T16 · [ ] AC-2→T5,T16 · [ ] AC-3→T6,T16 · [ ] AC-4→T5,T16
- [ ] AC-5→T3,T9,T16 · [ ] AC-6→T7,T16 · [ ] AC-7→T8 · [ ] AC-8→T10,T16
- [ ] AC-9→T10 · [ ] AC-10→T10,T16 · [ ] AC-11→T10,T11 · [ ] AC-12→T13,T16
- [ ] AC-13→T13 · [ ] AC-14→T14,T16 · [ ] AC-15→T7,T11,T13,T16,T17
