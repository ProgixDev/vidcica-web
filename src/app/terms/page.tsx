import { LegalSection, LegalShell, type LegalDoc } from "@/components/legal";

export const metadata = {
  title: "Conditions d’utilisation",
  description: "Les conditions qui encadrent l’utilisation de Vidcica.",
};

const FR: LegalDoc = {
  lang: "fr",
  title: "Conditions d’utilisation",
  updated: "Dernière mise à jour : 1er mai 2026",
  intro:
    "En utilisant Vidcica, tu acceptes les conditions ci-dessous. Lis-les attentivement : elles encadrent ce que tu peux faire avec l’app et ce que nous nous engageons à faire pour toi.",
  sections: [
    {
      h: "1. Acceptation",
      p: "L’accès à l’application Vidcica suppose l’acceptation pleine et entière des présentes Conditions générales d’utilisation. Si tu n’en acceptes pas tout ou partie, merci de ne pas utiliser le service.",
    },
    {
      h: "2. Compte utilisateur",
      p: "Tu es responsable de la confidentialité de tes identifiants et de toute activité réalisée depuis ton compte. Préviens-nous sans délai en cas d’usage non autorisé.",
    },
    {
      h: "3. Crédits & abonnement",
      p: "Les crédits permettent de générer des vidéos. Ils sont consommés à la génération et ne sont pas remboursables. L’abonnement se renouvelle automatiquement et peut être annulé à tout moment depuis l’écran de gestion.",
    },
    {
      h: "4. Contenus générés",
      p: "Tu es seul responsable des scripts que tu fournis et des vidéos publiées via Vidcica. Tu nous accordes une licence non-exclusive et temporaire pour traiter, transcrire et publier ces contenus vers les réseaux que tu connectes (comme TikTok), via leur API officielle.",
    },
    {
      h: "5. Limitation de responsabilité",
      p: "Vidcica fait de son mieux pour assurer une qualité de service élevée, mais ne peut être tenu responsable des indisponibilités des plateformes tierces (Instagram, TikTok, etc.) ni des modifications de leurs API.",
    },
    {
      h: "6. Résiliation",
      p: "Tu peux supprimer ton compte à tout moment depuis Réglages → Compte → Supprimer mon compte. La suppression est effective après une période de rétention de 30 jours.",
    },
  ],
};

const EN: LegalDoc = {
  lang: "en",
  title: "Terms of Use",
  updated: "Last updated: May 1, 2026",
  intro:
    "By using Vidcica, you accept the terms below. Please read them carefully: they govern what you can do with the app and what we commit to do for you.",
  sections: [
    {
      h: "1. Acceptance",
      p: "Accessing the Vidcica application implies full and complete acceptance of these Terms of Use. If you do not accept all or part of them, please do not use the service.",
    },
    {
      h: "2. User account",
      p: "You are responsible for keeping your credentials confidential and for all activity carried out from your account. Notify us without delay in the event of unauthorized use.",
    },
    {
      h: "3. Credits & subscription",
      p: "Credits are used to generate videos. They are consumed upon generation and are non-refundable. The subscription renews automatically and can be cancelled at any time from the management screen.",
    },
    {
      h: "4. Generated content",
      p: "You are solely responsible for the scripts you provide and the videos published via Vidcica. You grant us a non-exclusive, temporary license to process, transcribe and publish this content to the networks you connect (such as TikTok), using each platform’s official API.",
    },
    {
      h: "5. Limitation of liability",
      p: "Vidcica does its best to ensure a high quality of service, but cannot be held responsible for the unavailability of third-party platforms (Instagram, TikTok, etc.) or for changes to their APIs.",
    },
    {
      h: "6. Termination",
      p: "You can delete your account at any time from Settings → Account → Delete my account. Deletion takes effect after a 30-day retention period.",
    },
  ],
};

export default function TermsPage() {
  return (
    <LegalShell
      footer={
        <>
          Vidcica · Questions juridiques / legal :{" "}
          <a href="mailto:support@vidcica.com" className="underline">
            support@vidcica.com
          </a>
        </>
      }
    >
      <LegalSection doc={FR} />
      <hr className="border-border my-12" />
      <LegalSection doc={EN} />
    </LegalShell>
  );
}
