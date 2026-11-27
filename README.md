# PIXEL RESISTANCE

Jeu rétro 8/16 bits, bilingue français / anglais, réalisé pour la Nuit de l'Info 2025 : défi **« On veut du gros pixel ! »** (IUT du Littoral Côte d'Opale, département Informatique), sur le sujet national *« Le Village Numérique Résistant : comment les établissements scolaires peuvent tenir tête aux Big Tech ? »*.

On y aide un village à reprendre son indépendance numérique : missions à choix, fiches sur les menaces, atelier de solutions, progression et écran de victoire avec des recommandations personnalisées.

Projet compagnon : [NIRD WORLD](https://nird-world.vercel.app), un village à explorer avec un diagnostic d'indépendance numérique de l'école et une bibliothèque de logiciels libres.

## Écrans

| Écran | Route | Contenu |
| --- | --- | --- |
| Menu principal | `/` | Logo animé, histoire, Nouvelle partie / Continuer, Comment jouer, La Résistance, langue, son |
| Village | `/village` | Carte en tuiles jouable au clavier (flèches, ZQSD, WASD) ou à la croix tactile, 7 lieux à débloquer, 4 habitants |
| Missions | `/missions` | 5 missions narratives, déblocage progressif, étoiles et meilleur score |
| Fiches ennemies | `/ennemis` | 6 menaces : description, exemple, conséquences, parades, nuance |
| Atelier | `/atelier` | 7 modules de solutions, chacun avec une question de contrôle |
| QG | `/qg` | Statistiques, succès, remise à zéro |
| Victoire | `/victoire` | Score final, bilan par axe, recommandations selon les choix du joueur |

**Règles de progression.** L'XP et les pièces sont *calculées* à partir de ce que le joueur a accompli (meilleur score par mission, fiches lues, modules maîtrisés, lieux et habitants découverts). Rejouer une mission ne rapporte que la différence quand on bat son record : impossible de « farmer ». Les indices du mentor coûtent 5 pièces et réduisent donc le score final. La sauvegarde (LocalStorage) est vérifiée au chargement : une sauvegarde corrompue ou modifiée est réparée, jamais crue sur parole.

## Code

React 19, TypeScript, Vite, Tailwind CSS 4, Motion (Framer Motion), React Router, Zustand, i18next, Lucide.

```
src/
  main.tsx            point d'entrée et routes
  index.css           Tailwind et jetons de couleurs / polices
  game/content.ts     structure du jeu (missions, bonnes réponses, lieux, succès) — aucun texte
  game/progress.ts    règles pures : XP, pièces, niveaux, déblocages, succès, recommandations, sanitizer
  game/store.ts       état Zustand persistant
  game/sound.ts       effets chiptune générés avec Web Audio (aucun fichier audio)
  game/game.test.ts   tests : parité FR/EN, anti-farm, sauvegardes corrompues…
  locales/fr.ts       tous les textes en français (langue par défaut)
  locales/en.ts       traduction anglaise, typée sur fr.ts (une clé manquante ne compile pas)
  i18n.ts             instance i18next
  sprites.tsx         pixel art original dessiné en grilles de caractères, rendu en SVG
  ui.tsx              PixelButton, PixelCard, PixelDialog, PixelModal, PixelBadge, PixelProgressBar, PixelTooltip, LanguageSwitcher…
  PixelLayout.tsx     coquille du jeu : HUD, navigation, notifications de succès
  pixel.css           système de design pixel (bordures crantées, boutons, carte, animations)
  pages/              un fichier par écran
```

## Commandes

Prérequis : Node.js 22 ou plus récent.

```powershell
npm install
```

```powershell
npm run dev
```

Puis ouvrir http://localhost:5173.

```powershell
npm run typecheck
```

```powershell
npm test
```

```powershell
npm run build
```

```powershell
npm run preview
```

La production est servie depuis `dist/` (configuration Vercel dans `vercel.json`).

## Accessibilité

Navigation complète au clavier (menu aux flèches, carte au clavier, réponses avec A/B/C/D), fenêtres modales natives `<dialog>`, lien d'évitement, textes de dialogue lisibles par les lecteurs d'écran, respect de `prefers-reduced-motion` (animations, confettis et effet machine à écrire désactivés), attribut `lang` mis à jour selon la langue choisie.

## Licences et crédits

- Code : licence [MIT](LICENSE).
- Pixel art (personnages, bâtiments, ennemis, pièces, icône) : original, dessiné en code dans `sprites.tsx`, sous la même licence MIT.
- Sons : générés à la volée par l'API Web Audio, aucun fichier audio tiers.
- Polices : [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) (CodeMan38), [VT323](https://fonts.google.com/specimen/VT323) (Peter Hull) et [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans), sous SIL Open Font License 1.1, chargées depuis Google Fonts.
- Icônes : [Lucide](https://lucide.dev) (licence ISC).
- Aucun personnage, logo ou sprite issu d'un jeu commercial n'est utilisé.

Les noms de logiciels et de services cités (Windows, LibreOffice, Moodle, Nextcloud…) appartiennent à leurs détenteurs respectifs et ne servent qu'à illustrer des situations réelles.
