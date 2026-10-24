# Plan 008 — Client "Cahier technique": server, website and app

> Approved by the owner on 2026-10-24. This is the reference design; `tasks.md` tracks progress.

## Context

On 2026-10-23 the client (Kenn Dimitri) sent two files:

- `Vidcica - Cahier technique (1).pdf`: 31 pages. An untracked copy is in `vidcica-web/docs/`.
- `Downloads/Vidcica - Maquette du site (2).zip`: `site/index.html` + `img/` + `media/`.

The PDF lists 30 numbered fixes (A1…I2) covering signup, video creation, the library, the assistant, billing, plan limits, pages, legal texts and technical settings. It also says the **home page is fully replaced by the mockup**; that isn't itemised, so it's tracked here as **W0**. The mockup's app screens (Inscription, Créer une vidéo, Mes vidéos, Assistant) are the design reference for A–D. Every item goes on the **website, the app and the shared Supabase server**, one by one, nothing forgotten.

**Today (code + production, checked 2026-10-24):**

- **Plan rules the server enforces:** the model allowed per plan; voice-over off on Free (and silently dropped on Stock); networks Free 1 / Starter 3; Boost Pro+ only; 20 renders a day.
- **Not enforced anywhere:** duration per plan, quality per plan, scheduling, storage, library size, import, accounts per network.
- **Users can write some data directly:**
  - the `videos` table (any status, any `video_url`);
  - the `publish_jobs` table;
  - their own folders in the `videos` and `user-uploads` storage buckets.
- **60 s cap:** `MAX_VIDEO_SEC = 60` in `enqueue-generation` and `generation-worker`, at most 12 scenes, plus the `generate-plan` clamp.
- **JSON2Video is on its FREE plan:** its watermark is on our videos (B7), and it refuses anything over 60 s (debt map l.44-62).
- **Storage limits:** the `videos` bucket has no file-size limit of its own, so the project default applies (50 MB unless raised).
- **Credits:**
  - Video cost = `round(costFactor × max(12, round(sec × 0.8)))`, and Stock = 0.
  - The script is free.
  - Free gets 0 credits; the app wrongly shows 20.
- **Script screen:** on the web, a numbered, read-only list of scenes. In the app, the render starts right after the plan, with no review.
- **Signup:**
  - Web: no name field, no eye button, no "check inbox" screen, no resend, raw English errors.
  - App: first name only; niche chips; no resend countdown.
  - `profiles` has no first_name or last_name column.
- **Library:**
  - The menus offer only Télécharger, Dupliquer, Supprimer.
  - Import exists but is not tied to the plan and has no quota.
  - No file sizes are stored.
  - The app's « annuler la programmation » leaves the publish job queued.
- **Lia** (gpt-4.1-nano):
  - The prompt forbids giving prices.
  - She gets no account data.
  - The web greeting says "vous".
- **Money:** EUR only.
- **Formal "vous" copy:** 244 FR keys on the web and about 51 in the app.
- **SEO:** the web FAQ answers are not in the server HTML.
- **Users:** 53 in production (51 Free plus our Pro and Studio test accounts). No real paying customer yet.

## Decisions

**User (2026-10-24):**

1. **One release at the end**: server, web and Android together.
2. **Testimonials:** the mockup's 3 example quotes ship as they are.
3. **Currency:** credit packs stay EUR; only the 3 plans get CAD/USD.
4. **Every script is charged**, AI-written or pasted: 5 credits per started 50 words. No welcome credits.
5. **Stock videos** get voice-over, subtitles and music from **Starter** up.
6. **G2:** we **generate** the missing use-case videos; the user approves them.
7. **Multi-account and brand kit:** done as the client's document says. Pro gets 5 accounts per network plus the brand kit; Studio gets unlimited accounts plus the brand kit.

**Mine (change them at approval if needed):**

- **Dark server deploys.**
  - New server code reaches production early but stays off for everyone except our 4 test accounts. A switch in `app_config` controls it: `cahier_v2` = `off` / `testers` / `on`, plus `cahier_v2_testers`.
  - That's the only way to test the new web and app against the real backend. Release day switches it on for everyone.
  - Migrations stay additive until release.
- **The rule numbers live in one database table, `plan_limits`.**
  - The server functions, the database guards and Lia all read it.
  - Web and app keep a display copy, guarded by a web unit test and by the server test matrix.
- **New durations use today's price formula:**

  | Model        | 90 s | 2 min | 3 min |
  | ------------ | ---- | ----- | ----- |
  | Seedance     | 32   | 43    | 65    |
  | Seedance Pro | 72   | 96    | 144   |
  | Kling        | 79   | 106   | 158   |
  | Kling Pro    | 101  | 134   | 202   |
  | LTX          | 137  | 182   | 274   |
  | Veo 3.1      | 151  | 202   | 302   |
  | Stock        | 0    | 0     | 0     |
  - Script prices go in `app_config` (`script_credits_per_block=5`, `script_words_per_block=50`).

