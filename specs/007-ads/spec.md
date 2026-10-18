# Spec 007 — Ads & Leads: boost a video, manage campaigns, follow up leads

- **Status:** active
- **Type:** feature (two slices: `ads` + `leads`)
- **Requested by / owner:** Houssem Ferrani (product)
- **Date:** 2026-07-13
- **Slice / areas touched:** `src/features/ads`, `src/features/leads`; shared data-layer in `src/lib/vidcica/`; routes `/ads`, `/ads/new`, `/ads/[id]`, `/leads`, `/leads/[id]`. **Reuses the existing backend only — no new backend, no migrations, no edge-function edits.**

## Backend contract (source of truth — verified in ClipFlow)

The `campaigns` table **is** the ad-campaigns table (Meta columns were added to it; there is no separate `ad_campaigns` table). The `leads` table backs the CRM. Three live edge functions + one cron:

| Function              | Auth                       | Input → Output                                                                       | Notes                                                                                                                                                                                                                                                                         |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolve-ad-account`  | jwt                        | `{}` → `{ ok, hasAccount, hasPage, adAccountId?, currency?, pageName? }`             | **Gate.** 503 `ads_not_configured` until META secrets set. Decides real-launch vs draft.                                                                                                                                                                                      |
| `create-ad-campaign`  | jwt                        | `{ campaignId }` → `{ ok, status:'in_review', external_* }`                          | Reads an existing `campaigns` row, builds the **PAUSED** Meta objects (AdVideo→Campaign→AdSet→Creative→Ad). Idempotent (resumes on stored `external_*`). Errors: `objective_unsupported_phase1`, `no_ad_account`, `no_page`, `needs_reconnect`, `no_video_url`, `meta_error`. |
| `set-campaign-status` | jwt                        | `{ campaignId, action:'activate'\|'pause' }` → `{ ok, status:'active'\|'en_pause' }` | **Only path that spends money.** Activate enforces a per-user monthly spend cap. Errors: `below_min_budget {minDaily}`, `monthly_cap_exceeded {cap, projected}`, `campaign_not_created`, `needs_reconnect`.                                                                   |
| `sync-ad-insights`    | **service-role cron only** | —                                                                                    | Not client-callable (rejects non-service bearer). Writes live metrics + status onto `campaigns` rows every ~15 min. **Web reads those columns; it never calls this.**                                                                                                         |

Backend **Phase-1 honors only:** objectives `notoriete` / `trafic` / `engagement`; audience = countries (ISO-2) + age (13–65) + gender (`tous`/`hommes`/`femmes`) + Advantage+ (broad). Pixel, interests, behaviours, lookalike, manual placements, extra objectives are **rejected or ignored** server-side → the web deliberately does **not** surface them (no dead controls).

Leads have **no real capture wired anywhere yet** (Meta Lead Ads webhook is a future phase). The list is honestly empty until captures land; when they do, they arrive via `leads` INSERT → realtime. The web can manage a lead once it exists (status, notes, contact log, export) but cannot fabricate one.

## Problem (the why)

Mobile can boost a generated video into a real Meta (Facebook/Instagram) ad campaign, watch its status/metrics, activate/pause it under a spend cap, and follow up the leads it captures. The web front-end has none of this. Advertisers who work on desktop need the same over the same backend: turn a finished video into a paused campaign, review it, explicitly activate it (spending real money, cap-guarded), watch metrics fill in, and work the resulting leads.

## Desired behavior (the what)

### Slice A — Ads

1. **Campaigns list** (`/ads`). The user's campaigns (RLS-scoped) with status, budget, and headline metrics; realtime keeps status/metrics live as the sync cron updates them. Honest empty state → "Booster une vidéo" CTA.
2. **Boost a video** (`/ads/new`, lean flow). On entry the flow **gates on `resolve-ad-account`**:
   - **Real path** (account + page present): choose a finished video → objective (the 3 supported) → audience (countries · age · gender; Advantage+ implied) → budget (daily/total + schedule) → review → **Create**. Creation writes a `campaigns` row (`brouillon`) then calls `create-ad-campaign(campaignId)`; on success the campaign is **`in_review`, created PAUSED** (no money spent yet).
   - **Honest fallback** (`ads_not_configured` / no ad account / no Facebook page): the flow still lets the user **save a draft** and explains what's needed to launch (connect Facebook with ads permissions / add an ad account) — it never pretends a campaign went live.
3. **Campaign detail** (`/ads/[id]`). Status, budget, schedule, creative summary, and the live metric grid (spend/reach/impressions/clicks/CPM/CTR/CPC/conversions/leads) with a "mis à jour" timestamp; honest zeros until the cron fills them.
4. **Activate / pause** (on detail, real spend). A created (`in_review`/`en_pause`) campaign shows **Activer** behind a confirmation that states it spends real money; it calls `set-campaign-status activate`. An `active` campaign shows **Mettre en pause**. Spend-cap / min-budget / needs-reconnect errors are surfaced as clear French messages — never a silent failure.

### Slice B — Leads

5. **Leads list** (`/leads`). Captured leads (RLS-scoped) newest-first, with a "new" count badge; realtime prepends a genuinely new lead the moment it lands. Honest empty state explaining leads arrive automatically from lead campaigns.
6. **Lead detail** (`/leads/[id]`). Contact info + score bucket, a **status pipeline** (`new → contacted → qualified → converted / rejected`), free-form **notes**, a **contact log** (call / email / whatsapp), and an interaction **timeline**. Every mutation is optimistic locally and written through to the `leads` row (whole-row upsert, mirroring the mobile store); realtime reconciles drift.
7. **Export.** The user exports selected/all leads to **CSV** (a real client-generated download on web) and the export is logged as an interaction.

## Acceptance criteria

**Ads**

- **AC-1 (list, RLS + realtime):** `/ads` renders the signed-in user's campaigns only (RLS `user_id = auth.uid()`), showing status + budget + metrics; a status/metric change on a `campaigns` row appears without reload. Empty → an illustrated state with a "Booster une vidéo" CTA.
- **AC-2 (gate):** Entering `/ads/new` calls `resolve-ad-account`. When it returns `ads_not_configured` or no account/page, the flow shows the honest draft-only path (with what's needed to launch); when it returns an account + page, the real create path is shown.
- **AC-3 (boost happy path):** Given a finished video + a supported objective + audience + budget, when the user confirms, then a `campaigns` row is written (`brouillon`) and `create-ad-campaign` is called; on `{ ok, status:'in_review' }` the UI shows the campaign as **in review, created paused** (money not yet spent).
- **AC-4 (create errors — non-happy):** `create-ad-campaign` errors are surfaced honestly and the campaign stays a resumable draft — `needs_reconnect` → "reconnectez Facebook", `no_video_url` → "vidéo indisponible", `objective_unsupported_phase1` → objective message, `meta_error`/other → generic retry. No fake "launched".
- **AC-5 (activate — real spend, guarded):** On a created campaign, **Activer** requires a confirmation that states real spend, then calls `set-campaign-status activate`; on `{ ok, status:'active' }` the UI reflects active. `monthly_cap_exceeded` and `below_min_budget` show specific French messages; nothing is activated on error.
- **AC-6 (pause):** On an `active` campaign, **Mettre en pause** calls `set-campaign-status pause`; on success the UI reflects `en_pause`.
- **AC-7 (metrics read):** Campaign detail reads metric columns from the row (populated by the cron); before any sync they show honest zeros with a "en attente des premières données" affordance, not fabricated numbers.

**Leads**

- **AC-8 (list, RLS + realtime + empty):** `/leads` renders only the user's leads, newest-first, with a "new" badge count; a `leads` INSERT for this user appears live at the top. With no leads, an honest empty state explains automatic capture.
- **AC-9 (status pipeline):** Changing a lead's status updates it optimistically, logs a `status_change` interaction, and upserts the `leads` row; the new status persists across reload.
- **AC-10 (notes & contact log):** Adding a note appends a `note` interaction; logging a call/email/whatsapp appends the matching interaction; both write through to the row. Empty notes are rejected.
- **AC-11 (export):** Exporting selected leads produces a real CSV download and logs an `export` interaction on each affected lead.
- **AC-12 (states everywhere):** Every screen (ads list, boost flow, campaign detail, leads list, lead detail) renders its empty / loading / error / success states — no blank screens.

## Non-goals / out of scope

- **Any backend change** — no migrations, no edge-function edits, no calling `sync-ad-insights` (cron-owned).
- **The deferred wizard steps** — angles/hooks generation, interests/behaviours/lookalike/custom audiences, manual placements, and pixel/conversion tracking. The backend ignores/rejects them in Phase 1; surfacing them would be dead UI.
- **Meta Lead Ads capture** (the webhook that creates leads) — a future backend phase; the web only consumes leads that land.
- **Ad-account binding UX** — choosing/switching ad accounts or Facebook pages; `resolve-ad-account` auto-picks the first (a picker is later polish).
- **XLSX / email export** — CSV only for now (xlsx needs a lib; email export was a mobile fake). Deferred, noted in-UI if a control is shown.
- **Campaign edit / duplicate / delete** and the **analytics dashboard** (separate slice) — not part of this feature.
- **OAuth connect flow** — reuses the existing networks slice (003); ads simply gates on the resolved account.

## CUJ impact

- Registers **CUJ-08 — Boost a video into an ad**: `/ads` → "Booster une vidéo" → pick video/objective/audience/budget → create PAUSED → activate (confirm, cap-guarded) → watch metrics. (Update `docs/product/critical-user-journeys.md` at ship.)
- Registers **CUJ-09 — Work a lead**: `/leads` → open a lead → advance status / add note / log contact / export. (Same doc.)
- e2e: `e2e/ads.spec.ts`, `e2e/leads.spec.ts` (auth guards run headless; authenticated create/activate + lead mutations gated on a seeded test user, like 003–006). Screenshots under `artifacts/screenshots/007-ads/`.

## Open questions

Resolved with owner before `/plan-feature`:

- [x] **Create surface:** lean, backend-matched boost flow (not the full 9-step wizard) — only controls Phase-1 honors.
- [x] **Activate/pause on web:** included, behind a confirmation, with the spend-cap/min-budget/needs-reconnect errors surfaced.
- [x] **Leads scope:** full CRM parity (list + detail: status pipeline, notes, contact log, CSV export) wired to realtime, honest-empty until captures land.
- [ ] **Route shape** (`/ads/new` single scrollable form vs stepped) and **export control placement** — plan decides (behavior identical).

## Update 2026-10-18 — Meta approved the App Review: Boost made safe for every account

Meta approved Vidcica's App Review (eight permissions and the Marketing API Access Tier) on
2026-10-18. The backend changed the same day (vidcica commit `a6af3b2`, functions README
"Meta launch hardening"). This web slice follows it. The Facebook/Instagram gate on Networks
(`META_REVIEW_EMAILS`) stays on until the canary week ends (spec 003 update).

Changed requirements (they replace the matching parts above):

- **AC-13 (plan):** Boost is a Pro/Studio feature, and the server enforces it (`plan_required`).
  `/ads/new` shows a plan prompt instead of the wizard on Free and Starter. A campaign page offers
  no Launch or Activate on those plans, only a plan note. Pause is always offered for a running
  campaign, whatever the plan. Tests: `campaign-manage`, `activate-pause-controls` ("without a
  plan…", "keeps Pause…").
- **AC-14 (account currency and minimum):** the budget step uses the ad account's live minimum
  (`resolve-ad-account` → `minDailyBudget`, in the account's currency; fallback 5). The draft
  saves the currency it was typed in (`campaigns.currency`). A launch under another currency is
  refused (`currency_changed`). The save action no longer applies a fixed 5-unit floor: the
  server knows the real one. Tests: `store` ("the ad account's live limits"), `actions` ("leaves
  the minimum…", "saves the currency…"), `boost-wizard` ("shows the account's own minimum…").
- **AC-15 (why only a draft):** the draft-only banner names the reason (connect Facebook, no ad
  account, account disabled, Meta unreachable). It links to Networks only when a reconnect fixes
  it and Facebook is offered to this account. Otherwise it says Facebook is coming, with no dead
  link. Tests: `boost-wizard` ("why only a draft").
- **AC-16 (launch a saved draft):** a `brouillon` campaign page has "Lancer sur Meta". It creates
  the campaign paused; a refused launch names Meta's minimum in the account's currency. Tests:
  `activate-pause-controls` ("launches a saved draft…", "names the account's minimum…").
- **AC-17 (errors and links):** every reason the 2026-10-18 functions return has its own message
  in both languages (`adsErrorKey`). A refused pause links to Ads Manager. Amounts come from the
  server, in the account's currency (`adsErrorText`). Tests: `ads` ("maps the reasons…", "says the
  amount…"), `activate-pause-controls` ("links to Ads Manager…").
- **AC-18 (delete):** only drafts and ended campaigns can be deleted. `rejected` covers Meta's
  WITH_ISSUES, which can still be delivering, so it gets a Pause button and no Delete. Tests:
  `campaign-manage`, `activate-pause-controls` ("offers Pause on a refused campaign…").
- **AC-19 (money everywhere):** ad spend and cost per lead on Analytics are shown in the ad
  account's currency, never a fixed "€".

Out of scope still: choosing or switching ad accounts (the server keeps the stored one while it is
usable). Choosing the Facebook Page is now on Networks (spec 003 update).
