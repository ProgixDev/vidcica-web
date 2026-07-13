# Plan 007 — Ads & Leads

- **Spec:** [spec.md](spec.md) (open questions resolved; owner: lean boost flow, activate/pause with cap guard, full leads CRM)
- **Author:** Claude (agent) · **Date:** 2026-07-13

## Approach

Two feature slices (`ads`, `leads`) over the shared `lib/vidcica` tier (ADR-0008). **No new backend.**

- **Ads reads** are RSC + RLS (`campaigns` rows), kept live by a realtime hook (status/metrics from the
  `sync-ad-insights` cron). **Ads writes** go through the existing edge functions: `resolve-ad-account`
  (gate), `create-ad-campaign` (build PAUSED), `set-campaign-status` (activate/pause, cap-guarded).
  Creation first inserts a `campaigns` row (`brouillon`) via a server action, then invokes
  `create-ad-campaign(campaignId)` — exactly the mobile `ads.store.saveDraftAsCampaign` → `ads-launch`
  sequence.
- **Leads** mirror `ClipFlow/src/store/leads.store.ts`: a per-mount Zustand store (items + optimistic
  mutations + write-through upsert) seeded from an RSC list and reconciled by the `leads` realtime
  channel. Export is a **real client-side CSV** download on web (mobile faked it).

The boost flow is a single stepped client form (steps in local state, no route-per-step) — simplest,
and the whole draft is one `campaigns` row. Leads export control sits in the list header (select → export).

## Placement (module-boundaries + ADR-0008)

| What                     | Where                                                      | Notes                                                                                                                                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB types (expand)        | `src/lib/supabase/database.types.ts`                       | add `campaigns`, `leads` (generated via MCP, trimmed)                                                                                                                                                                                                               |
| Campaign domain + mapper | `src/lib/vidcica/campaign.ts`                              | `Campaign`, `rowToCampaign`, enums (objective/status/cta/gender/budget), `STATUS_META`, `SUPPORTED_OBJECTIVES`, `campaignDraftToRow`                                                                                                                                |
| Ads edge client          | `src/lib/vidcica/ads.ts`                                   | `resolveAdAccount()`, `createAdCampaign(id)`, `setCampaignStatus(id, action)` — session-bearer fetch, 503→`ads_not_configured`; typed outcomes mirroring `ClipFlow/src/lib/ads-launch.ts`                                                                           |
| Ads reads                | `src/lib/vidcica/ads-queries.ts`                           | `listMyCampaigns()`, `getMyCampaign(id)` (RSC, RLS)                                                                                                                                                                                                                 |
| Ads realtime             | `src/lib/vidcica/use-campaigns-realtime.ts`                | `useCampaignsRealtime(userId, initial)` + pure `upsertCampaign`/`removeCampaign`                                                                                                                                                                                    |
| Lead domain + mapper     | `src/lib/vidcica/lead.ts`                                  | `Lead`, `LeadInteraction`, `rowToLead`, `leadToRow`, status/score enums, `STATUS_META`, `toCsv()`                                                                                                                                                                   |
| Leads reads              | `src/lib/vidcica/leads-queries.ts`                         | `listMyLeads()`, `getMyLead(id)` (RSC, RLS)                                                                                                                                                                                                                         |
| Ads create action        | `src/features/ads/actions.ts`                              | `createDraftCampaign(input)` (zod, RLS insert into `campaigns`, `user_id` server-set) → returns id                                                                                                                                                                  |
| Ads slice                | `src/features/ads/`                                        | `CampaignList`, `CampaignCard`, `BoostWizard` (steps: video→objective→audience→budget→review), `CampaignDetail` + `ActivatePauseControls` (confirm dialog), `store.ts`+`provider.tsx` (campaigns list + realtime + create/activate/pause orchestration), `index.ts` |
| Leads slice              | `src/features/leads/`                                      | `LeadsList`, `LeadCard`, `LeadDetail` (status pipeline, notes, contact log, timeline), `ExportButton`, `store.ts`+`provider.tsx` (items + mutations + realtime), `index.ts`                                                                                         |
| Routes                   | `src/app/ads/{page,new,[id]}`, `src/app/leads/{page,[id]}` | thin guarded RSC; loading/error siblings; seed client components                                                                                                                                                                                                    |
| Middleware               | `src/lib/supabase/middleware.ts`                           | add `/ads`, `/leads` to `PROTECTED_PREFIXES`                                                                                                                                                                                                                        |

## Data & state

- **Reads (RSC, RLS):** `listMyCampaigns` / `getMyCampaign`, `listMyLeads` / `getMyLead` — cookie-session
  server client; RLS scopes to `auth.uid()`.