- **Scripts are paid once per block of 50 words, tied to the video draft.**
  - An AI rewrite is new work and is charged again.
  - Adding words later charges only the new blocks, shown live, per B2 « recalculer dès que le texte change ».
- **⋮ « Programmer » opens the existing publish page in "Programmer" mode,** with the mockup's day picker.
  - TikTok's posting rules require their privacy/consent screen for every post, so a plain checkbox dialog is not allowed.
  - Free users get the mockup's « L'offre Gratuit ne permet pas la programmation… Voir les offres » dialog instead.
- **Mockup annotations are not shipped:** « Nouveau », « Liste déroulante », « Bouton œil », « Exemple à remplacer », the « Simuler l'offre » bar and the black bottom bar.
- **Copy:** reused word for word, with curly apostrophes (the web typography check requires them); English written for /en.
- **One « Voix off + sous-titres » option**, as in the mockup.
- **Web account deletion gets the 30-day grace period**, like the app and as the terms and `/supprimer-mon-compte` already promise.
- **The data-deletion page keeps its URL `/supprimer-mon-compte`,** which Meta and Play already have.
  - It is retitled « Suppression des données ».
  - `/suppression-des-donnees` redirects to it.
- **Pro Boost** keeps its current limit of 5 active campaigns; Studio is unlimited. The server enforces both.
- **The Android app gets « Continuer avec Apple »** through the web sign-in flow. Otherwise a person who signed up with Apple on the web can't log in to the app.
- **Brand kit** = your logo (pick a corner) plus your caption colour, on Pro/Studio videos.
- **Old app builds (vc21) keep working:**
  - Requests from new clients carry `v: 2`.
  - For old builds, refused voice-over is dropped silently, and their scripts are charged at render time.
  - New refusals show as a generic error until the person updates.

## How we work

- **Branches:** `feat/cahier-technique` in `vidcica` (from `main`) and in `vidcica-web` (from `master`).
  - One conventional commit per item.
  - No push without asking.
  - The PDF and the zip are never committed.
- **Tracker:** `vidcica-web/specs/008-cahier-technique/`.
  - spec.md cites the PDF.
  - tasks.md has one checkbox per ID for Server, Web and App.
  - Boxes are ticked with evidence.
  - The app repo gets `docs/decisions/2026-10-24-cahier-technique.md`, pointing to it.
- **Each item ends with its checks:**
  - App: `npm run lint && npx tsc --noEmit && npm run check:colors && npm run check:shared`.
  - Web: `pnpm verify`.
  - UI changes: screenshots or an emulator run (AVD `H2H_API34`).
- **Server deploys** go through the Supabase MCP, with "repo == prod" written in the functions README.
  - The MCP refuses DROP statements; the owner runs the few needed ones in the SQL editor.
  - Every new shared module (`plan-limits.ts`, `rollout.ts`, `script-credits.ts`) goes into `SYNCED` in `scripts/check-shared-copies.mjs`.

## Checklist (the source of truth)

| ID     | P   | Item                                                                                  | Server         | Web   | App            | Owner / client          |
| ------ | --- | ------------------------------------------------------------------------------------- | -------------- | ----- | -------------- | ----------------------- |
| W0     | —   | Home page = mockup                                                                    | —              | ✓     | —              | —                       |
| A1     | P1  | Prénom, Nom, Ta niche (12 entries + « Autre… » free text), saved to profile           | ✓              | ✓     | ✓              | —                       |
| A2     | P1  | Eye button on password fields                                                         | —              | ✓     | exists, check  | —                       |
| A3     | P1  | « Vérifie ta boîte courriel » + resend countdown + « modifie ton adresse »            | —              | ✓     | ✓              | —                       |
| A4     | P1  | Fast confirmation emails                                                              | "tu" templates | —     | —              | Resend SMTP in Supabase |
| A5     | P2  | Apple sign-in kept and tested                                                         | —              | check | Android button | Apple Developer + test  |
| B1     | P1  | Editable script as one text → « Générer la vidéo »                                    | ✓              | ✓     | ✓              | —                       |
| B2     | P1  | Script + video cost and balance, live, server-checked                                 | ✓              | ✓     | ✓              | —                       |
| B3     | P1  | 15 s…3 min, locked per plan with 🔒 + plan                                            | ✓              | ✓     | ✓              | JSON2Video paid         |
| B4 / F | P1  | Every limit in the table, UI + server, plus the test matrix                           | ✓              | ✓     | ✓              | test inboxes            |
| B5     | P1  | Voice-over locked on Free + « ! »                                                     | ✓              | ✓     | ✓              | —                       |
| B6     | P2  | Right resolution shown and produced per plan                                          | ✓              | ✓     | ✓              | —                       |
| B7     | P1  | No external logo; Vidcica logo on Free/Starter                                        | ✓              | note  | note           | JSON2Video paid         |
| C1     | P1  | ⋮ Voir / Copier le script, Modifier et regénérer, Programmer                          | ✓ (copy RPC)   | ✓     | ✓              | —                       |
| C2     | P1  | Storage gauge, import (Starter+), quotas                                              | ✓              | ✓     | ✓              | bucket size limit       |
| C3     | P1  | Scheduling: days ahead, per day, greyed calendar                                      | ✓              | ✓     | ✓              | —                       |
| F+     | P1  | Several accounts per network (1/1/5/∞)                                                | ✓              | ✓     | ✓              | DROP lines              |
| F+     | P1  | Brand kit (Pro/Studio)                                                                | ✓              | ✓     | ✓              | —                       |
| D1     | P1  | Lia: knowledge base, account read, « tu », handoff, 20+ questions                     | ✓              | ✓     | ✓              | client sign-off         |
| E1     | P2  | Billing cards = mockup Tarifs, in the visitor's currency                              | —              | ✓     | ✓              | —                       |
| G1     | P1  | /fonctionnalites rebuilt from « Tout le studio », 5 networks                          | —              | ✓     | —              | —                       |
| G2     | P2  | /cas-usage layout + 3 videos per page                                                 | —              | ✓     | —              | approve videos          |
| G3     | P2  | « tu » everywhere (pages, emails, app) + mockup texts                                 | ✓              | ✓     | ✓              | —                       |
| H1–H5  | P1  | Privacy §3, Meta section + deletion page, §8, Loi 25, terms §3 + governing law + date | —              | ✓     | ✓              | lawyer; Meta URL        |
| I1     | P1  | Currency by country (CAD/USD/EUR), Stripe                                             | ✓              | ✓     | display        | live Stripe change      |
| I2     | P2  | FAQ in HTML + FAQPage JSON-LD; unique title and og:title                              | —              | ✓     | —              | —                       |

