/**
 * Mecanique commune aux carrousels du site (page projet et accueil).
 *
 * Principe : une piste a defilement horizontal avec accrochage, plus un clone
 * de la derniere diapo avant la premiere et un clone de la premiere apres la
 * derniere. Sur la premiere diapo, c'est donc la derniere qui depasse a
 * gauche, et « Precedent » glisse vers la gauche au lieu de sauter a l'autre
 * bout. Arrive sur un clone, la piste se replace sur le vrai media equivalent
 * — invisible, puisque les deux montrent la meme chose.
 *
 * Le composant appelant garde la main sur son habillage (compteur, vignettes,
 * points, legende) via `surChangement`.
 */

export interface OptionsCarrousel {
  /** Conteneur a defilement horizontal. */
  piste: HTMLElement;
  /** Selecteur des vraies diapos, enfants directs de la piste. */
  selecteurDiapo?: string;
  /** Appelee a chaque changement, avec l'index reel du media. */
  surChangement?: (index: number) => void;
  /** Conteneurs qui doivent aussi reagir aux fleches du clavier. */
  zonesClavier?: (Element | null | undefined)[];
}

export interface Carrousel {
  /** Va directement a un media. */
  aller(index: number): void;
  /** Avance ou recule d'un cran, en bouclant. */
  decaler(pas: number): void;
  /** Index reel du media affiche. */
  index(): number;
  /** Nombre de vrais media. */
  readonly nombre: number;
}

