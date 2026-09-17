# Plan SEO — Vidcica

**Objet :** rendre vidcica.com visible sur Google et fournir au client une liste de
mots-clés exploitable pour son marketing.
**Date :** 17 septembre 2026

---

## 1. État actuel

Ce qui est déjà en place (aucun travail à refaire) :

- URLs canoniques, Open Graph, carte Twitter, image de partage.
- `robots.txt` et `sitemap.xml` générés automatiquement.
- Données structurées : WebSite + FAQ.
- Les déploiements de test sont exclus de Google.
- Propriété du domaine validée dans Google Search Console.

Les trois limites qui bloquent le référencement aujourd'hui :

| #   | Problème                                                                                 | Conséquence                                                                               |
| --- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | La langue (FR/EN) est mémorisée par cookie : les deux versions partagent la **même URL** | Google ne peut indexer qu'une seule langue. Le marché anglophone est invisible            |
| 2   | Tout le contenu (fonctionnalités, tarifs, FAQ) tient sur **une seule page**              | Une seule URL pour tous les mots-clés : elle ne peut se positionner que sur un seul sujet |
| 3   | Le site ne contient que **6 pages publiques**, dont aucune page de contenu               | Presque aucune porte d'entrée depuis Google                                               |

---

## 2. Phase 1 — Cadrage et mots-clés (3 jours)

**Décisions attendues du client :**

- Pays et langues visés (France, Québec, Belgique, Suisse ? anglophone ?).
- 3 à 5 concurrents identifiés.
- Qui rédigera les articles de blog (client, prestataire, externe).

**Travail :**

1. Extraction des mots-clés à partir du produit, des concurrents et de Search Console.
2. Regroupement par intention, en familles :
   - **Produit** : générateur de vidéo IA, créer une vidéo avec l'IA, application vidéo IA
   - **Format** : vidéo TikTok IA, YouTube Shorts IA, Reels Instagram IA
   - **Tâche** : script vidéo IA, voix off IA française, sous-titres automatiques
   - **Publication** : publier automatiquement sur TikTok, programmer ses publications
   - **Publicité** : créer une campagne Meta Ads, publicité Facebook automatique
   - **Alternatives** : alternative à [concurrent]
   - **Longue traîne** : comment créer une vidéo TikTok sans se filmer, etc.
3. **Livrable : la carte des mots-clés** — un tableau `mot-clé → intention → famille →
page cible → priorité`. C'est le document que le client utilisera pour son marketing.

> Les volumes de recherche réels nécessitent un outil payant (Ahrefs, Semrush ou
> équivalent). Sans cet accès, les mots-clés sont établis à partir du produit et des
> concurrents, puis affinés avec les données Search Console après quelques semaines.

---

## 3. Phase 2 — Architecture du site (5 à 8 jours)

Une page par famille de mots-clés, au lieu d'une page unique.

**a. URLs par langue** — remplacer le cookie par des URLs `/fr/…` et `/en/…`, avec
balises `hreflang` et canonique par langue. C'est le point le plus structurant :
il ouvre le marché anglophone et supprime le contenu dupliqué.

**b. Pages à créer :**

| Page                                       | Mots-clés visés                                             |
| ------------------------------------------ | ----------------------------------------------------------- |
| `/fonctionnalites` + une page par fonction | génération IA, voix off, sous-titres, publication, Meta Ads |
| `/tarifs`                                  | prix, abonnement, crédits                                   |
| `/faq`                                     | questions longue traîne                                     |
| `/cas-usage/<métier>`                      | coach, restaurant, e-commerce, immobilier                   |
| `/alternatives/<concurrent>`               | alternative à [concurrent]                                  |

Chaque page : un seul H1, titre et description uniques, maillage interne, appel à l'action.

---

## 4. Phase 3 — Technique (2 à 3 jours)

- Sitemap régénéré à partir des nouvelles pages et des deux langues ; retrait de `/sign-in` ;
  dates de modification réelles.
- `robots.txt` : exclure aussi les pages applicatives (`/dashboard`, `/videos`, `/ads`…).
- Données structurées : ajout de Organization, SoftwareApplication (avec tarifs),
  BreadcrumbList ; conservation de FAQPage.
- Image de partage propre à chaque page.
- Performances (Core Web Vitals) : audit Lighthouse, images optimisées, LCP < 2,5 s.
- Mesure : Google Search Console + Bing Webmaster Tools + un outil d'analyse d'audience.

---

## 5. Phase 4 — Contenu (en continu)

- Création d'un blog (`/blog`), avec balisage Article.
- 12 à 15 articles répondant aux recherches de la longue traîne, un par sujet de la carte
  des mots-clés, chacun renvoyant vers la page produit correspondante.
- Rythme conseillé : 2 à 4 articles par mois. C'est le levier principal une fois la
  structure en place.

---

## 6. Phase 5 — Hors site et magasins d'applications (2 jours)

- **Fiche Google Play (ASO)** : titre, description courte et longue optimisées sur les
  mots-clés, captures d'écran. Le référencement dans le magasin est aussi important que
  celui du site.
- Inscription aux annuaires : Product Hunt, AlternativeTo, Capterra, annuaires SaaS
  francophones.
- Partenariats et articles invités pour obtenir des liens entrants.

---

## 7. Phase 6 — Suivi (mensuel)

- Rapport mensuel : positions, clics, conversions, pages d'entrée.
- Ajustement de la carte des mots-clés selon les données réelles de Search Console.
- Guide court remis au client pour exploiter la carte des mots-clés dans ses campagnes.

---

## 8. Calendrier indicatif

| Semaine                  | Contenu                                              |
| ------------------------ | ---------------------------------------------------- |
| 1                        | Cadrage, carte des mots-clés (livrable client)       |
| 2 – 3                    | URLs par langue, nouvelles pages                     |
| 4                        | Technique, données structurées, performances, mesure |
| À partir de la semaine 5 | Blog, ASO, annuaires, suivi mensuel                  |

Les premiers effets sur le trafic apparaissent généralement entre 2 et 4 mois.
