# Spec 002 — P0 video workspace: sign in → create → watch it render → download

- **Status:** active
- **Type:** feature
- **Requested by / owner:** Houssem Ferrani (product)
- **Date:** 2026-07-13
- **Slice / areas touched:** `src/features/auth`, `src/features/videos` (dashboard, list, detail), `src/features/create`; routes `/sign-in`, `/dashboard`, `/create`, `/videos/[id]`. Reuses the **existing** Supabase backend (no new backend): edge functions `generate-plan`, `enqueue-generation`; tables `videos`, `generation_jobs` (RLS read-own); realtime channel `videos:{userId}`.

## Problem (the why)

Vidcica ships as a mobile app over a live Supabase backend, but there is no desktop workspace. Creators who work at a computer can't sign in, see their videos, or make a new one on a big screen. The single most valuable thing the web can do first is the core loop the whole product exists for: **turn a script into a finished vertical video and get the file** — reusing the backend that already renders for mobile, so this is integration, not new capability. Everything else (publishing, ads, billing UI) layers on after this loop works end to end.

## Desired behavior (the what)

A returning Vidcica user opens the web app, signs in with the same account they use on mobile, sees their videos with up-to-the-second status, creates a new video from a script, watches it render stage by stage without refreshing, and downloads the finished MP4.

1. **Sign in.** The user signs in with **either** email + password **or** a phone number + one-time SMS code (the same accounts as mobile). A signed-in user landing on `/sign-in` goes straight to the dashboard; a signed-out user visiting a protected page is sent to sign-in and returned to where they were headed after success.
2. **Dashboard — my videos, live.** After sign-in the user sees a list of **their own** videos (newest first), each showing title, thumbnail, and a status badge (draft / generating / ready / …). When a video's status changes on the backend (e.g. a render finishes), the badge updates **live**, without a manual refresh. A first-time user with no videos sees an explanation and a single "create" call to action instead of a blank screen.
3. **Create — script to plan.** The user opens create, provides either a finished **script** or an **idea**, and sets the full set of composer options available on mobile (model, quality, aspect ratio, voice, voiceover on/off, captions on/off, background music, optional opening image). They request an AI **plan**; the app shows the generated title, description, hashtags, and the scene breakdown for review. The user can edit and regenerate, or accept.
4. **Enqueue a render.** On accept, the app starts a real render and shows the credit cost that was charged. If the render **cannot** be started — no credits, daily cap reached, the chosen model isn't allowed on the user's plan, or generation is temporarily unavailable — the user sees an honest, specific message with the right recovery (out-of-credits links to billing; unavailable explains and lets them retry later). No fake or placeholder render is ever shown.
5. **Watch it render.** The user watches the render progress through its stages (queued → footage → voiceover → assembling → ready) with live updates, not a bare spinner. If the render fails, the user is told plainly and sees that their credits were returned.
6. **Download.** Once ready, the video plays and the user can **download the finished MP4**.

## Acceptance criteria

- **AC-1 (sign in, password):** Given a user with an email/password identity, when they submit valid credentials on `/sign-in`, then a session is established and they land on `/dashboard`.
- **AC-2 (sign in, OTP):** Given a user with a phone identity, when they request a code, enter the valid SMS code, then a session is established and they land on `/dashboard`.
- **AC-3 (auth guard):** Given a signed-out visitor, when they open a protected route (`/dashboard`, `/create`, `/videos/[id]`), then they are redirected to `/sign-in` and, after a successful sign-in, returned to the originally requested route.
- **AC-4 (bad credentials — non-happy):** Given wrong password or an invalid/expired OTP, when submitted, then an inline, plain-language error appears and no session is created.
- **AC-5 (dashboard reads own only):** Given a signed-in user, when the dashboard loads, then it shows only rows where `user_id = auth.uid()` (RLS-scoped), rendered server-side on first paint (no blank flash), newest first.
- **AC-6 (empty state — non-happy):** Given a user with zero videos, when the dashboard loads, then they see an illustration/explanation + one "create a video" CTA, not an empty list.
- **AC-7 (live status):** Given the dashboard is open and one of the user's videos changes status on the backend, when that change is written, then the video's badge updates within a few seconds with no manual refresh (via the `videos:{userId}` realtime channel).
- **AC-8 (plan happy path):** Given a script/idea and composer options, when the user requests a plan, then a loading state shows and, on success, the returned title, description, hashtags, and scene segments are displayed for review.
- **AC-9 (plan error — non-happy):** Given the plan service returns not-configured or an error, when the user requests a plan, then a clear error with a retry appears and no video is enqueued.
- **AC-10 (enqueue success):** Given an accepted plan and sufficient credits, when the user confirms, then a real render is enqueued (via `enqueue-generation`, invoked with the user session), the charged credit amount is shown, and the user is taken to the render-progress view for that video.
- **AC-11 (enqueue blocked — non-happy):** Given `insufficient_credits` / `daily_cap` / `model_not_allowed` / `generation_not_live`, when the user confirms, then the specific reason is shown with the correct recovery (billing link for credits; retry/explain for unavailable) and **no** placeholder render is displayed.
- **AC-12 (render progress):** Given an enqueued job, when its stage advances (queued → footage → voiceover → assembling → ready), then the progress view reflects each stage live, not a bare spinner.
- **AC-13 (render failure — non-happy):** Given the job fails, when the failure is written, then the user sees a plain failure message stating credits were refunded.
- **AC-14 (download):** Given a video reached ready with a finished media URL, when the user opens its detail, then the video plays and a working "download MP4" action returns the finished file.
- **AC-15 (states on every screen):** Sign-in, dashboard, create, and render/detail each render designed empty (where applicable), loading (skeleton/staged, not bare spinner), error (inline + recovery), and success states.

## Out of scope

- **Publishing to social networks** (oauth-start, enqueue-publish, per-platform status) — that is the P1 `networks`/`publish` slice.
- **Billing/checkout UI** — a no-credits state _links to_ billing but the Stripe checkout screens are the P1 `billing` slice.
- **Ads, leads, analytics, support, notifications** beyond the video status badge.
- **Editing a rendered video** — Vidcica is a generator, not an editor; no trim/cut features.
- **New database objects or edge functions, or any migration in this repo.** If something appears to need one, stop and raise it — it belongs in the mobile repo.
- **i18n mechanism build-out** — copy is French-default; the concrete next-intl wiring is a prerequisite tracked in the plan, not re-specified here.

## CUJ impact

- Registers new **CUJ-03 — Create and watch a video render**: sign in → dashboard → create from a script → watch it render → download the MP4 (update `docs/product/critical-user-journeys.md` at ship with an `e2e/create-video.spec.ts` and `create-*` screenshots).

## Open questions

Resolved before `/plan-feature` proceeds.

- [ ] **Finished-MP4 delivery:** current renders land on the JSON2Video CDN (a public URL), with a follow-up to rehost into the Supabase `videos` bucket. Confirm whether web download should link the current CDN URL directly or require a rehosted/signed Supabase URL — affects whether download is a plain link or a server-mediated fetch.
- [ ] **Phone-OTP test path on web:** confirm the Supabase test number / Prelude config usable for e2e so AC-2 can be verified without sending real SMS.
- [ ] **Composer defaults per plan tier:** full parity exposes model/quality/ratio — confirm which options are gated for Free vs paid so AC-11's `model_not_allowed` is exercised with a known-locked model.
