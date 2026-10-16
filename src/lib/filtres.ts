/**
 * Logique de filtrage de la Bibliotheque.
 *
 * Regle du document : **OU a l'interieur d'un groupe, ET entre les groupes**.
 * Exemple : Unity + Godot + C# = les projets (Unity ou Godot) ET en C#.
 *
 * Ce module est utilise a la fois au build (pour construire les menus et
 * poser les valeurs sur les cartes) et dans le navigateur (pour appliquer
 * les filtres), afin que les deux cotes partagent exactement la meme regle.
 */
import { slugifyFiltre } from './slug';

export const GROUPES = ['domaine', 'moteur', 'langage'] as const;
export type Groupe = (typeof GROUPES)[number];

/** Filtres actifs : un ensemble de slugs par groupe. */
export type EtatFiltres = Record<Groupe, string[]>;

/** Valeurs portees par un projet, en slugs. */
export type ValeursProjet = Record<Groupe, string[]>;

export function etatVide(): EtatFiltres {
  return { domaine: [], moteur: [], langage: [] };
}

export function estVide(etat: EtatFiltres): boolean {
  return GROUPES.every((g) => etat[g].length === 0);
}

export function nombreActifs(etat: EtatFiltres): number {
  return GROUPES.reduce((n, g) => n + etat[g].length, 0);
}

/**
 * Lit les filtres depuis une query string.
 * `?moteur=unity,godot&langage=csharp`
 */
export function lireUrl(search: string): EtatFiltres {
  const params = new URLSearchParams(search);
  const etat = etatVide();
  for (const groupe of GROUPES) {
    const brut = params.get(groupe);
    if (!brut) continue;
    etat[groupe] = brut
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return etat;
}

/**
 * Serialise les filtres pour l'adresse. Retourne '' quand rien n'est actif,
 * pour que l'URL reste propre.
 */
export function ecrireUrl(etat: EtatFiltres): string {
  const params = new URLSearchParams();
  for (const groupe of GROUPES) {
    if (etat[groupe].length > 0) params.set(groupe, etat[groupe].join(','));
  }
  // URLSearchParams encode la virgule en %2C. Elle est legale telle quelle
  // dans une query string, et le document specifie `?moteur=unity,godot`.
  const q = params.toString().replace(/%2C/g, ',');
  return q ? `?${q}` : '';
}

/**
 * OU dans un groupe, ET entre les groupes : un groupe sans filtre actif
 * ne contraint rien.
 */
export function correspond(valeurs: ValeursProjet, etat: EtatFiltres): boolean {
  return GROUPES.every((groupe) => {
    const actifs = etat[groupe];
    if (actifs.length === 0) return true;
    return valeurs[groupe].some((v) => actifs.includes(v));
  });
}

/** Ajoute le filtre s'il est absent, le retire s'il est deja actif. */
export function basculer(
  etat: EtatFiltres,
  groupe: Groupe,
  valeur: string,
): EtatFiltres {
  const actifs = etat[groupe];
  return {
    ...etat,
    [groupe]: actifs.includes(valeur)
      ? actifs.filter((v) => v !== valeur)
      : [...actifs, valeur],
  };
}

/** Lit les valeurs de filtre posees sur une carte par `data-*`. */
export function valeursDeLElement(el: HTMLElement): ValeursProjet {
  const lire = (groupe: Groupe) =>
    (el.dataset[groupe] ?? '').split(',').filter(Boolean);
  return {
    domaine: lire('domaine'),
    moteur: lire('moteur'),
    langage: lire('langage'),
  };
}

export { slugifyFiltre };
