# Spec 006 — Support: Lia chat & contact form

- **Status:** active
- **Type:** feature
- **Requested by / owner:** Houssem Ferrani (product)
- **Date:** 2026-07-13
- **Slice / areas touched:** `src/features/support`; route `/support`. Reuses the **existing** backend (no new backend): edge function `support-chat` (OpenAI gpt-4.1-nano) + the `support_tickets` table (RLS insert-own).

## Problem (the why)

When a user is stuck on the web, they have no way to get help. Mobile ships an in-app assistant ("Lia") backed by the live `support-chat` edge function, plus a contact form that files a ticket. The web needs the same: an assistant that answers common questions instantly and, when it can't (account-specific issues), hands off to a contact form that reaches the support team — reusing the same backend.

## Desired behavior (the what)

1. **Chat with Lia.** On a support screen the user sees a short greeting from Lia and a message box. They type a question; Lia replies (via `support-chat`). While Lia "thinks", a typing indicator shows.
2. **Suggestions.** Lia's replies may include up to a few suggested follow-up chips; clicking one sends it as the next question.
3. **Graceful fallback.** If the assistant isn't configured/available, the chat still replies with a helpful fallback message and points to the contact form — it never dead-ends.
4. **Handoff.** For account-specific issues Lia can escalate; the UI surfaces a clear path to the contact form.
5. **Contact form.** The user can send a message to support (subject + message); it files a ticket and shows a confirmation. Empty/short input is rejected inline.

## Acceptance criteria

- **AC-1 (send & reply):** Given the support chat, when the user sends a non-empty message, then it appears as their turn and Lia's reply (from `support-chat`, over the recent conversation) appears after it.
- **AC-2 (typing indicator):** While awaiting Lia's reply, a typing indicator is shown and the send control is disabled; it clears when the reply arrives.
- **AC-3 (suggestions):** Given Lia returns suggestion chips, when the user clicks one, then it is sent as their next message.
- **AC-4 (not-configured fallback — non-happy):** Given `support-chat` returns 503 (not configured) or errors, when the user sends a message, then a graceful fallback reply is shown (pointing to the contact form) — the chat never leaves the user without a response.
- **AC-5 (handoff):** Given Lia flags a handoff, then the UI surfaces a clear way to reach the contact form.
- **AC-6 (contact form → ticket):** Given a subject + message, when the user submits the contact form, then a row is inserted into `support_tickets` (RLS, `user_id = auth.uid()`) and a confirmation is shown.
- **AC-7 (validation — non-happy):** Given an empty chat message, it is not sent; given an empty/too-short subject or message, the contact form shows an inline error and files nothing.
- **AC-8 (states everywhere):** The support screen renders its idle, typing/loading, error/fallback, and success (ticket sent) states.

## Out of scope

- **New backend / migrations / edge-function edits.** `support-chat` + `support_tickets` already exist.
- **FAQ / tutorials catalogs** and **contextual onboarding coachmarks** — mobile-only mock catalogs, not backend-connected; not part of this slice.
- **Ticket history / status list** — the form only _files_ a ticket; viewing/replying to tickets is a follow-up.
- **Per-account chat context** — `support-chat` is general v1 (no per-account data); unchanged here.
- **Persisting the chat thread** — a fresh greeting each session (mirrors mobile).

## CUJ impact

- Registers new **CUJ-07 — Get support**: open `/support` → ask Lia → get a reply (or fallback) → if needed, file a contact ticket. (Update `docs/product/critical-user-journeys.md` at ship; `e2e/support.spec.ts`, `support-*` shots.)

## Open questions

Resolved before `/plan-feature`.

- [x] **Scope:** Lia chat (`support-chat`, suggestions, handoff, mock fallback) + contact form (`support_tickets`).
- [x] **Fallback:** on `not_configured`/error, a canned FR reply pointing to the contact form (mirrors mobile's mock-bot fallback), not an error screen.
- [ ] **Contact form target UX:** a tab on `/support` vs a separate route — plan decides (behavior identical).
