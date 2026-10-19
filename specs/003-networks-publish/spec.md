# Spec 003 — Connect social networks & publish

- **Status:** active
- **Type:** feature
- **Requested by / owner:** Houssem Ferrani (product)
- **Date:** 2026-07-13
- **Slice / areas touched:** `src/features/networks`, `src/features/publish`; routes `/networks`, `/videos/[id]/publish`. Reuses the **existing** backend (no new backend): edge functions `oauth-start`, `oauth-callback`, `enqueue-publish`; tables `networks`, `publish_jobs` (RLS read/update-own), `videos`; realtime channels `networks:{userId}`, `publish_jobs:{userId}`, `videos:{userId}`.

## Problem (the why)

The P0 workspace lets a user create and download a video, but the whole point of Vidcica is to **publish** it. Users can't connect their social accounts or push a finished video out from the web. The backend already connects accounts (OAuth) and publishes (YouTube + LinkedIn live, Meta code-complete) for mobile — the web just needs the front-end to drive those same functions. This is the P1 that turns "make a video" into "make and distribute a video."

## Desired behavior (the what)

1. **Manage connections.** On a networks screen the user sees each supported platform (YouTube, LinkedIn, Instagram, Facebook, TikTok; X and, since 2026-10-19, Threads were dropped) with its connection state: connected (with the account handle), not connected, or needs-reconnect. Platforms whose backend isn't configured yet show "Bientôt disponible" and can't be connected.
2. **Connect an account.** The user clicks connect on a platform; a provider consent window opens; after they authorize, the connection appears as connected **without a manual refresh**. If they cancel, nothing changes and they see no error. A platform that isn't configured returns a graceful "bientôt disponible".
3. **Reconnect / disconnect.** A needs-reconnect account offers a one-click reconnect. A connected account can be disconnected. Each connected account can be toggled to include/exclude it from publishing.
4. **Publish a finished video.** From a ready video, the user opens publish, picks one or more **connected** networks, optionally edits the per-network caption/hashtags, chooses **publish now or schedule for later**, and (for YouTube) whether to post as a Short. Confirming enqueues the publish.
5. **Watch publish status.** After confirming, the user sees per-network status update live (queued → publishing → published, or failed). A partial failure names which networks failed and offers the right recovery (e.g. reconnect for an expired token). The video's overall status reflects published/scheduled.

## Acceptance criteria

- **AC-1 (list connections):** Given a signed-in user, when they open `/networks`, then each platform renders with its state (connected+handle / not-connected / needs-reconnect / unavailable), read server-side (RLS-scoped, no blank flash).
- **AC-2 (connect happy path):** Given an unconnected, configured platform, when the user connects and authorizes in the popup, then the platform shows as connected within a few seconds with no manual refresh (detected via the `networks` row the callback persists server-side).
- **AC-3 (connect cancelled — non-happy):** Given the user closes the consent popup without authorizing, when they return, then the platform is still not connected and no error is shown.
- **AC-4 (platform not configured — non-happy):** Given a platform whose backend secrets are unset, when the user tries to connect, then `oauth-start` returns `platform_not_configured` and the UI shows "Bientôt disponible", not an error.
- **AC-5 (reconnect / disconnect / toggle):** Given a needs-reconnect account, reconnect restores connected; given a connected account, disconnect removes it; toggling publish-enabled updates immediately.
- **AC-6 (publish requires a ready video + a connected network):** Given a video that is `pret`, when the user opens publish, then only **connected, publish-enabled** networks are selectable; with none selected the confirm action is disabled.
- **AC-7 (publish now):** Given selected networks and "now", when the user confirms, then `enqueue-publish` is invoked with the session, the video moves to `publishing`, and the user sees per-network status.
- **AC-8 (schedule):** Given "schedule" + a future datetime, when the user confirms, then the publish is enqueued with `scheduledFor` and the video shows `programme` (scheduled).
- **AC-9 (live per-platform status):** Given an in-flight publish, when a platform's job changes on the backend, then that platform's status updates live (via `publish_jobs:{userId}`), ending in published or failed.
- **AC-10 (partial failure — non-happy):** Given one network fails (e.g. expired token), when its job reports failed, then the UI names the failed network and its recovery reason (reconnect / rate-limited / rejected), while succeeded networks show published.
- **AC-11 (dedup / already-published — non-happy):** Given a network where the video is already live or a job is in flight, when the user re-publishes, then the backend's `skipped` set is surfaced (not re-published), with a clear message.
- **AC-12 (states on every screen):** `/networks` and the publish surface each render empty (where applicable), loading (skeleton), error (inline + recovery), and success states.

## Out of scope

