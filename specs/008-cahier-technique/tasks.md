# Tasks 008 — Client "Cahier technique"

This is the tracker that makes sure nothing is forgotten. Each box names the client's ID, then the surface:

- **[S]** server: Supabase, in the `vidcica` repo.
- **[W]** website: this repo.
- **[A]** mobile app: the `vidcica` repo.
- **[O]** owner action.
- **[C]** client action.

Tick a box only with evidence: the commit, the check that passed, a screenshot or an emulator run. Phases follow `plan.md`. The release happens once, at the end (Phase 9).

## Phase 0 — Set-up

- [x] Branches `feat/cahier-technique` (web from `master`, app from `main`)
- [x] Tracker: spec.md, plan.md, tasks.md; app decision record `vidcica/docs/decisions/2026-10-24-cahier-technique.md`
- [x] [W] Mockup images copied to `public/media/` (images only; nothing from the zip runs)
- [x] [S] 4 QA accounts `qa-{free,starter,pro,studio}@vidcica.com`, created already confirmed (owner chose server-side, no inbox), tiers set by SQL, passwords in `C:\dev\vidcica-secrets\plan-test-accounts.env`. Sign-in checked 2026-10-24
- [x] [S] `_shared/rollout.ts` (`isV2`) + `app_config` `cahier_v2` = `testers` + `cahier_v2_testers`, listed in check:shared

## Phase 1 — Plan limits on the server (B4, F)

