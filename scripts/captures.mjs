/**
 * Captures de verification visuelle.
 *
 *   npm run build && npm run captures
 *
 * Sert dist/ sur le meme sous-chemin qu'en production (/Portfolio) puis
 * photographie chaque page demandee en desktop et en mobile, themes sombre
 * et clair. Les images vont dans .captures/ (ignore par git).
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdir, rm } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const RACINE = new URL('../dist', import.meta.url).pathname.replace(/^\//, '');
const SORTIE = new URL('../.captures', import.meta.url).pathname.replace(/^\//, '');
const BASE = '/Portfolio';
const PORT = 4330;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

/** Serveur statique minimal : /Portfolio/xxx -> dist/xxx */
function servir() {
  return new Promise((resoudre) => {
    const serveur = createServer(async (req, res) => {
      let chemin = decodeURIComponent((req.url ?? '/').split('?')[0]);
      if (chemin.startsWith(BASE)) chemin = chemin.slice(BASE.length);
      // Astro produit des dossiers (/bibliotheque/index.html) : tout chemin
      // sans extension est resolu vers son index.
      if (chemin === '' || chemin.endsWith('/')) chemin += 'index.html';
      else if (!extname(chemin)) chemin += '/index.html';

      const fichier = join(RACINE, normalize(chemin).replace(/^(\.\.[/\\])+/, ''));
      try {
        const contenu = await readFile(fichier);
        res.writeHead(200, {
          'Content-Type': TYPES[extname(fichier)] ?? 'application/octet-stream',
        });
        res.end(contenu);
      } catch {
        res.writeHead(404).end('404');
      }
    });
    serveur.listen(PORT, () => resoudre(serveur));
  });
}

const PAGES = [
  { nom: 'accueil', chemin: '/' },
  { nom: 'bibliotheque', chemin: '/bibliotheque' },
  { nom: 'bib-filtre', chemin: '/bibliotheque?domaine=graphique' },
  { nom: 'bib-vide', chemin: '/bibliotheque?domaine=graphique&langage=csharp' },
  // Les deux variantes de page projet : en equipe (avec « Mon rôle ») et solo.
  { nom: 'projet-equipe', chemin: '/projets/diamond-seams' },
  { nom: 'projet-solo', chemin: '/projets/deferred-forward-rendering' },
];

const FORMATS = [
  // 1920 = largeur de la maquette Figma, pour comparer a l'identique.
  { nom: 'large', largeur: 1920, hauteur: 1080 },
  { nom: 'desktop', largeur: 1440, hauteur: 900 },
  { nom: 'mobile', largeur: 390, hauteur: 844 },
];

const THEMES = ['dark', 'light'];

const serveur = await servir();
await rm(SORTIE, { recursive: true, force: true });
await mkdir(SORTIE, { recursive: true });

const navigateur = await chromium.launch();
const faites = [];

for (const page of PAGES) {
  for (const format of FORMATS) {
    for (const theme of THEMES) {
      const contexte = await navigateur.newContext({
        viewport: { width: format.largeur, height: format.hauteur },
        deviceScaleFactor: 1,
      });
      // Le theme est lu dans localStorage par le script inline du <head>.
      await contexte.addInitScript((t) => {
        try {
          localStorage.setItem('theme', t);
        } catch {}
      }, theme);

      const onglet = await contexte.newPage();
      await onglet.goto(`http://localhost:${PORT}${BASE}${page.chemin}`, {
        waitUntil: 'networkidle',
      });
      await onglet.evaluate(() => document.fonts.ready);

      // `fullPage` redimensionne la fenetre en interne, ce qui fait recaler
      // les conteneurs a scroll-snap (le carrousel changeait de media). On
      // agrandit donc la fenetre nous-memes, on laisse la page se replacer,
      // puis on capture sans fullPage.
      const hauteur = await onglet.evaluate(
        () => document.documentElement.scrollHeight,
      );
      await onglet.setViewportSize({
        width: format.largeur,
        height: Math.min(hauteur, 20000),
      });
      await onglet.waitForTimeout(300);

      const nom = `${page.nom}-${format.nom}-${theme}.png`;
      await onglet.screenshot({ path: join(SORTIE, nom) });
      faites.push(nom);

      // On revient a la hauteur nominale pour les captures suivantes.
      await onglet.setViewportSize({
        width: format.largeur,
        height: format.hauteur,
      });
      await onglet.waitForTimeout(200);

      // En mobile, on capture aussi le panneau de filtres ouvert.
      if (format.nom === 'mobile' && page.nom === 'bibliotheque') {
        await onglet.click('[data-feuille-ouvrir]');
        await onglet.waitForTimeout(250);
        const nomFiltres = `${page.nom}-filtres-ouverts-${theme}.png`;
        await onglet.screenshot({ path: join(SORTIE, nomFiltres) });
        faites.push(nomFiltres);
      }

      // En mobile, on capture aussi le menu burger ouvert.
      if (format.nom === 'mobile' && page.nom === 'accueil') {
        await onglet.click('[data-menu-bascule]');
        await onglet.waitForTimeout(250);
        const nomMenu = `${page.nom}-menu-ouvert-${theme}.png`;
        await onglet.screenshot({ path: join(SORTIE, nomMenu) });
        faites.push(nomMenu);
      }

      await contexte.close();
    }
  }
}

await navigateur.close();
serveur.close();

console.log(`${faites.length} captures dans .captures/`);
faites.forEach((f) => console.log('  ' + f));