## Phase 0 — Set-up

1. Create the branches, tracker and decision record.
2. Copy the mockup's `img/*.jpg` into `vidcica-web/public/media/` (the 4 videos are already there). Images only; nothing from the zip runs.
3. Set up 4 test accounts: `qa-free`, `qa-starter`, `qa-pro`, `qa-studio`.
   - The owner gives us 4 inboxes.
   - Tiers are set by SQL.
   - Passwords go in `C:\dev\vidcica-secrets\plan-test-accounts.env`.
4. Add `_shared/rollout.ts` (`isV2(userId)`) and the `cahier_v2` rows.

## Phase 1 — Plan limits on the server (B4, F)

**`plan_limits` table**

- Readable by all, writable by no one.
- Seeded with exactly the client's table:

| Rule                             | Free  | Starter           | Pro                            | Studio |
| -------------------------------- | ----- | ----------------- | ------------------------------ | ------ |
| Max duration                     | 15 s  | 30 s              | 90 s                           | 180 s  |
| Quality                          | 720p  | 720p              | 1080p                          | 1080p  |
| Models                           | stock | + kling, seedance | + ltx, seedance-pro, kling-pro | + veo  |
| Voice-over                       | no    | yes               | yes                            | yes    |
| Networks                         | 1     | 3                 | 5                              | 5      |
| Accounts per network             | 1     | 1                 | 5                              | ∞      |
| Scheduling: days ahead / per day | 0 / 0 | 3 / 2             | 7 / 4                          | ∞      |
| Storage                          | 30 MB | 500 MB            | 1 GB                           | 4 GB   |
| Library                          | 10    | 100               | 500                            | ∞      |
| Phone import                     | no    | yes               | yes                            | yes    |
| Vidcica logo on videos           | yes   | yes               | no                             | no     |
| Active campaigns                 | 0     | 0                 | 5                              | ∞      |
| Brand kit                        | no    | no                | yes                            | yes    |

**`videos` table**

- New columns, written only by the server: `size_bytes`, `source` (`generated` | `imported`), `script_paid_blocks`.
- Backfilled from `storage.objects`.
- Plus `profiles.timezone`.

**Guard trigger on `videos`** (BEFORE INSERT OR UPDATE), for user sessions only, and switch-aware:

- On insert, the server-only columns are forced empty, `status` must be `brouillon`, and `video_url` must be null.
- On update:
  - the server-only columns and `video_url` cannot change;
  - nothing can leave `brouillon`/`generating` except through the server;
  - restoring a finished video from the trash checks the library limit first.
- The app's current status writes for finished videos (`pret` / `programme` / `publie`, `videos.store.ts:377-611`) stay allowed.

**Helpers**

- `plan_for(uid)`.
- `plan_usage(uid)`: storage in bytes, finished non-deleted videos, connected accounts.
- `my_plan()` RPC: limits, usage, credit balance and the script prices. `app_config` is closed to users, so clients need this RPC.

**`_shared/plan-limits.ts`**

- Exports `loadPlan(admin, userId)`, `planError(code, {plan, requiredPlan, limit})` (always a 403 naming the plan that unlocks it), and `minPlanFor()`.
- New codes:
  - `duration_not_allowed`
  - `voice_not_allowed`
  - `library_full`
  - `storage_full`
  - `import_not_allowed`
  - `schedule_not_allowed`
  - `schedule_too_far`
  - `schedule_day_full`
  - `account_limit`
  - `campaign_limit`