- **New backend / migrations / edge-function edits.** In particular, the cleaner web OAuth return (making `oauth-callback` honor `redirect_after` instead of the `vidcica://` deep link) is a **follow-up requiring human sign-off** — see Open questions. This slice uses the popup + detect approach with zero backend change.
- **Deleting/unpublishing a live post** (`delete-post`) — a later enhancement.
- **Ads / boosting a published video** (Meta Ads) — the P2 `ads` slice.
- **Analytics on published posts** (views/likes) — separate.
- **Per-network preview rendering** of exactly how the post will look.

## CUJ impact

- Registers new **CUJ-04 — Connect a network & publish**: sign in → `/networks` connect an account → open a ready video → publish now/schedule → watch per-network status. (Update `docs/product/critical-user-journeys.md` at ship; `e2e/networks-publish.spec.ts`, `networks-*` / `publish-*` shots.)

## Open questions

Resolved before `/plan-feature` proceeds.

- [x] **OAuth completion mechanism** — decided: **popup + detect via the `networks` table** (no backend change; token is persisted server-side before the `vidcica://` 302). Follow-up (needs sign-off, not this slice): enhance `oauth-callback` to honor the already-stored `redirect_after` for web (backwards-compatible: mobile sends none → keeps the deep link) for a cleaner redirect UX.
- [ ] **Networks realtime vs poll for connect detection** — confirm whether the `networks` table is in a realtime publication; if not, the popup-detect falls back to short polling (2s) while the popup is open. Plan will verify and pick.
- [ ] **Publish surface** — a dedicated route `/videos/[id]/publish` vs a dialog on the detail view. Plan decides; behavior is identical.

## Update 2026-10-18 — Meta approved the App Review: Facebook and Instagram for every account

Meta approved Vidcica's App Review on 2026-10-18. The backend changed the same day (vidcica
commit `a6af3b2`, functions README "Meta launch hardening"). `oauth-callback` now marks a Meta
row connected only when it can be used, and stores why not otherwise
(`platform_metadata.connectReason`: `meta_no_page`, `instagram_not_linked`, `meta_error`).
New functions: `meta-select-page` and `meta-disconnect`.

Changed requirements. **Gate removed the same day:** at the owner’s request there was no
canary week. Facebook and Instagram moved into `PUBLISHING_PLATFORMS` for every account, and
the `META_REVIEW_EMAILS` allowlist was deleted (AC-N6).

- **AC-N1 (connect reasons):** a Meta card that couldn't connect says why and what to do (share a
  Page, link an Instagram professional account, try again). The reason is read from the row, not
  the URL. A popup that closes itself after an incomplete connect reports the reason instead of
  being treated as a cancel. The connect wait is 10 minutes, not 2. Tests: `network-list` ("says
  why…"), `oauth` ("a self-closing popup…", "waits ten minutes…"), `network` ("stored Meta
  fields").
- **AC-N2 (Page picker):** when several Pages were shared, the Facebook card offers a picker. The
  server checks the choice and moves posts, Instagram and Boost to that Page together
  (`meta-select-page`). Tests: `network-list` ("offers a Page picker…", "sends a new Page
  choice…"), `actions` ("Meta actions").
- **AC-N3 (Meta disconnect):** disconnecting Facebook or Instagram asks first. The prompt says
  both cards go and running Boosts are paused. `meta-disconnect` pauses them before dropping the
  token. If one won't pause, nothing is disconnected, and the card lists the campaigns with an
  Ads Manager link and "Déconnecter quand même". Tests: `network-list` ("asks before a Meta
  disconnect…", "does nothing when the person cancels…").
- **AC-N4 (publish reasons):** publish failures map like the database's `publish_failure_info()`.
  Meta reasons are read first (`meta_no_page`, `instagram_not_linked`, `permission`), so a Meta
  error whose text mentions a token no longer reads "reconnect". Removing a Facebook post whose
  Page is no longer shared says so (`page_unavailable`). Tests: `publishing`.
- **AC-N5 (views):** a video's views read "—" when no platform reported any. A video on
  Instagram carries a note: Instagram shares no view count without `instagram_manage_insights`,
  which isn't requested.
- **AC-N6 (open to all):** Instagram and Facebook are offered to every account on Networks,
  in the publish picker and on the landing page (“5 réseaux”). There is no per-account
  allowlist any more. Tests: `network` (“offers Instagram and Facebook to every account”,
  `connectablePlatforms`).
- **AC-N7 (plan allowance, 2026-10-18):** each plan's network allowance is enforced. Free
  connects 1 network, Starter 3, Pro and Studio every network; Facebook + Instagram (one Meta
  login) count as one.
  - The server refuses a new connection beyond the plan: `oauth-start` before consent (403
    `network_limit`), `oauth-callback` again before saving. Reconnecting a network already held
    is always allowed, so a downgrade never cuts what is connected.
  - Networks shows "{used} sur {limit}" for limited plans and, at the limit, "Voir les offres"
    instead of "Connecter" on networks not held.
  - Tests: `network-list` ("plan allowance"), `network` (`heldConnections`), `oauth` ("a used-up
    plan allowance…").
