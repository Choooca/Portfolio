import fr from './fr';
import en from './en';

export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';

export type TranslationKey = keyof typeof fr;

const dictionaries = { fr, en } as const;

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Retourne le texte d'interface pour `key`, avec repli sur le francais si la
 * traduction manque. `vars` remplace les marqueurs `{nom}` du texte.
 *
 *   t('bib.compteur', 'fr', { n: 12, total: 24 })  ->  '12 projets sur 24'
 */
export function t(
  key: TranslationKey,
  locale: Locale = DEFAULT_LOCALE,
  vars?: Record<string, string | number>,
): string {
  const text = dictionaries[locale][key] ?? fr[key];
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** Lie `t()` a une langue, pour eviter de la repeter dans un composant. */
export function useTranslations(locale: Locale = DEFAULT_LOCALE) {
  return (key: TranslationKey, vars?: Record<string, string | number>) =>
    t(key, locale, vars);
}

/**
 * Choisit entre un champ francais et son equivalent anglais `_en`,
 * avec repli sur le francais si l'anglais est absent.
 */
export function pick<T>(fr_: T, en_: T | undefined, locale: Locale): T {
  return locale === 'en' && en_ !== undefined && en_ !== null ? en_ : fr_;
}
