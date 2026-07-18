"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The dashboard's composer teaser — the mobile app puts the PromptComposer
 * right on the home screen; on the web this compact version captures the
 * prompt + kind and hands off to /create with the full composer prefilled.
 */
export function QuickComposer() {
  const router = useRouter();
  const [kind, setKind] = useState<"idea" | "script">("idea");
  const [prompt, setPrompt] = useState("");

  function start() {
    const params = new URLSearchParams({ kind });
    if (prompt.trim()) params.set("prompt", prompt.trim());
    router.push(`/create?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start();
      }}
      data-testid="quick-composer"
      className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4 shadow-sm sm:p-5"
    >
      <div role="tablist" aria-label="Type de départ" className="flex gap-2">
        {(
          [
            { id: "idea", label: "Idée", hint: "L’IA écrit le script" },
            { id: "script", label: "Script", hint: "Ton script tel quel" },
          ] as const
        ).map((k) => (
          <button
            key={k.id}
            role="tab"
            type="button"
            aria-selected={kind === k.id}
            onClick={() => setKind(k.id)}
            title={k.hint}
            className={cn(
              "focus-visible:ring-ring rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
              kind === k.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground bg-transparent",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Que veux-tu créer aujourd’hui ?"
          rows={2}
          aria-label="Votre idée ou script"
          className="placeholder:text-muted-foreground min-h-16 flex-1 resize-none bg-transparent text-base outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              start();
            }
          }}
        />
        <button
          type="submit"
          aria-label="Commencer la création"
          className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-90"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4.5"
            aria-hidden
          >
            <path d="M12 19V5m-7 7 7-7 7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
