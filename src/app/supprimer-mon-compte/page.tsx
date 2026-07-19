import Link from "next/link";

export const metadata = {
  title: "Supprimer votre compte",
  description:
    "Comment supprimer votre compte Vidcica et vos données — depuis l’application ou par e-mail. How to delete your Vidcica account and data.",
};

/**
 * Public account-deletion instructions — required by the Google Play Data safety
 * section (a web URL that names the app, gives the deletion steps, and states
 * what is deleted/kept + retention). Bilingual FR/EN; public (not auth-gated).
 */
export default function DeleteAccountPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[720px] px-5 py-10 pb-20">
      <Link href="/" className="text-primary text-lg font-bold tracking-tight">
        Vidcica
      </Link>

      {/* ---------- Français ---------- */}
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Supprimer votre compte Vidcica</h1>
      <p className="text-muted-foreground mt-1 text-sm">Dernière mise à jour : 19 juillet 2026</p>

      <div className="mt-8 flex flex-col gap-8">
        <section>
          <h2 className="text-base font-semibold">Depuis l’application (recommandé)</h2>
          <ol className="text-muted-foreground mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed">
            <li>Ouvrez l’application Vidcica et connectez-vous.</li>
            <li>
              Allez dans <strong>Réglages → Compte → Supprimer mon compte</strong>.
            </li>
            <li>Confirmez la demande (cochez la case, puis tapez « SUPPRIMER »).</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-semibold">Par e-mail</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Si vous ne pouvez pas accéder à l’application, écrivez à{" "}
            <a href="mailto:hello@vidcica.com" className="text-primary hover:underline">
              hello@vidcica.com
            </a>{" "}
            depuis l’adresse e-mail de votre compte, avec pour objet « Suppression de compte ». Nous
            traitons votre demande dans un délai de 30 jours.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Ce qui est supprimé</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Votre profil, vos vidéos et brouillons, vos crédits, vos comptes de réseaux sociaux
            connectés, vos notifications et vos tickets de support — toutes les données personnelles
            associées à votre compte.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Vous pouvez aussi supprimer <strong>certaines données uniquement</strong> sans fermer
            votre compte : supprimez vos vidéos une par une dans l’application, ou écrivez à{" "}
            <a href="mailto:hello@vidcica.com" className="text-primary hover:underline">
              hello@vidcica.com
            </a>{" "}
            pour demander la suppression de données précises.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Délai et conservation</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            La suppression prend effet après un <strong>délai de grâce de 30 jours</strong>, pendant
            lequel vous pouvez l’annuler simplement en vous reconnectant. Passé ce délai, vos
            données personnelles sont <strong>définitivement effacées</strong>.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            <strong>Données conservées.</strong> Conformément à nos obligations comptables et
            fiscales, certaines données de facturation (factures et enregistrements de transactions)
            sont conservées pendant la durée exigée par la loi — jusqu’à 10 ans en France — même
            après la suppression de votre compte.
          </p>
        </section>
      </div>

      {/* ---------- English ---------- */}
      <h2 className="mt-12 border-t pt-8 text-2xl font-semibold tracking-tight">
        Delete your Vidcica account
      </h2>
      <div className="mt-6 flex flex-col gap-8">
        <section>
          <h3 className="text-base font-semibold">From the app (recommended)</h3>
          <ol className="text-muted-foreground mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed">
            <li>Open the Vidcica app and sign in.</li>
            <li>
              Go to <strong>Settings → Account → Delete my account</strong>.
            </li>
            <li>Confirm the request (tick the box, then type “SUPPRIMER”).</li>
          </ol>
        </section>

        <section>
          <h3 className="text-base font-semibold">By email</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            If you cannot access the app, email{" "}
            <a href="mailto:hello@vidcica.com" className="text-primary hover:underline">
              hello@vidcica.com
            </a>{" "}
            from your account’s email address with the subject “Account deletion”. We process
            requests within 30 days.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold">What is deleted</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Your profile, your videos and drafts, your credits, your connected social accounts, your
            notifications and your support tickets — all personal data associated with your account.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            You can also delete <strong>only some data</strong> without closing your account: delete
            your videos one by one in the app, or email{" "}
            <a href="mailto:hello@vidcica.com" className="text-primary hover:underline">
              hello@vidcica.com
            </a>{" "}
            to request deletion of specific data.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold">Timing and retention</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Deletion takes effect after a <strong>30-day grace period</strong>, during which you can
            cancel it simply by signing back in. After that, your personal data is{" "}
            <strong>permanently erased</strong>.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            <strong>Data we keep.</strong> To meet our accounting and tax obligations, certain
            billing records (invoices and transaction records) are retained for the period required
            by law — up to 10 years in France — even after your account is deleted.
          </p>
        </section>
      </div>

      <footer className="text-muted-foreground mt-12 border-t pt-4 text-xs">
        <Link href="/" className="hover:text-foreground">
          ← Retour à l’accueil
        </Link>
      </footer>
    </main>
  );
}
