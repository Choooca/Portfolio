import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/* ==========================================================================
   Listes fermees — reprises du modele de donnees de docs/passage-au-dev.md.
   Les libelles sont ceux de la maquette ; leur version en slug (pour l'URL
   des filtres) est calculee a l'affichage, pas stockee ici.
   ========================================================================== */

export const SECTIONS = ['pro', 'scolaire', 'perso'] as const;
export const DOMAINES = [
  'Gameplay',
  'Graphique',
  'Bas niveau',
  'Tech art',
  'Prototype',
] as const;
export const MOTEURS = ['Unity', 'Unreal', 'Godot', 'Sans moteur'] as const;

export type Section = (typeof SECTIONS)[number];
export type Domaine = (typeof DOMAINES)[number];
export type Moteur = (typeof MOTEURS)[number];

/* ==========================================================================
   Collection « projets » — un fichier .md par projet.

   Le slug de l'URL vient du nom du fichier, il n'est donc pas un champ du
   frontmatter. Le corps Markdown porte le texte de la page projet.

   Les fichiers `*.en.md` sont exclus : ils porteront la version anglaise du
   corps dans une session ulterieure. Les champs texte courts ont deja leur
   variante `_en` ci-dessous.
   ========================================================================== */

const projets = defineCollection({
  loader: glob({
    base: './src/content/projets',
    pattern: ['**/*.md', '!**/*.en.md'],
  }),
  schema: ({ image }) =>
    z
      .object({
        // --- Identite -----------------------------------------------------
        titre: z.string().min(1),
        section: z.enum(SECTIONS),
        genre: z.string().min(1),
        genre_en: z.string().optional(),
        pitch: z.string().min(1),
        pitch_en: z.string().optional(),

        // --- Classement et filtres (3 pastilles max sur une carte) --------
        domaine: z.array(z.enum(DOMAINES)).min(1),
        moteur: z.enum(MOTEURS).optional(),
        // Liste ouverte : C#, C++, Blueprint, HLSL, GLSL, Python…
        langage: z.array(z.string().min(1)).default([]),

        // --- Equipe -------------------------------------------------------
        // 1 = solo. Au-dela, `role` et `contribution` deviennent obligatoires
        // et la page affiche la ligne « Role » et l'encadre « Mon role ».
        equipe: z.number().int().min(1),
        role: z.string().optional(),
        role_en: z.string().optional(),
        contribution: z.string().optional(),
        contribution_en: z.string().optional(),

        // --- Fiche projet -------------------------------------------------
        duree: z.string().optional(),
        plateforme: z.string().optional(),
        technos: z.array(z.string().min(1)).min(1),
        liens: z
          .object({
            jouer: z.url().optional(),
            github: z.url().optional(),
            video: z.url().optional(),
          })
          .default({}),

        // --- Medias -------------------------------------------------------
        // Liste ordonnee ; le premier media sert de vignette de carte.
        // Les images passent par astro:assets (WebP/AVIF generes) ;
        // les videos sont des fichiers de public/, non transformes.
        medias: z
          .array(
            z.discriminatedUnion('type', [
              z.object({
                type: z.literal('image'),
                src: image(),
                legende: z.string().min(1),
                legende_en: z.string().optional(),
              }),
              z.object({
                type: z.literal('video'),
                // Chemin depuis public/, ex. '/videos/diamond-seams.mp4'
                src: z.string().min(1),
                // Image affichee avant le clic sur lecture.
                poster: image().optional(),
                legende: z.string().min(1),
                legende_en: z.string().optional(),
              }),
            ]),
          )
          .min(1),

        // Video de 5-10 s, muette, jouee au survol de la carte (desktop).
        apercu: z.string().optional(),

        // --- Projets lies -------------------------------------------------
        // Choix manuel : les slugs (= noms de fichiers) des projets montres
        // dans la colonne de droite, dans cet ordre. Zod ne voit qu'un
        // document a la fois : l'existence de chaque slug est verifiee au
        // build par src/pages/projets/[slug].astro.
        lies: z.array(z.string().min(1)).default([]),

        // --- Mise en avant et tri ----------------------------------------
        featured: z.boolean().default(false),
        ordre: z.number().int().optional(),
      })
      .superRefine((projet, ctx) => {
        // « Mon role » n'a de sens qu'en equipe : on rend les deux champs
        // obligatoires des que `equipe > 1`, et on signale l'incoherence
        // inverse pour eviter du contenu mort.
        if (projet.equipe > 1) {
          if (!projet.role) {
            ctx.addIssue({
              code: 'custom',
              path: ['role'],
              message:
                'Obligatoire quand `equipe` est superieur a 1 : la page affiche la ligne « Role ».',
            });
          }
          if (!projet.contribution) {
            ctx.addIssue({
              code: 'custom',
              path: ['contribution'],
              message:
                'Obligatoire quand `equipe` est superieur a 1 : la page affiche l\'encadre « Mon role ».',
            });
          }
        } else {
          if (projet.role) {
            ctx.addIssue({
              code: 'custom',
              path: ['role'],
              message:
                'Un projet solo (`equipe: 1`) n\'affiche pas de role : retirer ce champ ou corriger `equipe`.',
            });
          }
          if (projet.contribution) {
            ctx.addIssue({
              code: 'custom',
              path: ['contribution'],
              message:
                'Un projet solo (`equipe: 1`) n\'affiche pas « Mon role » : retirer ce champ ou corriger `equipe`.',
            });
          }
        }
      }),
});

export const collections = { projets };