**`enqueue-generation`** (`index.ts:60-83, 178-367`)

- Duration ≤ plan, judged on the scenes (never on the user-writable `duration_sec`).
- The model must be in the plan's list, including the no-model path that today falls back to Luma.
- Voice-over:
  - refused for v2 clients when the plan has none;
  - dropped silently for old builds;
  - Stock voice allowed for Starter+ (remove `provider !== 'pexels'` at l.217).
- Quality = the lower of plan and model.
- Library and storage checks.
- Caps follow the plan: up to 180 s, 36 scenes, and a word cap tied to the plan's maximum seconds.
- The plan's maximum seconds and the logo/brand flags go into the render settings.
- The status change to `generating` uses the service role.
- Cost formula unchanged, minus the 60 s clamp.

**`generation-worker`:** fails the job and refunds when the voice-over runs past the plan's maximum (scenes are stretched to the voice today, `providers.ts:1097-1099`).

**`generate-plan`:** refuses a length above the plan before doing anything, including the `length` that old builds send.

**`create-ad-campaign` / `set-campaign-status`:** Pro is limited to 5 active campaigns.

**Clients**

- Update the values in web `src/lib/vidcica/tiers.ts` and app `src/lib/tiers.ts`; Free credits read « À la carte ».
- Map the new codes in web `src/lib/vidcica/generation.ts` and app `src/lib/ai-generation.ts` to a clear message plus « Passer à l'offre … ».

**Test matrix:** start `vidcica/scripts/plan-limits-matrix.mjs`.

- It signs in as each test account and tries to exceed every row: duration, quality, model, voice, networks, accounts, scheduling, storage, library, import, credits.
- Above the limit must be refused; at the limit must work.
- It grows with every phase.

## Phase 2 — Rendering: logos, brand kit, resolution, long videos (B7, B6, B3)