- **Ads store (client, per-mount via provider):** seeds from the server list, folds in the
  `campaigns:{userId}` realtime channel (status/metrics), and holds the create/activate/pause
  orchestration with DI'd edge-client fns for tests. Activate is behind a confirm dialog.
- **Leads store (client, per-mount via provider):** items seeded from server, `leads:{userId}` realtime,
  optimistic `setStatus`/`addNote`/`logContact`/`exportLeads` with write-through `leads` upsert (DI'd
  supabase for tests). Whole-row upsert like the mobile store.
- **Create write:** `createDraftCampaign` server action inserts a `campaigns` row (status `brouillon`,
  `user_id` from `getUser()`), zod-validated; the store then calls `createAdCampaign(id)`.

## Acceptance criteria → verification mapping

| AC                                 | Proven by                                                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 list RLS+realtime             | unit `ads-queries` (shape) + `use-campaigns-realtime.test` (upsert/remove pure); RTL `CampaignList` empty→CTA; e2e guard               |
| AC-2 gate                          | unit `ads.test` (`resolveAdAccount` 503→not_configured, account/page branches); store test (gate → draft vs real path); RTL            |
| AC-3 boost happy                   | unit `actions.test` (insert shape, user_id server-set) + store test (create → invokes createAdCampaign → in_review); RTL wizard submit |
| AC-4 create errors                 | unit `ads.test`/store (each reason → honest message, stays draft)                                                                      |
| AC-5 activate guarded              | unit store (activate → setCampaignStatus; `monthly_cap_exceeded`/`below_min_budget` → messages); RTL confirm dialog gating             |
| AC-6 pause                         | unit store (pause → en_pause); RTL                                                                                                     |
| AC-7 metrics read                  | unit `campaign.ts` (rowToCampaign metrics/zeros); RTL detail zeros→"en attente"                                                        |
| AC-8 leads list RLS+realtime+empty | unit `leads-queries` + `leads store` realtime prepend; RTL empty state                                                                 |
| AC-9 status pipeline               | unit `leads store` (setStatus optimistic + interaction + upsert); RTL pipeline click                                                   |
| AC-10 notes & contact              | unit `leads store` (addNote/logContact interactions; blank note rejected); RTL                                                         |
| AC-11 export CSV                   | unit `lead.ts` `toCsv()` (rows→CSV) + store (export logs interaction); RTL download trigger                                            |
| AC-12 states                       | RTL empty/loading/error/success across screens + `pnpm e2e:shots` + `/verify-ui`                                                       |

## Risks & unknowns

- **Real Meta calls need META secrets + a connected FB ad account** — without them every edge fn returns
  `ads_not_configured` (503) and the flow correctly shows the draft path. So the _real_ create/activate
  e2e is gated on a seeded user **and** a configured Meta app (accepted residual risk; unit + RTL +
  screenshots cover the logic, incl. the not-configured branch which is the likely prod state today).
- **Activate spends real money** — mitigated by the mandatory confirm dialog and the server-side spend
  cap; the web only ever calls `set-campaign-status`, never bypasses the cap.
- **`sync-ad-insights` is cron-owned** — the web must not call it (it rejects non-service bearers); metrics
  are read-only from the row. Guard against anyone wiring an invoke.
- **`campaigns`/`leads` RLS** — own-row select/insert/update defined in the ClipFlow migrations (source of
  truth). Create action sets `user_id` server-side; leads upsert carries the session user's id.
- **Realtime streams full rows** — `campaigns`/`leads` rows carry **no secrets** (unlike `networks`), so
  streaming them is safe (checked: no token/ciphertext columns).

## Overlap check

Active specs: 002–006. This adds new `ads` + `leads` slices, new `lib/vidcica/{campaign,ads,ads-queries,
use-campaigns-realtime,lead,leads-queries}.ts`, new routes `/ads`,`/leads`, and expands
`database.types.ts` (+`campaigns`,`leads`) and `middleware.ts` (+2 prefixes). No file overlap with
002–006. Additive.

## Phases (small commits, green at each)

- **P0 — data layer:** DB types (+campaigns,+leads); `campaign.ts`, `ads.ts`, `ads-queries.ts`,
  `use-campaigns-realtime.ts`, `lead.ts`, `leads-queries.ts` + unit tests. No UI yet.
- **P1 — ads UI:** `/ads` list + realtime; `/ads/new` boost wizard (gate + create); `/ads/[id]` detail +
  activate/pause; store/provider/action; middleware; RTL. Commit.
- **P2 — leads UI:** `/leads` list + realtime + empty; `/leads/[id]` detail (pipeline/notes/contact/
  timeline); export CSV; store/provider; RTL. Commit.
- **P3 — verify:** e2e guards + `/verify-ui` screenshots of each state; then `/review`.
