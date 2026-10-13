/**
 * Valeurs de filtre ecrites dans l'URL (`?moteur=unity&langage=csharp`).
 *
 * Une slugification naive casserait les langages a symboles : « C# » et
 * « C++ » donneraient tous les deux « c ». D'ou la table d'exceptions.
 */
const EXCEPTIONS: Record<string, string> = {
  'c#': 'csharp',
  'c++': 'cpp',
  'f#': 'fsharp',
  'objective-c': 'objective-c',
  '.net': 'dotnet',
};

export function slugifyFiltre(libelle: string): string {
  const cle = libelle.trim().toLowerCase();
  if (cle in EXCEPTIONS) return EXCEPTIONS[cle]!;

  return cle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/\+/g, 'p') // C++ -> cpp (filet de securite)
    .replace(/#/g, 'sharp')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
