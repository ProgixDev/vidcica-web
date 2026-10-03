# 0009 — Adopt identity 01 “Rémanence” and remap the role tokens to ink-first

- **Status:** Accepted
- **Date:** 2026-10-02
- **Deciders:** product owner, engineering

## Context

The mobile app was redesigned around a new brand, identity 01 “Rémanence” (flat two-stroke V
mark, Manrope, warm mineral neutrals, one citron accent, grainy light fields), after App Review
rejected the previous orange/glass design. The web app still carried the old identity: Outfit,
an orange `primary`, bordered and shadowed cards, glow blobs and blur. The two front-ends over
the same backend have to look like one product (AGENTS.md, “Mirror the mobile app”).

## Decision

Port identity 01 to the web. The shadcn role names stay, but `primary` now means **ink** (the
main action is an ink pill), `accent` is a neutral hover step, and the citron accent gets its own
`brand` role, limited to one element per viewport. Surfaces are borderless and shadowless; dark
is the default scheme. The rules are `docs/design/redesign-rules.md`; the values are
`src/app/globals.css`.

## Alternatives considered

| Option                                             | Why not                                                                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Keep `primary` = brand colour, swap orange→citron  | Every existing `bg-primary` button would turn citron, breaking the “one accent per viewport” rule on every page.                      |
| New token names, leave the shadcn roles untouched  | Hundreds of call sites would keep the old meaning and new shadcn components would drop in with the wrong look.                        |
| Ship gradient field PNGs from the identity package | The fields are four-stop linear gradients; CSS reproduces them at any aspect ratio, and only the 256px grain tile needs to be a file. |

## Consequences

- Positive: one visual language across app and web; the token remap restyled most call sites
  without touching logic; both schemes are AA by construction (identity contrast table).
- Negative / accepted trade-offs: `text-primary` no longer reads as “accent” — legacy habits
  will produce ink text; raised surfaces (`bg-popover`) carry a divider-tone hairline because
  the light raised tone equals the canvas.
- Follow-ups: a segmented-control, a selectable-tile and a checkbox primitive are composed by
  hand in several features and should be extracted; a lint check for raw colours and
  `border`/`shadow` on surfaces would keep the rules from eroding.
