# Tasks 007 — Ads & Leads

Legend: `[ ]` todo · `[x]` done. Keep `pnpm verify` green at each commit.

## Phase 0 — shared data layer (`lib/vidcica`)

- [ ] T0 · DB types: generate + add `campaigns`, `leads` to `database.types.ts`
- [ ] T1 · `campaign.ts` — `Campaign` type, enums, `rowToCampaign`, `SUPPORTED_OBJECTIVES`, `STATUS_META`, `campaignDraftToRow`, budget/metric helpers (+ test)
- [ ] T2 · `ads.ts` — `resolveAdAccount`/`createAdCampaign`/`setCampaignStatus` edge client, typed outcomes, 503→`ads_not_configured` (+ test)
- [ ] T3 · `ads-queries.ts` — `listMyCampaigns`, `getMyCampaign` (RSC, RLS)
- [ ] T4 · `use-campaigns-realtime.ts` — hook + pure `upsertCampaign`/`removeCampaign` (+ test)
- [ ] T5 · `lead.ts` — `Lead`/`LeadInteraction` types, enums, `rowToLead`/`leadToRow`, `STATUS_META`, `toCsv()`, `pushInteraction` (+ test)
- [ ] T6 · `leads-queries.ts` — `listMyLeads`, `getMyLead` (RSC, RLS)
- [ ] **commit** `feat(ads): shared data-layer for campaigns + leads`

## Phase 1 — ads UI

- [ ] T7 · `features/ads/actions.ts` — `createDraftCampaign` (zod, RLS insert, user_id server-set) (+ test)
- [ ] T8 · `features/ads/store.ts` + `provider.tsx` — campaigns list + realtime + create/activate/pause orchestration (DI edge client) (+ test)
- [ ] T9 · `CampaignList` + `CampaignCard` + empty state; `/ads/page.tsx` (guarded RSC) + loading/error
- [ ] T10 · `BoostWizard` (video→objective→audience→budget→review; gate on resolveAdAccount) ; `/ads/new/page.tsx`
- [ ] T11 · `CampaignDetail` + metric grid + `ActivatePauseControls` (confirm dialog) ; `/ads/[id]/page.tsx` + loading/error
- [ ] T12 · RTL: list empty, wizard gate (draft vs real), create errors, activate confirm + cap error
- [ ] T13 · middleware `+/ads`; `index.ts`
- [ ] **commit** `feat(ads): /ads list + boost wizard + campaign detail (activate/pause)`

## Phase 2 — leads UI

- [ ] T14 · `features/leads/store.ts` + `provider.tsx` — items + realtime + optimistic mutations + write-through (+ test)
- [ ] T15 · `LeadsList` + `LeadCard` + "new" badge + empty state; `/leads/page.tsx` (guarded RSC) + loading/error
- [ ] T16 · `LeadDetail` — status pipeline, notes, contact log, timeline; `/leads/[id]/page.tsx` + loading/error
- [ ] T17 · `ExportButton` — real CSV download + interaction log
- [ ] T18 · RTL: leads empty, status change, add note (blank rejected), log contact, export
- [ ] T19 · middleware `+/leads`; `index.ts`
- [ ] **commit** `feat(leads): /leads list + detail (status, notes, contact, export)`

## Phase 3 — verify + review

- [ ] T20 · `e2e/ads.spec.ts` + `e2e/leads.spec.ts` (guards; authed gated on seeded user)
- [ ] T21 · `/verify-ui` screenshots each state → `artifacts/screenshots/007-ads/`
- [ ] T22 · `pnpm verify` green; `/review` (3-persona board) → fix P0/P1 → re-verify
- [ ] **commit** fixes; present verify output + screenshots
