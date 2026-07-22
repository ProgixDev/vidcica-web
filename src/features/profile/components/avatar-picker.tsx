"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import { createClient } from "@/lib/supabase/client";
import { setAvatar } from "../actions";

const ACCEPT = "image/png,image/jpeg,image/webp";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Avatar upload: pushes the picked file to the public `avatars` bucket from the
 *  browser, then persists the public URL on the profile via `setAvatar`. Shows
 *  the current avatar (or the name initial) + a "Changer la photo" button. */
export function AvatarPicker({ initialUrl, initial }: { initialUrl?: string; initial: string }) {
  const t = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setError(null);

    if (file.size > MAX_BYTES) {
      setError(t("profile.avatarTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(t("profile.avatarError"));
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) {
        setError(t("profile.avatarError"));
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const res = await setAvatar(publicUrl);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setUrl(publicUrl);
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Supabase avatar
        <img src={url} alt="" className="size-16 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="bg-primary text-primary-foreground flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-bold"
        >
          {initial}
        </span>
      )}
      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onPick}
          className="hidden"
          data-testid="avatar-file-input"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          data-testid="avatar-change-button"
        >
          {uploading ? t("profile.avatarUploading") : t("profile.avatarChange")}
        </Button>
        {error ? (
          <p role="alert" className="text-destructive text-xs">
            {error}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">{t("profile.avatarHint")}</p>
        )}
      </div>
    </div>
  );
}
