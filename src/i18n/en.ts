import type fr from './fr';

/**
 * Traduction anglaise. Partielle par choix : toute cle absente retombe
 * automatiquement sur le francais (voir `t()` dans index.ts).
 */
const en: Partial<Record<keyof typeof fr, string>> = {
  // Navigation
  'nav.accueil': 'Home',
  'nav.bibliotheque': 'Library',
  'nav.contact': 'Contact',
  'nav.cv': 'Resume',
  'nav.menu.ouvrir': 'Open menu',
  'nav.menu.fermer': 'Close menu',
  'nav.theme': 'Theme',
  'nav.theme.sombre': 'Switch to light theme',
  'nav.theme.clair': 'Switch to dark theme',
  'nav.langue': 'Language',

  // Home
  'accueil.portfolio': 'Portfolio',
  'accueil.defiler': 'Scroll',
  'accueil.projets': 'Projects',
  'accueil.voirTout': 'See all',
  'accueil.aPropos': 'About',
  'accueil.parcours': 'Background',
  'accueil.librairies': 'Libraries',

  // Library
  'bib.titre': 'Library',
  'bib.section.pro': 'Professional',
  'bib.section.scolaire': 'Academic',
  'bib.section.perso': 'Personal',
  'bib.sousTitre': 'All my projects — professional, academic and personal.',
  'bib.section.pro.desc': 'Projects built in a company',
  'bib.section.scolaire.desc': 'Projects built at Isart Digital',
  'bib.section.perso.desc': 'Technical explorations and side projects',
  'bib.filtres': 'Filters',
  'bib.filtres.actifs': 'Active filters',
  'bib.filtres.domaine': 'Field',
  'bib.filtres.moteur': 'Engine',
  'bib.filtres.langage': 'Language',
  'bib.filtres.reinitialiser': 'Reset filters',
  'bib.filtres.retirer': 'Remove this filter',
  'bib.compteur': '{n} of {total} projects',
  'bib.voirN': 'Show {n} projects',
  'bib.vide.titre': 'No project matches these filters.',
  'bib.vide.texte': 'Try removing a filter, or reset them all.',

  // Project page
  'projet.fiche': 'Project sheet',
  'projet.lies': 'Related projects',
  'projet.contexte': 'Context',
  'projet.role': 'Role',
  'projet.monRole': 'My role',
  'projet.duree': 'Duration',
  'projet.equipe': 'Team',
  'projet.plateforme': 'Platform',
  'projet.technos': 'Technologies',
  'projet.solo': 'Solo',
  'projet.personnes': '{n} people',
  'projet.lien.jouer': 'Play',
  'projet.lien.github': 'Source code',
  'projet.lien.video': 'Video',
  'projet.precedent': 'Previous project',
  'projet.retourBibliotheque': 'Library',
  'projet.suivant': 'Next project',

  // Media
  'media.apercu': 'Preview',
  'media.lire': 'Play video',
  'media.precedent': 'Previous media',
  'media.suivant': 'Next media',

  // 404
  '404.titre': 'This page does not exist (any more).',
  '404.texte': 'The link may be broken, or the project has moved.',
  '404.accueil': 'Back to home',
  '404.bibliotheque': 'Browse the library',

  // Footer
  'footer.hautDePage': 'Back to top',
};

export default en;
