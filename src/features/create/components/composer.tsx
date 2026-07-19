"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/lib/vidcica/tiers";
import { useCreateStore } from "../provider";
import { estimateCost } from "../cost";
import { LENGTHS, MUSIC_MOODS, RATIOS, VOICES } from "../options";
import { ModelMenu } from "./model-menu";

/** Clickable starter ideas — kills the blank-page freeze on first visit. */
const SUGGESTIONS = [
  "3 astuces pour gagner du temps le matin",
  "Présente ton produit phare en 20 secondes",
  "Avant / après : la transformation d’un client",
  "Une idée reçue de ton métier, démontée",
];

/**
 * The PromptComposer — same surface as the app's home composer: kind pills, a
 * big borderless textarea, a live credit-cost line and a control row of pill
 * pickers (modèle · durée · format · voix · musique) with a send button.
 * Submitting asks the AI for a plan (step 2 = PlanReview).
 */
export function Composer({ credits, plan }: { credits: number; plan: Plan }) {
  const input = useCreateStore((s) => s.input);
  const phase = useCreateStore((s) => s.phase);
  const error = useCreateStore((s) => s.error);
  const setInput = useCreateStore((s) => s.setInput);
  const requestPlan = useCreateStore((s) => s.requestPlan);
  const backToEdit = useCreateStore((s) => s.backToEdit);

  const planning = phase === "planning";
  const cost = estimateCost(input.model, input.length, credits);
  const canSubmit = input.prompt.trim().length >= 10 && !planning && cost.affordable;

  return (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) void requestPlan();
      }}
    >
      {/* Kind pills — Idée (l’IA écrit) / Script (tel quel) */}
      <div role="tablist" aria-label="Type de départ" className="flex gap-2">
        {(
          [
            { id: "idea", label: "Idée", hint: "L’IA écrit le script à partir de ton idée" },
            { id: "script", label: "Script", hint: "Ton script tel quel" },
          ] as const
        ).map((k) => (
          <button
            key={k.id}
            role="tab"
            type="button"
            aria-selected={input.kind === k.id}
            onClick={() => setInput({ kind: k.id })}
            title={k.hint}
            className={cn(
              "focus-visible:ring-ring rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
              input.kind === k.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k.label}
          </button>
        ))}
        <span className="text-muted-foreground/80 self-center text-xs">
          {input.kind === "idea" ? "L’IA écrit le script pour toi" : "Ton script, mot pour mot"}
        </span>
      </div>

      {/* The composer card */}
      <div className="border-border bg-card focus-within:border-ring/50 flex flex-col rounded-lg border shadow-sm transition-colors">
        <textarea
          id="prompt"
          value={input.prompt}
          onChange={(e) => setInput({ prompt: e.target.value })}
          placeholder="Que veux-tu créer aujourd’hui ?"
          aria-label={input.kind === "idea" ? "Votre idée" : "Votre script"}
          rows={5}
          className="placeholder:text-muted-foreground min-h-36 w-full resize-y bg-transparent px-5 pt-4 pb-2 text-base leading-relaxed outline-none"
          data-testid="composer-prompt"
        />

        {/* Cost line */}
        <p
          className={cn(
            "flex items-center gap-2 px-5 pb-3 text-xs",
            cost.affordable ? "text-muted-foreground" : "text-destructive",
          )}
          data-testid="composer-cost"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="size-3.5 shrink-0"
            aria-hidden
          >
            <circle cx="9" cy="9" r="6.5" />
            <path d="M14.8 6.6a6.5 6.5 0 1 1-8.2 8.2" />
          </svg>
          {cost.affordable ? (
            <>
              ≈ {cost.total} cr · {cost.remaining} restants · ≈ {cost.videosLeft} vidéo
              {cost.videosLeft === 1 ? "" : "s"}
            </>
          ) : (
            <>
              ≈ {cost.total} cr · solde insuffisant —{" "}
              <Link href="/billing" className="underline underline-offset-2">
                recharger
              </Link>
            </>
          )}
        </p>

        {/* Control row */}
        <div className="border-border/60 flex flex-wrap items-center gap-2 border-t px-3 py-3">
          <ModelMenu value={input.model} plan={plan} onChange={(v) => setInput({ model: v })} />
          <PillSelect
            label="Durée"
            value={String(input.length)}
            onChange={(v) => setInput({ length: Number(v) })}
            options={LENGTHS.map((l) => ({ value: String(l), label: `${l} s` }))}
          />
          <PillSelect
            label="Format"
            value={input.ratio}
            onChange={(v) => setInput({ ratio: v as (typeof RATIOS)[number] })}
            options={RATIOS.map((r) => ({ value: r, label: r }))}
          />
          <PillSelect
            label="Voix"
            value={input.voice}
            onChange={(v) => setInput({ voice: v })}
            options={VOICES.map((v) => ({ value: v.id, label: v.label }))}
            disabled={!input.voiceover}
          />
          <PillSelect
            label="Musique"
            value={input.music}
            onChange={(v) => setInput({ music: v })}
            options={MUSIC_MOODS.map((m) => ({ value: m.id, label: m.label }))}
            disabled={input.model === "pexels"}
          />
          <PillToggle
            label="Voix off"
            checked={input.voiceover}
            onChange={(checked) =>
              setInput({ voiceover: checked, ...(checked ? {} : { captions: false }) })
            }
          />
          <PillToggle
            label="Sous-titres"
            checked={input.captions}
            onChange={(checked) => setInput({ captions: checked })}
            disabled={!input.voiceover}
          />

          <button
            type="submit"
            disabled={!canSubmit}
            aria-label={planning ? "Génération du plan en cours" : "Générer le plan"}
            data-testid="composer-submit"
            className="bg-primary text-primary-foreground ml-auto flex size-10 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {planning ? (
              <span
                aria-hidden
                className="border-primary-foreground/40 border-t-primary-foreground size-4.5 animate-spin rounded-full border-2"
              />
            ) : (
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
            )}
          </button>
        </div>
      </div>

      {input.prompt.trim() === "" ? (
        <div className="flex flex-wrap gap-2" aria-label="Suggestions d’idées">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setInput({ prompt: s, kind: "idea" })}
              className="border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground rounded-full border border-dashed px-3 py-1.5 text-xs transition-colors"
            >
              ✦ {s}
            </button>
          ))}
        </div>
      ) : null}

      <p className="text-muted-foreground/80 text-xs">
        L’IA prépare d’abord un plan (titre, script, séquences) que tu valides avant de lancer le
        rendu — les crédits ne sont débités qu’à ce moment-là.
      </p>

      {error && phase === "error" ? (
        <div role="alert" className="flex flex-col gap-2">
          <p className="text-destructive text-sm">{error}</p>
          <Button type="button" variant="outline" onClick={backToEdit} className="self-start">
            Réessayer
          </Button>
        </div>
      ) : null}
    </form>
  );
}

/** Native select styled as a chip — robust, accessible, no portal needed. */
function PillSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex", disabled && "opacity-40")}>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-background text-foreground hover:bg-accent focus-visible:ring-ring appearance-none rounded-full border py-1.5 pr-7 pl-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2"
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

/** Small on/off chip (voix off, sous-titres). */
function PillToggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "focus-visible:ring-ring rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        checked
          ? "bg-accent text-accent-foreground border-transparent"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {checked ? "✓ " : ""}
      {label}
    </button>
  );
}
