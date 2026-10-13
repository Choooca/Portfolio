# Portfolio — Paul Vincensini

Site portfolio de Paul Vincensini (Gameplay Programmer). Site statique : Accueil, Bibliothèque de projets, une page par projet.

**Lis `docs/passage-au-dev.md` avant toute tâche** : il contient toutes les règles de comportement (filtres, vidéos, éléments collants, responsive), le modèle de données d'un projet et la liste des couleurs.

## Stack

- **Astro** (site statique, pas de SSR), TypeScript.
- **Content Collections** Astro pour les projets : un fichier Markdown par projet dans `src/content/projets/`, schéma validé avec Zod dans `src/content.config.ts`.
- CSS natif avec variables CSS (pas de framework CSS). Scripts client minimaux, en TypeScript, uniquement là où il faut de l'interactivité (filtres, carrousel, thème, menu mobile).
- Coloration des blocs de code : Shiki (intégré à Astro).
- Images : `astro:assets` (WebP/AVIF générés automatiquement).
- Déploiement : **GitHub Pages** via l'action officielle `withastro/action`, à chaque push sur `main` (`.github/workflows/deploy.yml`).

## Commandes

- `npm run dev` : serveur de développement
- `npm run build` : build de production (doit passer sans erreur avant chaque commit)
- `npm run preview` : prévisualiser le build

## Structure

```
src/
  components/     Composants Astro (voir tableau ci-dessous)
  content/projets/  Un .md par projet
  layouts/        Layout de base (head, script de thème, nav, footer)
  pages/          index, bibliotheque, projets/[slug], 404
  styles/         tokens.css (variables de couleur), global.css
  i18n/           Textes d'interface FR / EN
public/           CV (PDF), favicon
docs/             passage-au-dev.md
```

## Composants (correspondance Figma → code)

| Figma | Astro |
| --- | --- |
| Tag | `Tag.astro` |
| Card / Projet (+ Compact) | `ProjectCard.astro` |
| Media | `Media.astro` |
| Mon rôle | `RoleCallout.astro` |
| Code block | `CodeBlock.astro` |
| Toggle / Thème | `ThemeToggle.astro` |
| Nav, Nav / Mobile | `Nav.astro` |
| Footer, Footer / Mobile | `Footer.astro` |

## Design

- Maquette de référence : Figma « Portfolio », page « Refonte V2 » (fileKey `rD1rVBD7zc3YVmxyEnIXYz`). Si le serveur MCP Figma est connecté, s'en servir pour vérifier couleurs, tailles et espacements plutôt que de deviner.
- Le **mode sombre est la référence** ; le mode clair redéfinit seulement les valeurs des variables.
- **Jamais de couleur en dur** dans les composants : toujours `var(--…)` depuis `src/styles/tokens.css`. Noms des variables = noms Figma, avec `/` remplacé par `-` (`text/primary` → `--text-primary`).
- Police unique : **Intel One Mono** (Light, Regular, Medium, SemiBold), auto-hébergée.
- Breakpoints : mobile < 640 px, tablette 640–1023 px, desktop ≥ 1024 px. Contenu max 1680 px.

## Règles à ne pas oublier

- Filtres : **OU dans un groupe, ET entre groupes**, état reflété dans l'URL (`?moteur=unity,godot&langage=csharp`).
- « Mon rôle » et la ligne « Rôle » ne s'affichent que si `equipe > 1`.
- Vidéos d'aperçu : chargées seulement au premier survol, muettes, en boucle ; désactivées si `prefers-reduced-motion`.
- Thème : préférence système par défaut, choix mémorisé dans `localStorage`, appliqué par un script inline dans le `<head>` (pas de flash).
- Focus clavier : contour 2 px `--accent-fill`, décalé de 4 px, via `:focus-visible` uniquement.
- Sans JavaScript, le site reste lisible (toutes les cartes visibles).

## Conventions

- Textes d'interface et contenu en **français** ; anglais via `src/i18n/` et les champs `_en` des projets (repli sur le FR si absent).
- Noms de fichiers et slugs en kebab-case sans accents.
- Composants petits et sans dépendance externe sauf nécessité réelle ; demander avant d'ajouter une librairie.
- Travailler **page par page** et comparer avec la maquette avant de passer à la suite.
- Le contenu réel (images, textes, dates) est ajouté par Paul : utiliser des placeholders, ne pas inventer de contenu.
