/**
 * Liens externes et fichiers, partages par la Nav, le menu mobile et le Footer.
 *
 * PLACEHOLDERS : les vraies adresses sont a remplir par Paul (voir la section
 * « Reste a faire cote contenu » de docs/passage-au-dev.md). Le CV PDF n'est
 * pas encore dans public/.
 */
export const LIENS = {
  /** TODO Paul : adresse de contact a afficher publiquement. */
  mail: 'mailto:contact@example.com',
  /** TODO Paul : URL du profil LinkedIn. */
  linkedin: 'https://www.linkedin.com/',
  /** TODO Paul : URL du profil GitHub. */
  github: 'https://github.com/Choooca',
  /** TODO Paul : deposer le PDF dans public/cv.pdf. */
  cv: '/cv.pdf',
} as const;

/** Pages de la navigation principale, dans l'ordre d'affichage. */
export const NAVIGATION = [
  { cle: 'nav.accueil', chemin: '/' },
  { cle: 'nav.bibliotheque', chemin: '/bibliotheque' },
  // « Contact » fait defiler jusqu'au pied de page, il n'y a pas de page dediee.
  { cle: 'nav.contact', chemin: '#pied-de-page' },
] as const;
