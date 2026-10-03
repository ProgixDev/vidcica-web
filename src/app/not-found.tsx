import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-muted-foreground text-[13px] tabular-nums">404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
        {t("errors.notFoundTitle")}
      </h1>
      <p className="text-muted-foreground mt-5 max-w-md text-[15px] leading-relaxed">
        {t("errors.notFoundDescription")}
      </p>
      <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-10")}>
        {t("errors.notFoundHome")}
      </Link>
    </main>
  );
}