export function creerCarrousel(options: OptionsCarrousel): Carrousel | null {
  const { piste: zone, selecteurDiapo = '[data-diapo]', surChangement } = options;

  const diapos = Array.from(zone.querySelectorAll<HTMLElement>(selecteurDiapo));
  const n = diapos.length;
  if (n === 0) return null;

  // ---- Clones de boucle ----
  if (n > 1) {
    for (const [source, ou] of [
      [diapos[n - 1]!, 'afterbegin'],
      [diapos[0]!, 'beforeend'],
    ] as const) {
      const clone = source.cloneNode(true) as HTMLElement;
      clone.removeAttribute('data-diapo');
      clone.removeAttribute('data-actif');
      clone.dataset.clone = '';

      // Masque aux lecteurs d'ecran — le media est deja annonce a sa vraie
      // place — mais surtout PAS `inert` : celui-ci bloque aussi les clics,
      // et la diapo doit pouvoir amener a elle comme les autres.
      clone.setAttribute('aria-hidden', 'true');
      for (const cible of clone.querySelectorAll<HTMLElement>('button, a, [tabindex]')) {
        cible.setAttribute('tabindex', '-1');
      }

      zone.insertAdjacentElement(ou, clone);
    }
  }

  /** Toutes les cellules de la piste, clones compris. */
  const cellules = Array.from(zone.children) as HTMLElement[];

  /**
   * `position` suit ce qui est reellement affiche (mis a jour par
   * l'observateur). `vise` est la destination demandee : elle est mise a jour
   * tout de suite au clic, sinon des clics rapides se calculeraient tous
   * depuis la meme position de depart et des pas seraient perdus.
   */
  let position = n > 1 ? 1 : 0;
  let vise = position;
  let courant = 0;
  let pret = false;

  /**
   * Vrai pendant un deplacement commande. Indispensable : un `scrollTo`
   * instantane emet lui aussi un `scrollend`, aussitot. Sans ce drapeau, la
   * teleportation prealable de `decaler()` declencherait le recollage, qui
   * verrait le clone et renverrait au point de depart.
   */
  let pilote = false;
  let minuteurPilote: number;

  function programmer() {
    pilote = true;
    clearTimeout(minuteurPilote);
    // Filet : si l'animation n'arrive jamais a destination, on rend la main.
    minuteurPilote = window.setTimeout(() => {
      pilote = false;
      recoller();
    }, 800);
  }

  /**
   * Les images sont en chargement paresseux : celle vers laquelle on va doit
   * deja etre la, sinon on voit un blanc au moment du changement.
   */
  function precharger(p: number) {
    for (const voisin of [p - 1, p, p + 1]) {
      for (const img of cellules[voisin]?.querySelectorAll('img') ?? []) {
        img.loading = 'eager';
      }
    }
  }

  const reelDe = (p: number) => {
    if (n <= 1) return 0;
    if (p === 0) return n - 1;
    if (p === n + 1) return 0;
    return p - 1;
  };

  /** Cellule dont le centre est le plus proche du defilement actuel. */
  function celluleCentree() {
    let meilleure = 0;
    let ecart = Infinity;
    cellules.forEach((c, i) => {
      const cible = c.offsetLeft - (zone.clientWidth - c.clientWidth) / 2;
      const d = Math.abs(cible - zone.scrollLeft);
      if (d < ecart) {
        ecart = d;
        meilleure = i;
      }
    });
    return meilleure;
  }

  function marquer(index: number) {
    courant = Math.max(0, Math.min(index, n - 1));
    diapos.forEach((d, i) => d.toggleAttribute('data-actif', i === courant));
    surChangement?.(courant);
    // Previent Media.astro, qui met en pause la video en cours.
    document.dispatchEvent(new CustomEvent('carrousel:changement'));
  }

  function allerPosition(p: number, instantane = false) {
    const cible = cellules[p];
    if (!cible) return;
    zone.scrollTo({
      left: cible.offsetLeft - (zone.clientWidth - cible.clientWidth) / 2,
      behavior: instantane ? 'auto' : 'smooth',
    });
  }

  function aller(index: number) {
    const p = n > 1 ? index + 1 : index;
    vise = p;
    programmer();
    precharger(p);
    allerPosition(p);
  }

  /**
   * Le replacement se fait AVANT l'animation : arrive a un bord, on se
   * teleporte d'abord sur le clone equivalent — visuellement identique, donc
   * le saut est invisible — puis on glisse d'une seule case.
   */
  function decaler(pas: number) {
    if (n <= 1) return;

    let depart = vise;
    if (pas < 0 && depart === 1) depart = n + 1;
    else if (pas > 0 && depart === n) depart = 0;

    if (depart !== vise) {
      position = depart;
      allerPosition(depart, true);
    }

    vise = depart + pas;
    programmer();
    precharger(vise);
    allerPosition(vise);
  }

  /**
   * Filet pour le glissement au doigt, qui peut s'arreter sur un clone sans
   * passer par `decaler()`. On se fie a la position de defilement reelle, pas
   * a `position` : celle-ci peut etre en retard pendant une animation.
   */
  function recoller() {
    if (n <= 1 || !pret) return;
    const p = celluleCentree();

    if (pilote) {
      if (p !== vise) return;
      pilote = false;
      clearTimeout(minuteurPilote);
    }

    // La fin de defilement fait autorite : l'observateur ne previent qu'au
    // franchissement d'un seuil, et des allers-retours rapides peuvent ne
    // jamais en franchir.
    vise = p;
    position = p;
    const reel = reelDe(p);
    if (reel !== courant) marquer(reel);

    if (p !== 0 && p !== n + 1) return;
    vise = p === 0 ? n : 1;
    position = vise;
    precharger(vise);
    allerPosition(vise, true);
  }

  // ---- Diapos laterales cliquables ----
  zone.addEventListener('click', (event) => {
    const cellule = (event.target as HTMLElement).closest<HTMLElement>(
      `${selecteurDiapo}, [data-clone]`,
    );
    if (!cellule) return;
    const p = cellules.indexOf(cellule);
    const estClone = cellule.hasAttribute('data-clone');
    if (p < 0 || (!estClone && p === vise)) return;
    event.preventDefault();
    event.stopPropagation();

    // Cliquer un clone revient a faire un pas dans sa direction.
    if (estClone) decaler(p === 0 ? -1 : 1);
    else {
      vise = p;
      programmer();
      precharger(p);
      allerPosition(p);
    }
  });

  /**
   * Un element focalisable d'une diapo laterale amene sa diapo au centre.
   * Sans cela, la tabulation deplacerait le focus sur une carte a moitie
   * hors de la piste, dont le contour de focus serait rogne.
   *
   * Le recentrage est instantane : il accompagne un deplacement du focus,
   * pas un geste de navigation.
   */
  zone.addEventListener('focusin', (event) => {
    const cellule = (event.target as HTMLElement).closest<HTMLElement>(
      `${selecteurDiapo}, [data-clone]`,
    );
    if (!cellule) return;
    const p = cellules.indexOf(cellule);
    if (p < 0 || p === vise) return;
    vise = p;
    position = p;
    precharger(p);
    allerPosition(p, true);
    const reel = reelDe(p);
    if (reel !== courant) marquer(reel);
  });

  // Centrage initial AVANT de poser l'observateur, pour qu'il parte de la
  // bonne position de defilement.
  allerPosition(position, true);

  const observateur = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        const p = cellules.indexOf(entree.target as HTMLElement);
        if (p < 0) continue;
        position = p;
        precharger(p);
        const reel = reelDe(p);
        if (reel !== courant) marquer(reel);
      }
    },
    { root: zone, threshold: 0.6 },
  );
  cellules.forEach((c) => observateur.observe(c));

  /** Au redimensionnement, l'accrochage recale le defilement tout seul. */
  let minuteurTaille: number;
  addEventListener('resize', () => {
    clearTimeout(minuteurTaille);
    minuteurTaille = window.setTimeout(() => allerPosition(vise, true), 120);
  });

  // `scrollend` n'est pas partout : repli sur une temporisation.
  if ('onscrollend' in window) {
    zone.addEventListener('scrollend', recoller);
  } else {
    let minuteur: number;
    zone.addEventListener('scroll', () => {
      clearTimeout(minuteur);
      minuteur = window.setTimeout(recoller, 140);
    });
  }

  // ---- Clavier ----
  const auClavier = (event: Event) => {
    const e = event as KeyboardEvent;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      decaler(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      decaler(1);
    }
  };

  for (const zoneClavier of [zone.parentElement, ...(options.zonesClavier ?? [])]) {
    zoneClavier?.addEventListener('keydown', auClavier);
  }

  marquer(0);

  // Les images peuvent encore changer la mise en page : on recentre une fois
  // tout charge, puis on autorise le recollage.
  const demarrer = () => {
    position = n > 1 ? 1 : 0;
    vise = position;
    precharger(position);
    // Les partenaires de boucle doivent etre prets des le depart : ce sont eux
    // qu'on voit apparaitre en bouclant.
    if (n > 1) precharger(n);
    allerPosition(position, true);
    marquer(0);
    requestAnimationFrame(() => {
      pret = true;
    });
  };

  if (document.readyState === 'complete') requestAnimationFrame(demarrer);
  else addEventListener('load', demarrer, { once: true });

  return { aller, decaler, index: () => courant, nombre: n };
}
