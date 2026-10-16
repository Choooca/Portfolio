# Portfolio — Passage au dev

Oct 13, 2026 · @Vincensini

## Vue d'ensemble

Le site est statique, généré avec **Astro** et hébergé gratuitement sur **GitHub Pages**. Chaque projet est un fichier Markdown : ajouter un projet = ajouter un fichier, sans toucher au code.

- **Maquette de référence** : fichier Figma « Portfolio », page « Refonte V2 ». Le mode sombre est la référence, le mode clair en découle par les variables.
- **Pourquoi Astro** : il génère du HTML pur (rapide, bon pour le référencement) et gère nativement des collections de fichiers Markdown typées. Le peu d'interactivité (filtres, carrousel, thème) tient en petits scripts.
- **Déploiement** : Astro maintient une GitHub Action officielle qui publie sur GitHub Pages à chaque push sur `main`, avec peu de configuration ([guide officiel](https://docs.astro.build/en/guides/deploy/github/)). Un nom de domaine personnalisé reste possible plus tard.
- **Langues** : FR par défaut, EN via le sélecteur. Les textes de l'interface vont dans un fichier de traduction, le contenu des projets dans un champ par langue (voir le modèle de données).

## Pages et écrans

Trois gabarits de page couvrent tout le site : Accueil, Bibliothèque, Projet. Chaque écran existe en sombre (rangée du haut) et en clair (rangée en dessous) dans Figma.

| Page | Desktop (1920) | Mobile (390) | Notes |
| --- | --- | --- | --- |
| Accueil — écran d'entrée | Screen / Accueil | Mobile / Accueil | Plein écran, on fait défiler pour entrer |
| Accueil — contenu | Screen / Accueil — Projets | Mobile / Accueil — Projets | Bannière demoreel, projets mis en avant, À propos, Parcours |
| Bibliothèque | Screen / Bibliothèque | Mobile / Bibliothèque | Cartes en grille (desktop), liste compacte (mobile) |
| Bibliothèque — filtres | Screen / Bibliothèque — Filtre actif (C++) | Mobile / Bibliothèque — Filtres | Menu déroulant (desktop), panneau du bas (mobile) |
| Bibliothèque — aucun résultat | Screen / Bibliothèque — Aucun résultat | — | Même message en mobile, centré |
| Projet solo | Screen / Projet — Deferred & Forward Rendering | — | Sans « Mon rôle » |
| Projet en équipe | Screen / Projet — Diamond Seams (équipe) | Mobile / Projet — Diamond Seams | Avec « Mon rôle » |
| Menu mobile | — | Mobile / Menu ouvert | Liens, langue, thème, CV |
| 404 | Screen / 404 | Mobile / 404 |  |

Le lien « Contact » de la navigation fait défiler jusqu'au pied de page, il n'y a pas de page Contact dédiée.

## Modèle de données d'un projet

Un projet = un fichier `src/content/projets/<slug>.md`. L'en-tête (frontmatter) porte les données ci-dessous ; le corps Markdown porte le texte de la page projet (Contexte, Réalisations techniques…), avec images, vidéos et blocs de code insérés directement.

| Champ | Type | Obligatoire | Rôle à l'affichage |
| --- | --- | --- | --- |
| `titre` | texte | oui | Carte, page projet, navigation précédent/suivant |
| `slug` | texte | oui (nom du fichier) | URL `/projets/<slug>` |
| `section` | `pro` · `scolaire` · `perso` | oui | Section de la Bibliothèque |
| `genre` | texte court | oui | Ligne sous le titre des cartes |
| `pitch` | 1 phrase | oui | Sous le titre de la page projet |
| `domaine` | liste : Gameplay, Graphique, Bas niveau, Tech art, Prototype | oui | Pastille rouge + filtre |
| `moteur` | Unity · Unreal · Godot · Sans moteur | non | Pastille violette + filtre |
| `langage` | liste : C#, C++, Blueprint, HLSL… | non | Pastille bleue + filtre |
| `equipe` | nombre (1 = solo) | oui | Si > 1 : affiche la ligne « Rôle » et l'encadré « Mon rôle » |
| `role` | texte | si `equipe` > 1 | Fiche projet + titre de « Mon rôle » |
| `contribution` | texte | si `equipe` > 1 | Paragraphe de « Mon rôle » |
| `duree` | texte | non | Fiche projet |
| `plateforme` | texte | non | Fiche projet |
| `technos` | liste | oui | Pastilles neutres de la fiche projet |
| `liens` | `jouer`, `github`, `video` (URL) | non | Boutons de la fiche ; bouton absent si lien vide |
| `medias` | liste ordonnée d'images/vidéos + légende | oui (≥ 1) | Carrousel ; le 1er sert de vignette |
| `apercu` | vidéo courte (5–10 s, muette) | non | Lecture au survol de la carte |
| `featured` | booléen | non | Apparaît dans le carrousel de l'accueil |
| `ordre` | nombre | non | Ordre dans sa section (sinon alphabétique) |

- **Cartes** : toutes les valeurs de `domaine`, `moteur` et `langage` s'affichent en pastilles, dans cet ordre ; elles passent à la ligne et la carte s'allonge si besoin. Le détail des `technos` reste réservé à la fiche projet. *(Décidé au dev le 16/10/2026 : la maquette n'en prévoyait qu'une par dimension, mais une carte pouvait alors ressortir d'un filtre sans montrer la pastille correspondante.)*
- **Précédent / suivant** : projets voisins dans la même section, en boucle.
- **Traduction** : les champs texte (`genre`, `pitch`, `role`, `contribution`) et le corps existent en FR et EN ; si l'EN manque, on affiche le FR.

## Bibliothèque et filtres

Règle : **OU à l'intérieur d'un groupe, ET entre les groupes**. Exemple : Unity + Godot + C# = les projets (Unity ou Godot) et en C#.

- **Sections fixes** : Professionnel, Scolaire, Personnel, toujours dans cet ordre et toujours visibles. Chaque section affiche son compteur de projets correspondants.
- **Section sans résultat** : elle reste affichée, réduite à son en-tête avec son compteur à zéro. *(Décidé au dev le 16/10/2026 : le message « Aucun projet ne correspond aux filtres actifs dans cette section » prenait trop de place pour ce qu'il apportait, le compteur à zéro suffit.)*
- **Aucun résultat du tout** : les sections sont remplacées par l'état vide global, avec un bouton « Réinitialiser les filtres ».
- **Deux façons de filtrer** :
  - les menus Domaine / Moteur / Langage (desktop) ou le bouton « Filtres » qui ouvre le panneau du bas (mobile) ;
  - un clic sur une pastille d'une carte, qui ajoute ce filtre ou le retire s'il est déjà actif.
- **Retour visuel** : la barre « Filtres actifs » liste chaque filtre avec une croix pour le retirer. Un badge sur le menu donne le nombre de filtres de ce groupe, et les pastilles des cartes qui correspondent passent en état actif. Le total « X projets sur 24 » se met à jour.
- **Menus** : chaque option affiche le nombre total de projets qui la portent. Les options sans aucun projet n'apparaissent pas.
- **URL** : les filtres sont écrits dans l'adresse (`/bibliotheque?moteur=unity,godot&langage=csharp`), pour pouvoir partager une recherche et retrouver sa sélection en revenant depuis une page projet. En revanche l'adresse est **remplacée** et non empilée : le bouton Précédent quitte la Bibliothèque au lieu de rejouer les filtres un par un. *(Décidé au dev le 16/10/2026.)*
- **Mobile** : dans le panneau, les choix ne s'appliquent qu'au bouton « Voir N projets », dont le nombre se met à jour en direct.
- **Sans JavaScript** : toutes les cartes s'affichent, les filtres sont simplement inactifs.

## Vidéos et médias

Principe : rien ne se charge avant d'être utile, pour que la Bibliothèque reste légère.

- **Aperçu au survol (desktop)** : la vidéo `apercu` remplace l'image de la carte, muette, en boucle, avec le badge « Aperçu » et la barre de progression. Elle ne se télécharge qu'au premier survol. Au départ de la souris, retour à l'image.
- **Mobile et tactile** : pas d'aperçu au survol. La carte mène directement à la page projet.
- **Bannière de l'accueil (demoreel)** : vidéo muette, en boucle, lancée automatiquement. Une image fixe s'affiche tant qu'elle charge.
- **Carrousel de la page projet** : les images s'affichent directement. Une vidéo montre sa première image avec le bouton lecture, et ne se lance qu'au clic, avec le son. Changer de média met en pause la vidéo en cours.
- **Navigation du carrousel** : flèches et vignettes (desktop), glissement au doigt et points (mobile), flèches du clavier.
- **Accessibilité** : si le visiteur a activé « réduire les animations » dans son système, l'aperçu au survol et la lecture automatique de la bannière sont désactivés.
- **Formats** : vidéos en MP4 (H.264), aperçus courts et compressés ; images en WebP ou AVIF, générées par Astro à partir des originaux.

## Éléments collants et responsive

Trois largeurs de référence. La tablette n'est pas maquettée : elle se déduit du desktop et du mobile.

| Élément | Desktop (≥ 1024 px) | Tablette (640–1023 px) | Mobile (< 640 px) |
| --- | --- | --- | --- |
| Barre de navigation | Collée en haut | Collée en haut | Collée en haut, menu burger |
| Barre de filtres (Bibliothèque) | Collée sous la navigation | Collée sous la navigation | Collée sous la navigation (bouton « Filtres ») |
| Fiche projet | Collée dans la colonne de droite | Sous le carrousel, non collée | Sous le carrousel, non collée |
| Grille de la Bibliothèque | 4 cartes par ligne | 2 cartes par ligne | Liste compacte, 1 par ligne |
| Carrousel de l'accueil | Carte centrale large + cartes latérales | Cartes de 300 px qu'on fait glisser | Cartes de 300 px qu'on fait glisser |
| Marges latérales | 120 px (contenu max 1680 px) | 40 px | 20 px |

La fiche projet n'est collée qu'en desktop : en mobile, elle prendrait trop de place à l'écran.

## Thème clair / sombre

Les 22 variables Figma de la collection « Couleurs » deviennent 22 variables CSS. Le thème clair redéfinit seulement leurs valeurs.

- **Par défaut** : le thème du système du visiteur (`prefers-color-scheme`).
- **Bascule** : le bouton soleil/lune de la navigation (et le réglage « Thème » du menu mobile). Le choix est mémorisé dans le navigateur et prime sur le système.
- **Sans flash** : un petit script dans le `<head>` applique le thème avant l'affichage de la page.
- **Restent sombres dans les deux thèmes** : la bannière demoreel et les blocs de code.
- **Transparences** : certaines couleurs sont utilisées avec une opacité (séparateurs à 7 %, fond de « Mon rôle » à 5 %, bouton CV à 8 %). Les reprendre telles quelles depuis Figma.

| Variable | Sombre | Clair |
| --- | --- | --- |
| `bg/page` | #0A0918 | #F7F6FB |
| `bg/nav` | #07061A | #FFFFFF |
| `bg/band` | #0D0C20 | #FFFFFF |
| `bg/section-alt` | #0E0D22 | #EFEDF7 |
| `surface/default` | #14122C | #FFFFFF |
| `surface/raised` | #1B1838 | #F3F1FA |
| `border/default` | #2A2752 | #E2DFF0 |
| `text/primary` | #F2F1FA | #14122C |
| `text/secondary` | #CFCDE6 | #3D3A5C |
| `text/muted` | #A6A3C4 | #5E5B80 |
| `text/subtle` | #7D7AA3 | #7A7799 |
| `accent/fill` | #FFD900 | #F2C200 |
| `accent/text` | #FFD900 | #8F6B00 |
| `accent/on` | #0A0918 | #0A0918 |
| `line/default` | #FFFFFF | #14122C |
| `chip/bg` | #FFFFFF | #ECEAF6 |
| `media/placeholder` | #1F1C40 | #E6E3F2 |
| `media/placeholder-icon` | #4A4675 | #B5B1CF |
| `media/placeholder-hover` | #2A2650 | #D9D5EC |
| `tag/domaine-text` | #FF9EA0 | #C2292E |
| `tag/moteur-text` | #CDB4FF | #7A3FE0 |
| `tag/langage-text` | #AFC0FF | #2F4FD6 |

Couleurs de base des pastilles (identiques dans les deux thèmes) : Domaine #E5484D, Moteur #A06CFF, Langage #4C6FFF. Police unique : Intel One Mono (Light, Regular, Medium, SemiBold).

## Composants

Chaque composant Figma correspond à un composant Astro. Ils sont rangés au-dessus des écrans, sur la page « Refonte V2 ».

| Composant Figma | Composant Astro | Variantes / propriétés |
| --- | --- | --- |
| Tag | `Tag.astro` | Kind : Domaine, Moteur, Langage · State : Default, Active · Label |
| Card / Projet | `ProjectCard.astro` | State : Default, Hover (aperçu vidéo) · Title, Genre |
| Card / Projet — Compact | `ProjectCard.astro` (variante `compact`) | Liste mobile, sans aperçu au survol |
| Media | `Media.astro` | Type : Image, Vidéo |
| Mon rôle | `RoleCallout.astro` | Affiché seulement si `equipe` > 1 |
| Code block | `CodeBlock.astro` | Nom de fichier, langage ; coloration syntaxique intégrée à Astro (Shiki) |
| Button / CV | dans `Nav.astro` | Lien vers le PDF du CV |
| Toggle / Thème | `ThemeToggle.astro` | Theme : Sombre (icône soleil), Clair (icône lune) |
| Nav (desktop) / Nav / Mobile | `Nav.astro` | Lien actif souligné en jaune ; burger en mobile |
| Footer / Footer / Mobile | `Footer.astro` | Mail, LinkedIn, GitHub, CV, retour en haut |

Les blocs de code des pages projet s'écrivent directement en Markdown (trois backticks + langage) et prennent le style du composant automatiquement.

## Petits états et accessibilité

- **Focus clavier** : contour jaune de 2 px, décalé de 4 px, uniquement à la navigation clavier (`:focus-visible`). Exemples dans le tableau « États / Focus clavier ».
- **404** : page dédiée avec deux boutons, « Retour à l'accueil » et « Voir la bibliothèque ». GitHub Pages sert automatiquement le fichier `404.html` généré par Astro.
- **Aucun résultat** : voir la section Bibliothèque.
- **Images** : chaque média a un texte alternatif (sa légende, ou le titre du projet pour les vignettes).
- **Pastilles cliquables** : ce sont de vrais boutons, avec l'état actif annoncé aux lecteurs d'écran.
- **Menu mobile et panneau de filtres** : se ferment avec Échap, et le focus reste à l'intérieur tant qu'ils sont ouverts.

## Reste à faire côté contenu

À remplir par Paul, au fil du dev. Le site peut tourner avec les textes provisoires en attendant.

- [ ] Images et vidéos de chaque projet (carrousel, vignette, aperçu de 5–10 s)
- [ ] Vidéo du demoreel pour la bannière de l'accueil
- [ ] Durée, taille d'équipe, rôle et contribution de chaque projet
- [ ] Genre d'Invokyr
- [ ] Dates et entreprise du poste de Développeur R&D VR (Parcours)
- [ ] Vérifier le classement de chaque projet (section et pastilles)
- [ ] Choisir les projets `featured` de l'accueil
- [ ] CV à jour en PDF
- [ ] Liens itch.io et GitHub
- [ ] Traduction anglaise
