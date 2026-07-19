"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { planRank, tierDef, type Plan } from "@/lib/vidcica/tiers";
import { MODELS } from "../options";
import { ModelIcon } from "./model-icons";

/**
 * «Modèle de génération» picker — the web version of the app's
 * ModelPickerSheet: brand mark + label per model, tier-locked rows greyed with
 * a lock + plan hint (tapping one goes to billing, the web's upsell).
 */
export function ModelMenu({
  value,
  plan,
  onChange,
}: {
  value: string;
  plan: Plan;
  onChange: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const selected = MODELS.find((m) => m.id === value) ?? MODELS.at(0);
  if (!selected) return null; // unreachable — the catalog is non-empty

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Modèle de génération"
        data-testid="composer-model"
        onClick={() => setOpen((o) => !o)}
        className="border-border bg-background hover:bg-accent focus-visible:ring-ring flex items-center gap-2 rounded-full border py-1.5 pr-2.5 pl-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <ModelIcon id={selected.id} className="size-4.5 shrink-0" />
        {selected.label}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={cn("text-muted-foreground size-3 transition-transform", open && "rotate-180")}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Fermer le menu des modèles"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            aria-label="Modèle de génération"
            className="border-border bg-popover absolute top-full left-0 z-50 mt-2 max-h-80 w-64 overflow-y-auto rounded-md border shadow-xl"
          >
            <p className="text-muted-foreground px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest uppercase">
              Modèle de génération
            </p>
            <ul className="flex flex-col p-1.5">
              {MODELS.map((m) => {
                const locked = planRank(plan) < planRank(m.minTier);
                const isSelected = m.id === value;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setOpen(false);
                        if (locked) router.push("/billing");
                        else onChange(m.id);
                      }}
                      className={cn(
                        "hover:bg-accent flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-left transition-colors",
                        locked && "opacity-55",
                      )}
                    >
                      <ModelIcon id={m.id} className="size-7 shrink-0" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span
                          className={cn(
                            "text-sm",
                            isSelected ? "text-primary font-semibold" : "font-medium",
                          )}
                        >
                          {m.label}
                        </span>
                        <span className="text-muted-foreground text-[11px]">{m.maxQuality}</span>
                      </span>
                      {locked ? (
                        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                          {tierDef(m.minTier).label}
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            className="size-3.5"
                            aria-hidden
                          >
                            <rect x="5" y="11" width="14" height="9" rx="2" />
                            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                          </svg>
                        </span>
                      ) : isSelected ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary size-4"
                          aria-hidden
                        >
                          <path d="m4.5 12.5 5 5 10-11" />
                        </svg>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
