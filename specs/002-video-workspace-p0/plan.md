# Plan 002 — P0 video workspace

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes — see _Resolved decisions_)
- **Author:** Claude (agent) · **Date:** 2026-07-13

## Approach

Three thin feature slices (`auth`, `videos`, `create`) over a small **shared data-layer** in `src/lib/vidcica/`. The key trade-off: module boundaries forbid features importing each other, but all three need the `Video` domain type, the row→domain mapper, the generation client, and the realtime hook — so those live in shared `lib` (a data-access layer), not in any one feature. Reads are **RLS-scoped Server Components** (dashboard/detail fetch on the server for first paint); writes/pipeline actions **invoke the existing edge functions** (`generate-plan`, `enqueue-generation`) with the user session — **no new backend, no migrations**. Live status uses the real `videos:{userId}` realtime channel (mirrors `ClipFlow/src/store/videos.store.ts`). No ADR needed: Supabase is ADR-0007; we add no dependency (Supabase realtime + `functions.invoke` ship with `@supabase/supabase-js`).

**Interim types:** `database.types.ts` couldn't be generated (Supabase MCP unauthorized this session). We copy `ClipFlow/src/types/database.types.ts` (generated from the same project `scoozakhhmowpzwotxgp`) to `src/lib/supabase/database.types.ts` as the working types, marked TODO to regenerate from the live DB once MCP/CLI auth exists. This unblocks typed clients without any `any`.

## Placement (per `docs/architecture/module-boundaries.md`)

| What                             | Where                                                      | Notes                                                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB types (interim)               | `src/lib/supabase/database.types.ts`                       | copied from ClipFlow; regenerate later                                                                                                                   |
| Video domain type + mapper       | `src/lib/vidcica/video.ts`                                 | `Video`, `VideoStatus`, `GenerationJobStatus`, `rowToVideo` (subset of ClipFlow)                                                                         |
| Generation client                | `src/lib/vidcica/generation.ts`                            | `generatePlan`, `enqueueGeneration`, `fetchGenerationJob`, `fetchVideoMedia` via `functions.invoke` — mirrors `ClipFlow/src/lib/ai-generation.ts` shapes |
| Server reads                     | `src/lib/vidcica/queries.ts`                               | `listMyVideos()`, `getMyVideo(id)`, `getLatestJob(videoId)` — RLS-scoped, server client                                                                  |
| Realtime hook                    | `src/lib/vidcica/use-videos-realtime.ts`                   | client hook subscribing to `videos:{userId}`; merges row updates into initial list                                                                       |
| Auth (extend)                    | `src/features/auth/`                                       | add phone-OTP alongside existing email/password                                                                                                          |
| Dashboard + detail + progress    | `src/features/videos/`                                     | client list w/ live badges; detail = player + download; render-progress staged UI                                                                        |
| Composer + plan review + enqueue | `src/features/create/`                                     | full-parity form, plan review, enqueue + blocked states                                                                                                  |
| Routes                           | `src/app/dashboard`, `/create`, `/videos/[id]`, `/sign-in` | thin RSC; seed feature components with server data                                                                                                       |
| Shared UI additions              | `src/components/ui/`                                       | `badge`, `tabs`, `spinner/progress`, `select`, `label`, `textarea` (added via shadcn; second consumer = design-system intent)                            |

## Data & state

- **Server data:** `listMyVideos()` (dashboard RSC), `getMyVideo(id)` + `getLatestJob(videoId)` (detail RSC) via `createClient()` server, RLS `user_id = auth.uid()`. Serializable `Video[]` passed to client components.
- **Client state:** per-feature Zustand via context (create wizard: input + options + plan + phase). Dashboard list holds server-seeded `Video[]` and merges realtime `postgres_changes` updates. No module-level singletons.
- **Actions:** `create` uses server actions that zod-validate composer input, then call `generatePlan`/`enqueueGeneration` with the session (authz = the Supabase session; RLS on the tables). Sign-out already exists.

## Acceptance criteria → verification mapping

