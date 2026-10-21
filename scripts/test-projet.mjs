/**
 * Verification du comportement de la page projet.
 *
 *   npm run build && npm run test:projet
 *
 * Couvre les regles de docs/passage-au-dev.md : « Mon rôle » et la ligne
 * « Rôle » seulement si equipe > 1, carrousel (fleches, vignettes, clavier,
 * compteur, legende), precedent/suivant dans la meme section en boucle,
 * et habillage des blocs de code.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const RACINE = new URL('../dist', import.meta.url).pathname.replace(/^\//, '');
const BASE = '/Portfolio';
const PORT = 4332;

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
const aller = (slug) =>
  page.goto(`http://localhost:${PORT}${BASE}/projets/${slug}`, { waitUntil: 'networkidle' });

// ====================================================================
console.log('\n## Projet en equipe (equipe = 4)');
await aller('diamond-seams');
verifier('encadre « Mon rôle » present', (await page.$$('.encadre')).length, 1);
verifier(
  'ligne « Rôle » dans la fiche',
  await page.$$eval('.fiche dt', (els) => els.map((e) => e.textContent.trim())),
  ['Contexte', 'Rôle', 'Durée', 'Équipe', 'Plateforme'],
);
verifier(
  'equipe affichee en nombre',
  (await page.$$eval('.fiche dd', (e) => e.map((x) => x.textContent.trim())))[3],
  '4 personnes',
);
verifier(
  'technos en puces',
  await page.$$eval('.technos__liste li', (e) => e.map((x) => x.textContent.trim())),
  ['Unity', 'C#', 'À compléter'],
);

// ====================================================================
console.log('\n## Projet solo (equipe = 1)');
await aller('deferred-forward-rendering');
verifier('pas d\'encadre « Mon rôle »', (await page.$$('.encadre')).length, 0);
verifier(
  'pas de ligne « Rôle »',
  await page.$$eval('.fiche dt', (els) => els.map((e) => e.textContent.trim())),
  ['Contexte', 'Durée', 'Équipe', 'Plateforme'],
);
verifier(
  'equipe affichee « Solo »',
  (await page.$$eval('.fiche dd', (e) => e.map((x) => x.textContent.trim())))[2],
  'Solo',
);
verifier(
  'toutes les pastilles du projet',
  // Portee a l'en-tete : les cartes « Projets liés » portent les leurs.
  await page.$$eval('.entete .pastilles .tag', (e) => e.map((x) => x.textContent.trim())),
  ['Graphique', 'Bas niveau', 'Sans moteur', 'C++', 'HLSL'],
);

// ====================================================================
console.log('\n## Carrousel');
await aller('diamond-seams');
const actif = () =>
  page.$eval('[data-diapo][data-actif]', (e) => Number(e.dataset.diapo));
const compteur = () => page.textContent('[data-carrousel-courant]');
const legende = () => page.textContent('[data-carrousel-legende]');

verifier('demarre sur le premier media', await actif(), 0);
verifier('compteur a 1', (await compteur())?.trim(), '1');
verifier('3 vignettes', (await page.$$('[data-vignette]')).length, 3);
verifier(
  'premiere vignette selectionnee',
  await page.$$eval('[data-vignette]', (e) => e.map((x) => x.getAttribute('aria-selected'))),
  ['true', 'false', 'false'],
);

await page.click('[data-carrousel-suiv]');
await page.waitForTimeout(600);
verifier('la fleche suivante avance', await actif(), 1);
verifier('compteur a 2', (await compteur())?.trim(), '2');
verifier('legende mise a jour', (await legende())?.trim(), 'Placeholder — vidéo à ajouter.');

await page.click('[data-vignette="2"]');
await page.waitForTimeout(700);
verifier('clic sur une vignette', await actif(), 2);
verifier('le compteur suit les vignettes', (await compteur())?.trim(), '3');
verifier('la legende suit les vignettes', (await legende())?.trim(), 'Placeholder — capture à remplacer.');
verifier(
  'la vignette cliquee est marquee',
  await page.$$eval('[data-vignette]', (e) => e.map((x) => x.getAttribute('aria-selected'))),
  ['false', 'false', 'true'],
);

await page.click('[data-vignette="1"]');
await page.waitForTimeout(700);
verifier('compteur apres une 2e vignette', (await compteur())?.trim(), '2');

await page.click('[data-carrousel-prec]');
await page.waitForTimeout(700);
verifier('la fleche precedente recule', await actif(), 0);

console.log('\n## Clones de boucle');
verifier(
  'un clone a chaque extremite',
  await page.$$eval('[data-piste] [data-clone]', (e) => e.length),
  2,
);
verifier(
  'les clones sont masques aux lecteurs d\'ecran',
  await page.$$eval('[data-clone]', (e) =>
    e.every((x) => x.getAttribute('aria-hidden') === 'true'),
  ),
  true,
);
verifier(
  'leurs boutons sont hors du parcours clavier',
  await page.$$eval('[data-clone] button', (b) => b.every((x) => x.tabIndex === -1)),
  true,
);
// `inert` bloquerait aussi les clics : les clones doivent rester cliquables.
verifier(
  'les clones ne sont pas inertes',
  await page.$$eval('[data-clone]', (e) => e.some((x) => x.hasAttribute('inert'))),
  false,
);
verifier(
  'leurs images sont chargees sans attendre',
  await page.$$eval('[data-clone] img', (i) => i.every((x) => x.loading === 'eager')),
  true,
);
// Le clone de gauche est deja telecharge : c'est lui qu'on voit en bouclant,
// et c'est son chargement paresseux qui provoquait l'attente.
verifier(
  'le clone de gauche est deja telecharge',
  await page.$$eval('[data-piste] > [data-clone] img', (i) =>
    i.every((x) => x.complete && x.naturalWidth > 0),
  ),
  true,
);
verifier(
  'le clone de gauche montre le dernier media',
  await page.$eval('[data-piste] > :first-child', (e) =>
    e.querySelector('.media__badge') ? 'video' : 'image',
  ),
  'image',
);

// On repart du 2e media pour tester une fleche clavier hors boucle.
await page.click('[data-vignette="1"]');
await page.waitForTimeout(700);
await page.focus('[data-carrousel-suiv]');
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(700);
verifier('fleche gauche du clavier', await actif(), 0);

console.log('\n## Le carrousel boucle');
// Depuis le premier media, Precedent glisse sur le clone de fin puis se
// recolle silencieusement sur le vrai dernier media.
await page.click('[data-carrousel-prec]');
await page.waitForTimeout(900);
verifier('depuis le premier, Precedent va au dernier', await actif(), 2);
verifier('compteur au dernier', (await compteur())?.trim(), '3');
verifier(
  'apres recollage on est sur un vrai media, pas un clone',
  await page.$eval('[data-piste]', (p) => {
    const centre = p.scrollLeft + p.clientWidth / 2;
    const cellule = Array.from(p.children).find(
      (c) => c.offsetLeft <= centre && c.offsetLeft + c.clientWidth >= centre,
    );
    return cellule?.hasAttribute('data-clone') ?? true;
  }),
  false,
);

await page.click('[data-carrousel-suiv]');
await page.waitForTimeout(900);
verifier('depuis le dernier, Suivant revient au premier', await actif(), 0);
verifier('compteur revenu a 1', (await compteur())?.trim(), '1');

await page.focus('[data-carrousel-prec]');
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(900);
verifier('le clavier boucle aussi', await actif(), 2);
await page.click('[data-vignette="0"]');
await page.waitForTimeout(700);

console.log('\n## Diapos laterales cliquables');
await page.click('[data-vignette="0"]');
await page.waitForTimeout(700);
verifier(
  'le curseur indique un clic possible sur les cotes',
  await page.$$eval('.diapo', (d) => [
    getComputedStyle(d.find((x) => x.hasAttribute('data-actif'))).cursor,
    getComputedStyle(d.find((x) => !x.hasAttribute('data-actif'))).cursor,
  ]),
  ['default', 'pointer'],
);
// La diapo de droite (le 2e media) doit venir au centre au clic.
await page.evaluate(() => {
  const piste = document.querySelector('[data-piste]');
  const cellules = Array.from(piste.children);
  const i = cellules.findIndex((c) => c.hasAttribute('data-actif'));
  cellules[i + 1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(800);
verifier('un clic sur la diapo de droite l\'amene au centre', await actif(), 1);

// Le clone de gauche doit se cliquer comme n'importe quelle diapo laterale.
await page.click('[data-vignette="0"]');
await page.waitForTimeout(700);
await page.evaluate(() => {
  document
    .querySelector('[data-piste] > [data-clone]')
    .dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(900);
verifier('un clic sur le clone de gauche va au dernier media', await actif(), 2);
await page.click('[data-vignette="0"]');
await page.waitForTimeout(700);

console.log('\n## Robustesse du carrousel');
// Etat de la piste : ecart au centrage le plus proche, et coherence entre
// ce qui est affiche et ce qui est annonce.
const etatPiste = () =>
  page.evaluate(() => {
    const p = document.querySelector('[data-piste]');
    const cellules = Array.from(p.children);
    const ecarts = cellules.map((c) =>
      Math.abs(c.offsetLeft - (p.clientWidth - c.clientWidth) / 2 - p.scrollLeft),
    );
    const centree = ecarts.indexOf(Math.min(...ecarts));
    const reels = cellules.filter((c) => !c.hasAttribute('data-clone'));
    return {
      ecart: Math.round(Math.min(...ecarts)),
      surClone: cellules[centree].hasAttribute('data-clone'),
      centre: reels.indexOf(cellules[centree]),
      actif: Number(
        document.querySelector('[data-diapo][data-actif]')?.dataset.diapo ?? -1,
      ),
    };
  });

await aller('diamond-seams');
await page.waitForTimeout(400);

// Six « Precedent » d'affilee : la boucle doit tourner, pas se bloquer.
const tours = [];
for (let i = 0; i < 6; i++) {
  await page.click('[data-carrousel-prec]');
  await page.waitForTimeout(800);
  tours.push((await etatPiste()).actif);
}
verifier('six « Precedent » font deux tours complets', tours, [2, 1, 0, 2, 1, 0]);

// Rafale de clics alternes : l'etat doit rester coherent.
for (let i = 0; i < 10; i++) {
  await page.click(i % 2 ? '[data-carrousel-prec]' : '[data-carrousel-suiv]');
  await page.waitForTimeout(120);
}
await page.waitForTimeout(1400);
const apresRafale = await etatPiste();
verifier('jamais coince entre deux diapos', apresRafale.ecart, 0);
verifier('jamais arrete sur un clone', apresRafale.surClone, false);
verifier(
  'le media affiche est celui annonce',
  apresRafale.centre,
  apresRafale.actif,
);

// Rafale rapide dans un seul sens : aucun pas ne doit se perdre.
await page.click('[data-vignette="0"]');
await page.waitForTimeout(800);
for (let i = 0; i < 6; i++) {
  await page.click('[data-carrousel-suiv]');
  await page.waitForTimeout(60);
}
await page.waitForTimeout(1600);
const apresRapide = await etatPiste();
verifier('six pas rapides = deux tours, retour au premier', apresRapide.actif, 0);
verifier('et toujours aligne', apresRapide.ecart, 0);

console.log('\n## Historique');
const entrees = () => page.evaluate(() => history.length);
await aller('diamond-seams');
const depart = await entrees();

const themeAvant = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click('[data-theme-toggle]');
await page.waitForTimeout(200);
verifier('le changement de theme n\'empile rien', (await entrees()) - depart, 0);
verifier(
  'mais il agit bien',
  await page.evaluate(() => document.documentElement.dataset.theme),
  themeAvant === 'dark' ? 'light' : 'dark',
);
await page.click('[data-theme-toggle]');
await page.waitForTimeout(200);

await page.click('.haut');
await page.waitForTimeout(600);
verifier('« Retour en haut » n\'empile rien', (await entrees()) - depart, 0);

await page.click('a[href="#pied-de-page"]');
await page.waitForTimeout(600);
verifier('« Contact » n\'empile rien', (await entrees()) - depart, 0);
verifier(
  'et il defile bien jusqu\'au pied de page',
  await page.evaluate(() => {
    const p = document.getElementById('pied-de-page').getBoundingClientRect();
    return p.top < window.innerHeight && p.top > -200;
  }),
  true,
);
verifier(
  'l\'adresse reste propre',
  await page.evaluate(() => location.hash),
  '',
);

console.log('\n## Redimensionnement');
// scroll-snap recale le defilement tout seul quand la fenetre change de
// taille, et peut atterrir sur un autre media : on doit rester en place.
await page.click('[data-vignette="1"]');
await page.waitForTimeout(700);
await page.setViewportSize({ width: 1200, height: 1400 });
await page.waitForTimeout(500);
verifier('on reste sur le meme media apres un redimensionnement', await actif(), 1);
verifier('compteur inchange', (await compteur())?.trim(), '2');
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(500);
await page.click('[data-vignette="0"]');
await page.waitForTimeout(700);

console.log('\n## Media video');
verifier(
  'la 2e diapo porte le badge VIDÉO',
  await page.$eval('[data-diapo="1"] .media__badge', (e) => e.textContent.trim()),
  'VIDÉO',
);
verifier(
  'aucune balise <video> avant le clic',
  await page.$$eval('video', (v) => v.length),
  0,
);

// ====================================================================
console.log('\n## Precedent / suivant');
verifier(
  'voisins dans la meme section, en boucle',
  await page.$$eval('.navigation .carte__titre', (e) => e.map((x) => x.textContent.trim())),
  ['Deferred & Forward Rendering', 'Deferred & Forward Rendering'],
);
verifier(
  'les liens pointent vers le bon projet',
  await page.$$eval('.navigation a', (e) => e.map((x) => new URL(x.href).pathname)),
  [`${BASE}/projets/deferred-forward-rendering`, `${BASE}/projets/deferred-forward-rendering`],
);

// ====================================================================
console.log('\n## Bloc de code');
verifier('habillage applique', (await page.$$('.bloc-code')).length, 1);
verifier(
  'langage affiche',
  (await page.textContent('.bloc-code__langue'))?.trim(),
  'CSHARP',
);
verifier('bouton copier present', (await page.$$('[data-copier-code]')).length, 1);
// Chromium ne resout pas counter() dans le style calcule : on verifie que le
// compteur est bien en place plutot que sa valeur rendue.
verifier(
  'numeros de ligne par compteur CSS',
  await page.$eval('.bloc-code .line', (e) =>
    getComputedStyle(e, '::before').counterIncrement,
  ),
  'ligne 1',
);
// Shiki ecrit les hex en majuscules : comparaison insensible a la casse.
verifier(
  'coloration appliquee (mot-cle mauve, fonction bleue, nombre jaune)',
  await page.$$eval('.bloc-code span[style]', (els) => {
    const styles = els.map((e) => e.getAttribute('style').toLowerCase());
    return [
      styles.some((s) => s.includes('#cdb4ff')),
      styles.some((s) => s.includes('#afc0ff')),
      styles.some((s) => s.includes('#ffd900')),
    ];
  }),
  [true, true, true],
);
verifier(
  'le bloc suit le theme (habillage)',
  await page.evaluate(() => {
    const bloc = document.querySelector('.bloc-code');
    const lire = (t) => {
      document.documentElement.dataset.theme = t;
      return getComputedStyle(bloc).backgroundColor;
    };
    const sombre = lire('dark');
    const clair = lire('light');
    document.documentElement.dataset.theme = 'dark';
    return [sombre, clair];
  }),
  ['rgb(13, 12, 32)', 'rgb(255, 255, 255)'],
);
// On compare la couleur CALCULEE, pas l'attribut : c'est ce qui manquait
// au test precedent, qui passait alors que rien n'etait applique.
verifier(
  'la coloration est reellement appliquee et suit le theme',
  await page.evaluate(() => {
    const jeton = [...document.querySelectorAll('.bloc-code pre span[style]')].find(
      (s) => s.getAttribute('style').toLowerCase().includes('#cdb4ff'),
    );
    if (!jeton) return 'jeton introuvable';
    const lire = (t) => {
      document.documentElement.dataset.theme = t;
      return getComputedStyle(jeton).color;
    };
    const sombre = lire('dark');
    const clair = lire('light');
    document.documentElement.dataset.theme = 'dark';
    return [sombre, clair];
  }),
  ['rgb(205, 180, 255)', 'rgb(122, 63, 224)'],
);

// ====================================================================
console.log('\n## Carrousel en mobile');
await page.setViewportSize({ width: 390, height: 844 });
await aller('diamond-seams');
verifier(
  'fleches et vignettes masquees',
  await page.evaluate(() => [
    getComputedStyle(document.querySelector('.fleche')).display,
    getComputedStyle(document.querySelector('.vignettes')).display,
  ]),
  ['none', 'none'],
);
verifier('les points sont de vrais boutons', (await page.$$('button[data-point]')).length, 3);
verifier(
  'points visibles et cliquables',
  await page.$eval('.points', (e) => getComputedStyle(e).display),
  'flex',
);

await page.click('[data-point="2"]');
await page.waitForTimeout(600);
verifier('un clic sur un point change de media', await actif(), 2);
verifier('compteur suit', (await compteur())?.trim(), '3');
verifier(
  'le point actif est marque',
  await page.$$eval('[data-point]', (e) => e.map((x) => x.getAttribute('aria-selected'))),
  ['false', 'false', 'true'],
);

await page.focus('[data-point="2"]');
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(600);
verifier('fleche clavier depuis les points', await actif(), 1);

console.log('\n## Navigation projet en mobile');
verifier(
  'les deux cartes se partagent une ligne',
  await page.$eval('.navigation', (e) => getComputedStyle(e).gridTemplateColumns.split(' ').length),
  2,
);
verifier(
  'vignettes retirees en mobile',
  await page.$$eval('.navigation .carte__media', (e) =>
    e.every((x) => getComputedStyle(x).display === 'none'),
  ),
  true,
);

// ====================================================================
console.log('\n## Fiche collee');
await page.setViewportSize({ width: 1440, height: 900 });
await aller('diamond-seams');
verifier(
  'fiche collee en desktop',
  await page.$eval('.colonne', (e) => getComputedStyle(e).position),
  'sticky',
);
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(200);
// En mobile la colonne n'est plus une boite : ses deux blocs se placent eux-memes.
verifier(
  'non collee en mobile',
  await page.$eval('.colonne__fiche', (e) => getComputedStyle(e).position),
  'static',
);
verifier(
  'fiche placee avant l\'article en mobile',
  await page.$eval('.colonne__fiche', (e) => getComputedStyle(e).order),
  '-1',
);

// ====================================================================
console.log('\n## Projets lies');
await page.setViewportSize({ width: 1440, height: 900 });
await aller('deferred-forward-rendering');

verifier(
  'la section est rendue',
  await page.$$eval('.lies .carte', (c) => c.length),
  1,
);
verifier(
  'elle pointe sur le projet cite par `lies`',
  await page.$eval('.lies .titre a', (a) => new URL(a.href).pathname.replace(/\/$/, '')),
  '/Portfolio/projets/diamond-seams',
);

// La carte garde la forme compacte malgre la largeur : image a gauche.
verifier(
  'carte compacte en desktop',
  await page.$eval('.lies .carte', (e) => getComputedStyle(e).flexDirection),
  'row',
);
verifier(
  'vignette de 88px',
  await page.$eval('.lies .media', (e) => getComputedStyle(e).width),
  '88px',
);
// Hors bibliotheque il n'y a aucun filtre a piloter.
verifier(
  'pastilles non interactives',
  await page.$$eval('.lies .pastilles button', (b) => b.length),
  0,
);
verifier(
  'pas d\'apercu au survol',
  await page.$eval('.lies .carte', (e) => e.hasAttribute('data-apercu')),
  false,
);

// Desktop : accrochee sous la fiche, dans la colonne collee.
verifier(
  'accrochee sous la fiche, dans la colonne collee',
  await page.evaluate(() => {
    const colonne = document.querySelector('.colonne');
    const fiche = document.querySelector('.fiche');
    const lies = document.querySelector('.lies');
    return (
      colonne.contains(lies) &&
      getComputedStyle(colonne).position === 'sticky' &&
      Math.round(lies.getBoundingClientRect().top - fiche.getBoundingClientRect().bottom)
    );
  }),
  32,
);
// Garde-fou : la colonne ne doit jamais depasser l'ecran, sinon le bas de la
// liste resterait hors d'atteinte sous un bloc colle.
verifier(
  'la colonne tient dans l\'ecran',
  await page.evaluate(() => {
    const c = document.querySelector('.colonne');
    return c.getBoundingClientRect().height <= window.innerHeight;
  }),
  true,
);

// Mobile : apres l'article, juste avant « Projet suivant ».
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(200);
verifier(
  'ordre mobile : article, puis lies, puis navigation',
  await page.evaluate(() => {
    const y = (s) => {
      const e = document.querySelector(s);
      return e ? e.getBoundingClientRect().top + window.scrollY : -1;
    };
    return y('.article') < y('.lies') && y('.lies') < y('.navigation');
  }),
  true,
);

// Un projet sans `lies` n'affiche pas la section.
await page.setViewportSize({ width: 1440, height: 900 });
await aller('diamond-seams');
verifier(
  'la section suit le contenu du champ',
  await page.$$eval('.lies .carte', (c) => c.map((e) => e.querySelector('.titre a').textContent.trim())),
  ['Deferred & Forward Rendering'],
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