- [x] [S] F: migration `plan_limits` (table seeded with the client's table, public read)
- [x] [S] F: migration `videos` server-only columns (`size_bytes`, `source`, `script_paid_blocks`) + backfill + `profiles.timezone`
- [x] [S] F: `videos` guard trigger (insert + update, user sessions, aware of the switch)
- [x] [S] F: `plan_for`, `plan_usage`, `my_plan()` RPC (limits + usage + balance + script prices)
- [x] [S] F: `_shared/plans.ts` (`loadPlan`, `loadUsage`, `planRefusal`, `minPlanFor`) + error codes, synced copies
- [x] [S] B4/B3/B5/B6: `enqueue-generation` (duration by scenes, models per plan incl. the path with no model, voice refused for v2 and dropped for old builds, Stock voice for Starter+, quality = min(plan, model), library + storage, caps up to the plan, plan seconds + logo flags in the render settings, service-role status change, no 60 s clamp)
- [ ] [S] B3: `generation-worker` fails + refunds when the voice runs past the plan's maximum (code done, deploys with phase 2)
- [x] [S] B3: `generate-plan` refuses a length above the plan before any work (v56+)
- [ ] [S] F: `create-ad-campaign` / `set-campaign-status`, Pro capped at 5 active campaigns (code done, deploys with the release batch)
- [x] [W] F: `src/lib/vidcica/tiers.ts` values = client table; Free credits « À la carte »; unit test against the table. New fields `libraryMax`, `storageMb`, `scheduleDaysAhead`, `schedulePerDay`, `phoneImport`, `vidcicaLogo`, `activeCampaigns`; Free support `help_center`. `tiers.test.ts` holds the section F table (drift guard). Pricing comparison table = the mockup's 16 rows, card lists in the mockup's words; `lib/vidcica/units.ts` writes « 1 min 30 » / « 1 Go ». `pnpm verify` green 2026-10-24
- [x] [A] F: `src/lib/tiers.ts` + `policy.ts` values = client table; Free « À la carte » (not 20). Same new fields; `STORAGE_LIMITS` → `LIBRARY_LIMITS`; home chip + credits screen read "N crédits" with no "/ 0" for Free; paywall blurbs name the durations; `formatVideoLength` / `formatMegabytes` in `format.ts`. tsc + lint (0 errors) + check:shared green; check:colors still fails on 134 old leaks in files not touched here
- [x] [W] F: new error codes mapped (message + « Passer à l'offre … »). Requests send `v: 2`; `duration_locked` (generate-plan + enqueue), `voice_locked`, `library_full`, `storage_full`, `model_locked` with the plan; `plan_unavailable` → "momentanément indisponible"; `components/blocked-notice.tsx` (composer + review); script-too-long and render-too-long messages name the plan's longest video
- [x] [A] F: new error codes mapped (message + paywall). Requests send `v: 2`; `src/lib/plan-refusal.ts` → paywall with reason, the unlocking plan preselected and the limit spelled out (durationLocked, voiceLocked, storageFull, lockedModel; library_full reuses storage_limit); empty draft dropped; Stock plan call now sends the length (the server assumed 30 s, above Free's 15 s)
- [x] [S] F: `scripts/plan-limits-matrix.mjs`, first version (generation rows). 81/81 against production on 2026-10-24
- [x] [S] Outage fix (not in the brief): OpenAI shut gpt-4.1-nano down on 2026-10-23. generate-plan, write-script, improve-script and support-chat moved to gpt-5.6-luna, deployed for everyone on 2026-10-24 (owner's go)

## Phase 2 — Rendering (B7, B6, B3, brand kit)

- [ ] [O] B7/B3: JSON2Video on a paid plan (removes their watermark and the 60 s refusal)
- [ ] [O] B3: storage file limit ≥ 200 MB (project + `videos` bucket)
- [ ] [S] B7: Vidcica logo PNG in `app-assets/brand/`, added on Free/Starter (`dispatchAssembly`), no single-clip shortcut when a logo is needed
- [ ] [S] B6: output resolution = plan (720p Free/Starter)
- [ ] [S] B3: worker 180 s cap, stuck timeout scaled to length
- [ ] [S] B3: big files streamed (assembly-webhook, providers) + a failed copy fails the job
- [ ] [S] B3: publishers: YouTube resumable upload, TikTok chunks of 64 MB or less, LinkedIn streamed
- [ ] [S] B3: Pexels searches reused across scenes
- [ ] [S] C2: `assembly-webhook` saves `size_bytes`
- [ ] [S] BK: `brand_kits` table + storage folder + applied in `dispatchAssembly` (logo + caption colour) for Pro/Studio only
- [ ] [W] BK: `/account/brand` page (Pro/Studio, « 🔒 Pro » otherwise)
- [ ] [A] BK: `settings/brand` screen (Pro/Studio, locked otherwise)
- [ ] [W] B6: model menu shows the plan's resolution (« Stock · 720p »)
- [ ] [A] B6: model picker shows the plan's resolution
- [ ] [W] B7: logo note on the result/detail (« Offre Starter : le logo Vidcica apparaît… »)
- [ ] [A] B7: same note on the video screen
- [ ] [S] B3: proof: one real 3-min render + one private 3-min publish on YouTube, TikTok and LinkedIn

## Phase 3 — Create a video (B1, B2, B3, B5)

- [ ] [S] B2: `consume_script_credits` (service role, no daily count, ledger `script`) + `_shared/script-credits.ts`
- [ ] [S] B1/B2: `generate-plan` modes write/rewrite/paste/resegment + `videoId`; charged after OpenAI succeeds; script in paragraphs; word budget
- [ ] [S] B2: `write-script` (script action) + `improve-script` follow the rule; `ideas` free
- [ ] [S] B2: `enqueue-generation` charges unpaid blocks (old builds pay at render), then the video
- [ ] [S] C1: `copy_video_draft(id)` RPC (carries the paid blocks over)
- [ ] [W] B1: 3 steps Idée → Ton script (editable text) → Vidéo, mockup copy; `plan-review.tsx` replaced
- [ ] [W] B2: cost bar step 1 (script ≈ + video + balance) and step 2 (video + extra blocks + « Il te restera »); `scriptCost()` + tests
- [ ] [W] B3: durations 15 s → 3 min with locks; `schema.ts` caps 180 s / 36 scenes
- [ ] [W] B5: « Voix off + sous-titres » locked on Free + « ! » tooltip
- [ ] [W] B1: draft created at « Écrire le script »; `/create?draft=` resumes at step 2
- [ ] [A] B1: `app/generate/review.tsx` (editable text, word count, Réécrire, Modifier l'idée, Générer)
- [ ] [A] B2: cost line composer + review; `scriptCost()` in `credits.ts`
- [ ] [A] B3: durations 15 s → 3 min with locks (composer)
- [ ] [A] B5: voice option locked on Free + « ! » sheet
- [ ] [A] B2: with too few credits, « Recharge tes crédits sur vidcica.com »
- [ ] [W][A] B3: the script-length guard follows the plan (web `features/create/script-length.ts` and app `src/lib/script-length.ts` still say `MAX_VIDEO_SEC = 60`); the default length never above the plan (Free's composer defaults to 30 s today, which the server now refuses)
- [ ] [W] B2/E1: « ≈ N vidéos IA de 30 s par mois » ignores the script price; follow the mockup (credits line only) or count the script

## Phase 4 — Signup (A1–A5)

- [ ] [S] A1: `profiles.first_name` / `last_name`; `handle_new_user` copies first/last/niche (+ Google's name)
- [ ] [W] A1: sign-up fields Prénom, Nom, E-mail, Ta niche (12 + « Autre… » → « Écris ta niche »), password; audience removed from signup
- [ ] [W] A2: `components/ui/password-input.tsx` (eye) on sign-up, sign-in, reset
- [ ] [W] A3: « Vérifie ta boîte courriel » panel + 60 s countdown + resend + « modifie ton adresse »
- [ ] [W] A3: rate-limit errors in FR/EN with seconds left
- [ ] [W] A1: one-time « Complète ton profil » for Google/Apple/phone without name or niche
- [ ] [W] A1: profile edit with first name, last name and niche list
- [ ] [A] A1: `register.tsx` Prénom + Nom, niche list + « Autre… » text
- [ ] [A] A2: eye toggles checked (login, register, reset, change-password)
- [ ] [A] A3: `check-inbox.tsx` countdown + « modifie ton adresse » + spam hint; rate-limit message
- [ ] [A] A1: settings profile with first name, last name and niche list
- [ ] [A] A5: « Continuer avec Apple » on Android (web flow)
- [ ] [S] A4/G3: email templates in « tu » (FR + EN)
- [ ] [O] A4: Resend SMTP in Supabase + higher email rate limit + paste templates

## Phase 5 — Mes vidéos (C1–C3)

- [ ] [W] C1: ⋮ menu: Voir le script (dialog), Copier, Modifier et regénérer, Programmer (+ existing items); hidden for imports
- [ ] [W] C1: « Script de la vidéo » on the video detail page
- [ ] [A] C1: visible ⋮ + same items in `LibraryActionsSheet` (expo-clipboard, script sheet)
- [ ] [S] C2: `import-video` function (checks + signed upload + finalize with real size)
- [ ] [S] C2: generation refused when storage is full
- [ ] [S] C2: daily cleanup of files of videos in the trash for 30 days
- [ ] [W] C2: storage gauge + plan line + « Importer depuis mon téléphone » (Starter+) using `import-video`
- [ ] [A] C2: storage gauge + import gated by plan using `import-video`
- [ ] [S] C3: `enqueue-publish` with service role, finished video stored with us, days ahead + per local day
- [ ] [S] C3: `schedule_availability(tz)` RPC + real cancel of queued jobs
- [ ] [W] C3: day chips (greyed beyond the limit / full) + hour + plan line; Free dialog « Voir les offres »
- [ ] [A] C3: `SchedulerSheet` limited to the plan; Free message; cancel through the server

## Phase 6 — Several accounts per network (F+)

- [ ] [O] Drop `networks_user_id_platform_key`, `publish_jobs_active_uq`, `video_metrics` primary key (SQL editor)
- [ ] [S] Unique (user, platform, external_user_id); `publish_jobs.network_id`; active unique (video, network); `video_metrics` keyed by network
- [ ] [S] `oauth-callback` adds/updates accounts within the plan (counts accounts); Google `select_account`; multi-Page Meta picker
- [ ] [S] Everything reading one row per platform moves to `network_id` (enqueue-publish, publish-job, creator-info, refresh-tokens, sync-video-metrics, verify-published-posts, delete-post, `_shared/meta.ts` ×11, meta-select-page/disconnect/deauthorize)
- [ ] [W] `/networks`: accounts per network, « Ajouter un compte » / « 🔒 Pro : 5 comptes par réseau », disconnect per account; `oauth.ts` fixed
- [ ] [W] Publish: choose the accounts; analytics name the account
- [ ] [A] Networks screens + publish: same as the web

## Phase 7 — Legal (H1–H5) + currency (I1)

- [ ] [W] H1: privacy §3, 5 networks (FR + EN)
- [ ] [W] H2: privacy section « Données Meta (Facebook et Instagram) » (FR + EN)
- [ ] [W] H2: « Suppression des données » (`/supprimer-mon-compte` retitled, « tu », web + app + email) + redirect `/suppression-des-donnees` + footer link
- [ ] [W] H2: web deletion → `request_account_deletion` (30 days)
- [ ] [W] H3: privacy §8, new text (FR + EN)
- [ ] [W] H4: Loi 25 line (FR + EN)
- [ ] [W] H5: terms §3 + « Droit applicable » + date (FR + EN)
- [ ] [A] H1–H5: `src/lib/legal-content.ts` same texts (FR + EN)
- [ ] [O] H2: confirm Meta's data-deletion URL = `https://www.vidcica.com/supprimer-mon-compte`
- [ ] [C] H: lawyer review
- [ ] [W] I1: middleware `x-vercel-ip-country` → currency cookie; manual selector; `src/lib/currency.ts`
- [ ] [W] I1: prices in that currency on home, /tarifs (+ JSON-LD), /billing, /billing/manage
- [ ] [S] I1: `stripe-setup` adds CAD/USD `currency_options` to the 3 plan prices (test mode first)
- [ ] [S] I1: `create-checkout-session` `currency` for plans (packs EUR); Stripe customer currency respected
- [ ] [S] I1: Stripe test harness green (CAD checkout, plan change, CAD subscriber buying an EUR pack)
- [ ] [A] I1: paywall prices in the device region's currency

## Phase 8 — Lia, billing, home, pages, « tu », SEO, Apple

- [ ] [S] D1: `support-chat` knowledge base (from `plan_limits` + prices + FAQ + how-tos + refunds) + account read + « tu » + `source` + handoff; gpt-4.1-mini
- [ ] [W] D1: greeting + 6 suggestions + source line + « Transmettre au support » + locale sent
- [ ] [A] D1: same in the app chat
- [ ] [S] D1: `scripts/lia-questions.mjs`, 25-question report
- [ ] [C] D1: report reviewed by the client
- [ ] [W] E1: shared plan card (mockup) + comparison table, used on home / tarifs / billing (the table's rows and the card lists already match the mockup since Phase 1; left: card design, currency, « Pour découvrir Vidcica » lines, ✓/– lists, price notes, the billing page's use)
- [ ] [A] E1: paywall = the 4 mockup cards (Free included)
- [ ] [W] W0: new home page, every mockup section (FR word for word + EN)
- [ ] [W] W0: header/footer as the mockup (Suppression des données, support@, Rouyn-Noranda, Google Play)
- [ ] [W] G1: /fonctionnalites from « Tout le studio » + 5 networks + images matching titles
- [ ] [W] G2: /cas-usage layout (photo / ideas / CTA) + 3 videos per page
- [ ] [S] G2: 9 videos generated (after JSON2Video paid) — [C] approved
- [ ] [W] G3: « tu » sweep (messages.ts, blog, site.ts, support, create schema) + `check:tu` in `pnpm verify`
- [ ] [A] G3: « tu » sweep (i18n.ts, locales/fr-FR.json) + `check:tu`
- [ ] [W] I2: FAQ answers in HTML (`<details>`) + server-side FAQPage JSON-LD (home, /faq)
- [ ] [W] I2: home title + `pageMetadata()` (title, description, og:title) on every page
- [ ] [O] A5: Apple Developer check (Services ID, domains, return URL, key expiry) + private relay
- [ ] [O] A5: sign-up + login test on desktop, Android browser, Android app

## Phase 9 — Release (everything together)

- [ ] Gate green: test matrix (4 plans), Lia report, Stripe harness, `pnpm verify` + `pnpm e2e` + screenshots, app green sequence + emulator CUJ-1/2/4/5/8, JSON2Video paid, SMTP, storage limit
- [ ] Closing migrations (guards live, policies narrowed, `publish_jobs` direct insert closed)
- [ ] Function deploys recorded in `supabase/functions/README.md`
- [ ] `cahier_v2 = on`
- [ ] [O] Live Stripe `currency_options` (go)
- [ ] Legal dates = release day
- [ ] Web merged + pushed (Vercel)
- [ ] Android 1.3.0 / vc22: clean prebuild, permissions diff vs v21 — [O] Play upload
- [ ] Post-release watch (renders, schedules, imports, publish errors)
- [ ] Docs: AGENTS.md, debt map, functions README, web product docs, CUJs, specs index → shipped
