# Web ↔ Mobile parity audit

Date: 2026-07-22. Compares vidcica-web (Next.js) against the ClipFlow mobile app
(Expo/RN), screen by screen. Source: three read-only audits of both codebases.

## Verdict

The web app is **not identical** to mobile, but **no core journey is broken** —
sign-in (email / phone-OTP / Google), create → plan → render, watch, download,
and publish all work on web. The gaps are **richness and completeness**, not
dead ends. Biggest missing area: the entire **Analytics** section.

**Where web is already AHEAD of mobile (do not regress when closing gaps):**
realtime publish-job status, realtime campaigns list + live ad-metrics grid,
realtime leads with score buckets + multi-select export, an explicit PlanReview
step, and starter-prompt suggestions in the composer.

---

## P0 — core journey (all present; nothing broken)

Every P0 step has a working web equivalent: auth landing, dashboard inline
composer, create state machine + render progress, video player + download,
publish entry. No P0 gaps.

---

## P1 — important gaps (the real parity work)

1. **Analytics — entirely MISSING on web.** Mobile has 4 views (Overview /
   Videos / Audience / Ads) with a 7d/30d/90d range control and charts: hero KPI
   - sparkline + delta, KPI tiles, per-platform share bars, gender split, age /
     country breakdowns, best-time-to-post heatmap, top-video rows, per-campaign
     rows. Real metric ingestion isn't wired even on mobile (honest zeros), so web
     builds the view shells + wires the same `selectors` seam. Mobile ref:
     ClipFlow/app/analytics/_, ClipFlow/src/components/feature/analytics/_.

2. **Account recovery — MISSING on web.** No forgot-password, no reset-password
   (`resetPasswordForEmail` absent from web src). An email/password user who
   forgets their password is locked out. Mobile: forgot-password.tsx,
   reset-password.tsx.

3. **Change email / change phone — MISSING on web.** A web user cannot change
   their account email or phone (phone is the primary web login identifier).
   Mobile: settings/change-email.tsx, settings/change-phone.tsx. (Change-password
   is N/A — web is passwordless for OTP/Google users.)

4. **Billing depth — THINNER.** Web = paywall + a "Manage plan" button that opens
   the Stripe billing portal. Missing in-app: subscription manage (cancel / resume
   / scheduled-change UI), a **credit-history ledger**, and **receipts/invoices**.
   Mobile: billing/manage.tsx, billing/credits.tsx, billing/receipts.tsx.

5. **Publish — per-platform customization + review step (THINNER).** Web publish
   is a single-screen composer with a read-only, auto-derived caption. Mobile is a
   5-step wizard with per-platform caption + hashtag editing (limits, suggested
   tags, copy-to-all) and a summary review step.
   ⚠️ Caveat: the `enqueue-publish` / `publish-job` backend currently builds the
   caption from the video row (title/description/hashtags) and ignores any
   client-sent per-platform caption — so **editable captions need a backend
   change to be real**, on either platform. Decide before building.

6. **Library management — THINNER.** Web library has no search, no filters
   (status / platform / period), and no per-item actions (duplicate / download /
   reschedule / delete). Video detail can't delete / retire / share / boost and
   doesn't show the script. Mobile: app/(tabs)/library.tsx, app/video/[id].tsx.

7. **Ads — THINNER.** Web create is a 5-step boost wizard; mobile is 9 steps
   (adds creative, angles, placements, tracking/pixel, launch). Web campaign
   management is activate/pause only — no duplicate / delete / edit. Mobile:
   app/ads/new/\*, app/ads/[id].tsx.

8. **Help center — THINNER.** Web support = AI chat (Lia) + contact form only.
   Missing: searchable/categorized **FAQ**, guides, video tutorials, ticket
   history. Mobile: app/help/\*.

9. **Onboarding — THINNER.** Web goes straight to sign-in with a flat
   email+password toggle. Mobile has a register wizard + profile-setup that
   captures niche / audience / avatar / legal consent at signup (feeds AI
   personalization). Web only captures these later in account/edit.

10. **Networks connect screen — THINNER / review-relevant.** Web connects via an
    inline OAuth popup; mobile has a dedicated connect screen with an explicit
    permission-scope disclosure before authorizing (may matter for platform app
    review) + network stat sync/sync-all.

---

## P2 — polish (nice-to-have)

- Dashboard: welcome carousel, week-over-week stat deltas, recent-drafts rail,
  quick-actions, networks row.
- Library: calendar view, trash, storage banner, plan-cap subtitle.
- Video detail: platform icons + relative time, publish-failures banner.
- Create: image-to-video attach, storage-cap preflight gate.
- Profile: avatar upload in the edit form; About page.
- Delete account: typed-word confirmation + 30-day grace (web is a single
  immediate confirm).
- Notifications: push-permission/preferences screen (web push is out of scope).
- Leads: search + filters + period, format-choice export, form-answers card,
  source-campaign link, contact deeplinks, confirm-on-destructive.
- Ads list: active/draft/ended tabs, draft-resume banner.
- Help: ticket history, guides list.
- Phone OTP: resend cooldown, code TTL/expiry, attempt lockout, country picker.

---

## Suggested order

1. **Analytics** (biggest single missing area; self-contained; charts + range).
2. **Account recovery** (forgot/reset password) + **change email/phone** (real
   user lock-out risk).
3. **Billing depth** (credit history + receipts + in-app manage).
4. **Library management** + **video-detail actions** (daily-use friction).
5. **Publish customization** (after the caption/backend decision).
6. **Ads wizard depth + campaign management**, **Help FAQ**, **onboarding capture**.
7. P2 polish.
