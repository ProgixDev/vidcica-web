import Link from "next/link";

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
export function LegalShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[720px] px-5 py-10 pb-20">
      <Link href="/" className="text-primary text-lg font-bold tracking-tight">
        Vidcica
      </Link>
      <nav className="mt-2 mb-8 flex gap-4 text-sm" aria-label="Langue">
        <a href="#fr" className="text-primary font-semibold hover:underline">
          Français
        </a>
        <a href="#en" className="text-primary font-semibold hover:underline">
          English
        </a>
      </nav>
      {children}
      <footer className="text-muted-foreground mt-12 border-t pt-4 text-xs">{footer}</footer>
    </main>
  );
}

export function LegalSection({ doc }: { doc: LegalDoc }) {
  return (
    <section id={doc.lang} className="flex flex-col">
      <h1 className="text-2xl font-semibold tracking-tight">{doc.title}</h1>
      <p className="text-muted-foreground mt-1 text-xs">{doc.updated}</p>
      <p className="text-foreground/80 mt-3 text-sm leading-relaxed">{doc.intro}</p>
      {doc.sections.map((s) => (
        <div key={s.h} className="mt-5">
          <h2 className="text-base font-medium">{s.h}</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{s.p}</p>
        </div>
      ))}
    </section>
  );
}
