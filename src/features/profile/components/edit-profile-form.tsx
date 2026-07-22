"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import type { Profile } from "@/lib/vidcica/profile";
import { firstName } from "@/lib/vidcica/profile";
import { updateProfile } from "../actions";
import { AvatarPicker } from "./avatar-picker";

/** Preferred content tone — same set as the mobile app (stored as text). */
const TONES: { value: string; key: MessageKey }[] = [
  { value: "energique", key: "profile.tone.energique" },
  { value: "pedagogique", key: "profile.tone.pedagogique" },
  { value: "humour", key: "profile.tone.humour" },
  { value: "inspirant", key: "profile.tone.inspirant" },
  { value: "pro", key: "profile.tone.pro" },
];

export function EditProfileForm({ profile }: { profile: Profile | null }) {
  const t = useT();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [niche, setNiche] = useState(profile?.niche ?? "");
  const [audience, setAudience] = useState(profile?.audience ?? "");
  const [tone, setTone] = useState(profile?.preferredTone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const res = await updateProfile({ displayName, niche, audience, preferredTone: tone });
    setPending(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.push("/account");
    router.refresh();
  }

  const avatarInitial = ((displayName.trim() || firstName(profile))[0] ?? "?").toUpperCase();

  return (
    <form onSubmit={submit} className="flex w-full max-w-xl flex-col gap-5">
      <AvatarPicker initialUrl={profile?.avatarUrl} initial={avatarInitial} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-name">{t("profile.nameLabel")}</Label>
        <Input
          id="p-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t("profile.namePlaceholder")}
          maxLength={60}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-niche">{t("profile.nicheLabel")}</Label>
        <Input
          id="p-niche"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder={t("profile.nichePlaceholder")}
          maxLength={40}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-audience">{t("profile.audienceLabel")}</Label>
        <Textarea
          id="p-audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder={t("profile.audiencePlaceholder")}
          maxLength={280}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("profile.toneLabel")}</Label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((o) => {
            const active = tone === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() => setTone(active ? "" : o.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-accent text-accent-foreground"
                    : "hover:bg-muted border-border text-muted-foreground",
                )}
              >
                {t(o.key)}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="rounded-full">
          {pending ? t("profile.saving") : t("profile.save")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full"
          onClick={() => router.push("/account")}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
