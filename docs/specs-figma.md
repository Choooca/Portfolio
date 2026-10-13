# Specs relevées dans Figma

Relevé le 13/10/2026 depuis le fichier « Portfolio », canvas **Refonte V2**
(`fileKey` `rD1rVBD7zc3YVmxyEnIXYz`, `node-id` du canvas : `50-2`).

> Le canvas s'appelle « Refonte V2 » mais la **page** Figma qui le contient
> s'appelle « Page 1 ». Interroger le MCP sans `node-id` ne liste que les
> pages et renvoie donc « Page 1 » : il faut passer `50:2` pour atteindre la
> maquette.

## Couleurs — vérification des 22 variables

Les 22 variables de `src/styles/tokens.css` ont été comparées aux valeurs
réelles de Figma, mode sombre **et** mode clair. **Aucun écart.**

Une seule valeur n'a pas pu être relevée directement : `media/placeholder-hover`
en mode clair (`#d9d5ec`), qui n'apparaît que dans l'état survol de la carte.
Les 21 autres ayant toutes correspondu, elle est reprise du document tel quel.

Nœuds utiles pour revérifier plus tard :

| Variables couvertes | Nœud sombre | Nœud clair |
| --- | --- | --- |
| Le gros du jeu (19) | `2006:667` | `2007:1875` |
| `bg/band` | `58:5` | `2007:925` |
| `bg/section-alt` | `51:2` | `2007:784` |
| `media/placeholder-hover` | `66:575` | — |

## Transparences

| Usage | Base | Opacité | Nœud |
| --- | --- | --- | --- |
| Séparateur | `line/default` | 7 % | `58:49` (Divider) |
| Fond « Mon rôle » | `accent/fill` | 5 % | `2004:644` |
| Fond bouton CV | `accent/fill` | 8 % | `66:512` |
| Fond pastille (Default) | couleur de base | 16 % | `57:14` |
| Bordure pastille (Default) | couleur de base | 50 % | `57:14` |

Les deux dernières ne figuraient pas dans `passage-au-dev.md`.

## Tag — `57:14`

Pastille de filtre. `Kind` = dimension (couleur), `State` = Active quand le
filtre est sélectionné. Cliquable : ajoute ou retire le filtre.

- `border-radius: 999px`, `padding: 5px 12px`, bordure `1px solid`
- Texte : Intel One Mono **Medium 13px**
- **Default** : fond base 16 %, bordure base 50 %, texte `--tag-<kind>-text`
- **Active** : fond base 100 %, bordure base 100 %, texte **blanc pur**
  (`#ffffff` dans les deux thèmes, pas `--text-primary`)

Couleurs de base, codées en dur dans Figma (ce ne sont pas des variables) :
Domaine `#e5484d`, Moteur `#a06cff`, Langage `#4c6fff`.

## Mon rôle — `2004:644`

Affiché **uniquement** si `equipe > 1`. Masqué pour les projets solo, en même
temps que la ligne « Rôle » de la fiche projet.

- Fond `accent/fill` à 5 %, **bordure gauche 3px `accent/fill` pleine opacité**
- `border-radius: 16px`, `padding: 28px 32px`, `gap: 14px`, colonne
- Libellé « MON RÔLE » : Medium 13px, `letter-spacing: 1.95px`, `accent/text`
- Titre (le rôle) : Medium 22px, `text/primary`
- Paragraphe (la contribution) : **Light** 18px, `line-height: 1.7`,
  `text/secondary`

## Button / CV — `66:512`

Bouton de téléchargement du CV (PDF), dans la barre de navigation.

- Fond `accent/fill` à 8 %, bordure `1px solid accent/fill` pleine opacité
- `border-radius: 10px`, `padding: 7px 12px 7px 14px`, `gap: 8px`
- Texte « CV » : Medium 16px, `accent/text`
- Icône de téléchargement : SVG 16×16, à récupérer depuis Figma au moment de
  construire le composant

## Inventaire des frames

32 frames de premier niveau. Les composants `Nav`, `Footer`, `Mon rôle`,
`Code block` et `Button / CV` ne sont pas des frames de premier niveau : ce
sont des symboles rangés hors écran.

| Composant | Symbole |
| --- | --- |
| Tag | `57:14` |
| Media | `63:466` |
| Card / Projet | `66:575` |
| Toggle / Thème | `2008:1499` |
| Mon rôle | `2004:644` |
| Button / CV | `66:512` |
| Footer | `66:516` |
| Code block | `66:540` |

Écrans desktop sombres : Accueil `50:3`, Accueil — Projets `51:2`,
Bibliothèque `58:5`, Bibliothèque — Filtre actif `59:353`,
Bibliothèque — Aucun résultat `2014:3398`, Projet solo `63:467`,
Projet équipe `2006:667`, 404 `2014:3318`, États / Focus clavier `2014:3628`.

Mobile sombre : Accueil `2009:1523`, Accueil — Projets `2009:1534`,
Bibliothèque `2010:1589`, Bibliothèque — Filtres `2010:2040`,
Projet `2011:2358`, Menu ouvert `2012:3313`, 404 `2014:3378`.

Les variantes claires portent le suffixe « — Clair ».
