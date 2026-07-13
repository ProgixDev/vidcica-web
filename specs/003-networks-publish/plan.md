# Plan 003 — Connect social networks & publish

- **Spec:** [spec.md](spec.md) (open questions: OAuth mechanism resolved; realtime-vs-poll + publish-surface decided below)
- **Author:** Claude (agent) · **Date:** 2026-07-13

## Approach

Two feature slices (`networks`, `publish`) over the same shared `lib/vidcica` data-access tier
(ADR-0008). **No new backend:** connect drives the existing `oauth-start`/`oauth-callback`; publish
drives `enqueue-publish`; disconnect/toggle-publish are direct RLS updates on the `networks` row
(mirrors `networks.store.ts`). Reads are RLS-scoped Server Components.

**OAuth on web (the key decision):** the callback exchanges + persists the token server-side, then
302s to `vidcica://` (unusable in a browser). So the web opens the provider consent in a **popup**
(`window.open` to the `oauth-start` authorize URL) and, since the token is already saved before the
redirect, **detects success by watching the `networks` row** (realtime if the table is published,
else 2s polling while the popup is open), then closes the popup and refreshes. Zero backend change.
Cleaner redirect (honoring the stored `redirect_after`) is a signed-off follow-up, out of scope.

**Publish surface:** a dedicated route `/videos/[id]/publish` (RSC seeds the wizard with the video +
the user's connected networks). Simpler than a dialog and screenshot-friendly.

## Placement (per module-boundaries + ADR-0008)

| What              | Where                                                                      | Notes                                                                             |
| ----------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| DB types (expand) | `src/lib/supabase/database.types.ts`                                       | add `networks` + `publish_jobs` (regen via MCP)                                   |
| Network domain    | `src/lib/vidcica/network.ts`                                               | `Network` type, `rowToNetwork`, `PLATFORMS`, `platformToProvider`, status helpers |
| OAuth (web popup) | `src/lib/vidcica/oauth.ts`                                                 | `startNetworkOAuth(platform)` → oauth-start + popup + detect                      |
| Publish client    | `src/lib/vidcica/publishing.ts`                                            | `enqueuePublish`, `mapPublishFailureReason` (port of ClipFlow)                    |
| Server reads      | `src/lib/vidcica/networks-queries.ts`                                      | `listMyNetworks()` (RLS)                                                          |
| Realtime hooks    | `src/lib/vidcica/use-networks-realtime.ts`, `use-publish-jobs-realtime.ts` | merge reducers (pure, tested)                                                     |
| Networks slice    | `src/features/networks/`                                                   | list + connect/reconnect/disconnect/toggle, states                                |
| Publish slice     | `src/features/publish/`                                                    | wizard store + provider, select/caption/now-schedule/short, per-platform status   |
| Routes            | `src/app/networks`, `src/app/videos/[id]/publish`                          | thin RSC                                                                          |
| Shared UI         | `src/components/ui/`                                                       | `switch` (toggle), `dialog`? — prefer native; add only if reused                  |

## Data & state

- **Server reads:** `listMyNetworks()` (networks RSC), `getMyVideo` + `listMyNetworks` (publish RSC).
- **Client state:** networks list seeded + kept live (connect detection + status). Publish wizard =
  per-feature Zustand via context (selected platforms, per-platform caption/hashtags, mode now|schedule,
  scheduledAt, youtubeAsShort, phase idle|submitting|done|error), deps-injected for testing.
- **Writes:** connect = `oauth-start` invoke + popup (client); disconnect/toggle = RLS update (server
  action, zod-validated rowId + platform); publish = `enqueuePublish` server action with the session.

## Acceptance criteria → verification mapping

| AC                               | Proven by                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| AC-1 list connections            | unit `networks-queries.test.ts` (table+RLS shape); RTL `network-list.test.tsx` renders each state; e2e page render |
| AC-2 connect happy               | unit `oauth.test.ts` (start→detect state machine with injected fakes); manual/e2e gated on provider creds          |
| AC-3 cancelled                   | unit `oauth.test.ts` (popup closed → `cancelled`, no state change)                                                 |
| AC-4 not configured              | unit `oauth.test.ts` (503 `platform_not_configured` → unavailable, no error)                                       |
| AC-5 reconnect/disconnect/toggle | RTL/unit on the update actions (optimistic + RLS patch shape)                                                      |
| AC-6 publish gating              | unit `publish/store.test.ts` (only connected+enabled selectable; none → confirm disabled)                          |
| AC-7 publish now                 | unit `publish/store.test.ts` (enqueue invoked, video→publishing); e2e gated                                        |
| AC-8 schedule                    | unit `publish/store.test.ts` (scheduledFor set, video→programme)                                                   |
| AC-9 live status                 | unit `use-publish-jobs-realtime.test.ts` (job change → per-platform status merge)                                  |
| AC-10 partial failure            | unit `publishing.test.ts` (`mapPublishFailureReason` cases) + store (failed set surfaced)                          |
| AC-11 dedup/skipped              | unit `publish/store.test.ts` (`skipped` set surfaced, not re-published)                                            |
| AC-12 states everywhere          | RTL empty/loading/error + `pnpm e2e:shots` + `/verify-ui`                                                          |

## Risks & unknowns

- **Popup-detect reliability.** De-risk: token is persisted before the redirect, so detection only
  needs the row read; poll fallback if `networks` realtime isn't published. Verify in plan step 0.
- **Meta = one provider, two platforms (ig+fb).** Connecting `meta` may set both rows; surface per
  platform and let the callback own it. Don't assume a 1:1 platform→row on connect.
- **Real OAuth + publish need provider apps + a connected account** — the authenticated e2e is gated
  on the same seeded test user as 002 (accepted residual risk; unit + RTL + screenshots otherwise).
- **`x` (Twitter) is dropped** (paid API) — show unavailable, never offer connect.

## Overlap check

Active specs: `002-video-workspace-p0` (active) touches `src/features/videos`, `src/lib/vidcica`,
`/videos/[id]`. This spec **adds** `src/app/videos/[id]/publish` (new child route — no file overlap
with `/videos/[id]/page.tsx`) and adds new `lib/vidcica/*` files (network/publishing/oauth) without
editing 002's (video/generation/queries). Resolution: additive, no conflict; the "Publish" entry
point added to 002's `VideoDetail` is the one shared touch — a small, append-only edit.
