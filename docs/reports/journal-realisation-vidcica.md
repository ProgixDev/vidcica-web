# Journal de réalisation — Projet Vidcica

**Chronologie du développement et analyse du calendrier**

**Client :** Kenn Dimitri<br>
**Prestataire :** Progix<br>
**Référence :** Engagement Article 4.1 — 30 jours de développement<br>
**Mise en ligne Google Play :** 14 août 2026<br>
**Période couverte :** 2 mai 2026 → 4 septembre 2026 (améliorations et mises à jour après la mise en ligne)<br>
**Date du rapport :** 10 septembre 2026

---

## 1. Objet

Ce document retrace, date par date, le déroulement du développement de Vidcica (application mobile iOS/Android et plateforme web). Il sert à mettre en regard le calendrier réel et l'engagement initial de 30 jours.

Chaque date citée est vérifiable. Elle provient de l'historique horodaté du code, des documents de décision datés du projet, des rapports quotidiens transmis au client et de l'historique des mises en production (voir annexe A). Les retards décrits au §7.1 proviennent des échanges avec le client.

La numérotation **J1, J2…** compte les jours calendaires à partir du démarrage du développement, le **2 mai 2026 (J1)**.

---

## 2. Synthèse

- **Engagement initial.** 30 jours de développement pour l'application mobile iOS/Android, backend compris, jusqu'à la soumission aux stores, répartis en 7 sprints. Le développement a démarré le 2 mai 2026.
- **À l'issue du mois prévu,** les écrans de l'application étaient construits (phase 1 achevée le 20 mai, J19). Le backend, dont la chaîne de génération vidéo par IA, a été mis en production le 1er juin (J31).
- **Échéance ajustée : 10 – 11 juin.** Entre mai et début juin, le client a mis 7 jours à créer les comptes nécessaires au projet et 3 à 4 jours à approvisionner les crédits des services IA. Reportée de ces 10 à 11 jours, l'échéance du 31 mai tombe le 10 – 11 juin (J40 – J41). À cette date, le backend était en production depuis le 1er juin, et la première vidéo IA réelle a été produite le 10 juin.
- **Mise en ligne : 14 août (J105), sur le Google Play Store.** Les travaux suivants sont des améliorations et des mises à jour de l'application en ligne. S'y ajoutent la préparation de la soumission App Store et l'ouverture de la publication sur les réseaux, au fil des validations des plateformes.
- **Le périmètre s'est ensuite fortement élargi.** Le 27 juin (J57), le client a demandé une **version web complète** de Vidcica, qui ne figurait pas dans l'engagement. Son développement principal, frontend et raccordement au backend compris, a pris **24 jours** (13 juillet – 5 août), avec une première mise en production dès le 13 juillet. Validations et compléments ont suivi jusqu'au 31 août. Au total, elle représente 87 enregistrements de code et 37 mises en production.
- **Plusieurs décisions du client ont modifié des éléments déjà développés.** La grille tarifaire a été révisée deux fois. L'essai gratuit a été supprimé après avoir été développé. Les règles d'accès aux publicités ont changé, et un vrai choix de modèle vidéo selon l'abonnement a été demandé.
- **Plusieurs étapes dépendaient d'éléments à fournir par le client :**
  - la création des comptes nécessaires (Google Play, Apple, réseaux sociaux, outils IA : 7 jours de retard cumulés) ;
  - l'approvisionnement en crédits des services IA (3 à 4 jours) ;
  - des absences et périodes sans réponse du client (5 jours cumulés sur la durée du développement) ;
  - la configuration du service SMS (20 jours d'attente) ;
  - les informations légales de la société (29 jours) ;
  - la vidéo de démonstration pour Google ;
  - la vérification d'identité du compte Meta du client (au moins 3 jours perdus à chercher l'origine d'un blocage qui venait de là) ;
  - la vérification d'entreprise Meta, toujours pas confirmée par le client à ce jour.
- **En dehors du développement, l'accès aux API de YouTube, TikTok et Meta dépendait de la validation de chaque plateforme.** Ces validations exigent la démonstration d'un parcours déjà fonctionnel dans l'application. Elles ne pouvaient donc être demandées qu'une fois ces parcours développés, puis ont demandé de 10 à 20 jours d'instruction. TikTok a validé le 20 août et Google/YouTube le 25 août. Meta a accordé l'accès aux publicités, opérationnelles depuis le 10 août. La demande pour Instagram et Facebook, préparée le 17 août, n'a pas pu être déposée : Meta exige d'abord la vérification d'entreprise, que le client n'a pas confirmée.

---

## 3. Référentiel : l'engagement initial

La spécification fonctionnelle v1.0 (6 mai 2026) planifie le développement en 7 sprints, pour un total de **30 jours, « conforme à l'engagement Article 4.1 »** :

| Sprint | Durée | Contenu                                             |
| ------ | ----- | --------------------------------------------------- |
| 1      | 5 j   | Socle technique, authentification, paramètres       |
| 2      | 5 j   | Comptes sociaux, génération vidéo IA, édition       |
| 3      | 4 j   | Publication, bibliothèque                           |
| 4      | 6 j   | Meta Ads (création et pilotage), prospects          |
| 5      | 4 j   | Statistiques, abonnements et crédits                |
| 6      | 3 j   | Notifications, aide, finitions                      |
| 7      | 3 j   | Recette, corrections, builds, soumission aux stores |

Cette spécification concerne **l'application mobile uniquement**. L'administration web y figure comme « Hors scope MVP mobile ». Les tarifs prévus étaient de 19 / 49 / 149 € par mois. L'interface était prévue en français, l'anglais étant indiqué comme « futur ».

### Échéance ajustée des retards du client

| Élément                                                                                  | Date / durée                 |
| ---------------------------------------------------------------------------------------- | ---------------------------- |
| Échéance initiale (30 jours à compter du 2 mai)                                          | 31 mai (J30)                 |
| Retard du client : création des comptes (Google Play, Apple, réseaux sociaux, outils IA) | + 7 jours                    |
| Retard du client : approvisionnement en crédits des services IA                          | + 3 à 4 jours                |
| **Échéance ajustée**                                                                     | **10 – 11 juin (J40 – J41)** |

Ces deux retards sont survenus entre mai et début juin, pendant la période de réalisation du périmètre initial (détail au §7.1). L'échéance ajustée ne tient pas compte des autres attentes décrites au §7, postérieures à cette période.

---

## 4. Chronologie

| Date              | Jour        | Étape                                                                                                                                                                                                                                           |
| ----------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2 mai             | J1          | Démarrage du développement de l'application mobile                                                                                                                                                                                              |
| 3 – 6 mai         | J2 – J5     | Construction des premiers écrans. **Reprise du design** à la suite d'un retour du client sur le rendu visuel                                                                                                                                    |
| 20 mai            | J19         | **Phase 1 achevée** : tous les parcours de l'application construits et conformes aux règles validées le 4 mai. Premiers builds iOS/Android                                                                                                      |
| 31 mai – 1er juin | J30 – J31   | **Backend mis en production** : authentification réelle, chaîne de génération vidéo IA, crédits, publication TikTok, version anglaise                                                                                                           |
| 2 juin            | J32         | Décisions du client : publicités réservées aux abonnements Pro et plus, vrai choix de modèle vidéo selon l'abonnement                                                                                                                           |
| 3 juin            | J33         | Publication YouTube et LinkedIn, notifications push. Connexion par SMS livrée, **en attente de la configuration du client**                                                                                                                     |
| **10 juin**       | **J40**     | **Échéance ajustée des retards du client (voir §3).** Première vidéo IA réelle produite en production. La clé API Luma transmise par le client relevait de la nouvelle plateforme de Luma, et le connecteur a dû être adapté à cette plateforme |
| 16 – 24 juin      | J46 – J54   | Instagram, Facebook et Threads, paiement Stripe, raccordement Meta Ads, nouveaux moteurs vidéo, musique de fond                                                                                                                                 |
| 23 juin           | J53         | Connexion par SMS activée, dès réception de la configuration du client                                                                                                                                                                          |
| **27 juin**       | **J57**     | **Demande du client : version web de Vidcica.** Étude de cadrage remise au client                                                                                                                                                               |
| 5 juillet         | J65         | Tarifs finaux « convenus avec le client » (25 / 45 / 99 €) et **suppression de l'essai gratuit** à la demande du client                                                                                                                         |
| **13 juillet**    | **J73**     | **Démarrage de la plateforme web.** Première mise en production le jour même                                                                                                                                                                    |
| 16 – 20 juillet   | J76 – J80   | Préparation de la publication Play Store, dont la mise en conformité avec la politique de paiement Google Play                                                                                                                                  |
| 19 juillet        | J79         | Mentions légales publiées avec « [à compléter] », **en attente des informations société du client**                                                                                                                                             |
| 21 – 29 juillet   | J81 – J89   | Web : version bilingue, alignement fonctionnel sur l'application mobile                                                                                                                                                                         |
| **5 août**        | **J96**     | **Plateforme web terminée et prête pour les validations** : connexion des réseaux depuis le web, options de publication exigées par TikTok                                                                                                      |
| 10 août           | J101        | **Meta Ads opérationnel de bout en bout** (première campagne réelle créée sur le compte publicitaire du client)                                                                                                                                 |
| **14 août**       | **J105**    | **Application en ligne sur le Google Play Store**                                                                                                                                                                                               |
| 17 août           | J108        | Préparation de la soumission App Store (Sign in with Apple, nouveau build iOS). Mentions légales complétées dès réception des informations du client                                                                                            |
| 20 – 21 août      | J111 – J112 | **Validation TikTok obtenue.** Publication ouverte au public (TikTok, LinkedIn)                                                                                                                                                                 |
| 25 – 26 août      | J116 – J117 | **Vérification Google obtenue.** Publication YouTube ouverte au public. Nouveau build Android                                                                                                                                                   |
| 31 août – 4 sept. | J122 – J126 | Sign in with Apple ajouté au parcours d'inscription mobile, documentation, passation technique                                                                                                                                                  |

---

## 5. Temps consacré

Le projet n'a pas fait l'objet d'une feuille de temps horaire. Le tableau ci-dessous répartit donc les **enregistrements de code** par période.

**Important.** Un enregistrement correspond au moment où un ensemble de travaux est sauvegardé dans l'historique, et non aux jours de travail qui l'ont produit. Le développement se fait régulièrement sur plusieurs jours avant un enregistrement groupé. Les jours sans enregistrement ne sont donc **pas** des jours sans travail. C'est pourquoi ce rapport ne mesure pas le temps en « jours comportant un enregistrement ».

| Période                           | Durée     | Travaux principaux                                                                                                              | Enregistrements mobile | Enregistrements web |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------- |
| 2 – 31 mai (J1 – J30)             | 30 j      | Construction de l'application, design, phase 1                                                                                  | 37                     | —                   |
| 1er juin – 12 juillet (J31 – J72) | 42 j      | Backend, IA, publication, paiements, décisions du client                                                                        | 89                     | —                   |
| 13 juillet – 5 août (J73 – J96)   | 24 j      | **Plateforme web : développement principal**, préparation Play Store                                                            | 21                     | **69**              |
| 6 – 31 août (J97 – J122)          | 26 j      | **Mise en ligne Google Play (14 août)**, puis améliorations, mises à jour, préparation App Store et validations des plateformes | 21                     | 18                  |
| 1er – 4 septembre (J123 – J126)   | 4 j       | Passation                                                                                                                       | 1                      | —                   |
| **Total**                         | **126 j** |                                                                                                                                 | **169**                | **87**              |

À retenir :

- **La plateforme web a été développée en 24 jours** (13 juillet – 5 août), frontend et raccordement au backend compris, avec une première mise en production dès le 13 juillet. Cette période concentre 69 de ses 87 enregistrements. Au 5 août, la plateforme était prête pour les validations des plateformes. La suite, jusqu'au 31 août, a porté sur ces validations, la conformité et des compléments.
- **La plateforme web représente 87 des 256 enregistrements du projet (34 %)** et 37 mises en production. Aucune de ces tâches ne relevait de l'engagement initial.
- Ces chiffres **sous-estiment** le travail réel. Ils excluent :
  - les déploiements des fonctions serveur ;
  - la configuration des consoles Google, Apple, Meta, TikTok et Supabase ;
  - la préparation des dossiers de validation ;
  - les échanges avec le client.

  Avant le 31 mai notamment, le code serveur était déployé directement sur l'infrastructure, sans être versionné. Il n'apparaît donc pas dans l'historique.

---

## 6. Évolutions du périmètre

### 6.1 Demandes et décisions du client

| Date            | Évolution                                                                                                                                    | Origine                                                | Conséquence                                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3 – 6 mai       | Reprise du design de l'application                                                                                                           | Retour du client sur le rendu visuel                   | Refonte des écrans déjà construits                                                                                                                                 |
| 2 juin          | Choix réel du modèle vidéo selon l'abonnement                                                                                                | Demande du client                                      | Moteurs vidéo supplémentaires intégrés du 17 juin au 5 juillet (Kling, Seedance, LTX, Veo, Kling Pro)                                                              |
| 2 juin          | Publicités réservées aux abonnements Pro et supérieurs                                                                                       | Décision du client                                     | Modification des règles validées le 4 mai (le plan Starter prévoyait 1 campagne)                                                                                   |
| mai → 5 juillet | Grille tarifaire modifiée deux fois depuis la spécification : 19 / 49 / 149 € → 9,99 / 24,99 / 59,99 € (en place au 2 juin) → 25 / 45 / 99 € | Version finale « convenue avec le client » (5 juillet) | Offres, crédits et textes repris à chaque révision                                                                                                                 |
| 5 juillet       | Suppression de l'essai gratuit de 7 jours                                                                                                    | Décision du client                                     | Fonction validée le 4 mai et développée le 20 mai, retirée entièrement                                                                                             |
| **27 juin**     | **Version web complète de Vidcica**                                                                                                          | **Demande du client**                                  | **Nouvelle plateforme développée en 24 jours (13 juillet – 5 août), puis validations et compléments jusqu'au 31 août. 87 enregistrements, 37 mises en production** |

### 6.2 Fonctionnalités livrées au-delà de la spécification initiale

| Date          | Fonctionnalité                                                      | Spécification initiale                  |
| ------------- | ------------------------------------------------------------------- | --------------------------------------- |
| 1er – 10 juin | Application entièrement bilingue français / anglais (2 400+ textes) | Français, anglais « futur »             |
| 2 juin        | Création de vidéo à partir d'une image importée                     | Création à partir d'un texte uniquement |

---

## 7. Éléments attendus du client

### 7.1 Accès, comptes et crédits

Ces retards proviennent des échanges avec le client (e-mails, messages).

| Élément attendu                                                                                                                                                               | Période                                             | Retard              | Conséquence                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Création des comptes nécessaires au projet : compte développeur Google Play, compte développeur Apple, comptes des réseaux sociaux, comptes des outils de génération vidéo IA | Mai – début juin                                    | **7 jours cumulés** | Builds pour les stores, raccordement des réseaux sociaux et génération IA réelle en attente de ces accès                                                                                                                   |
| Approvisionnement en crédits des services de génération vidéo IA (à fournir par le client avec les clés API)                                                                  | Mai – début juin                                    | **3 à 4 jours**     | Aucun test de génération réelle possible tant que les crédits n'étaient pas disponibles                                                                                                                                    |
| Vérification d'identité du compte Meta du client non effectuée                                                                                                                | À partir du 10 août (J101)                          | **≥ 3 jours**       | Blocage Meta identifié et signalé au client le 10 août. Le client n'a pas pu le lever lui-même, et a passé au moins 3 jours à en chercher l'origine : la vérification d'identité de son propre compte n'était pas réalisée |
| Absences et périodes sans réponse du client (validations, décisions, informations demandées)                                                                                  | Ponctuellement, sur toute la durée du développement | **5 jours cumulés** | Décisions et validations en suspens, travaux dépendants mis en attente                                                                                                                                                     |

### 7.2 Éléments datés dans les documents du projet

| Élément attendu                                                                                              | Depuis                           | Reçu / levé                                          | Attente        | Conséquence                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------- | ---------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuration du service SMS (modèle de message, clé API, secret)                                            | 3 juin (J33)                     | 23 juin (J53)                                        | **20 jours**   | Connexion par téléphone restée en mode démonstration                                                                                                                                                       |
| Informations légales de la société (raison sociale, forme juridique, SIREN, siège, directeur de publication) | 19 juillet (J79)                 | 17 août (J108)                                       | **29 jours**   | Mentions légales du site publiées avec des champs « [à compléter] »                                                                                                                                        |
| Vidéo de démonstration pour la vérification Google (YouTube)                                                 | Au plus tard le 21 juillet (J81) | —                                                    | —              | Vérification Google obtenue le 25 août. Jusque-là, YouTube restait limité à 100 utilisateurs, avec un avertissement « application non vérifiée »                                                           |
| Vérification d'entreprise Meta (numéro d'entreprise) et captures vidéo pour la validation Meta               | Au plus tard le 10 août (J101)   | **Non confirmée par le client à la date du rapport** | **≥ 31 jours** | Le dossier de validation Instagram / Facebook, préparé le 17 août, n'a pas pu être déposé. Publication Instagram / Facebook non ouverte au public, et publicités Meta non ouvertes à tous les utilisateurs |

