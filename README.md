# Le Safe Lounge

Refonte responsive centrée sur les photographies et la carte réelle du restaurant. Vite, TypeScript, CSS et GSAP / ScrollTrigger.

```sh
npm install
npm run dev
```

- `npm run build` : vérification TypeScript et production du site statique dans `dist/`.
- `npm run preview` : aperçu du build.
- `npm test` : dix-huit tests de parcours dans Chrome via Playwright.
- `npm run deploy` : reconstruit le site et remplace la branche `gh-pages`.

Le site est publié sur https://seifharboub.github.io/safe-lounge/ (GitHub Pages, branche `gh-pages`).
Les sources restent sur `main`, la branche `gh-pages` ne contient que le site construit.

Les chemins d’assets construits à l’exécution — photos de la carte, plats de l’accueil, desserts,
vidéos — passent par `asset()` dans `src/asset.ts`, qui applique `import.meta.env.BASE_URL`.
Vite ne réécrit que les chemins présents dans le HTML et le CSS : sans ce détour, tout ce qui est
construit en JavaScript tomberait en 404 sous un sous-dossier. `BASE_PATH` fixe cette base au build.

## Contenu et sources

La carte a été relevée le 18 septembre 2026 sur les dix pages du site officiel :

- https://lesafelounge.com/salades
- https://lesafelounge.com/pates
- https://lesafelounge.com/pizzas
- https://lesafelounge.com/burgers
- https://lesafelounge.com/desserts
- https://lesafelounge.com/crepes
- https://lesafelounge.com/milkshakes
- https://lesafelounge.com/mocktails
- https://lesafelounge.com/boissons
- https://lesafelounge.com/hookah

Les boutons Dinner et Lounge du site d’origine utilisent des liens JavaScript Divi. Les sous-pages contiennent bien la carte complète.

Les 56 entrées de carte, ingrédients, prix et suppléments sont conservés dans `src/menu.json`. La ligne des boissons fraîches regroupe les neuf boissons à 5 €, comme sur le site source. Les 55 photos sont téléchargées depuis ce même site et conservées sans retouche dans `public/assets/menu/`. Aucune photographie externe ni image générée n’est utilisée. Les recadrages et rotations sont uniquement des effets d’affichage CSS.

`research/original-menu.json` archive les textes, modules HTML et URLs des photos consultés. `python3 scripts/import-menu.py` reconstruit la carte depuis cette archive ; il ne synchronise pas automatiquement les futures mises à jour du site.

Les logos SVG, les polices locales Fraunces, Satoshi et Oswald et les couleurs viennent du dossier BRANDING-SAFE-LOUNGE fourni. Palette : `#150B19`, `#E6E4D8`, `#224233`, `#AF8DBF`, `#81A092`. Licences des polices dans `public/assets/licenses/`.

Les coordonnées et l’année 2017 proviennent du brandboard / brandbook du client. Les liens de contact ouvrent le téléphone ou le mail ; aucune réservation n’est enregistrée. Le lien Maps recherche l’établissement sans inventer une adresse.

## Interactions

Accueil à trois plats avec transitions, photographies animées au défilement, ruban animé, catégories, recherche transversale insensible aux accents, fiches détaillées avec prix et suppléments, navigation et raccourcis mobiles.

Les liens internes sont traités dans `src/main.ts` plutôt que par le saut d’ancre natif : un rafraîchissement de ScrollTrigger annule le défilement doux du navigateur, et un lien de catégorie doit d’abord laisser la carte se redessiner. Chaque lien amène donc sa section exactement en haut de l’écran, sans laisser apparaître la fin de la section précédente. La section de contact occupe au moins une hauteur d’écran pour que la dernière ancre puisse elle aussi se caler en haut.

L’accueil et la section desserts changent de plat tout seuls. La barre de progression *est* le minuteur : c’est une animation CSS, donc la mettre en pause — hors écran, derrière un dialogue, sur le bouton d’animations ou sous une préférence de mouvement réduit — arrête aussi la rotation, et les deux ne peuvent pas se désynchroniser. Un clic sur une pastille reprend la main immédiatement.

Sur téléphone, les trois cartes « Le plus dur, c’est de choisir » forment un rail que l’on fait glisser : une seule photographie occupe la largeur, sans morceau de la suivante ni barre de défilement, et trois repères de position sont posés au-dessus. Il avance seul toutes les 3,2 s en va-et-vient, et rend la main définitivement dès que le visiteur fait défiler le rail lui-même.

La prise de contrôle n’écoute pas le toucher : poser le doigt sur une carte pour faire défiler la page verticalement est le geste le plus courant sur téléphone, et il ne doit rien arrêter. Le signal retenu est un défilement horizontal du rail que le script n’a pas déclenché — une fenêtre de 900 ms couvre son propre défilement doux, tout ce qui arrive en dehors vient du visiteur.

