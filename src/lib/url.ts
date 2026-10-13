/**
 * Le site est publie sous un sous-chemin (`/Portfolio` sur GitHub Pages).
 * Tout lien interne doit passer par `href()` : ecrire `/bibliotheque` en dur
 * donnerait un lien casse en production.
 *
 *   <a href={href('/bibliotheque')}>   ->  /Portfolio/bibliotheque
 *   <a href={href('/')}>               ->  /Portfolio/
 */
const BASE = import.meta.env.BASE_URL;

export function href(path: string): string {
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

/**
 * URL absolue a partir d'un chemin SANS le prefixe (ex. '/favicon.svg').
 * Le `base` est ajoute au passage.
 */
export function absoluteUrl(path: string, site: URL | undefined): string {
  return new URL(href(path), site ?? 'http://localhost:4321').toString();
}

/**
 * URL absolue a partir d'un chemin qui porte DEJA le prefixe — typiquement
 * `Astro.url.pathname`. Ne pas utiliser `absoluteUrl()` ici : le `base`
 * serait applique une seconde fois (`/Portfolio/Portfolio/`).
 */
export function canonicalUrl(pathname: string, site: URL | undefined): string {
  return new URL(pathname, site ?? 'http://localhost:4321').toString();
}

/** `true` si `path` correspond a la page courante (lien actif de la nav). */
export function isCurrent(path: string, pathname: string): boolean {
  const target = href(path).replace(/\/$/, '');
  const current = pathname.replace(/\/$/, '');
  return target === current;
}