Ces attentes ont été signalées au client au fil du projet, notamment dans les rapports quotidiens des 21 juillet, 22 juillet et 10 août.

---

## 8. Validations imposées par des plateformes tierces

### 8.1 Pourquoi ces validations ne pouvaient pas être demandées plus tôt

En dehors du développement lui-même, l'accès public aux API de **YouTube (Google)**, **TikTok** et **Meta** (Instagram, Facebook, publicités) est soumis à la validation de chaque plateforme. Tant que cette validation n'est pas obtenue, les fonctions concernées restent réservées aux comptes de test, quel que soit l'avancement du développement.

Ces demandes ne pouvaient pas être déposées au début du projet. Chaque plateforme exige la démonstration d'un parcours **déjà fonctionnel** dans l'application :

- **Google (YouTube) :** une vidéo de démonstration montrant l'écran d'autorisation et l'usage réel de chaque accès demandé.
- **TikTok et Meta :** une application accessible pour l'examinateur, un compte de test, une vidéo par permission demandée, et la vérification du domaine ou de l'entreprise.

Le déroulé était donc nécessairement séquentiel :

1. développer le parcours (connexion du compte, publication) ;
2. le rendre démontrable à un examinateur externe ;
3. enregistrer les démonstrations ;
4. déposer la demande ;
5. attendre l'instruction par la plateforme, qui a pris **de 10 à 20 jours** selon la plateforme.

