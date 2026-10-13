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

  // Library
  'bib.titre': 'Library',
  'bib.section.pro': 'Professional',
  'bib.section.scolaire': 'Academic',
  'bib.section.perso': 'Personal',
  'bib.filtres': 'Filters',
  'bib.filtres.actifs': 'Active filters',
  'bib.filtres.domaine': 'Field',
  'bib.filtres.moteur': 'Engine',
  'bib.filtres.langage': 'Language',
  'bib.filtres.reinitialiser': 'Reset filters',
  'bib.filtres.retirer': 'Remove this filter',
  'bib.compteur': '{n} of {total} projects',
  'bib.voirN': 'Show {n} projects',
  'bib.section.vide': 'No project in this section matches the active filters.',
  'bib.vide.titre': 'No results',
  'bib.vide.texte': 'No project matches the active filters.',

  // Project page
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
  'projet.suivant': 'Next project',

  // Media
  'media.apercu': 'Preview',
  'media.lire': 'Play video',
  'media.precedent': 'Previous media',
  'media.suivant': 'Next media',

  // 404
  '404.titre': 'Page not found',
  '404.texte': 'This page does not exist or has been moved.',
  '404.accueil': 'Back to home',
  '404.bibliotheque': 'Browse the library',

  // Footer
  'footer.hautDePage': 'Back to top',
};

export default en;
