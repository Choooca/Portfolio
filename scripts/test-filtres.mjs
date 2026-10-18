/**
 * Verification du comportement des filtres de la Bibliotheque.
 *
 *   npm run build && npm run test:filtres
 *
 * Verifie les regles de docs/passage-au-dev.md : OU dans un groupe,
 * ET entre les groupes, etat dans l'URL, compteurs, etats vides,
 * panneau mobile et retour arriere.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const RACINE = new URL('../dist', import.meta.url).pathname.replace(/^\//, '');
const BASE = '/Portfolio';
const PORT = 4331;

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

/** Titres des cartes actuellement visibles. */
const visibles = (page) =>
  page.$$eval('[data-carte]', (cartes) =>
    cartes
      .filter((c) => {
        const hote = c.closest('li') ?? c;
        return !hote.hidden && hote.offsetParent !== null;
      })
      .map((c) => c.querySelector('.titre')?.textContent?.trim()),
  );

const url = (page) => new URL(page.url()).search;

// ====================================================================
// Desktop
// ====================================================================
{
  const ctx = await navigateur.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const aller = (q = '') => page.goto(`http://localhost:${PORT}${BASE}/bibliotheque${q}`, { waitUntil: 'networkidle' });

  console.log('\n## Etat initial');
  await aller();
  verifier('les 2 cartes sont visibles', (await visibles(page)).length, 2);
  verifier('compteur sans filtre', (await page.textContent('[data-compteur]'))?.trim(), '2 projets');
  verifier('barre « filtres actifs » masquee', await page.$eval('[data-actifs]', (e) => e.hidden), true);
  verifier("pas d'etat vide global", await page.$eval('[data-vide-global]', (e) => e.hidden), true);

  console.log('\n## Clic sur une pastille de carte');
  await page.click('[data-carte] button[data-filtre-groupe="domaine"][data-filtre-valeur="graphique"]');
  verifier('1 carte restante', await visibles(page), ['Deferred & Forward Rendering']);
  verifier('URL mise a jour', url(page), '?domaine=graphique');
  verifier('compteur « sur »', (await page.textContent('[data-compteur]'))?.trim(), '1 projets sur 2');
  verifier('barre « filtres actifs » visible', await page.$eval('[data-actifs]', (e) => e.hidden), false);
  verifier('1 puce active', (await page.$$('[data-retirer]')).length, 1);

  console.log('\n## OU a l\'interieur d\'un groupe');
  await page.click('[data-menu="domaine"] [data-menu-bouton]');
  await page.click('[data-option][data-groupe="domaine"][data-valeur="gameplay"]');
  verifier('les 2 cartes reviennent', (await visibles(page)).length, 2);
  verifier('URL cumule les 2 valeurs', url(page), '?domaine=graphique,gameplay');
  verifier('badge du menu a 2', (await page.textContent('[data-menu="domaine"] [data-menu-badge]'))?.trim(), '2');

  console.log('\n## ET entre les groupes');
  await aller('?domaine=graphique&langage=csharp');
  verifier('aucune carte', (await visibles(page)).length, 0);
  verifier('etat vide global affiche', await page.$eval('[data-vide-global]', (e) => e.hidden), false);
  verifier('sections masquees', await page.$$eval('[data-section]', (s) => s.every((x) => x.hidden)), true);

  console.log('\n## Section videe par les filtres');
  await aller('?domaine=graphique');
  // Les 3 sections restent affichees, seuls leurs compteurs bougent.
  verifier('les 3 sections restent visibles', await page.$$eval('[data-section]', (s) => s.map((x) => x.hidden)), [false, false, false]);
  verifier('compteurs par section', await page.$$eval('[data-section-compteur]', (e) => e.map((x) => x.textContent.trim())), ['0', '1', '0']);
  verifier('grilles vides masquees', await page.$$eval('[data-grille]', (g) => g.map((x) => x.hidden)), [true, false, true]);

  console.log('\n## Reinitialiser');
  await page.click('[data-actifs] [data-reinitialiser]');
  verifier('les 2 cartes reviennent', (await visibles(page)).length, 2);
  verifier('URL nettoyee', url(page), '');
  verifier('barre « filtres actifs » masquee', await page.$eval('[data-actifs]', (e) => e.hidden), true);

  console.log('\n## Retrait par la croix');
  await aller('?domaine=graphique,gameplay');
  await page.click('[data-retirer][data-valeur="graphique"]');
  verifier('il reste un filtre', url(page), '?domaine=gameplay');
  verifier('1 carte', await visibles(page), ['Diamond Seams']);

  console.log('\n## Historique : les filtres ne s\'empilent pas');
  // On arrive depuis l'accueil, puis on enchaine deux filtres.
  await page.goto(`http://localhost:${PORT}${BASE}/`, { waitUntil: 'networkidle' });
  await aller();
  await page.click('[data-carte] button[data-filtre-groupe="domaine"][data-filtre-valeur="graphique"]');
  await page.click('[data-menu="langage"] [data-menu-bouton]');
  await page.click('[data-option][data-groupe="langage"][data-valeur="cpp"]');
  verifier('les 2 filtres sont dans l\'URL', url(page), '?domaine=graphique&langage=cpp');

  await page.goBack();
  verifier(
    'Precedent quitte la page au lieu de rejouer les filtres',
    new URL(page.url()).pathname,
    `${BASE}/`,
  );

  await page.goForward();
  verifier('et Suivant retrouve la selection', url(page), '?domaine=graphique&langage=cpp');
  verifier('la selection est bien reappliquee', await visibles(page), ['Deferred & Forward Rendering']);

  console.log('\n## Options des menus');
  await aller();
  const opts = await page.$$eval('[data-menu="langage"] [data-option]', (els) =>
    els.map((e) => [e.querySelector('.option__libelle').textContent.trim(), e.querySelector('.option__nombre').textContent.trim()]),
  );
  verifier('langages avec leur nombre', opts, [['C#', '1'], ['C++', '1'], ['HLSL', '1']]);

  // Une carte n'affiche qu'une pastille par dimension, mais le filtrage doit
  // porter sur TOUTES les valeurs du projet. Deferred est en C++ ET HLSL,
  // seul C++ est visible sur la carte.
  await aller('?langage=hlsl');
  verifier('filtre sur une valeur non affichee', await visibles(page), ['Deferred & Forward Rendering']);
  const moteurs = await page.$$eval('[data-menu="moteur"] [data-option]', (els) =>
    els.map((e) => e.querySelector('.option__libelle').textContent.trim()),
  );
  verifier('aucune option a zero projet', moteurs, ['Sans moteur', 'Unity']);

  console.log('\n## Pastille deja active = retrait');
  await aller('?domaine=graphique');
  await page.click('[data-carte] button[data-filtre-groupe="domaine"][data-filtre-valeur="graphique"]');
  verifier('le filtre est retire', url(page), '');

  await ctx.close();
}

