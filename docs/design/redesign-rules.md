# Redesign rules — identity 01 “Rémanence” (web pass, 2026-10-02)

The operating rules for every page of the web app. They are the web translation of the
mobile app's `docs/brand/redesign-rules.md` and `docs/brand/identity-01/IDENTITY.md`
(repo `vidcica`). Read fully before touching a route. The foundation (tokens, font,
primitives, app shell, marketing chrome, landing) is done; a page pass is a **restyle,
not a rewrite**.

## The look, in one paragraph

ElevenLabs-quiet on a warm mineral canvas. One family (Manrope). Ink and pale neutrals
do all the work; the citron accent (`brand`) appears **at most once per viewport**. Every
button, chip and badge is a full pill. Cards are one neutral step off the canvas with
**no border and no shadow**. No glass, no blur, no gradients on UI chrome, no glow, no
tinted icon discs, no uppercase tracked eyebrows. Space and type do the hierarchy. Dark
is the primary scheme; light must look as finished.

## Tokens (`src/app/globals.css`)

Role names are shadcn-compatible but mean what the app means:

| Utility                                                                             | Meaning                                                                             |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bg-background` / `text-foreground`                                                 | canvas / primary text                                                               |
| `bg-card`                                                                           | pale surface, one step off canvas (cards, sidebar, sheets)                          |
| `bg-popover`                                                                        | raised surface (menus, dialogs, toasts)                                             |
| `bg-primary text-primary-foreground`                                                | **INK** — the main action pill, selected chip                                       |
| `bg-secondary`                                                                      | pale pill / pale field. Inside anything `bg-card` it auto-steps so it stays visible |
| `bg-accent`                                                                         | neutral hover/pressed step (NOT the brand colour)                                   |
| `text-subtle-foreground` / `text-muted-foreground`                                  | secondary / muted text                                                              |
| `bg-brand text-brand-foreground`, `bg-brand-subtle`                                 | the citron accent                                                                   |
| `text-destructive` on `bg-destructive-subtle` (same for `success`, `warning`)       | status, only when essential                                                         |
| `border-border`                                                                     | divider — decorative hairline between list rows only                                |
| `bg-scrim`                                                                          | modal backdrop, bottom scrim over a photo/video                                     |
| `field-aube` · `field-contre-jour` · `field-papier` · `field-apres-image` + `grain` | atmospheric gradient fields                                                         |

`text-primary` is now **ink**, not a colour. Never use it to mean “accent”; links and
active states are neutral (weight, underline or a pale pill carry the state).

Radii: `rounded-sm` 12 · `rounded-md` 16 · `rounded-lg` 24 (`xl/2xl/3xl` alias to 24) ·
`rounded-full` for every button, chip, badge, avatar, icon disc. No raw hex/rgba/oklch
and no `white`/`black` utilities in pages (only brand logos of third parties and the
scrim over media are exempt; text over media uses `text-white` only on a `bg-scrim`).

## Primitives (`src/components/ui`) — use them, do not restyle them at call sites

- `Button`/`buttonVariants`: `default` ink pill · `brand` citron pill · `secondary` (and
  the legacy `outline`) pale pill · `ghost` text · `destructive` tinted. Sizes `sm` 36 ·
  `default` 40 · `lg` 48 · `icon` 40. Do not add `rounded-*`, `border`, `shadow` or
  colour overrides at the call site (delete the ones that exist).
- `Card` (pale, borderless, 24 radius) — sub-parts unchanged.
- `Input` / `Textarea` / `Select`: pale borderless field, 44 high, 16 radius.
- `Badge`: `muted` · `brand` (ink) · `success` · `warning` · `destructive` (tinted) · `outline` (pale).
- `Switch`, `Progress`, `Skeleton`, `EmptyState`, `Label`, `PageHeader` (28–32/600 title).

If a primitive lacks something, compose at the call site and report the gap; do not
edit `src/components/ui`, `src/components/app-shell`, `src/components/brand.tsx` or
`globals.css` during a page pass.

## The accent budget

- **Authenticated app:** the sidebar's “Create a video” pill is the accent. Pages inside
  `(app)` therefore use **no** `brand` fill; their main action is the ink pill. The only
  exception is a page whose blocking error/paywall needs a recovery action while the
  sidebar is not visible — still ink by default.
- **Marketing / auth pages:** one `brand` pill per viewport — the hero or closing CTA.
  The header CTA is ink. Pricing: the highlighted plan's button may be `brand` if no
  other brand element shares the viewport; all others `secondary`.
- Stats, links, icons, eyebrows, numbers and active nav are never accent-coloured.

## Layout numbers

- Marketing container `max-w-6xl px-6`; sections `py-20 sm:py-28`. App content sits in
  the shell's `max-w-6xl`; sections 40 apart (`gap-10`), 12–16 from heading to content.
- Type: display `text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] leading-[1.02]`
  (landing hero only) · page title 28–32/600 (via `PageHeader`) · section title
  `text-3xl sm:text-4xl font-semibold tracking-[-0.03em]` on marketing, `text-xl font-semibold`
  in the app · body `text-[15px] leading-relaxed` · caption `text-[13px]` · micro `text-xs`.
  Weights 400/500/600 only (no `font-bold`, no `font-light`). Nothing under 12px.
- Rows 48–64 high: leading visual, 15/600 title + 13 muted sub-line, **one** trailing
  element. Rows inside a Card: no dividers unless the list is long; then `divide-y divide-border`.
- Buttons: one filled action per group; secondary is `ghost` or `secondary`. Never two
  filled ink/brand buttons side by side.
- Grids of tiles: one geometry per page, 12–16 gap. Video thumbnails 9:16, `rounded-md`.
- Empty/loading/error: `EmptyState` — one 17/600 line, one 13 muted line, ≤ 1 button.
- Focus: the primitives' neutral 2px ring. Custom interactive elements add
  `focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none`.
- Motion: keep the existing `Reveal`/`motion` usage; no new hover lifts with shadows
  (a hover is a tone step: `hover:bg-accent`).

## Anti-patterns to remove on sight

`border` on cards, chips, inputs, buttons, icon buttons · `shadow-*` anywhere ·
`backdrop-blur*` and translucent `bg-*/80` panels · radial/linear gradients on chrome ·
glow blobs · tinted accent discs behind icons (`bg-primary/10 text-primary`) ·
`ring-1 ring-primary/…` · gradient text · `uppercase tracking-widest` eyebrows (drop the
eyebrow or make it plain 13px muted) · eyebrow + title + subtitle stacks · cards inside
cards · `text-primary`/`bg-primary/10` used as “orange” · `hover:-translate-y` +
`hover:shadow` lifts · more than one accent element · centred body text outside
hero/empty states · `font-bold` · `text-[10px]`/`text-[11px]`.

## Process for each page

1. Read the route and its feature components. Keep **all** logic, data flow, props,
   i18n keys, `data-testid`s, aria labels, routes and feature flags exactly as they are.
   Do not touch `src/lib`, `src/core`, stores, schemas, server actions, `supabase/`.
2. Strip chrome first (borders, shadows, blur, gradients, tinted discs, eyebrows). Then
   set the hierarchy with type and space. Then place the one action.
3. All strings stay in i18n (`src/lib/i18n`); avoid adding strings. If one is truly
   needed add FR + EN, curly quotes, sentence case (`docs/conventions/copy.md`).
4. Verify: `pnpm exec tsc --noEmit` and `pnpm exec eslint <your files>` are clean, and
   `pnpm exec prettier --write <your files>` has been run (it sorts Tailwind classes).
5. Report: files changed, what each page now looks like in two lines, primitive gaps,
   anything unresolved.