Ce temps d'attente ne dépendait pas du développement : il s'est ajouté au calendrier une fois les parcours terminés.

### 8.2 Validations et issues

| Plateforme                   | Objet                                                                                                                           | Issue                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Google Play                  | Politique de paiement : pas d'achat dans l'application Android hors système Google. Les achats ont été déplacés sur le site web | Mise en conformité le 16 juillet                                                                                       |
| TikTok                       | Validation de l'application et audit de l'API de publication, sur démonstration                                                 | Approuvée le 20 août. Publication ouverte le 21 août                                                                   |
| Google (YouTube)             | Vérification des accès YouTube, sur vidéo de démonstration (délai annoncé par Google : 2 à 4 semaines)                          | Approuvée le 25 août. Publication ouverte le 26 août                                                                   |
| Meta — publicités            | Accès aux publicités (Marketing API)                                                                                            | **Accordé.** Campagnes réelles opérationnelles depuis le 10 août sur le compte publicitaire du client                  |
| Meta — Instagram et Facebook | Validation des permissions de publication, sur démonstration et vidéos par permission                                           | Dossier préparé le 17 août. **Dépôt impossible** tant que le client n'a pas confirmé la vérification d'entreprise (§7) |

Ces procédures sont obligatoires. Leurs délais d'instruction sont fixés par chaque plateforme, et elles ne peuvent être engagées qu'avec une application déjà fonctionnelle.

