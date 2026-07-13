# Product Overview

## What this product is

**Vidcica Web** is the logged-in desktop workspace for Vidcica — a French-first (bilingual fr/en) product that turns a short script into an AI-generated short-form video and auto-publishes it to social networks (YouTube, LinkedIn, Instagram, Facebook live; TikTok/X/Threads partial), with credits + subscription billing and, later, in-app Meta Ads.

The bet: creators and small businesses want finished, publishable vertical video without editing skills. Vidcica already ships as an Expo mobile app; the web is a **second front-end over the same live Supabase backend** (project `scoozakhhmowpzwotxgp`) — it reuses that backend's schema, RLS, realtime, and edge functions and **never owns migrations**. The web-specific win over mobile is Stripe billing (mobile uses RevenueCat IAP) and real wide desktop layouts. A marketing landing site already exists; this repo is the workspace, not marketing. Ground rules and non-obvious decisions: [VIDCICA_WEB_BUILD_BRIEF.md](../../VIDCICA_WEB_BUILD_BRIEF.md).

## Users

| User                    | Wants                                                  | Success looks like                                                        |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Creator / solo marketer | Turn a script into a publishable vertical video, fast  | Sign in → create → watch it render → download/publish, no editing skills  |
| Small-business owner    | Consistent multi-network presence without a video team | One script auto-published to several networks; credits/subscription clear |
| Returning mobile user   | The same account and content on a bigger screen        | Same Supabase user/videos as mobile, adapted to a desktop workspace       |

## What we will NOT do (anti-goals)

- **No new backend.** No migrations or new tables in this repo; no re-implementing edge-function logic — the web calls the existing functions. Schema-shaped changes belong in the mobile repo and are raised with a human.
- **No marketing site here** — a landing already exists; this repo is the authenticated workspace only.
- **No mobile transplant** — do not copy phone type sizes or the bottom-tab nav onto desktop; adapt the brand tokens to wide layouts with a left sidebar.
- No multi-app monorepo (see ADR-0001) — clone per project instead.

## Current feature map

Living per-feature docs: [features/](features/README.md). Journeys that must never break: [critical-user-journeys.md](critical-user-journeys.md).

## Glossary

| Term         | Meaning here                                                        |
| ------------ | ------------------------------------------------------------------- |
| CUJ          | Critical user journey — an e2e-tested, screenshot-evidenced path    |
| Slice        | A `src/features/<name>` vertical module                             |
| Harness      | Everything that steers agents: docs, gates, skills, hooks, personas |
| Painted door | UI experiment with a no-op backend (see process/painted-door.md)    |
