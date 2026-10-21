---
titre: 'Deferred & Forward Rendering'
section: 'scolaire'
genre: 'Moteur de rendu'
genre_en: 'Rendering engine'
pitch: 'À compléter : une phrase de présentation du projet.'
pitch_en: 'TODO: one-sentence pitch.'

# À vérifier : classement et pastilles (3 maximum sur une carte).
domaine: ['Graphique', 'Bas niveau']
moteur: 'Sans moteur'
langage: ['C++', 'HLSL']

# Projet solo : pas de champ `role` ni `contribution`.
equipe: 1

duree: 'À compléter'
plateforme: 'À compléter'
technos: ['C++', 'HLSL', 'À compléter']

# Les boutons absents de `liens` ne s'affichent pas sur la fiche.
liens: {}

medias:
  - type: 'image'
    src: '../../assets/projets/deferred-forward-rendering/01-placeholder.svg'
    legende: 'Placeholder — capture à remplacer.'
    legende_en: 'Placeholder — screenshot to replace.'
  - type: 'image'
    src: '../../assets/projets/deferred-forward-rendering/02-placeholder.svg'
    legende: 'Placeholder — capture à remplacer.'
  - type: 'image'
    src: '../../assets/projets/deferred-forward-rendering/03-placeholder.svg'
    legende: 'Placeholder — capture à remplacer.'

# apercu: '/videos/deferred-forward-rendering-apercu.mp4'  # à ajouter

featured: true
ordre: 1
---

## Contexte

À compléter par Paul. Ce paragraphe décrit le cadre du projet : objectif,
contrainte de départ, durée.

## Réalisations techniques

À compléter. Cette section porte le détail technique, avec images, vidéos et
blocs de code insérés directement dans le Markdown.

```cpp
// Placeholder : le bloc prend automatiquement le style de CodeBlock.astro.
void Renderer::RenderGBufferPass(const Scene& scene)
{
    for (const MeshInstance& instance : scene.OpaqueInstances())
    {
        m_context->BindMaterial(instance.Material());
        m_context->DrawIndexed(instance.IndexCount());
    }
}
```

## Résultat

À compléter.
