import { LegalSection, LegalShell, type LegalDoc } from "@/components/legal";

export const metadata = {
  title: "Politique de confidentialité",
  description: "Quelles données Vidcica collecte, pourquoi, et comment les contrôler.",
};

const FR: LegalDoc = {
  lang: "fr",
  title: "Politique de confidentialité",
  updated: "Dernière mise à jour : 1er mai 2026",
  intro:
    "Nous prenons la protection de tes données au sérieux. Ce document explique quelles données nous collectons, pourquoi, et comment tu peux les contrôler.",
  sections: [
    {
      h: "1. Données collectées",
      p: "Nous collectons les informations que tu nous fournis (nom, e-mail, numéro de téléphone), les contenus que tu génères (scripts, vidéos, miniatures) et les données d’usage (vues, clics, plantages). Aucune donnée biométrique n’est collectée.",
    },
    {
      h: "2. Finalités",
      p: "Ces données servent à fournir le service, améliorer l’expérience, communiquer avec toi, et respecter nos obligations légales. Elles ne sont jamais vendues à des tiers.",
    },
    {
      h: "3. Partage avec les plateformes",
      p: "Lorsque tu connectes un réseau social (comme TikTok), tu nous autorises à publier en ton nom via l’API officielle. Aucun mot de passe n’est stocké — uniquement les jetons d’accès, chiffrés au repos. Nous demandons uniquement les autorisations nécessaires à la publication, et tu peux déconnecter un réseau à tout moment.",
    },
    {
      h: "4. Conservation",
      p: "Les vidéos sont conservées 12 mois après leur dernière publication. Les données de compte sont conservées tant que ton compte est actif, puis supprimées dans les 30 jours suivant la fermeture.",
    },
    {
      h: "5. Tes droits",
      p: "Tu disposes d’un droit d’accès, de rectification, d’effacement et de portabilité de tes données. Pour exercer ces droits, contacte-nous depuis Aide → Nous contacter.",
    },
    {
      h: "6. Sécurité",
      p: "Tes données sont chiffrées en transit (TLS 1.3) et au repos (AES-256). Nos prestataires sont localisés en Union Européenne et conformes au RGPD.",
    },
  ],
};

const EN: LegalDoc = {
  lang: "en",
  title: "Privacy Policy",
  updated: "Last updated: May 1, 2026",
  intro:
    "We take the protection of your data seriously. This document explains what data we collect, why, and how you can control it.",
  sections: [
    {
      h: "1. Data collected",
      p: "We collect the information you provide (name, email, phone number), the content you generate (scripts, videos, thumbnails) and usage data (views, clicks, crashes). No biometric data is collected.",
    },
    {
      h: "2. Purposes",
      p: "This data is used to provide the service, improve the experience, communicate with you, and meet our legal obligations. It is never sold to third parties.",
    },
    {
      h: "3. Sharing with platforms",
      p: "When you connect a social network (such as TikTok), you authorize us to publish on your behalf via the official API. No password is stored — only access tokens, encrypted at rest. We request only the permissions needed to publish the videos you create, and you can disconnect any network at any time.",
    },
    {
      h: "4. Retention",
      p: "Videos are kept for 12 months after their last publication. Account data is kept as long as your account is active, then deleted within 30 days of closure.",
    },
    {
      h: "5. Your rights",
      p: "You have the right to access, rectify, erase and port your data. To exercise these rights, contact us from Help → Contact us.",
    },
    {
      h: "6. Security",
      p: "Your data is encrypted in transit (TLS 1.3) and at rest (AES-256). Our providers are located in the European Union and are GDPR-compliant.",
    },
  ],
};

export default function PrivacyPage() {
  return (
    <LegalShell
      footer={
        <>
          Vidcica · Demandes RGPD / privacy :{" "}
          <a href="mailto:hello@vidcica.com" className="underline">
            hello@vidcica.com
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
