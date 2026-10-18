/**
 * Blocs de code — Figma « Code block » (66:540).
 *
 * Les blocs s'écrivent directement en Markdown (trois backticks + langage,
 * plus `title="chemin/fichier"` au besoin) et prennent le style du composant
 * automatiquement : ce fichier fournit le thème de coloration et le
 * transformateur Shiki qui ajoute l'habillage (points, nom de fichier,
 * langage, bouton copier).
 *
 * Toutes les couleurs sont figées aux valeurs du mode sombre : les blocs de
 * code restent sombres dans les deux thèmes (règle du document).
 */

/**
 * Une palette par theme. Les valeurs sont celles de src/styles/tokens.css :
 * mots-cles = tag/moteur-text, fonctions = tag/langage-text,
 * nombres = accent/text, chaines = tag/domaine-text,
 * commentaires et texte = text/subtle et text/secondary.
 */
const PALETTES = {
  dark: {
    motCle: '#cdb4ff',
    fonction: '#afc0ff',
    nombre: '#ffd900',
    chaine: '#ff9ea0',
    commentaire: '#6f6c93',
    texte: '#cfcde6',
    fond: '#0d0c20',
  },
  light: {
    motCle: '#7a3fe0',
    fonction: '#2f4fd6',
    nombre: '#8f6b00',
    chaine: '#c2292e',
    commentaire: '#7a7799',
    texte: '#3d3a5c',
    fond: '#ffffff',
  },
};

/** @returns {import('shiki').ThemeRegistrationRaw} */
function construireTheme(type) {
  const p = PALETTES[type];
  return {
    name: `portfolio-${type}`,
    type,
    colors: {
      'editor.background': p.fond,
      'editor.foreground': p.texte,
    },
    settings: [
      { settings: { background: p.fond, foreground: p.texte } },
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: { foreground: p.commentaire },
      },
      {
        scope: [
          'keyword',
          'storage',
          'storage.type',
          'storage.modifier',
          'keyword.control',
          'keyword.operator.new',
          'variable.language',
          'entity.name.type',
          'support.type',
          'support.class',
          'entity.name.class',
        ],
        settings: { foreground: p.motCle },
      },
      {
        scope: [
          'entity.name.function',
          'support.function',
          'meta.function-call',
          'entity.name.tag',
        ],
        settings: { foreground: p.fonction },
      },
      {
        scope: [
          'constant.numeric',
          'constant.language.boolean',
          'constant.language.null',
        ],
        settings: { foreground: p.nombre },
      },
      {
        scope: ['string', 'string.quoted', 'constant.other', 'variable.other.constant'],
        settings: { foreground: p.chaine },
      },
    ],
  };
}

export const themeCodeSombre = construireTheme('dark');
export const themeCodeClair = construireTheme('light');

const el = (tagName, properties, children = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});

const txt = (value) => ({ type: 'text', value });

/** Les trois points façon fenêtre, en haut à gauche de l'en-tête. */
const points = () =>
  el(
    'svg',
    {
      width: '42',
      height: '10',
      viewBox: '0 0 42 10',
      fill: 'none',
      'aria-hidden': 'true',
      class: 'bloc-code__points',
    },
    [5, 21, 37].map((cx) =>
      el('circle', { cx: String(cx), cy: '5', r: '5', fill: 'currentColor' }),
    ),
  );

const iconeCopier = () =>
  el(
    'svg',
    { width: '16', height: '16', viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
    [
      el('path', {
        d: 'M7 5H12C13.1046 5 14 5.89543 14 7V12C14 13.1046 13.1046 14 12 14H7C5.89543 14 5 13.1046 5 12V7C5 5.89543 5.89543 5 7 5Z',
        stroke: 'currentColor',
        'stroke-width': '1.4',
      }),
      el('path', {
        d: 'M11 5V3.5C11 3.10218 10.842 2.72064 10.5607 2.43934C10.2794 2.15804 9.89782 2 9.5 2H3.5C3.10218 2 2.72064 2.15804 2.43934 2.43934C2.15804 2.72064 2 3.10218 2 3.5V9.5C2 9.89782 2.15804 10.2794 2.43934 10.5607C2.72064 10.842 3.10218 11 3.5 11H5',
        stroke: 'currentColor',
        'stroke-width': '1.4',
      }),
    ],
  );

/**
 * Enveloppe le <pre> de Shiki dans l'habillage de la maquette.
 * `title="..."` dans l'info-string du bloc devient le nom de fichier.
 */
export const transformerBlocCode = {
  name: 'portfolio:bloc-code',
  root(node) {
    const brut = this.options.meta?.__raw ?? '';
    const titre = /title="([^"]+)"/.exec(brut)?.[1] ?? '';
    const langue = this.options.lang ?? '';
    const pre = node.children.find((n) => n.type === 'element');
    if (!pre) return;

    const gauche = el('div', { class: 'bloc-code__gauche' }, [
      points(),
      ...(titre ? [el('span', { class: 'bloc-code__fichier' }, [txt(titre)])] : []),
    ]);

    const droite = el('div', { class: 'bloc-code__droite' }, [
      ...(langue && langue !== 'plaintext'
        ? [el('span', { class: 'bloc-code__langue' }, [txt(langue.toUpperCase())])]
        : []),
      el(
        'button',
        {
          type: 'button',
          class: 'bloc-code__copier',
          'data-copier-code': '',
          'aria-label': 'Copier le code',
        },
        [iconeCopier()],
      ),
    ]);

    node.children = [
      el('figure', { class: 'bloc-code' }, [
        el('div', { class: 'bloc-code__entete' }, [gauche, droite]),
        pre,
      ]),
    ];
  },
};
