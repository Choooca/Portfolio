/**
 * Contenu editable de la page d'accueil.
 *
 * Ces textes viennent de la maquette Figma (« Section / À propos », 51:69).
 * Ils sont ici plutot que dans src/i18n/ parce que ce n'est pas du texte
 * d'interface mais du contenu : Paul les modifie directement.
 *
 * Chaque champ a sa variante `_en`, comme les projets ; si l'anglais manque,
 * le francais s'affiche (voir `pick()` dans src/i18n).
 */

/**
 * Demoreel de la section « À propos ».
 * TODO Paul : deposer la video dans public/videos/ et une image d'affiche.
 */
export const DEMOREEL = {
  /** Chemin depuis public/. */
  video: '/videos/demoreel.mp4',
};

export const BIO = {
  texte:
    "Actuellement étudiant à Isart Digital et gameplay programmer à Ludogram, je suis spécialisé en gameplay programming et intéressé par l'optimisation. J'aime également la programmation graphique et le développement bas niveau, que j'apprends via des projets personnels.",
  texte_en:
    'Currently a student at Isart Digital and a gameplay programmer at Ludogram, I specialise in gameplay programming and care about optimisation. I also enjoy graphics programming and low-level development, which I learn through personal projects.',
};

export interface EntreeParcours {
  /** Periode. `enCours` la met en avant en jaune. */
  periode: string;
  periode_en?: string;
  intitule: string;
  intitule_en?: string;
  lieu: string;
  lieu_en?: string;
  /** Une entree en cours a sa pastille pleine et sa periode en accent. */
  enCours?: boolean;
}

/** Frise du parcours, de la plus recente a la plus ancienne. */
export const PARCOURS: EntreeParcours[] = [
  {
    periode: 'Actuellement',
    periode_en: 'Current',
    intitule: 'Gameplay Programmer — stage',
    intitule_en: 'Gameplay Programmer — internship',
    lieu: 'Ludogram · Lille',
    enCours: true,
  },
  {
    periode: 'En cours · 4e année',
    periode_en: 'Ongoing · 4th year',
    intitule: 'Game Design & Programming',
    lieu: 'Isart Digital',
    enCours: true,
  },
  {
    // TODO Paul : dates et entreprise (voir « Reste à faire » du document).
    periode: 'Dates à compléter',
    periode_en: 'Dates to be filled in',
    intitule: 'Développeur R&D VR',
    intitule_en: 'VR R&D Developer',
    lieu: 'Entreprise à compléter',
    lieu_en: 'Company to be filled in',
  },
];

export interface LigneCompetence {
  libelle: string;
  libelle_en?: string;
  valeur: string;
  valeur_en?: string;
}

export const COMPETENCES: LigneCompetence[] = [
  { libelle: 'Moteurs', libelle_en: 'Engines', valeur: 'Unity, Unreal, Godot' },
  { libelle: 'Langages', libelle_en: 'Languages', valeur: 'C++, C#, HLSL, GLSL' },
  { libelle: 'Versioning', valeur: 'Git, Perforce' },
  {
    libelle: 'Langues',
    libelle_en: 'Spoken',
    valeur: 'Français (natif), Anglais (B2)',
    valeur_en: 'French (native), English (B2)',
  },
];
