import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

/** One language block of a legal document (verbatim content lives in the page). */
export type LegalDoc = {
  lang: "fr" | "en";
  title: string;
  updated: string;
  intro: string;
  sections: { h: string; p: string }[];
};

/** Frame for the public legal pages — brand, language nav, container, footer.
 *  Public + indexable (not behind the auth middleware); uses role tokens so the
 *  pages render correctly in light and dark. */
export async function LegalShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const t = await getT();
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-6 pt-10 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="focus-visible:ring-ring focus-visible:ring-offset-background inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <BrandLockup />
        </Link>
        <nav className="flex gap-2" aria-label={t("chrome.languageNavLabel")}>
          <a href="#fr" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Français
          </a>
          <a href="#en" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            English
          </a>
        </nav>
      </div>
      <div className="mt-16 flex flex-col gap-24">{children}</div>
      <footer className="text-muted-foreground mt-20 text-[13px]">{footer}</footer>
    </main>
  );
}

export function LegalSection({ doc }: { doc: LegalDoc }) {
  return (
    <section id={doc.lang} className="flex scroll-mt-10 flex-col">
      <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{doc.title}</h1>
      <p className="text-muted-foreground mt-4 text-[13px]">{doc.updated}</p>
      <p className="mt-10 text-[17px] leading-7">{doc.intro}</p>
      {doc.sections.map((s) => (
        <div key={s.h} className="mt-10">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">{s.h}</h2>
          <p className="text-subtle-foreground mt-3 text-[16px] leading-7">{s.p}</p>
        </div>
      ))}
    </section>
  );
}
