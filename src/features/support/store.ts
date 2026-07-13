import { createStore } from "zustand/vanilla";
import {
  CONTACT_SUGGESTION,
  fallbackReply,
  type AskSupportOutcome,
  type SupportTurn,
} from "@/lib/vidcica/support";

/**
 * Support chat state machine. `ask` is injected so send / reply / typing /
 * suggestions / fallback are unit-testable without the network (AC-1..AC-4).
 * provider.tsx injects the real `askSupport`.
 */
export type SupportMessage = {
  id: string;
  author: "user" | "lia";
  body: string;
  suggestions?: string[];
};

export type SupportDeps = {
  ask: (turns: SupportTurn[]) => Promise<AskSupportOutcome>;
};

export type SupportState = {
  messages: SupportMessage[];
  typing: boolean;
  /** True once Lia escalated — the UI offers the contact form. */
  handoff: boolean;
  send: (body: string) => Promise<void>;
};

export type SupportStore = ReturnType<typeof createSupportStore>;

const GREETING =
  "Bonjour, je suis Lia 👋 Comment puis-je vous aider ? Posez-moi une question sur la création, la publication ou votre abonnement.";

let seq = 0;
const nextId = () => `m${++seq}`;

export function greeting(): SupportMessage {
  return { id: nextId(), author: "lia", body: GREETING };
}

export function createSupportStore(deps: SupportDeps) {
  return createStore<SupportState>()((set, get) => ({
    messages: [greeting()],
    typing: false,
    handoff: false,

    send: async (body) => {
      const trimmed = body.trim();
      if (!trimmed || get().typing) return; // blank / in-flight no-op (AC-7)

      const prior = get().messages;
      set({ messages: [...prior, { id: nextId(), author: "user", body: trimmed }], typing: true });

      const turns: SupportTurn[] = [
        ...prior.map(
          (m): SupportTurn => ({
            role: m.author === "user" ? "user" : "assistant",
            content: m.body,
          }),
        ),
        { role: "user", content: trimmed },
      ];

      // Live reply when configured; ANY non-ok degrades to the fallback so the
      // chat never strands the user (AC-4).
      const res = await deps.ask(turns);
      const reply = res.ok ? res : fallbackReply();
      const suggestions = [...reply.suggestions];
      if (reply.handoff && !suggestions.some((s) => /formulaire|contact/i.test(s))) {
        suggestions.push(CONTACT_SUGGESTION);
      }

      set((s) => ({
        messages: [...s.messages, { id: nextId(), author: "lia", body: reply.reply, suggestions }],
        typing: false,
        handoff: s.handoff || reply.handoff,
      }));
    },
  }));
}
