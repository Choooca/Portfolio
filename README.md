# Portfolio — Paul Vincensini

Site portfolio statique (Astro + TypeScript), déployé sur GitHub Pages à
chaque push sur `main`.

**URL de production** : https://choooca.github.io/Portfolio

## Prérequis

Node **≥ 22.12** (Astro 7). Vérifier avec `node -v`.

## Commandes

| Commande | Effet |
| --- | --- |
| `npm install` | Installe les dépendances |
| `npm run dev` | Serveur de développement sur http://localhost:4321/Portfolio |
| `npm run build` | `astro check` puis build de production dans `dist/` |
| `npm run preview` | Prévisualise le build |

`npm run build` doit passer sans erreur avant chaque commit.

## Ajouter un projet

Créer un fichier `src/content/projets/<slug>.md` en kebab-case sans accents.
Le slug du fichier devient l'URL `/projets/<slug>`. Le frontmatter est validé
par le schéma de `src/content.config.ts` : une donnée manquante ou incohérente
fait échouer le build avec un message explicite.

Voir `docs/passage-au-dev.md` pour le modèle de données complet et les règles
de comportement du site.

## Structure

```
src/
  assets/fonts/     Intel One Mono (woff2, OFL)
  assets/projets/   Images par projet
  components/       Composants Astro
  content/projets/  Un .md par projet
  layouts/          BaseLayout (head, script de thème)
  lib/              Helpers (url.ts)
  pages/            Routes
  styles/           tokens.css (couleurs), global.css
  i18n/             Textes d'interface FR / EN
public/             Favicon, CV, vidéos
docs/               passage-au-dev.md
```

## Liens internes

Le site est publié sous le sous-chemin `/Portfolio`. Tout lien interne doit
passer par le helper `href()` de `src/lib/url.ts` : un chemin écrit en dur
serait cassé en production.

## Licence de la police

Intel One Mono est distribuée sous SIL Open Font License — voir
`src/assets/fonts/OFL.txt`.
