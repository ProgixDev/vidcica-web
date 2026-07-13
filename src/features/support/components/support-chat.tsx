"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSupportStore } from "../provider";

const isContactChip = (s: string) => /formulaire|contact/i.test(s);

/** Lia chat: message thread + suggestion chips + typing indicator + input. */
export function SupportChat({ onHandoff }: { onHandoff: () => void }) {
  const messages = useSupportStore((s) => s.messages);
  const typing = useSupportStore((s) => s.typing);
  const send = useSupportStore((s) => s.send);
  const [text, setText] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || typing) return;
    setText("");
    void send(body);
  }

  function onChip(chip: string) {
    if (isContactChip(chip)) onHandoff();
    else void send(chip);
  }

  return (
    <div className="flex flex-col gap-4" data-testid="support-chat">
      <div
        className="flex flex-col gap-3"
        data-testid="chat-thread"
        role="log"
        aria-live="polite"
        aria-label="Conversation avec Lia"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex flex-col gap-1.5", m.author === "user" && "items-end")}
          >
            <div
              data-testid={`msg-${m.author}`}
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                m.author === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground border",
              )}
            >
              {m.body}
            </div>
            {m.suggestions && m.suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {m.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChip(s)}
                    className="border-input hover:bg-accent rounded-full border px-3 py-1 text-xs"
                    data-testid="suggestion"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {typing ? (
          <div className="text-muted-foreground text-xs" role="status" data-testid="typing">
            Lia écrit…
          </div>
        ) : null}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrivez votre question…"
          aria-label="Votre message"
          data-testid="chat-input"
        />
        <Button type="submit" disabled={typing || text.trim().length === 0} data-testid="chat-send">
          Envoyer
        </Button>
      </form>
    </div>
  );
}
