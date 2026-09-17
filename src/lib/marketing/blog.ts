import type { Locale } from "@/lib/i18n/config";

/**
 * The blog, as typed content rather than MDX.
 *
 * The repo already stores prose this way (legal pages, use cases), so this adds
 * no build tooling and no dependency, and the copy stays type-checked.
 *
 * **Articles are per-locale, not translations.** The French and English keyword
 * maps overlap only partly: some questions are worth answering for one market
 * and not the other. An article therefore declares the locales it exists in, and
 * the routes, the index and the sitemap all follow that — advertising an `/en`
 * URL for an article that was never written in English would send Google to a
 * 404.
 */
export type ArticleBody = {
  title: string;
  /** Meta description, 140–160 characters. */
  description: string;
  /** Opening paragraph, shown under the title. */
  intro: string;
  sections: ReadonlyArray<{ h: string; p: string }>;
  /** Closing line that leads into the product without overselling it. */
  outro: string;
};

export type Article = {
  slug: string;
  /** ISO date — drives ordering and the `datePublished` in the schema. */
  published: string;
  /** The search this article answers, one per locale it exists in. */
  content: Partial<Record<Locale, ArticleBody>>;
};

export const ARTICLES: readonly Article[] = [
  {
    slug: "video-sans-se-filmer",
    published: "2026-09-17",
    content: {
      fr: {
        title: "Comment créer une vidéo TikTok sans se filmer",
        description:
          "Trois façons de publier des vidéos courtes sans jamais passer devant la caméra, et comment écrire un script qui retient l'attention dès la première seconde.",
        intro:
          "Beaucoup de gens abandonnent les réseaux sociaux pour une seule raison : ils n'ont pas envie de se filmer. C'est un frein réel, et il est contournable. Les vidéos qui marchent le mieux sur TikTok et YouTube Shorts ne montrent souvent aucun visage.",
        sections: [
          {
            h: "1. La vidéo avec voix off et séquences",
            p: "La formule la plus simple : un script, une voix off, des séquences d'illustration et des sous-titres. On l'utilise pour expliquer, raconter ou lister. Le spectateur écoute une voix et regarde des images qui appuient le propos — personne n'a besoin d'être à l'écran. C'est aussi le format le plus rapide à produire en série, parce qu'il ne dépend ni du décor, ni de la lumière, ni de votre disponibilité.",
          },
          {
            h: "2. La vidéo produit ou lieu",
            p: "Ici, la caméra montre ce que vous vendez : un plat, un bien immobilier, un article. Vous filmez l'objet, pas vous. Quelques plans courts suffisent, et la voix off porte le message. C'est la forme la plus directe pour un commerce, un restaurant ou une boutique en ligne.",
          },
          {
            h: "3. La capture d'écran commentée",
            p: "Pour tout ce qui se passe sur un écran — un outil, un tableau de bord, une démonstration — l'enregistrement d'écran avec commentaire fonctionne très bien. Le spectateur veut voir le résultat, pas votre visage.",
          },
          {
            h: "Ce qui compte vraiment : les trois premières secondes",
            p: "Sans visage, l'accroche repose entièrement sur la première phrase et la première image. Annoncez tout de suite ce que la personne va apprendre : « Trois erreurs qui font fuir vos clients » fonctionne mieux que « Bonjour, aujourd'hui on va parler de… ». Et prévoyez des sous-titres : une grande partie des vues se font sans le son.",
          },
          {
            h: "Publier régulièrement compte plus que la perfection",
            p: "Une vidéo correcte par semaine bat trois vidéos parfaites publiées puis plus rien pendant un mois. C'est la régularité qui construit l'audience, et c'est précisément ce que le format sans visage rend tenable : vous n'avez pas besoin d'être disponible, coiffé et bien éclairé pour produire.",
          },
        ],
        outro:
          "Vidcica écrit le script, génère la voix off et les sous-titres, choisit les séquences et publie la vidéo sur vos réseaux — sans caméra.",
      },
      en: {
        title: "How to make videos without showing your face",
        description:
          "Three ways to publish short videos without ever appearing on camera, and how to write a hook that holds attention in the first second.",
        intro:
          "Plenty of people give up on social media for one reason: they do not want to film themselves. That is a real obstacle, and it is avoidable. Many of the best-performing videos on TikTok and YouTube Shorts show no face at all.",
        sections: [
          {
            h: "1. Voiceover over stock footage",
            p: "The simplest format: a script, a voiceover, supporting footage and captions. It works for explaining, listing or telling a story. The viewer hears a voice and watches images that back it up — nobody needs to be on screen. It is also the fastest format to produce in batches, because it does not depend on a set, the lighting, or your availability.",
          },
          {
            h: "2. Product or place videos",
            p: "Here the camera shows what you sell: a dish, a property, an item. You film the thing, not yourself. A few short shots are enough, and the voiceover carries the message. This is the most direct format for a shop, a restaurant or an online store.",
          },
          {
            h: "3. Narrated screen recordings",
            p: "For anything that happens on a screen — a tool, a dashboard, a walkthrough — a screen recording with commentary works well. The viewer wants to see the result, not your face.",
          },
          {
            h: "What actually matters: the first three seconds",
            p: 'Without a face, the hook rests entirely on your first line and first image. Say immediately what the viewer will learn: "Three mistakes that cost you customers" beats "Hi everyone, today we\'re going to talk about…". And add captions — a large share of views happen with the sound off.',
          },
          {
            h: "Consistency beats perfection",
            p: "One decent video a week beats three perfect ones followed by a month of silence. Consistency builds the audience, and that is exactly what the faceless format makes sustainable: you do not need to be available, dressed and well lit in order to publish.",
          },
        ],
        outro:
          "Vidcica writes the script, generates the voiceover and captions, picks the footage and publishes to your networks — no camera involved.",
      },
    },
  },
  {
    slug: "script-video-courte",
    published: "2026-09-17",
    content: {
      fr: {
        title: "Comment écrire un script de vidéo courte",
        description:
          "La structure en quatre temps qui fonctionne pour une vidéo de 15 à 60 secondes : accroche, promesse, contenu, appel à l'action — avec des exemples.",
        intro:
          "Une vidéo courte se joue à l'écriture. Le montage, la voix et les images viennent après : si le script ne tient pas, rien ne rattrape. Voici la structure la plus fiable, et pourquoi elle marche.",
        sections: [
          {
            h: "L'accroche : une phrase, pas une introduction",
            p: "Vous avez environ une seconde avant que le pouce ne glisse. Supprimez les salutations et entrez directement dans le sujet. Une accroche efficace annonce un bénéfice (« Voilà comment remplir votre salle un mardi soir »), une tension (« Votre annonce immobilière fait fuir les acheteurs ») ou un chiffre concret.",
          },
          {
            h: "La promesse : dites ce que la personne va obtenir",
            p: "Juste après l'accroche, une phrase qui cadre la suite : « Trois choses à changer », « La méthode en deux minutes ». Le spectateur reste s'il sait où il va. C'est aussi ce qui vous empêche de partir dans tous les sens au milieu.",
          },
          {
            h: "Le contenu : une idée par vidéo",
            p: "Une seule idée, développée en deux ou trois points. Le réflexe naturel est d'en dire trop ; c'est ce qui fait décrocher. Si vous avez cinq conseils, faites cinq vidéos — vous aurez du contenu pour un mois au lieu d'une vidéo confuse.",
          },
          {
            h: "L'appel à l'action : un seul, explicite",
            p: "Terminez par une action unique : suivre le compte, poser une question en commentaire, cliquer sur le lien. Deux appels à l'action valent zéro. Et formulez-le comme une suite logique de ce que vous venez de dire, pas comme une pause publicitaire.",
          },
          {
            h: "Le test de lecture à voix haute",
            p: "Lisez le script à voix haute en vous chronométrant. Comptez environ 150 mots par minute : une vidéo de 30 secondes fait donc autour de 75 mots. Si vous devez accélérer pour tenir, coupez du texte plutôt que de parler plus vite.",
          },
        ],
        outro:
          "Vidcica part d'une phrase et écrit le script complet dans cette structure, puis le transforme en vidéo prête à publier.",
      },
      en: {
        title: "How to write a script for a short video",
        description:
          "The four-part structure that works for a 15 to 60 second video: hook, promise, content, call to action — with examples.",
        intro:
          "A short video is won or lost in the writing. Editing, voice and footage come later: if the script does not hold, nothing rescues it. Here is the most reliable structure, and why it works.",
        sections: [
          {
            h: "The hook: one line, not an introduction",
            p: 'You have roughly a second before the thumb moves on. Cut the greetings and start inside the subject. A good hook states a benefit ("Here\'s how to fill your restaurant on a Tuesday"), a tension ("Your listing is scaring buyers off") or a concrete number.',
          },
          {
            h: "The promise: say what they will get",
            p: 'Right after the hook, one line that frames what follows: "Three things to change", "The method in two minutes". Viewers stay when they know where they are going. It also stops you wandering halfway through.',
          },
          {
            h: "The content: one idea per video",
            p: "A single idea, developed over two or three points. The instinct is to say too much, and that is what loses people. If you have five tips, make five videos — that is a month of content instead of one muddled clip.",
          },
          {
            h: "The call to action: exactly one",
            p: "End with a single action: follow, comment, tap the link. Two calls to action are worth none. Phrase it as the natural next step from what you just said, rather than as an ad break.",
          },
          {
            h: "The read-aloud test",
            p: "Read the script out loud with a timer. Budget about 150 words per minute, so a 30-second video runs around 75 words. If you have to rush to fit, cut words rather than speaking faster.",
          },
        ],
        outro:
          "Vidcica starts from one sentence, writes the full script in this structure, then turns it into a video ready to publish.",
      },
    },
  },
];

export function findArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/** Articles that exist in a locale, newest first. */
export function articlesFor(locale: Locale): Article[] {
  return ARTICLES.filter((a) => a.content[locale]).sort((x, y) =>
    y.published.localeCompare(x.published),
  );
}

/** Every (locale, path) pair that actually resolves — for the sitemap. */
export function blogPaths(locale: Locale): string[] {
  return articlesFor(locale).map((a) => `/blog/${a.slug}`);
}
