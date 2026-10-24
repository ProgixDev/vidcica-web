# Spec 008 — Client "Cahier technique" (2026-10-23)

- **Status:** active
- **Type:** enhancement (client change request: signup, create, library, assistant, billing, plan limits, pages, legal, currency, SEO)
- **Requested by / owner:** Kenn Dimitri (client), via the owner
- **Date:** 2026-10-24
- **Slice / areas touched:** `src/app/page.tsx` + marketing pages, `src/features/{auth,create,videos,publish,support,billing,networks,profile}`, `src/lib/vidcica/*`, `src/middleware.ts`, `src/components/{ui,…}`; the mobile app and the Supabase server (repo `vidcica`) change in step

## Problem (the why)

The client reviewed vidcica.com on 2026-10-20 and sent a 31-page technical brief, `Vidcica - Cahier technique (1).pdf`. It is kept untracked in `docs/`. The mockup is `Vidcica - Maquette du site.zip`, with `site/index.html`.

The brief has 30 numbered fixes and makes 3 points:

- **Plan limits are not enforced.** A Free account made a 30 s 1080p video.
- **The client's promises are not kept.**
  - Users can't edit the script.
  - No cost is shown before generating.
  - Videos carry another company's watermark.
- **The site doesn't match the new design.** The home page is fully replaced by the mockup.

The same fixes apply to the mobile app, which uses the same backend.

## Desired behavior (the what)

The site and the app behave as the mockup and the brief describe:

- **Signup.** It asks for first name, last name and niche, has an eye button on the password, and after sending shows « Vérifie ta boîte courriel » with a resend countdown.
- **Creating a video takes three steps:** idea, then an editable script shown as normal text, then the video. Before each step, the person sees what it costs in credits and what is left.
- **Each plan's limits are visible in the interface and refused by the server.** That covers duration, quality, models, voice-over, networks and accounts, scheduling, storage, library, import, logo, ads and the brand kit. A locked option names the plan that unlocks it.
- **« Mes vidéos » has three additions:**
  - the script, with actions in each video's ⋮ menu;
  - a storage gauge;
  - import from the phone.
- **Scheduling follows the plan:** how far ahead, and how many videos per day.
- **Lia answers from a knowledge base and from the person's own account,** using « tu ».
- **Prices are shown in the visitor's currency** (CAD in Canada, USD in the US, EUR elsewhere), and checkout uses that currency.
- **The public pages are updated:** home, /fonctionnalites, /cas-usage, the legal texts and SEO.

Every user-facing French text uses « tu ».

## Acceptance criteria

Each criterion is numbered after the brief, so `AC-B4` is brief item B4. The server rules are checked by `vidcica/scripts/plan-limits-matrix.mjs`. The UI rules are checked by e2e tests, screenshots, and an emulator run on the app.

### Home page

- **AC-W0:** The home page reproduces every section of the mockup's home page, with its French copy word for word and an English version.
  - The sections, in order: nav, hero video, stats, 4 steps, publish, examples, studio, trades, boost, pricing with currency, trust, testimonials, FAQ, final CTA, footer.
  - Its calls to action lead to account creation.

### A — Signup

- **AC-A1:** The signup form has Prénom, Nom, Adresse e-mail, « Ta niche » and Mot de passe.
  - « Ta niche » lists 12 trades plus « Autre… ».
  - Choosing « Autre… » shows « Écris ta niche ».
  - First name, last name and niche are saved to the profile, including when email confirmation is required.
- **AC-A2:** Every password field has an eye button that shows and hides the text.
- **AC-A3:** After « Créer mon compte », the form is replaced by « Vérifie ta boîte courriel ». It shows:
  - the address used;
  - « Renvoyer l'e-mail » with a visible countdown;
  - a link to correct the address.

  A rate-limit error shows a French or English sentence with the seconds left, never Supabase's raw English.

- **AC-A4:** Confirmation emails go out through a production sender (owner action), using templates written in « tu ».
- **AC-A5:** « Continuer avec Apple » works end to end, sign-up then login, on desktop and on Android (the browser and the app).

### B — Create a video