// ====================================================================
// Mobile
// ====================================================================
{
  const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}${BASE}/bibliotheque`, { waitUntil: 'networkidle' });

  console.log('\n## Pastilles des cartes en mobile');
  // À cette largeur le filtrage passe par le panneau : toucher une pastille
  // dans une carte serait ambigu avec le fait de toucher la carte.
  verifier(
    'pastilles des cartes inertes',
    await page.$$eval('[data-carte] button[data-filtre-groupe]', (b) =>
      b.every((x) => x.disabled),
    ),
    true,
  );
  verifier(
    'hors du parcours clavier',
    await page.$$eval('[data-carte] button[data-filtre-groupe]', (b) =>
      b.every((x) => x.tabIndex === -1 || x.disabled),
    ),
    true,
  );
  // Les pastilles sont posees au-dessus de la zone cliquable du titre :
  // une fois inertes, elles ne doivent pas bloquer l'ouverture du projet.
  verifier(
    'elles laissent passer le clic vers la carte',
    await page.$eval('[data-carte] .pastilles', (e) => getComputedStyle(e).pointerEvents),
    'none',
  );

  // On touche une pastille : c'est le projet qui doit s'ouvrir, sans filtrer.
  // `force` contourne le fait que le bouton est desactive, mais l'evenement
  // souris reste reel : c'est bien le navigateur qui decide de la cible.
  await page
    .locator('[data-carte] button[data-filtre-groupe]')
    .first()
    .click({ force: true });
  await page.waitForLoadState('networkidle');
  verifier(
    'toucher une pastille ouvre bien le projet',
    new URL(page.url()).pathname,
    `${BASE}/projets/deferred-forward-rendering`,
  );
  verifier('et ne filtre rien', new URL(page.url()).search, '');

  await page.goto(`http://localhost:${PORT}${BASE}/bibliotheque`, {
    waitUntil: 'networkidle',
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  verifier(
    'elles redeviennent actives en desktop',
    await page.$$eval('[data-carte] button[data-filtre-groupe]', (b) =>
      b.every((x) => !x.disabled),
    ),
    true,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);

  console.log('\n## Panneau du bas (mobile)');
  verifier('panneau ferme au chargement', await page.$eval('[data-feuille]', (e) => e.hidden), true);
  await page.click('[data-feuille-ouvrir]');
  verifier('panneau ouvert', await page.$eval('[data-feuille]', (e) => e.hidden), false);

  await page.click('[data-feuille] button[data-filtre-groupe="langage"][data-filtre-valeur="cpp"]');
  verifier('rien n\'est applique avant « Voir »', url(page), '');
  verifier('les 2 cartes sont encore la', (await visibles(page)).length, 2);
  verifier('le bouton annonce le total', (await page.textContent('[data-feuille-appliquer-texte]'))?.trim(), 'Voir 1 projets');

  await page.click('[data-feuille-appliquer]');
  verifier('panneau referme', await page.$eval('[data-feuille]', (e) => e.hidden), true);
  verifier('filtre applique', url(page), '?langage=cpp');
  verifier('1 carte', await visibles(page), ['Deferred & Forward Rendering']);

  console.log('\n## Echap ferme le panneau');
  await page.click('[data-feuille-ouvrir]');
  await page.keyboard.press('Escape');
  verifier('panneau referme par Echap', await page.$eval('[data-feuille]', (e) => e.hidden), true);

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
