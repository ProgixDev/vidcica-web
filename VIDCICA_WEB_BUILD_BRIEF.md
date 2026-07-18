# Vidcica Web — Build Brief for Claude Code

**Purpose of this file:** you (Claude Code) are building the **Vidcica web app** *inside the
NEXTJS-SKELETON*, reusing the **same Supabase backend** that already powers the Expo mobile
app. This brief is the ground truth for the non-obvious decisions. Read it before running any
skeleton skill, then follow the skeleton's own harness (`AGENTS.md`) for the actual work.

Two repos are in the workspace:

- **`ClipFlow/`** — the Expo mobile app ("Vidcica"). Its `supabase/` folder, `src/store/`,
  `src/lib/`, and `src/theme/` are the **reference** for backend contracts and design. Do **not**
  edit this repo.
- **`NEXTJS-SKELETON/`** (or its renamed clone) — where the website is built. This is the only
  place you write code.

---

## 0. The one rule that changes everything: reuse the backend, don't rebuild it

The website and the mobile app are **two front-ends over one Supabase project**
(`scoozakhhmowpzwotxgp`, eu-central-1). The backend already exists and is live: full schema
(credits, videos, generation_jobs, publish_jobs, oauth_states, notifications, subscriptions,
credit_products, support_tickets, leads, ad campaigns) plus **25 edge functions**
(see `ClipFlow/supabase/functions/README.md`).

Therefore:

- **Point the web app at the existing project.** Same `SUPABASE_URL` + anon key as mobile.
- **Do NOT run the skeleton's own migrations.** `NEXTJS-SKELETON/supabase/migrations/000X_*`
  (profiles/notes/subscriptions) are the skeleton's demo schema — they are irrelevant and would
  conflict with the real schema. Treat the skeleton's `supabase/` folder as a *pattern reference
  only*. The source-of-truth DB is `ClipFlow/supabase/migrations/`.
- **Do NOT fork or re-implement the edge functions.** Call them. The web reuses the exact same
  contracts the mobile app uses (`enqueue-generation`, `generate-plan`, `enqueue-publish`,
  `oauth-start`, `create-checkout-session`, `create-portal-session`, `support-chat`, …).
