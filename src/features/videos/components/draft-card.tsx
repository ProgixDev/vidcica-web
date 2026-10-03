"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import { deleteVideo } from "../actions";

/**
 * A draft that was planned but never rendered — typically one the mobile app
 * saved before its render started. It used to be a dead end (“Create a video”
 * opened a blank composer); now it shows what the draft holds and continues it.
 *
 * Mobile parity: the app shows a draft on its regular video screen with no way
 * to resume it, so resuming here is a deliberate web improvement.
 */
export function DraftCard({ draft }: { draft: { id: string; title: string; script: string } }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    if (!window.confirm(t("videos.draftDeleteConfirm"))) return;
    startTransition(async () => {
      const res = await deleteVideo(draft.id);
      if (res.ok) {
        router.push("/videos");
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-card flex flex-col gap-5 rounded-lg p-6" data-testid="draft-card">
      <p className="text-subtle-foreground text-[15px] leading-relaxed">
        {t("videos.draftNotGenerated")}
      </p>
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{draft.title}</h2>
        {draft.script ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground text-[13px]">{t("videos.draftScript")}</p>
            <p className="text-[15px] leading-relaxed whitespace-pre-line">{draft.script}</p>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/create?draft=${encodeURIComponent(draft.id)}`} className={buttonVariants()}>
          {t("videos.draftGenerate")}
        </Link>
        <Button variant="ghost" onClick={onDelete} disabled={pending}>
          {t("videos.draftDelete")}
        </Button>
      </div>
    </div>
  );
}