---

## 9. Conclusion

- **À l'issue du mois prévu,** l'application mobile était construite. Son backend, dont la génération vidéo par IA, était en production le 1er juin (J31).
- **Compte tenu des 10 à 11 jours de retard du client** sur la création des comptes et l'approvisionnement des crédits, l'échéance ajustée tombe le 10 – 11 juin. La première vidéo IA réelle a été produite en production le 10 juin.
- **Le calendrier s'est allongé à mesure que le périmètre s'élargissait.** Le client a demandé une plateforme web complète, qui représente à elle seule un tiers des enregistrements de code du projet. Le client a aussi pris plusieurs décisions qui ont conduit à reprendre des éléments déjà développés.
- **Une part importante du calendrier restant a dépendu d'éléments à fournir par le client et de validations de plateformes tierces.** Il a notamment fallu attendre :
  - 7 jours la création des comptes nécessaires au projet ;
  - 3 à 4 jours l'approvisionnement en crédits des services IA ;
  - 20 jours la configuration du service SMS ;
  - 29 jours les informations légales de la société.

  À cela s'ajoutent 5 jours cumulés d'absence du client, et au moins 3 jours perdus sur la vérification d'identité de son compte Meta. La vérification d'entreprise Meta reste en attente. Certaines de ces étapes ne sont pas encore levées à la date de ce rapport.