1. **Owner:** move JSON2Video to a paid plan. Credits are counted in rendered seconds: Hobby 3,000 s/month, Professional 12,000 s/month (better for 3-minute videos). This alone removes their watermark and the 60 s refusal.
2. **Owner/us:** raise the storage file limit to at least 200 MB, both the `videos` bucket and the project limit.
3. **`dispatchAssembly`** (`generation-worker/_shared/providers.ts:1024-1217`). JSON2Video supports a whole-movie `image` element with `position` and `duration: -2`.
   - Add the Vidcica logo (`app-assets/brand/vidcica-watermark.png`, drawn from the mockup's logo) on Free/Starter.
   - Add the user's logo plus caption colour for a Pro/Studio brand kit (the colour is hard-coded `#FF8A3D` today, l.1148-1157).
   - No single-clip shortcut when a logo is needed (worker l.187-209).
   - Resolution follows the plan (l.1051-1058).
4. **Long videos.**
   - Worker `MAX_VIDEO_SEC` goes to 180, and the "stuck" timeout scales with length.
   - Big files are streamed instead of loaded whole:
     - `assembly-webhook:144-151`
     - `providers.ts:797-805` (upload `res.body` with `duplex:'half'`)

     A failed copy fails the job instead of keeping the provider's expiring URL.

   - Publishers:
     - YouTube moves to resumable upload (`publishers.ts:68,98-102`);
     - TikTok sends chunks of 64 MB or less (`:215-220`);
     - LinkedIn streams (`:316-332`);
     - Meta already pulls the URL.
   - Pexels searches are reused across scenes (36 per 3-minute video against a 200/hour limit).
   - `assembly-webhook` saves `size_bytes`.
   - Proof: one real 3-minute render (Seedance, test account) and one private/unlisted 3-minute publish on each of YouTube, TikTok and LinkedIn.

5. **Brand kit.**
   - A `brand_kits` table: logo path, corner, colour, on/off. Each user sees only their own row.
   - New pages: web `/account/brand` and app `settings/brand`. Pro/Studio only, « 🔒 Pro » otherwise.
   - The server applies it only when the plan allows.
6. **UI.**
   - Model menus show the plan's resolution (« Stock · 720p » on Free/Starter): web `model-menu.tsx`, app `PromptComposer.tsx`.
   - The result and detail screens say « Offre Starter : le logo Vidcica apparaît sur la vidéo. Il est retiré à partir de l'offre Pro. »

## Phase 3 — Create a video: idea → script → video (B1, B2, B3, B5)

**Server — script charging, tied to the draft**

- A new `consume_script_credits` (service role only): it doesn't count toward the 20/day cap, and it writes ledger reason `script`. It is kept apart from the video charge, so a failed render refunds the video but not the script.
- `generate-plan` (and `write-script`'s script action, and `improve-script`) take `mode` and the `videoId` of a draft. Charging happens only after OpenAI succeeds:

  | Mode                | What happens                                   | Charge                                                            |
  | ------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
  | `write` / `rewrite` | AI writes the script                           | new script's blocks charged; `script_paid_blocks` := those blocks |
  | `paste`             | user's own script                              | only the blocks beyond those already paid                         |
  | `resegment`         | edited text split into scenes before rendering | free unless the edit added blocks                                 |
  - The script comes back in **paragraphs**, never numbered sentences.
  - The AI gets a word budget, so the charge never exceeds the cost shown.
  - `ideas` is never charged.

- `enqueue-generation` charges any blocks still unpaid for the final text, then the video. That is how old builds (no draft id) pay for their script: once, at render, at least one block. Nobody pays twice, and nobody renders with an unpaid script. Calls without a draft are rate-limited.
- « Dupliquer » and « Modifier et regénérer » go through a server function `copy_video_draft(id)` that carries the paid blocks over.

**Web** (`src/features/create/*`). The mockup's 3 steps, with its copy:

1. **Idée.** Ton idée (the Idée / Script pills stay), then:
   - **Modèle:** locks and the plan's resolution.
   - **Durée:** 15 s, 30 s, 60 s, 1 min 30, 2 min, 3 min; locked ones show « 🔒 Pro »… (`options.ts:17`; `schema.ts:20,46` raised to 180 s / 36 scenes).
   - **Format, Voix, Musique.**
   - **« Voix off + sous-titres »:** greyed with 🔒 on Free, plus a « ! » button showing « Voix off et sous-titres : réservés à partir de l'offre Starter ».
   - **The plan's lock note.**
   - **Cost bar:** « Script ≈ N mots : X crédits · Vidéo : Y crédits » plus « Solde ». The button « Écrire le script » is disabled when the balance is too low, with a link to packs.
2. **Ton script.**
   - An auto-growing text area with paragraphs, plus « N mots » and « Clique n'importe où… ».
   - « Réécrire le script · X crédits » and « ← Modifier l'idée ».
   - A length guard tied to the duration.
   - « Coût de la vidéo : Y crédits » (plus « + Z crédits : texte allongé » when needed) and « Il te restera … » or « Solde insuffisant… ».
   - « Générer la vidéo ».
3. **Vidéo.**
   - Progress, then « Ta vidéo est prête ✓ » with its info line.
   - Buttons: « Publier ou programmer », « Télécharger le MP4 », « Nouvelle vidéo ».
   - « Script de la vidéo », always available, plus the logo note.

- `plan-review.tsx` is replaced.
- The draft is created at « Écrire le script », so `/create?draft=` resumes at step 2.
- `cost.ts` gets `scriptCost()`, with unit tests that copy the server table.

**App**

- `PromptComposer.tsx` and `VideoSettingsPanel.tsx` get the same locks, durations, merged voice option, « ! » (a small Sheet) and cost line.
- New `app/generate/review.tsx` reuses the text area and word count of `app/generate/script.tsx`.
- `app/generate/index.tsx` is split into script, then review, then render.
- `src/lib/credits.ts` gets `scriptCost()`.
- With too few credits: « Recharge tes crédits sur vidcica.com ».

## Phase 4 — Signup (A1–A4 and the app side of A5)

**Server.**

- `profiles.first_name` and `last_name`.
- `handle_new_user` (in `20261019170000_remove_threads.sql`) copies first name, last name and niche, plus Google's name when present.
- `display_name` stays the first name.

**Web `features/auth`.**

- Sign-up fields:
  - Prénom and Nom on one row.
  - E-mail.
  - « Ta niche »: Restaurant et food, Immobilier, Coach sportif, E-commerce, Beauté et coiffure, Mode et vêtements, Créateur de contenu, Éducation et formation, Santé et bien-être, Voyage et tourisme, Finance et assurance, Automobile, and Autre… (which opens « Écris ta niche »).
  - Password.
- The audience field moves to the profile only.
- A new `components/ui/password-input.tsx` (eye button) is used for sign-up, sign-in and reset. It replaces the reset page's checkbox.
- After sign-up, the « Vérifie ta boîte courriel » panel shows:
  - the email used;
  - « Renvoyer l'e-mail dans 0:59 » (Supabase's 60 s window; `auth.resend`; reuses the forgot-password "sent" view and the phone-OTP cooldown);
  - « Rien reçu ? … modifie ton adresse ».
- Rate-limit errors become « Attends N secondes… » (FR/EN) and start the countdown.
- Google, Apple and phone sign-ups without a name or niche get a one-time « Complète ton profil » step.
- Profile edit gets the same fields.

**App.**

- `register.tsx`: the name step gets Prénom + Nom; the niche step becomes the same list, reusing the Sheet dropdown from `profile-setup.tsx`, with free text for « Autre… ».
- `check-inbox.tsx`:
  - a 60 s countdown (the pattern from `otp.tsx:48-72`);
  - « modifie ton adresse » back to the email step;
  - the spam hint.
- `auth.store.ts` handles the rate-limit message and sends the last name.
- Settings profile gets the same fields.
- Android gets « Continuer avec Apple » through the web flow, like Google.

**Emails (A4, G3).**

- `supabase/email-templates/*.html` rewritten with "tu", FR and EN; the owner pastes them in.
- Owner: Resend SMTP, following `docs/release/transactional-email-setup.md`, and a higher email rate limit.

## Phase 5 — Mes vidéos (C1–C3)

**C1 — video menu**

- Web `video-list.tsx` CardMenu, and app `LibraryActionsSheet.tsx` with a visible ⋮ on `LibraryGridCard.tsx`:
  - **Voir le script** opens a dialog or sheet « Script · {titre} », with paragraphs, « Copier le script » and « Modifier et regénérer ».
  - **Copier le script** (`expo-clipboard` in the app).
  - **Modifier et regénérer** reopens step 2 with the text in a new draft, through `copy_video_draft`.
  - **Programmer.**
  - **Télécharger, Dupliquer, Supprimer** stay.
- Script items are hidden for imported videos.
- The web video detail page gets « Script de la vidéo ».

**C2 — storage and import**

- New `import-video` function:
  - checks import, library and storage;
  - returns a signed upload URL;
  - on finalize, reads the real size, then creates the row (`source=imported`) or removes the file.
- At release, user write policies narrow:
  - `user-uploads` accepts images only;
  - the `videos` bucket accepts only `{uid}/thumb/*.jpg|png|webp` (app thumbnails).
- Generation is refused when storage is full.
- A daily cleanup deletes the files of videos left in the trash for 30 days (nothing deletes files today).
- **Web `/videos` header and app library header:**
  - « Stockage », a bar, and « X Mo sur Y · vidéos générées et importées »;
  - « Offre Starter · 100 vidéos max · 3 réseaux connectés »;
  - « Importer depuis mon téléphone » (disabled on Free: « Disponible à partir de Starter »);
  - at the limit, « Passer à l'offre … ».

**C3 — scheduling**

- `enqueue-publish`:
  - writes jobs with the service role (it uses the user's session today), so direct `publish_jobs` inserts can then be closed;
  - only accepts a finished video stored with us;
  - checks how far ahead, and how many videos per local day (timezone sent by the client, else `profiles.timezone`, else UTC).
- A new `schedule_availability(tz)` returns 14 days of counts and the limits.
- A real cancel: queued jobs go to `cancelled`, used by both clients. The app's cancel only changes the video status today, and the job still publishes.
- **Web publish page** (`publish-flow.tsx:389-428`):
  - `datetime-local` is replaced by the mockup's day chips, greyed beyond the limit or when full (tooltip says why), plus an hour picker;
  - the plan line, e.g. « Offre Starter : jusqu'à 3 jours à l'avance, 2 vidéos maximum par jour… »;
  - Free: the option is locked and shows the « Voir les offres » dialog.
- **App:** `SchedulerSheet.tsx` gets the same limits and the Free message.

## Phase 6 — Several accounts per network (Pro 5, Studio unlimited)

1. **Schema.**
   - The owner, in the SQL editor, drops three unique rules: `networks_user_id_platform_key`, `publish_jobs_active_uq`, and the primary key of `video_metrics` (video_id, platform).
   - A migration then adds: a unique index on (user, platform, `external_user_id`); `publish_jobs.network_id`; an active unique index on (video, network); `video_metrics` keyed by network.
2. **`oauth-callback`.**
   - It updates the same external account, fills the empty seeded row, or adds a row within the plan.
   - It now counts accounts, not only platforms (`plan-limits.ts:43`; `oauth-callback:170-174`).
   - Meta: the Page picker can pick several Pages with their Instagram accounts.
   - Google gets `prompt=select_account`.
   - TikTok and LinkedIn show a hint to switch accounts in the browser first.
3. **Everything that reads one row per platform moves to `network_id`:**
   - `enqueue-publish` (deduplicated by account), `publish-job`, `creator-info`;
   - `refresh-tokens`, `sync-video-metrics`, `verify-published-posts`, `delete-post`;
   - the 11 copies of `_shared/meta.ts`, which feed `create-ad-campaign`, `resolve-ad-account`, `sync-ad-insights` and `set-campaign-status`;
   - `meta-select-page`, `meta-disconnect`, `meta-deauthorize`;
   - web `src/lib/vidcica/oauth.ts:208-219`.

   Old requests that send only `platforms` use the platform's first connected account.

4. **Screens.**
   - Web `/networks` and the app's networks screens: accounts under each network, « Ajouter un compte » (or « 🔒 Pro : 5 comptes par réseau »), and disconnect per account.
   - The publish flows let the person pick accounts.
   - Analytics show the account name.

## Phase 7 — Legal (H1–H5) and currency (I1)

**Privacy (web `src/app/privacy/page.tsx`)**

- **H1:** §3 gets the client's sentence, which lists TikTok, Instagram, Facebook, LinkedIn and YouTube.
- **H2:** a new « Données Meta (Facebook et Instagram) » section, modelled on §4: what is read, why, never resold. Sections after it are renumbered.
- **H3:** the client's §8 text.
- **H4:** « Responsable de la protection des renseignements personnels : Vidcica — support@vidcica.com ».

**Deletion page (H2)**

- `/supprimer-mon-compte` becomes « Suppression des données », in "tu", covering web, app and email.
- `/suppression-des-donnees` redirects to it, and a footer link is added.
- Web deletion uses `request_account_deletion` (30 days) instead of `admin.deleteUser` (`features/auth/actions.ts:20-35`).

**Terms (H5)**

- The new §3.
- A « Droit applicable » article: Québec / Canada.
- The date is set to release day.

All H texts in EN too. The app's copies in `src/lib/legal-content.ts` (6-section privacy, dated 1er mai 2026) are replaced by the same texts.

**I1 — web**

- `middleware.ts` reads `x-vercel-ip-country`: CA → CAD, US → USD, everything else EUR. The choice goes in a cookie, and the manual selector (« Devise · Détectée : … ») overrides it.
- `src/lib/currency.ts` holds the prices: EUR 0/25/45/99, CAD 0/39/71/156, USD 0/28/51/111. Formatted « 39 $ CA ».
- It is used on the home page, /tarifs (and its JSON-LD), /billing and /billing/manage.

**I1 — server**

- `stripe-setup` adds CAD/USD `currency_options` to the 3 existing plan prices. Stripe allows this, so price ids and plan changes stay as they are.
- `create-checkout-session` accepts `currency` for plans; packs stay in EUR.
- A customer whose Stripe currency is already set keeps it.
- First run in test mode with the existing harness, including "CAD subscriber buys an EUR pack". The live change happens at release.

**I1 — app:** prices shown in the device region's currency (display only).

## Phase 8 — Lia, billing cards, home, pages, « tu », SEO, Apple (D1, E1, W0, G1–G3, I2, A5)

**D1 — Lia (`support-chat`)**

- **Knowledge base** (`knowledge.ts`), built from `plan_limits` and the prices, so it updates itself when prices change. It covers:
  - credit rules and examples;
  - packs;
  - the 8 mockup FAQ answers and the /faq answers;
  - how-tos for web and app;
  - refunds (H5);
  - the logo rule;
  - languages and support.
- **Account read** (with the user's session): plan, credits, storage, library and connected accounts.
- **Behaviour:**
  - the « jamais de prix » rule goes; she answers only from the knowledge base;
  - she uses "tu";
  - each answer has a `source` (« Page Tarifs », « Ton compte »…);
  - if she doesn't know, she offers « Transmettre au support », which creates a ticket with the conversation.
- **Model:** gpt-4.1-mini.
- **Clients:** the mockup greeting, its 6 suggestion chips (FR/EN) and the source line. The web now sends its locale (it never does today, `provider.tsx:25`).
- **Test:** `scripts/lia-questions.mjs` asks 25 questions (20 FR + 5 EN) and writes a report for the client.

**E1 — billing cards**

- One presentational card in shared components, with an action slot (the billing feature passes its Stripe and change-plan buttons). Layering stays clean.
- Mockup design:
  - « Pour découvrir Vidcica »;
  - price in the chosen currency;
  - credits line;
  - ✓/– lists, « Tout Starter, plus : »;
  - « Comparer les offres en détail »;
  - price notes.
- Used by the home page, /tarifs and /billing. It replaces the `pricing-cards.tsx` and `paywall.tsx` cards.
- The app's `billing/paywall.tsx` gets the same 4 cards, Free included.

**W0 — home** (`src/app/page.tsx` + marketing components). Section by section from `site/index.html`:

- nav (FR/EN, theme, Se connecter, Commencer);
- hero video with 3 chips;
- 4 stats;
- 4 steps;
- « Une vidéo. Cinq réseaux. » with the horizon picker;
- 3 example videos with sound buttons;
- « Tout le studio »;
- the métiers tabs;
- the Booster funnel;
- Tarifs;
- trust;
- 3 testimonials;
- an 8-question FAQ;
- the final CTA;
- footer (Produit / Métiers / Légal with « Suppression des données », support@vidcica.com, « © 2026 Vidcica · Rouyn-Noranda (Québec) », « Disponible sur le web et Google Play »).

Every CTA goes to `/sign-in?mode=sign-up`.

**G1 — /fonctionnalites**

- « Tout le studio »: 6 cards, each image matching its title (feat-script, feat-voice, f-4, feat-sched, feat-lib, feat-ads).
- The 5-network block, the model pills and a CTA.

**G2 — /cas-usage/[metier]**

- Mockup layout: photo on the left; the 3 ideas, the result line and « Essayer avec mon activité » on the right.
- One video per idea:
  - matching site clips are reused (clip-restaurant, clip-sport, clip-boutique);
  - the other 9 are generated on a Studio test account after the JSON2Video upgrade, so they have no watermark;
  - the user approves them.

**G3 — « tu » sweep**

- Web: `messages.ts`, blog articles, `site.ts:32`, the support store and actions, and `create/schema.ts`.
- App: `src/lib/i18n.ts` and `locales/fr-FR.json`.
- Email templates.
- A new `check:tu` script in each repo (in `pnpm verify` for the web, in the green sequence for the app) blocks formal FR copy.

**I2 — SEO**

- `faq-accordion.tsx` keeps every answer in the HTML (`<details>`).
- FAQPage JSON-LD generated server-side on the home page and /faq.
- Home title: « Générateur de vidéo IA — essai gratuit · Vidcica ».
- `pageMetadata()` gives every page its own title, description and og:title. That includes the privacy and terms titles that stay French on /en.

**A5 — Apple**

- The owner checks Apple Developer: Services ID, domains vidcica.com + www, the Supabase return URL, and the key that expires every 6 months.
- The owner registers the Resend domain with Apple's private relay.
- Then a full sign-up and login on desktop, the Android browser and the Android app.

## Phase 9 — Release (everything together)

1. **Gate.** All of these must be green:
   - the test matrix (4 accounts);
   - the Lia report;
   - the Stripe test harness;
   - `pnpm verify` + `pnpm e2e` + screenshots of every changed page;
   - the app's green sequence + an emulator run of CUJ-1/2/4/5/8;
   - JSON2Video on a paid plan;
   - SMTP sending;
   - the storage file limit raised.
2. **Order.**
   1. Closing migrations: `videos` guard live, policies narrowed, owner DROP lines.
   2. Function deploys, recorded in the README.
   3. `cahier_v2 = on`.
   4. Live Stripe `currency_options` (owner's go).
   5. Legal dates set to today.
   6. Web merged and pushed (Vercel).
   7. Android 1.3.0 / versionCode 22: clean prebuild, permissions diffed against v21; the owner uploads.
3. **Watch:**
   - first real renders (logo, size, length);
   - schedules;
   - imports;
   - `publish_jobs` errors.
4. **Docs:** AGENTS.md, debt map (JSON2Video fixed, trash cleanup), functions README, web product docs, tracker closed.

## Owner and client actions

1. **Owner:**
   - JSON2Video paid plan (before Phase 2 tests).
   - Storage file limit raised to 200 MB or more.
   - Resend SMTP plus rate limit, then paste the "tu" templates (A4).
   - 4 test inboxes.
   - DROP lines (Phase 6).
   - Apple Developer check and tests (A5).
   - Confirm Meta's data-deletion URL is still `https://www.vidcica.com/supprimer-mon-compte`.
   - Go for the live Stripe change.
   - Upload vc22 to Play.
   - Optional: ask Pexels for a higher API limit.
2. **Client:**
   - Lawyer review of the H texts.
   - Sign off the Lia report.
   - Approve the 9 generated videos.

## Flags for the client

- **Strict script pricing vs. the mockup copy.** With every script charged and no welcome credits, « Gratuit, sans carte bancaire. Ta première vidéo dans 3 minutes », « Commencer gratuitement » and « Sans carte bancaire » are no longer true: a new Free user must buy a pack first. The copy ships word for word unless the client changes it.
- **Testimonials:** they ship with the mockup's names, « Prénom N. ».
- **Free support:** Free is « Centre d'aide », but the contact form stays open to everyone; tickets are tagged with the plan.
- **Merged voice option:** the single « Voix off + sous-titres » option means videos with subtitles but no voice disappear.
- **Currencies:** CAD/USD prices are the client's 20 Oct conversions; packs stay EUR.

## Risks

- **3-minute videos.**
  - Provider and JSON2Video seconds grow 3 to 6 times.
  - Memory and timeouts, plus TikTok/YouTube upload sizes (handled in Phase 2).
  - Proven with a real render and a real publish before release.
- **Big-bang release.**
  - Softened by the dark switch, additive migrations and a release checklist.
  - Rollback: redeploy the previous function versions from git, and put `cahier_v2` back to `testers`.
- **Old app builds (vc21)** see generic errors for new refusals. Users with several accounts per network should use the new app.

## Verification (release gate)

- **Server:** `plan-limits-matrix.mjs`.
  - Every row of the client's table is refused above the limit and accepted at the limit, for each plan; a cheap Stock render covers the accepted cases.
  - Direct writes are refused: a `videos` insert as `pret`, a status jump, a foreign `video_url`, a `publish_jobs` insert, a video upload outside `import-video`.
  - Scripts are charged once (write → edit → render; old-build path; duplicate).
  - One real 3-minute render and publish, plus a logo check per plan.
- **Web:** `pnpm verify` + `pnpm e2e` (test credentials), plus `/verify-ui` screenshots of:
  - home;
  - signup + check-inbox;
  - create (3 steps × plans);
  - videos menu, script dialog, gauge, import;
  - schedule picker per plan;
  - billing in EUR, CAD and USD;
  - Lia;
  - legal pages, /fonctionnalites, /cas-usage.

  Also, view-source must show the FAQ answers and JSON-LD, and every page its own title/og:title.

- **App:** the green sequence plus an emulator run of:
  - signup (eye, countdown);
  - create (locks, costs, script screen);
  - library (menu, gauge, import);
  - scheduling limits;
  - Lia;
  - paywall cards.
- **Business:**
  - the Lia 25-question report reviewed;
  - the Stripe harness (CAD checkout, plan change);
  - Resend delivery in under ~1 min.