- **RLS is the security boundary.** The anon key is safe in the browser; every table read/write
  is authorized by row-level security. Never use the service-role key outside trusted server code
  (only for account deletion, exactly as the skeleton's `features/auth` already does).

If a change *seems* to require a DB migration, stop — it almost certainly belongs in the mobile
repo's `supabase/` and should be raised with the human, not added to the web repo.

---

## 1. Environment

Map the mobile env vars to the skeleton's naming (values are identical — copy from
`ClipFlow/.env` on the human's machine):

| Mobile (`ClipFlow/.env`)          | Web (`NEXTJS-SKELETON/.env.local`)      |
| --------------------------------- | ---------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`        | `NEXT_PUBLIC_SUPABASE_URL`               |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`          |
| (service role — server only)      | `SUPABASE_SERVICE_ROLE_KEY` (optional; account deletion only) |

Also set `NEXT_PUBLIC_SITE_URL` and update `src/core/site.ts` (name → "Vidcica", French locale
`fr_FR`) — `pnpm web:check` flags leftover skeleton identity. Never edit `.env*` except
`.env.example`; add any new server var to the zod schema in `src/core/env.ts`.

---

## 2. Backend integration pattern

The skeleton already ships the SSR Supabase wiring — **use it as-is**, don't invent a client:

- `src/lib/supabase/server.ts` — RSC / server actions / route handlers (cookie session).
- `src/lib/supabase/client.ts` — browser components (realtime, live status).
- `src/lib/supabase/middleware.ts` + `src/middleware.ts` — session refresh.
- `src/lib/supabase/admin.ts` — service-role, trusted server only.

Concrete rules:

1. **Types:** generate them from the live DB rather than hand-porting —
   `supabase gen types typescript --project-id scoozakhhmowpzwotxgp > src/lib/supabase/database.types.ts`
   and type every client `createClient<Database>()`. (Mobile keeps its own copy at
   `ClipFlow/src/types/database.types.ts` — use it as a cross-check, not the source.)
2. **Reads:** prefer Server Components hitting Supabase directly (RLS-scoped) for first paint —
   dashboards, video lists, account. No blank screens (skeleton + mobile share this rule).
3. **Writes / pipeline actions:** call the existing edge functions via
   `supabase.functions.invoke('<name>', …)` with the user session. Do not duplicate their logic.
   Mirror the mobile call sites in `ClipFlow/src/lib/` and `ClipFlow/src/store/` — e.g.
   `ai-generation.ts`, `publishing.ts`, `oauth.ts`, `stripe-checkout.ts`, `credits.ts` show the
   exact request bodies and expected responses.
4. **Realtime:** credits, generation status, publish status, and notifications all broadcast over
   Supabase realtime (see the `*_realtime` migrations). Subscribe on the client for live updates
   instead of polling.
5. **Row → domain mapping:** `ClipFlow/src/lib/db-mappers.ts` is the canonical DB-row→type
   mapping. Reuse its shape so web and mobile speak the same domain language.

**Billing note (web-specific win):** mobile tops up credits through RevenueCat IAP, but the
backend *already* has Stripe functions (`create-checkout-session`, `create-portal-session`,
`stripe-webhook`). On web, use **Stripe** for billing — it's the correct web channel and the
functions exist. The skeleton also ships a `payments-stripe` pack (`packs/`) you can lean on for
the UI shell.

---

## 3. Design — this is the "Claude Design" you asked about

The skeleton has a built-in design workflow: `docs/design/quality-bar.md` (the bar every page must
clear) + `docs/templates/claude-design-prompt.md` filled by the **`/design-prompt`** skill, then
enforced by the `ux-reviewer` persona in `/review`. **Use that flow** — feed it Vidcica's brand so
the web wears the same identity as the app, adapted for desktop.

Port the design system from **`ClipFlow/src/theme/`** (this is the current source of truth — more
refined than `ClipFlow/CLAUDE.md`, which is slightly stale):

- **Color** → translate `palette.ts` / `theme.ts` into the skeleton's oklch **role tokens** in
  `src/app/globals.css` (light + dark), keeping the shadcn role names so components don't change.
  Warm brand `#FF8A3D → #FFB070 → #FFD9B0`; deep neutral `#0E0B08` dark / `#FFF8F1` light.
  Gradients are reserved for ~2 surfaces (logo, paywall/upgrade hero) — not decorative.
- **Radius** (from `tokens.ts`, note the update): sm 10 / md 16 / lg 28; `full: 999` **only** for
  circular avatars, icon buttons, filter chips. The old "999 on everything" is dead.
- **Type** → brand face is **Outfit** (`@expo-google-fonts/outfit` on mobile) — load it via
  `next/font`. This also satisfies the skeleton's rule that Inter/system is *not* a distinctive
  brand face. Use a ~1.25 modular scale at ~16px base for web (the mobile scale is deliberately
  tiny for phones — do not copy phone type sizes onto desktop).
- **Elevation / motion** → map `tokens.ts` `elevation.*` (two recipes, warm-tinted, never
  pure-black) and `motion.*` (150–300ms, real easing, `prefers-reduced-motion`) to the web
  equivalents with Motion.
- **Frosted glass** — the mobile BlurView look translates to `backdrop-blur` on overlays/nav; use
  sparingly and always with a solid fallback.

Adapt, don't transplant: the mobile design is compact and touch-first. For desktop, keep the brand
tokens but use real wide layouts, a **left sidebar nav** (not a bottom tab bar), hover + visible
focus states, keyboard nav, and a consistent container max-width. The quality bar's per-page state
matrix (empty / loading / error / success + 404/500/auth/paywall) is mandatory.

---

## 4. Copy & i18n

Vidcica is **French-default, bilingual (fr/en)**. The mobile strings live in
`ClipFlow/src/lib/i18n.ts` (large fr/en dictionary) — reuse the wording where screens overlap so
voice stays consistent, but the web needs its own i18n mechanism (the RN `t()` won't port). Pick a
web-native approach (e.g. `next-intl`) and set French as default locale. Follow the skeleton's
`docs/conventions/copy.md` (curly quotes, sentence case) — it's CI-enforced by
`pnpm check:typography`.

---

## 5. Feature map — mobile store → web feature slice

The scope chosen for the web is **the logged-in desktop workspace** (not a marketing site — a
landing already exists). Build vertical slices under `src/features/<name>/` (public API via
`index.ts`; features never import other features; Zustand per-feature via context, never a
module-level singleton).

| Priority | Web feature slice          | Reuses (mobile)                                  | Backend it calls                                            |
| -------- | -------------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| P0       | `auth` (extend skeleton's) | `auth.store.ts`, `lib/secure-storage` → cookies  | Supabase auth (same users/providers as mobile)             |
| P0       | `dashboard` / `videos`     | `videos.store.ts`, `db-mappers.ts`               | `videos` table (RLS reads); realtime status                |
| P0       | `create` (script→video)    | `videos.store`, `lib/ai-generation.ts`, `generation-models.ts` | `generate-plan`, `enqueue-generation`; realtime job status |
| P1       | `networks` + `publish`     | `networks.store`, `publish.store`, `lib/oauth.ts`, `lib/publishing.ts` | `oauth-start`/`oauth-callback`, `enqueue-publish`          |
| P1       | `billing` (credits/subs)   | `billing.store.ts`, `lib/stripe-checkout.ts`, `lib/credits.ts`, `lib/tiers.ts` | `create-checkout-session`, `create-portal-session` (Stripe on web) |
| P1       | `notifications`            | `notifications.store.ts`                         | `notifications` table + realtime                           |
| P2       | `support`                  | `support.store.ts`, `lib/support-chat.ts`        | `support-chat`                                             |
| P2       | `ads` (Meta campaigns)     | `ads.store.ts`, `leads.store.ts`, `lib/ads-launch.ts` | `create-ad-campaign`, `set-campaign-status`, `sync-ad-insights` |

Start with the P0 critical user journey — **sign in → dashboard → create a video → watch it
render → download** — as the first spec. Everything else layers on.

---

## 6. Build sequence (use the skeleton's harness, don't hand-roll)

1. `/setup-project vidcica-web` — name the app, fill site identity, vision, CODEOWNERS.
2. Wire env + generate DB types (Section 1 + 2). Confirm `pnpm dev` boots and a Server Component
   can read one RLS-scoped table.
3. `/design-prompt` — feed it Vidcica's brand from `ClipFlow/src/theme/` + Section 3. Rebrand
   `src/app/globals.css` tokens, load Outfit, verify against `docs/design/quality-bar.md`.
4. Per feature, in priority order: `/create-spec` → `/plan-feature` → `/implement-feature` →
   `/verify-ui` → `/review` → `/feature-report`. Keep `pnpm verify` green at every step; a feature
   isn't done without passing tests + inspected screenshots.
5. `/add-feature payments-stripe` when you reach billing — the pack gives a working Stripe shell to
   adapt to the existing functions.

---

## 7. Guardrails (do-not list)

- Do **not** run the skeleton's demo migrations or create new ones in the web repo.
- Do **not** re-implement edge-function logic on the web — invoke the existing functions.
- Do **not** put any secret in a `NEXT_PUBLIC_*` var. Service-role key = trusted server only.
- Do **not** copy mobile *phone* type sizes / bottom-tab nav onto desktop — adapt the brand,
  re-lay-out for the web.
- Do **not** invent a new visual language — port the tokens; the `ux-reviewer` will reject the
  default shadcn/purple look.
- Do **not** weaken a gate to make work pass; fix the work (skeleton constitution).
- When product behavior is ambiguous or a change looks like it needs a schema migration, **ask**
  rather than guess.
