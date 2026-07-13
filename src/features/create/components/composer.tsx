"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateStore } from "../provider";
import { MODELS, MUSIC_MOODS, QUALITIES, RATIOS, VOICES } from "../options";

const LENGTHS = [15, 30, 45, 60] as const;

export function Composer() {
  const input = useCreateStore((s) => s.input);
  const phase = useCreateStore((s) => s.phase);
  const error = useCreateStore((s) => s.error);
  const setInput = useCreateStore((s) => s.setInput);
  const requestPlan = useCreateStore((s) => s.requestPlan);
  const backToEdit = useCreateStore((s) => s.backToEdit);

  const planning = phase === "planning";
  const canSubmit = input.prompt.trim().length >= 10 && !planning;

  return (
    <form
      className="flex w-full flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) void requestPlan();
      }}
    >
      {/* idea / script toggle */}
      <div
        role="tablist"
        aria-label="Type de départ"
        className="bg-muted grid grid-cols-2 gap-1 rounded-full p-1"
      >
        {(["idea", "script"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={input.kind === k}
            onClick={() => setInput({ kind: k })}
            className={cn(
              "focus-visible:ring-ring rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
              input.kind === k
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k === "idea" ? "À partir d’une idée" : "J’ai déjà un script"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prompt">{input.kind === "idea" ? "Votre idée" : "Votre script"}</Label>
        <Textarea
          id="prompt"
          value={input.prompt}
          onChange={(e) => setInput({ prompt: e.target.value })}
          placeholder={
            input.kind === "idea"
              ? "Ex : 3 astuces pour gagner du temps le matin"
              : "Collez votre script mot pour mot…"
          }
          className="min-h-32"
          data-testid="composer-prompt"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Modèle" htmlFor="model">
          <Select
            id="model"
            value={input.model}
            onChange={(e) => setInput({ model: e.target.value })}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Qualité" htmlFor="quality">
          <Select
            id="quality"
            value={input.quality}
            onChange={(e) => setInput({ quality: e.target.value as (typeof QUALITIES)[number] })}
          >
            {QUALITIES.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Format" htmlFor="ratio">
          <Select
            id="ratio"
            value={input.ratio}
            onChange={(e) => setInput({ ratio: e.target.value as (typeof RATIOS)[number] })}
          >
            {RATIOS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Voix" htmlFor="voice">
          <Select
            id="voice"
            value={input.voice}
            onChange={(e) => setInput({ voice: e.target.value })}
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Musique" htmlFor="music">
          <Select
            id="music"
            value={input.music}
            onChange={(e) => setInput({ music: e.target.value })}
          >
            {MUSIC_MOODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Durée" htmlFor="length">
          <Select
            id="length"
            value={String(input.length)}
            onChange={(e) => setInput({ length: Number(e.target.value) })}
          >
            {LENGTHS.map((l) => (
              <option key={l} value={l}>
                {l} s
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={input.voiceover}
            onChange={(e) => setInput({ voiceover: e.target.checked })}
            className="accent-primary size-4"
          />
          Voix off IA
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={input.captions}
            onChange={(e) => setInput({ captions: e.target.checked })}
            disabled={!input.voiceover}
            className="accent-primary size-4"
          />
          Sous-titres
        </label>
      </div>

      {error && phase === "error" ? (
        <div role="alert" className="flex flex-col gap-2">
          <p className="text-destructive text-sm">{error}</p>
          <Button type="button" variant="outline" onClick={backToEdit} className="self-start">
            Réessayer
          </Button>
        </div>
      ) : null}

      <Button type="submit" disabled={!canSubmit} data-testid="composer-submit">
        {planning ? "Génération du plan…" : "Générer le plan"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
