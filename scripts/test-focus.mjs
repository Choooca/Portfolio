/**
 * Audit du focus clavier sur tout le site.
 *
 *   npm run build && npm run test:focus
 *
 * Regle de la maquette (« États / Focus clavier », 2014:3628) : tout element
 * interactif recoit un contour jaune de 2px, decale de 4px, uniquement a la
 * navigation clavier.
 *
 * L'audit tabule reellement chaque page et verifie, pour chaque arret :
 *   - qu'un contour conforme est visible (sur l'element ou sur un ancetre,
 *     cas de la carte projet dont l'anneau entoure toute la carte) ;
 *   - que l'arret n'est pas sur un element masque ou hors accessibilite ;
 *   - que le contour n'est pas rogne par un conteneur a defilement.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const RACINE = new URL('../dist', import.meta.url).pathname.replace(/^\//, '');
const BASE = '/Portfolio';
const PORT = 4334;

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
        // Comme GitHub Pages : on sert le 404.html genere par Astro.
        try {
          const page404 = await readFile(join(RACINE, '404.html'));
          res.writeHead(404, { 'Content-Type': TYPES['.html'] });
          res.end(page404);
        } catch {
          res.writeHead(404).end('404');
        }
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

/** Decrit l'element qui a le focus : contour, visibilite, rognage. */
const DECRIRE = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;

  const nom = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''}`;

  // Le contour peut etre porte par un ancetre : la carte projet encadre
  // toute la carte plutot que le seul lien du titre.
  let porteur = el;
  let carrier = null;
  let contour = null;
  for (let i = 0; i < 7 && porteur; i++) {
    const s = getComputedStyle(porteur);
    if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) {
      carrier = porteur;
      contour = {
        sur: porteur === el ? 'element' : 'ancetre',
        largeur: s.outlineWidth,
        style: s.outlineStyle,
        couleur: s.outlineColor,
        decalage: s.outlineOffset,
      };
      break;
    }
    porteur = porteur.parentElement;
  }

  const r = el.getBoundingClientRect();
  const visible = r.width > 0 && r.height > 0 && el.offsetParent !== null;

  // Arret sur quelque chose de masque ?
  const masque = Boolean(el.closest('[hidden], [aria-hidden="true"], [inert]'));

  // Contour rogne par un conteneur a defilement ?
  // C'est le porteur du contour qu'il faut mesurer, pas l'element focalise :
  // sur une carte projet l'anneau entoure toute la carte, bien plus grande
  // que le lien du titre.
  const cible = carrier ?? el;
  const rc = cible.getBoundingClientRect();
  let rogne = false;
  let p = cible.parentElement;
  const marge = 2 + 4; // largeur + decalage attendus
  while (p && p !== document.body) {
    const s = getComputedStyle(p);
    if (s.overflowY !== 'visible' || s.overflowX !== 'visible') {
      const pr = p.getBoundingClientRect();
      if (
        rc.top - marge < pr.top - 0.5 ||
        rc.bottom + marge > pr.bottom + 0.5 ||
        rc.left - marge < pr.left - 0.5 ||
        rc.right + marge > pr.right + 0.5
      ) {
        rogne = true;
      }
      break;
    }
    p = p.parentElement;
  }

  return { nom, contour, visible, masque, rogne };
};

const serveur = await servir();
const navigateur = await chromium.launch();

/** Tabule une page et renvoie la liste des arrets decrits. */
async function parcourir(page, url, pas = 40) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.evaluate(() => document.body.focus());

  const arrets = [];
  const vus = new Set();
  for (let i = 0; i < pas; i++) {
    await page.keyboard.press('Tab');
    // Le navigateur amene l'element focalise a l'ecran, et l'accrochage se
    // restabilise : on mesure l'etat final, pas l'instant du Tab.
    await page.waitForTimeout(90);
    const a = await page.evaluate(DECRIRE);
    if (!a) continue;
    // Un cycle complet : on s'arrete quand on repasse sur le premier arret.
    const cle = a.nom + i;
    if (vus.has(cle)) break;
    vus.add(cle);
    arrets.push(a);
  }
  return arrets;
}

const PAGES = [
  ['accueil', '/'],
  ['bibliotheque', '/bibliotheque'],
  ['bibliotheque filtree', '/bibliotheque?domaine=graphique'],
  ['projet en equipe', '/projets/diamond-seams'],
  ['projet solo', '/projets/deferred-forward-rendering'],
  ['404', '/cette-page-nexiste-pas'],
];

const FORMATS = [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
];

const ACCENT = { dark: 'rgb(255, 217, 0)', light: 'rgb(242, 194, 0)' };

for (const [nomFormat, viewport] of FORMATS) {
  const ctx = await navigateur.newContext({ viewport, colorScheme: 'dark' });
  const page = await ctx.newPage();

  for (const [nomPage, chemin] of PAGES) {
    console.log(`\n## ${nomPage} — ${nomFormat}`);
    const arrets = await parcourir(page, `http://localhost:${PORT}${BASE}${chemin}`);

    verifier(`${nomPage} : des arrets de tabulation existent`, arrets.length > 0, true);

    const sansContour = arrets.filter((a) => !a.contour).map((a) => a.nom);
    verifier(`${nomPage} : tous les arrets ont un contour`, sansContour, []);

    const mauvais = arrets
      .filter(
        (a) =>
          a.contour &&
          (a.contour.largeur !== '2px' ||
            a.contour.decalage !== '4px' ||
            a.contour.couleur !== ACCENT.dark),
      )
      .map((a) => `${a.nom} (${a.contour.largeur}/${a.contour.decalage}/${a.contour.couleur})`);
    verifier(`${nomPage} : contour 2px, decale de 4px, en accent`, mauvais, []);

    const invisibles = arrets.filter((a) => !a.visible).map((a) => a.nom);
    verifier(`${nomPage} : aucun arret sur un element invisible`, invisibles, []);

    const masques = arrets.filter((a) => a.masque).map((a) => a.nom);
    verifier(`${nomPage} : aucun arret hors accessibilite`, masques, []);

    const rognes = arrets.filter((a) => a.rogne).map((a) => a.nom);
    verifier(`${nomPage} : aucun contour rogne`, rognes, []);
  }

  await ctx.close();
}

// ====================================================================
console.log('\n## La souris ne doit jamais declencher le contour');
{
  const ctx = await navigateur.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}${BASE}/bibliotheque`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  await page.click('[data-menu="domaine"] [data-menu-bouton]');
  verifier(
    'un clic souris ne pose pas de contour',
    await page.$eval('[data-menu="domaine"] [data-menu-bouton]', (e) => {
      const s = getComputedStyle(e);
      return s.outlineStyle === 'none' || parseFloat(s.outlineWidth) === 0;
    }),
    true,
  );

  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  verifier(
    'mais le clavier, oui',
    await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement);
      return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2;
    }),
    true,
  );
  await ctx.close();
}

await navigateur.close();
serveur.close();

console.log('\n============================');
console.log(`${reussis} verifications passees, ${echecs.length} en echec`);
if (echecs.length) {
  console.log('\nEchecs :');
  echecs.forEach((e) => console.log('  - ' + e));
  process.exit(1);
}
