import Link from "next/link";

export const metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site vidcica.com — éditeur, hébergement, contact.",
};

const SECTIONS: { h: string; body: React.ReactNode }[] = [
  {
    h: "Éditeur du site",
    body: (
      <>
        Le site vidcica.com et le service Vidcica sont édités par [raison sociale à compléter],
        [forme juridique à compléter], immatriculée sous le numéro [SIREN à compléter], dont le
        siège social est situé [adresse à compléter].
        <br />
        Directeur de la publication : [à compléter].
        <br />
        Contact :{" "}
        <a href="mailto:hello@vidcica.com" className="text-primary hover:underline">
          hello@vidcica.com
        </a>
        .
      </>
    ),
  },
  {
    h: "Hébergement",
    body: (
      <>
        Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
        (vercel.com). Les données applicatives sont hébergées par Supabase, Inc. (supabase.com), sur
        des serveurs situés dans l’Union européenne.
      </>
    ),
  },
  {
    h: "Propriété intellectuelle",
    body: (
      <>
        La marque Vidcica, le logo, l’interface et l’ensemble des contenus du site sont protégés par
        le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite. Les
        vidéos générées par les utilisateurs à partir du service leur appartiennent, dans les
        conditions décrites dans les{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Conditions d’utilisation
        </Link>
        .
      </>
    ),
  },
  {
    h: "Données personnelles",
    body: (
      <>
        Le traitement des données personnelles est décrit dans la{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Politique de confidentialité
        </Link>
        . Pour exercer vos droits (accès, rectification, suppression), écrivez à{" "}
        <a href="mailto:hello@vidcica.com" className="text-primary hover:underline">
          hello@vidcica.com
        </a>
        .
      </>
    ),
  },
];

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[720px] px-5 py-10 pb-20">
      <Link href="/" className="text-primary text-lg font-bold tracking-tight">
        Vidcica
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Mentions légales</h1>
      <p className="text-muted-foreground mt-1 text-sm">Dernière mise à jour : 19 juillet 2026</p>
      <div className="mt-8 flex flex-col gap-8">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="text-base font-semibold">{s.h}</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
      <footer className="text-muted-foreground mt-12 border-t pt-4 text-xs">
        <Link href="/" className="hover:text-foreground">
          ← Retour à l’accueil
        </Link>
      </footer>
    </main>
  );
}
