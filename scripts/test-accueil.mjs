/**
 * Verification du comportement de la page d'accueil.
 *
 *   npm run build && npm run test:accueil
 *
 * Couvre : ecran d'entree plein ecran sans barre de navigation (elle
 * apparait au defilement), banniere qui reste sombre dans les deux themes,
 * galerie des projets mis en avant, frise du parcours.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const RACINE = new URL('../dist', import.meta.url).pathname.replace(/^\//, '');
const BASE = '/Portfolio';
const PORT = 4333;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

function servir() {
  return new Promise((resoudre) => {
    const s = createServer(async (req, res) => {
      let c = decodeURIComponent((req.url ?? '/').split('?')[0]);
      if (c.startsWith(BASE)) c = c.slice(BASE.length);
      if (c === '' || c.endsWith('/')) c += 'index.html';
      else if (!extname(c)) c += '/index.html';
      try {
        const buf = await readFile(join(RACINE, normalize(c).replace(/^(\.\.[/\\])+/, '')));
        res.writeHead(200, { 'Content-Type': TYPES[extname(c)] ?? 'application/octet-stream' });
        res.end(buf);
      } catch {
        res.writeHead(404).end('404');
      }
    });
    s.listen(PORT, () => resoudre(s));
  });
}

let reussis = 0;
const echecs = [];

function verifier(nom, obtenu, attendu) {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (ok) reussis++;
  else echecs.push(`${nom}\n      attendu : ${JSON.stringify(attendu)}\n      obtenu  : ${JSON.stringify(obtenu)}`);
  console.log(`  ${ok ? 'ok  ' : 'KO  '}${nom}`);
}

const serveur = await servir();
const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const aller = () =>
  page.goto(`http://localhost:${PORT}${BASE}/`, { waitUntil: 'networkidle' });

const navVisible = () =>
  page.$eval('.entete', (e) => {
    const s = getComputedStyle(e);
    return s.opacity !== '0' && !s.transform.includes('-');
  });

// ====================================================================
console.log('\n## Banniere');
await aller();
await page.waitForTimeout(400);
// L'ecran d'entree a ete retire de la maquette : la page commence par la
// banniere, et la barre de navigation est visible des le depart.
verifier('la barre de navigation est visible des le depart', await navVisible(), true);
verifier(
  'la page commence par la banniere',
  await page.$eval('main > :first-child', (e) => e.className),
  'banniere',
);
verifier(
  "plus d'ecran d'entree",
  await page.$$eval('[data-plein-ecran]', (e) => e.length),
  0,
);
// Seul le voile de gauche reste sombre ; le fondu du bas suit le theme,
// sinon la banniere se termine sur un bloc sombre au milieu du clair.
verifier(
  'le voile de gauche reste sombre dans les deux themes',
  await page.evaluate(() => {
    const v = document.querySelector('.banniere__voile');
    const lire = (t) => {
      document.documentElement.dataset.theme = t;
      return getComputedStyle(v).backgroundImage.includes('rgba(10, 9, 24, 0.92)');
    };
    const r = [lire('dark'), lire('light')];
    document.documentElement.dataset.theme = 'dark';
    return r;
  }),
  [true, true],
);
verifier(
  'le fondu du bas suit le theme',
  await page.evaluate(() => {
    const v = document.querySelector('.banniere__voile');
    const lire = (t) => {
      document.documentElement.dataset.theme = t;
      return getComputedStyle(v).backgroundImage;
    };
    const sombre = lire('dark');
    const clair = lire('light');
    document.documentElement.dataset.theme = 'dark';
    return sombre !== clair;
  }),
  true,
);
console.log('\n## Demoreel de la section À propos');
verifier('le bloc demoreel est present', (await page.$$('.demoreel')).length, 1);
verifier(
  'le media est present, sans libelle ni legende',
  await page.evaluate(() => [
    Boolean(document.querySelector('.demoreel__media')),
    Boolean(document.querySelector('.demoreel__titre')),
    Boolean(document.querySelector('.demoreel__legende')),
  ]),
  [true, false, false],
);
verifier(
  'badge VIDÉO et bouton lecture',
  await page.evaluate(() => [
    document.querySelector('.demoreel__media .media__badge')?.textContent?.trim(),
    Boolean(document.querySelector('.demoreel__media [data-media-lecture]')),
  ]),
  ['VIDÉO', true],
);
// La video ne doit pas se telecharger avant le clic.
verifier(
  'aucune balise <video> avant le clic',
  await page.$$eval('video', (v) => v.length),
  0,
);
await page.click('.demoreel__media [data-media-lecture]');
await page.waitForTimeout(300);
verifier(
  'un clic cree la video, avec le son',
  await page.$$eval('.demoreel__media video', (v) =>
    v.map((x) => ({ controles: x.controls, muet: x.muted })),
  ),
  [{ controles: true, muet: false }],
);
await aller();
await page.waitForTimeout(400);

console.log('\n## Galerie des projets mis en avant');
// Meme mecanique que le carrousel de la page projet : piste a accrochage,
// clones de boucle, fleches, diapos laterales cliquables.
const actifGalerie = () =>
  page.$eval('[data-galerie-piste] [data-diapo][data-actif]', (e) =>
    Number(e.dataset.diapo),
  );

verifier('demarre sur le premier projet', await actifGalerie(), 0);
verifier(
  'un clone a chaque extremite',
  await page.$$eval('[data-galerie-piste] [data-clone]', (e) => e.length),
  2,
);
verifier(
  "les clones sont masques aux lecteurs d'ecran",
  await page.$$eval('[data-galerie-piste] [data-clone]', (e) =>
    e.every((x) => x.getAttribute('aria-hidden') === 'true'),
  ),
  true,
);

await page.click('[data-galerie-suiv]');
await page.waitForTimeout(800);
verifier('la fleche suivante avance', await actifGalerie(), 1);

await page.click('[data-galerie-prec]');
await page.waitForTimeout(800);
verifier('la fleche precedente recule', await actifGalerie(), 0);

// Depuis le premier, Precedent boucle sur le dernier.
await page.click('[data-galerie-prec]');
await page.waitForTimeout(900);
verifier('la galerie boucle', await actifGalerie(), 1);

// Un clic sur la carte laterale l'amene au centre.
await page.click('[data-galerie-point="0"]');
await page.waitForTimeout(800);
await page.evaluate(() => {
  const piste = document.querySelector('[data-galerie-piste]');
  const autre = Array.from(piste.children).find((c) => c.dataset.diapo === '1');
  autre.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(800);
verifier("cliquer une carte laterale l'amene au centre", await actifGalerie(), 1);

verifier(
  'les points suivent',
  await page.$$eval('[data-galerie-point]', (e) =>
    e.map((x) => x.getAttribute('aria-selected')),
  ),
  ['false', 'true'],
);

console.log('\n## Parcours');
verifier(
  'trois etapes',
  await page.$$eval('.frise .etape', (e) => e.length),
  3,
);
verifier(
  'les etapes en cours sont en accent',
  await page.$$eval('.etape__periode', (e) =>
    e.map((x) => x.classList.contains('etape__periode--encours')),
  ),
  [true, true, false],
);
verifier(
  'le trait de la frise s\'arrete a la derniere',
  await page.$eval('.etape--derniere', (e) => getComputedStyle(e).borderInlineStartColor),
  'rgba(0, 0, 0, 0)',
);

console.log('\n## Mobile');
await page.setViewportSize({ width: 390, height: 844 });
await aller();
await page.waitForTimeout(400);
verifier('barre visible aussi en mobile', await navVisible(), true);
verifier(
  'la galerie devient une rangee glissante',
  await page.evaluate(() => [
    getComputedStyle(document.querySelector('.rangee')).display,
    getComputedStyle(document.querySelector('.scene')).display,
  ]),
  ['flex', 'none'],
);

// Le burger n'est accessible qu'une fois la nav apparue.
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.2, behavior: 'instant' }));
await page.waitForTimeout(600);
verifier('la nav apparait, le burger est atteignable', await navVisible(), true);
await page.click('[data-menu-bascule]');
await page.waitForTimeout(300);
verifier(
  'le menu burger s\'ouvre',
  await page.$eval('[data-menu-panneau]', (e) => !e.hidden),
  true,
);

await ctx.close();
await navigateur.close();
serveur.close();

console.log('\n============================');
console.log(`${reussis} verifications passees, ${echecs.length} en echec`);
if (echecs.length) {
  console.log('\nEchecs :');
  echecs.forEach((e) => console.log('  - ' + e));
  process.exit(1);
}
