# Tasks 002 — P0 video workspace

Ordered, executable, checkboxed. Work top-to-bottom; tick on commit. `[P]` = parallel-safe.
Gates after every task: `pnpm lint && pnpm typecheck && pnpm test`; `pnpm verify` at phase ends.

## Phase 0 — setup & shared data-layer

- [x] T0 Branch `feat/002-video-workspace-p0`; copy interim `src/lib/supabase/database.types.ts` from ClipFlow (TODO regen) · done: `tsc` sees `Database['public']['Tables']['videos']`
- [x] T1 Shared `src/lib/vidcica/video.ts`: `Video`, `VideoStatus`, `GenerationJobStatus`, `rowToVideo` (subset) · done: unit `video.test.ts` maps a fixture row
- [x] T2 Shared `src/lib/vidcica/generation.ts`: `generatePlan`/`enqueueGeneration`/`fetchGenerationJob`/`fetchVideoMedia` via `functions.invoke` (shapes mirror ClipFlow) · done: typechecks; reason-code mapping unit-tested
- [x] T3 Shared `src/lib/vidcica/queries.ts`: `listMyVideos`/`getMyVideo`/`getLatestJob` (server client, RLS) · done: `queries.test.ts` asserts table+order+columns
- [x] T4 UI primitives via shadcn: `badge`, `label`, `textarea`, `select`, `tabs`, `progress` · done: components exist, tokens-driven, build green

## Phase 1a — auth: phone OTP (AC-2, AC-4)

- [x] T5 `features/auth`: add OTP request+verify (Supabase `signInWithOtp`/`verifyOtp`) alongside email/password; tabbed UI · done: `otp.test.ts` state machine green
- [x] T6 `/sign-in` shows both methods; guard redirect `?next=` honored · done: e2e guard step green (AC-3)

## Phase 1b — dashboard: live list (AC-5, AC-6, AC-7, AC-15)

- [x] T7 `features/videos`: `VideoList` client component (badges per `VideoStatus`) + empty/loading/error states · done: renders from seeded props
- [x] T8 `use-videos-realtime` hook merges `videos:{userId}` `postgres_changes` · done: `use-videos-realtime.test.ts` flips a badge on synthetic payload (AC-7)
- [x] T9 `/dashboard/page.tsx` RSC: `listMyVideos()` seeds `VideoList` · done: page serves seeded rows server-side (AC-5)

## Phase 1c — create: composer → plan → enqueue (AC-8..AC-11, AC-15)

- [x] T10 `features/create` store + provider: input(idea|script) + full composer options + phases (idle/planning/review/enqueuing/blocked/error) · done: `store.test.ts` covers plan ok/err + enqueue ok + each blocked reason
- [x] T11 [P] Composer + PlanReview UI (all states; blocked → specific message + billing link) · done: states render in route
- [x] T12 `/create/page.tsx` RSC seeds provider; server action wraps `generatePlan`/`enqueueGeneration` with session · done: page serves; invalid input → typed error

## Phase 1d — render progress + detail + download (AC-12, AC-13, AC-14, AC-15)

- [x] T13 `RenderProgress` client: stage map (queued→footage→voiceover→assembling→ready) via realtime/poll; failed→refund message · done: `progress.test.ts` green
- [x] T14 `VideoDetail`: player + "download MP4" anchor (finished URL, `download` attr) · done: ready state renders player+download (AC-14)
- [x] T15 `/videos/[id]/page.tsx` RSC: `getMyVideo`+`getLatestJob` → detail or progress · done: page serves both states

## Phase 2 — verification

- [x] T16 `e2e/create-video.spec.ts`: sign-in → dashboard → create → (mocked) render → download, with `shot()` per state · done: `FEATURE=002-video-workspace-p0 pnpm e2e:shots` green
- [x] T17 Run `/verify-ui 002` — inspect screenshots vs ACs; fix what you see
- [x] T18 `pnpm verify` green; conventional history

## Phase 3 — review & ship

- [x] T19 Run `/review`; fix P0/P1 findings
- [ ] T20 `/feature-report` → `docs/reports/002-video-workspace-p0.md`
- [ ] T21 Open PR (spec + report linked); after merge `/update-docs` (CUJ-03, feature doc, specs status)

## AC coverage (post-review; see plan.md "Verification status")

- [x] AC-1 (unit surface; full e2e gated on test user) · [x] AC-2 (OTP reducer) · [x] AC-3 (e2e) · [x] AC-4 (OTP reducer)
- [x] AC-5 (queries.test) · [x] AC-6 (video-list.test) · [x] AC-7 (merge reducer) · [x] AC-8 (store.test)
- [x] AC-9 (store.test) · [x] AC-10 (store.test) · [x] AC-11 (store.test) · [x] AC-12 (progress.test)
- [x] AC-13 (progress.test) · [x] AC-14 (video-detail.test) · [x] AC-15 (screenshots + verify-ui)
