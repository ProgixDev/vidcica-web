import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground font-mono text-sm">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">{t("errors.notFoundTitle")}</h1>
      <p className="text-muted-foreground max-w-prose">{t("errors.notFoundDescription")}</p>
      <Link href="/" className={cn(buttonVariants({ variant: "default" }), "mt-2")}>
        {t("errors.notFoundHome")}
      </Link>
    </main>
  );
}