L'ensemble des pièces citées peut être fourni sur demande : historique horodaté du code, documents de décision datés, rapports quotidiens, historique des mises en production.

---

## Annexe A — Méthode et sources

- **Historique du code.** Dépôts de l'application mobile (169 enregistrements, du 2 mai au 4 septembre) et de la plateforme web (87 enregistrements propres à Vidcica, du 13 juillet au 31 août). Les dates d'écriture et d'enregistrement concordent pour tous les enregistrements : aucune réécriture a posteriori.
- **Historique des mises en production** de la plateforme web, fourni par l'hébergeur : 37 mises en production réussies à partir du 13 juillet.
- **Documents de décision datés** du projet : spécification v1.0 du 6 mai, décisions du 4 mai, complétion de la phase 1 du 20 mai, étude de la plateforme web du 27 juin, tarification.
- **Rapports quotidiens transmis au client** (21 juillet, 22 juillet, 10 août).
- **Échanges avec le client** (e-mails, messagerie) pour les retards du §7.1.
- **Limites.** Pas de feuille de temps horaire. Les dates d'enregistrement indiquent quand le travail a été sauvegardé, pas quand il a été réalisé : plusieurs jours de développement peuvent précéder un seul enregistrement. Les travaux hors code (configuration des consoles, dossiers de validation, échanges) ne sont pas comptés.