- **AC-B1:** After the idea, the script appears as one formatted text, in paragraphs and not as numbered sentences. The person can edit it anywhere, then click « Générer la vidéo ».
- **AC-B2:** The cost is shown next to the button, with the balance left, and recomputed whenever the model, the duration or the text changes.
  - Script: 5 credits per started block of 50 words.
  - Video: by model and duration.
  - Stock: 0.

  The server charges exactly these amounts and refuses when the balance is too low.

- **AC-B3:** The durations offered are 15 s, 30 s, 60 s, 1 min 30, 2 min and 3 min.
  - Maximum per plan: Free 15 s, Starter 30 s, Pro 1 min 30, Studio 3 min.
  - Durations above the plan stay visible with 🔒 and the plan that unlocks them.
  - The server refuses a duration above the plan.
- **AC-B4:** Every limit in the table below is locked in the interface and refused by the server, even when the interface is bypassed.
- **AC-B5:** On a plan without voice-over, « Voix off + sous-titres » cannot be checked: it is greyed, with 🔒.
  - Next to it, « ! » shows « Voix off et sous-titres : réservés à partir de l'offre Starter ».
- **AC-B6:** The model list shows each plan's real resolution (720p on Free and Starter), and the file is produced at that resolution.
- **AC-B7:** No external service's logo appears on any video.
  - Free and Starter videos carry the Vidcica logo.
  - Pro and Studio videos carry none, or the brand kit's logo.

### C — Mes vidéos

- **AC-C1:** Each video's ⋮ menu offers:
  - Voir le script: a dialog with the text, laid out as in B1;
  - Copier le script;
  - Modifier et regénérer: back to the script step with this text;
  - Programmer;
  - Télécharger, Dupliquer and Supprimer.
- **AC-C2:** A storage gauge (« X Mo sur Y ») counts generated and imported videos.
  - Limits: Free 30 MB, Starter 500 MB, Pro 1 GB, Studio 4 GB.
  - « Importer depuis mon téléphone » is available from Starter up.
  - At the limit, import and generation are blocked, with « Passer à l'offre … ».
- **AC-C3:** Scheduling follows the plan:
  - Free: none, with a link to the plans;
  - Starter: up to 3 days ahead, 2 videos per day;
  - Pro: 7 days, 4 per day;
  - Studio: unlimited.

  Days beyond the limit, or already full, are greyed. The server refuses anything outside the plan.

### D — Lia

- **AC-D1:** Lia answers prices, durations, credits, scheduling and how-to questions.
  - She uses a knowledge base built from the pricing, FAQ, features, terms and this brief.
  - She reads the person's own account: plan, credits left, storage, connected networks.
  - She uses « tu ».
  - When she doesn't know, she offers to pass the question to support.
  - Before launch, a report of 25 common questions is reviewed.

### E — Billing

- **AC-E1:** The billing page shows exactly the mockup's pricing cards (same prices, credits and lines), in the site's currency.

### F — Plan limits (server-checked)

- **AC-F:** The server enforces this table.

  |                             | Gratuit       | Starter           | Pro                            | Studio     |
  | --------------------------- | ------------- | ----------------- | ------------------------------ | ---------- |
  | Prix                        | 0 €           | 25 €/mois         | 45 €/mois                      | 99 €/mois  |
  | Crédits / mois              | À la carte    | 150               | 300                            | 600        |
  | Durée max                   | 15 s          | 30 s              | 1 min 30                       | 3 min      |
  | Qualité max                 | 720p          | 720p              | 1080p                          | 1080p      |
  | Modèles                     | Stock         | + Kling, Seedance | + LTX, Seedance Pro, Kling Pro | + Veo 3.1  |
  | Voix off + sous-titres      | Non           | Oui               | Oui                            | Oui        |
  | Réseaux connectés           | 1             | 3                 | 5                              | 5          |
  | Comptes par réseau          | 1             | 1                 | 5                              | Illimité   |
  | Programmation               | Non           | 3 jours           | 7 jours                        | Illimitée  |
  | Vidéos programmées / jour   | —             | 2                 | 4                              | Illimité   |
  | Stockage                    | 30 Mo         | 500 Mo            | 1 Go                           | 4 Go       |
  | Bibliothèque                | 10 vidéos     | 100 vidéos        | 500 vidéos                     | Illimitée  |
  | Import téléphone            | Non           | Oui               | Oui                            | Oui        |
  | Logo Vidcica                | Oui           | Oui               | Non                            | Non        |
  | Logo d'un service externe   | Jamais        | Jamais            | Jamais                         | Jamais     |
  | Publicités Meta + prospects | Non           | Non               | Oui                            | Illimitées |
  | Kit de marque               | Non           | Non               | Oui                            | Oui        |
  | Support                     | Centre d'aide | E-mail            | Prioritaire                    | Dédié      |
  - The script costs 5 credits per 50 words, and a Stock video costs 0 credits, on every plan.
  - On a test account for each plan, every attempt to go over a line is refused by the server.