Le ruban est dupliqué par script jusqu’à dépasser la largeur de la fenêtre d’un groupe complet : la boucle ne laisse donc aucun trou, à n’importe quelle largeur. Sa durée est calculée pour une vitesse constante de 88 px par seconde. Le motif alterne une accroche et le nom de la maison : GOOD MOOD · LE SAFE LOUNGE · GOOD FOOD · LE SAFE LOUNGE · GOOD VIBES · LE SAFE LOUNGE.

Les animations respectent la préférence système de réduction des mouvements et peuvent être mises en pause dans le pied de page. La préférence est mémorisée localement. Navigation clavier dans les catégories, dialogues natifs accessibles, retour du focus et touche Échap.

## Mobile

L’aperçu vidéo de l’accueil devient une barre compacte sur téléphone — vignette, titre, bouton de
lecture sur une seule ligne — au lieu d’une carte verticale qui mangeait le haut de page ; sur desktop
la colonne qui l’accueille suit la largeur du navigateur au lieu d’un 295 px figé. Le menu mobile se
ferme aussi bien au doigt posé à côté que sur la croix.

Les flèches `↗ ▶ ↓ ↑` portent toutes le sélecteur U+FE0E. Sans lui, iOS bascule sur la police
d’emoji couleur partout où la police en place n’a pas le glyphe — le menu mobile est en Fraunces,
qui n’en a pas, et les flèches devenaient des carrés bleus. Un test le vérifie sur le DOM rendu,
y compris le balisage écrit par le script.

Le téléphone est la cible principale. Aucun texte ne descend sous 9 px en dessous de 1024 px, aucun lien ni bouton n’offre moins de 36 px à toucher — les liens de texte gardent leur taille, c’est un pseudo-élément qui élargit la zone tactile —, et rien ne déborde à 360, 390 ni 430 px. Trois tests couvrent ces trois règles.

Les dix catégories de la carte s’affichent en pastilles qui reviennent à la ligne : tout est visible d’un coup, rien n’est coupé et il n’y a pas de défilement horizontal. L’ordre d’affichage place la catégorie sélectionnée par défaut en tête (`DISPLAY_ORDER` dans `src/main.ts`) ; `src/menu.json` conserve l’ordre du site source.

## Maintenance

- Carte : `src/menu.json` ; archive et import disponibles pour vérifier les données.
- Contenus de page et contacts : `index.html`.
- Styles : `src/style.css`.
- Interactions et animations : `src/main.ts`.
- Tests : `tests/site.spec.ts`.


## Médias du lieu et Instagram

Quatre vidéos originales et huit photographies / couvertures de publications du compte officiel `@lesafelounge` ont été téléchargées dans `public/assets/instagram/`. Elles sont servies localement, sans embed ni connexion Instagram. Les vidéos, leur son et leurs sous-titres incrustés sont conservés tels que publiés. Les sources exactes et légendes sont consignées dans `research/instagram/manifest.json`.

L’accueil utilise la photographie du salon en arrière-plan et un aperçu vidéo muet. Celui-ci ne charge qu’à l’approche du viewport, se met en pause hors écran ou lorsque l’onglet est masqué et respecte la réduction des mouvements ainsi que le mode économie de données. Son bouton permet de le lire ou de le mettre en pause. Les autres vidéos ne chargent qu’après ouverture explicite. Le lecteur plein format permet de contrôler le son ; fermer le lecteur arrête et décharge la vidéo.

La section « Votre prochaine bonne adresse » réunit le salon, la façade, l’adresse et les trois vidéos dans une seule grille rectangulaire aux bords alignés. Le panuozzo est montré comme contenu Instagram, sans ajout de prix ni modification de la carte existante. L’adresse vient des légendes des publications ; les horaires proviennent de la biographie du profil consultée le 18 septembre 2026.

La section lounge porte une fumée d’ambiance sur son fond sombre, jamais sur les photographies. C’est une texture `feTurbulence` figée, encodée en data-URI, que trois calques font dériver lentement : le filtre n’est calculé qu’une fois et seules les transformations sont animées, ce qui la garde fluide sur téléphone. Elle disparaît sous une préférence de mouvement réduit et se met en pause avec le bouton d’animations.

Les affiches des vidéos `en-cuisine` et `a-table` sont des images extraites des vidéos locales elles-mêmes (`ffmpeg -ss 32.6` et `-ss 11.1`), et non plus les couvertures Instagram : elles montrent le plat dressé et la table servie. Les sous-titres incrustés restent ceux de la vidéo ; le cadrage CSS de la tuile les laisse hors champ.

La section lounge met en avant les deux photographies de chicha du site officiel (`hookah1.jpg`, `hookah2.jpg`, les visuels des formules à 20 € et 25 €) ; elles ouvrent la fiche de leur formule. La photographie du salon lounge les accompagne. `public/assets/instagram/pizza.jpg` n’est plus affichée mais reste archivée avec les autres médias.

Code du lecteur : `src/media.ts`. Les tests couvrent également le décodage / la lecture, l’arrêt hors écran, la fermeture et le retour du focus.