| AC                             | Proven by                                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-1 sign-in password          | e2e `e2e/create-video.spec.ts` step "sign in (password)" → lands `/dashboard` (uses a seeded test user)                                                                  |
| AC-2 sign-in OTP               | unit `features/auth/otp.test.ts` (form state machine: request→enter→submit); e2e OTP happy path gated on a Supabase test number (manual until configured — see Resolved) |
| AC-3 auth guard                | e2e: visit `/create` signed-out → redirected to `/sign-in?next=/create` → after sign-in lands `/create`                                                                  |
| AC-4 bad creds/OTP             | unit `features/auth/*.test.ts` (error surfaced, no session); e2e wrong-password shows inline error                                                                       |
| AC-5 dashboard reads own (RSC) | unit `lib/vidcica/queries.test.ts` (query shape: table `videos`, ordered `created_at desc`); e2e dashboard renders seeded rows server-side (no blank flash)              |
| AC-6 empty state               | e2e (user with 0 videos) → `EmptyState` + create CTA; screenshot `dashboard-empty`                                                                                       |
| AC-7 live status               | unit `use-videos-realtime.test.ts` (a simulated `postgres_changes` UPDATE flips a badge); documented manual live check                                                   |
| AC-8 plan happy                | unit `create/store.test.ts` (plan success → review state populated); e2e mocks `generate-plan` → review shows title/hashtags/segments                                    |
| AC-9 plan error                | unit `create/store.test.ts` (`not_configured`/`error` → error state, no enqueue)                                                                                         |
| AC-10 enqueue success          | unit `create/store.test.ts` (ok → jobId + charged shown, navigates); e2e mocked                                                                                          |
| AC-11 enqueue blocked          | unit `create/store.test.ts` per reason (`insufficient_credits`→billing link; `daily_cap`/`model_not_allowed`/`not_live`→message, no placeholder)                         |
| AC-12 render progress          | unit `videos/progress.test.ts` (stage map queued→…→ready); e2e mocked job advance; screenshots per stage                                                                 |
| AC-13 render failure           | unit `videos/progress.test.ts` (failed → refund message)                                                                                                                 |
| AC-14 download                 | e2e: ready video detail → player present + download anchor has finished URL + `download` attr                                                                            |
| AC-15 states everywhere        | `pnpm e2e:shots` captures empty/loading/error/success for each screen; `/verify-ui` inspects                                                                             |

## Verification status (post-review, 2026-07-13)

The AC→verification table above was written before implementation and **overstates the e2e
coverage** — the actual `e2e/create-video.spec.ts` covers the guard (AC-3) and the sign-in surface;
the full authenticated journey is written but **skips until a seeded test user** (`E2E_TEST_EMAIL`
/`PASSWORD`) exists. Corrected mapping of what actually proves each AC:

- **Running tests:** AC-3 (e2e guard), AC-5/8/9/10/11/12/13 (unit reducers/queries), AC-2/4 (OTP
  reducer), AC-7 (merge reducer), AC-6 (RTL `video-list.test.tsx`), AC-14 (RTL `video-detail.test.tsx`),
  plan-boundary guard (`schema.test.ts`), open-redirect (`redirect.test.ts`).
- **Screenshots only:** every screen's states (`artifacts/screenshots/002-video-workspace-p0/`).
- **Accepted residual risk (needs a seeded test user):** the end-to-end authenticated CUJ
  (sign-in success → enqueue nav → live render advance → download) and the real OTP SMS round-trip.
  The e2e is in place and un-skips automatically once the creds are set in CI.

## Risks & unknowns

- **Interim DB types drift** from the live schema. De-risk: copy from the same project; a `queries.test.ts` asserts the columns we read exist in the type; regenerate before ship.
- **Realtime is hard to e2e deterministically.** De-risk: unit-test the merge reducer with a synthetic payload; e2e asserts initial render; live behavior verified manually and noted.
- **OTP needs real SMS.** De-risk: unit-test the form; e2e OTP behind a configured Supabase test number (open item, tracked).
- **Full composer parity is large.** De-risk: build the form against the real `enqueue-generation` fields; gate advanced options behind the server clamp (server rejects out-of-tier → AC-11). Options list ported from `ClipFlow/src/lib/generation-models.ts` values.
- **`generation_live` state.** If off, enqueue returns `not_live` → the block-with-recovery path (AC-11) is the correct UX; no mock render.

## Overlap check

Active specs touching the same areas: none. Only `001-task-list` (shipped) exists; no active spec overlaps `auth`/`videos`/`create` or the new routes.

## Resolved decisions (were spec _Open questions_)

1. **MP4 delivery:** download links the finished media URL from the row (`fetchVideoMedia().videoUrl`) directly via an anchor with `download`. If the URL is cross-origin (J2V CDN) and the browser opens instead of downloads, fall back to a server route that streams it. Rehost-to-Supabase remains a later backend follow-up (not this repo).
2. **OTP e2e:** email/password is the e2e-verified auth path for CUJ-03; OTP is unit-tested for its state machine and screenshotted, with full round-trip verified manually / via a Supabase test number when configured. Recorded as a known test limitation, not a blocker.
3. **Composer tier gating:** advanced model options are offered; the server (`enqueue-generation`) is the source of truth and returns `model_not_allowed` for out-of-tier picks — AC-11 exercises this with a known Pro-only model on a Free account.