## Annexe B — Références

| Fait                                                                                          | Source                                                                                                        |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Plan de 30 jours « conforme à l'engagement Article 4.1 »                                      | Spécification v1.0, §18 (6 mai)                                                                               |
| Phase 1 achevée                                                                               | Document de décision « Complétion Phase 1 » (20 mai)                                                          |
| Chaîne de génération IA en production                                                         | Plan de génération IA, §7 « DEPLOYED + LIVE 2026-06-01 »                                                      |
| Clé Luma de la nouvelle plateforme, première vidéo IA réelle                                  | Enregistrement `2baa302` (10 juin)                                                                            |
| Service SMS en attente de la configuration du client                                          | Enregistrements `dc6d90c` (3 juin) et `89673fa` (23 juin)                                                     |
| Demande de version web                                                                        | Étude « Vidcica on the Web », 27 juin : « The client wants Vidcica … to also run for web users »              |
| Choix de modèle selon l'abonnement demandé par le client                                      | Décision « composer wiring » (2 juin)                                                                         |
| Publicités réservées au plan Pro (décision du client)                                         | Décision « tiers single source » (2 juin)                                                                     |
| Tarifs « convenus avec le client »                                                            | Enregistrement `ea27727` (5 juillet)                                                                          |
| Suppression de l'essai (décision du client)                                                   | Enregistrement `789ed1f` (5 juillet)                                                                          |
| Informations légales attendues                                                                | Rapports quotidiens web du 21 et du 22 juillet. Enregistrements `134e0d3` (19 juillet) et `f747798` (17 août) |
| Vidéo de démonstration Google attendue du client                                              | Rapport quotidien web du 21 juillet                                                                           |
| Vérification d'entreprise Meta attendue du client                                             | Rapport quotidien du 10 août. Dossier de validation Meta du 17 août (« Business Verification : outstanding ») |
| Accès aux publicités Meta accordé                                                             | Rapport quotidien du 10 août (permission `ads_management` accordée, campagne réelle créée)                    |
| Exigences des validations (démonstration, compte de test, vidéo par permission, vérification) | Documentation technique des validations, 5 août. Dossiers de validation Google et Meta, 17 août               |
| Validation TikTok                                                                             | Enregistrement `f32f55e` (21 août)                                                                            |
| Vérification Google                                                                           | Enregistrement `e7f363f` (26 août)                                                                            |
| Clé API et crédits IA à fournir par le client                                                 | Enregistrement `8b0165b` (17 juin) : « Owner: set FAL_KEY edge secret (+ credit) »                            |
