// @ts-check
import { defineConfig } from 'astro/config';

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
      // Les blocs de code restent sombres dans les deux themes.
      theme: 'github-dark',
      wrap: false,
    },
  },
});
