# 0008 — A shared domain data-access tier under `src/lib/<domain>`

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Vidcica web team

## Context

Module boundaries (ADR-0002, `docs/architecture/module-boundaries.md`) forbid feature slices
from importing each other, and describe `src/lib/**` as "shared utilities that must never know
about domain concepts." That guidance assumes domain logic always lives inside a single feature.

The Vidcica web app breaks that assumption: **multiple features need the same backend domain code.**
The generation client (`generatePlan`, `enqueueGeneration`, `fetchGenerationJob`) is called by both
the `create` slice (to enqueue) and the `videos` slice (to poll render progress). Because features
cannot import one another, this genuinely-shared code has nowhere to live inside a feature.

The alternatives are worse: duplicating it across features (drift), or forcing an artificial
"host" feature that others reach into (a boundary violation by another name).

## Decision

Introduce a **domain data-access tier** at `src/lib/<domain>/` (here `src/lib/vidcica/`), sitting in
the `shared` layer, allowed to reference generated DB types and edge-function contracts. It holds:

- Domain types + pure row→domain mappers (`video.ts`).
- The generation client that wraps the existing edge functions (`generation.ts`).
- RLS-scoped server read helpers (`queries.ts`).
- Domain realtime hooks (`use-videos-realtime.ts`).

Rules that keep this from becoming a dumping ground:

1. Code lands here **only when a second feature actually consumes it** (promote late — same rule
   as feature→shared promotion). Single-consumer domain code stays in its feature.
2. It may import generated types (`src/lib/supabase/database.types.ts`) and `core`, never features
   or `app`.
3. Presentation (labels, tokens) should prefer the feature; a small status-metadata table colocated
   with its type is tolerated but not a licence to put UI here.

## Consequences

- Boundaries stay lint-clean (this is `shared` code; no feature cross-imports).
- The boundary doc's "never know about domain concepts" line is **relaxed for this named tier** and
  should be read as "generic utilities in `src/lib/*` (format, utils) stay domain-free; domain
  data-access lives under `src/lib/<domain>/`."
- Reviewers should still push single-consumer domain code back into its feature.

## Follow-up

`video.ts` / `use-videos-realtime.ts` / `queries.ts` are currently consumed mainly by the `videos`
slice + app routes; if they never gain a second feature consumer, a future change may relocate them
into `src/features/videos/` and leave only `generation.ts` shared. Tracked, not blocking.
