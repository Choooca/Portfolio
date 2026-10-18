// @ts-check
import { defineConfig } from 'astro/config';
import {
  themeCodeClair,
  themeCodeSombre,
  transformerBlocCode,
} from './src/lib/code-block.mjs';

// Site de projet GitHub Pages : https://choooca.github.io/Portfolio
// `base` doit prefixer tous les liens internes -> utiliser le helper
// `href()` de src/lib/url.ts plutot que d'ecrire les chemins en dur.
export default defineConfig({
  site: 'https://choooca.github.io',
  base: '/Portfolio',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  markdown: {
    shikiConfig: {
      // Deux themes sur mesure, aux couleurs de tokens.css.
      // `defaultColor: false` fait emettre a Shiki les deux couleurs en
      // variables CSS (--shiki-light / --shiki-dark) sur chaque jeton : le
      // bloc suit alors le theme du site sans rien recalculer au clic.
      themes: { light: themeCodeClair, dark: themeCodeSombre },
      defaultColor: false,
      transformers: [transformerBlocCode],
      wrap: false,
    },
  },
});