### G — Other pages

- **AC-G1:** /fonctionnalites is rebuilt from the mockup's « Tout le studio » section.
  - It shows the 5 networks: TikTok, Instagram, Facebook, YouTube Shorts and LinkedIn.
  - Each image shows what its title says.
- **AC-G2:** Each /cas-usage/[métier] page uses the mockup's layout: photo, 3 ideas and a CTA.
  - Each idea has a real Vidcica video.
- **AC-G3:** Pages, emails and app messages address the person with « tu », never « vous ». A check blocks any regression.

### H — Legal

- **AC-H1:** Privacy §3 lists TikTok, Instagram, Facebook, LinkedIn and YouTube.
- **AC-H2:** Privacy has a « Données Meta (Facebook et Instagram) » section.
  - « Suppression des données » explains how to delete one's account and data.
  - Its address is the one registered with Meta.
- **AC-H3:** Privacy §8 gets the client's text: EU and North American providers.
- **AC-H4:** Privacy names « Vidcica — support@vidcica.com » as the person responsible for personal information (Loi 25).
- **AC-H5:** Terms §3 states the refund rule.
  - A « Droit applicable » article names the laws of Québec and Canada.
  - The date is the release date.

### I — Technical

- **AC-I1:** Currency follows the visitor's country (header `x-vercel-ip-country`): CAD in Canada, USD in the US, EUR elsewhere.
  - Plan prices: 39/71/156 $ CA and 28/51/111 $ US.
  - A manual selector is kept.
  - Checkout charges in the currency shown.
  - Credit packs stay in EUR (owner's decision).
- **AC-I2:** FAQ answers are in the server HTML, with FAQPage JSON-LD generated server-side.
  - The home title is « Générateur de vidéo IA — essai gratuit · Vidcica ».
  - Every page has its own title and og:title.

### Also in the client's table

- **AC-MA:** A user can connect up to the plan's number of accounts per network (1/1/5/unlimited), choose the accounts when publishing, and disconnect each one.
- **AC-BK:** Pro and Studio can set a brand kit (logo and caption colour), which is applied to their videos.

## Out of scope

- **Testimonials:** the mockup's 3 example quotes ship as they are (owner's decision). Real quotes come later from the client.
- **Purchases in the mobile app:** none (Play policy, `FEATURES.checkout`). The app only shows prices.
- **Mockup annotations are not shipped:** « Nouveau », « Liste déroulante », « Bouton œil », « Exemple à remplacer », « Simuler l'offre » and the bottom demo bar.

## CUJ impact

- Extends CUJ-1 (sign up/in), CUJ-2 (create a video), CUJ-4 (publish/schedule), CUJ-5 (billing), CUJ-8 (library) and the support chat.
- Update `docs/product/critical-user-journeys.md` at ship.

## Decisions (owner, 2026-10-24)

- One release at the end (server, web and Android together). Until then, server code ships switched off: `app_config.cahier_v2`.
- Every script is charged, whether AI-written or pasted. No welcome credits.
- Stock videos get voice-over, subtitles and music from Starter up.
- Packs stay in EUR.
- The 9 missing use-case videos are generated with Vidcica, then approved.
- Multi-account and the brand kit are built as the client's table says.
- The full plan and design: `plan.md`.
