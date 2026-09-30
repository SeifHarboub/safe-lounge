# Le Safe Lounge

Refonte responsive centrée sur les photographies et la carte réelle du restaurant. Vite, TypeScript, CSS et GSAP / ScrollTrigger.

```sh
npm install
npm run dev
```

- `npm run build` : vérification TypeScript et production du site statique dans `dist/`.
- `npm run preview` : aperçu du build.
- `npm test` : tests de parcours dans Chrome via Playwright.
- `npm run deploy` : reconstruit le site et remplace la branche `gh-pages`.

Le site est publié sur https://lesafelounge.com/ (GitHub Pages, branche `gh-pages`, domaine chez IONOS). Le fichier `CNAME` est écrit par `scripts/deploy.sh` ; les anciennes pages WordPress (`/burgers`, `/pizzas`, `/hookah`…) redirigent vers leur section depuis `public/<page>/index.html`.
Les sources restent sur `main`, la branche `gh-pages` ne contient que le site construit.

Les chemins d’assets construits à l’exécution — photos de la carte, plats de l’accueil, desserts —
passent par `asset()` dans `src/asset.ts`, qui applique `import.meta.env.BASE_URL`.
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

Les 56 entrées de carte, ingrédients, prix et suppléments sont conservés dans `src/menu.json`. La ligne des boissons fraîches regroupe les neuf boissons à 5 €, comme sur le site source. Les 55 photos de cette ancienne carte (`public/assets/menu/`) ont été retirées du site avec les sections « Premiers aperçus » et desserts qu’elles illustraient ; elles restent dans l’historique git. La carte actuelle utilise `public/assets/menu-v2/`.

`research/original-menu.json` archive les textes, modules HTML et URLs des photos consultés. `python3 scripts/import-menu.py` reconstruit la carte depuis cette archive ; il ne synchronise pas automatiquement les futures mises à jour du site.

Les logos SVG, les polices locales Fraunces, Satoshi et Oswald et les couleurs viennent du dossier BRANDING-SAFE-LOUNGE fourni. Palette : `#150B19`, `#E6E4D8`, `#224233`, `#AF8DBF`, `#81A092`. Licences des polices dans `public/assets/licenses/`.

Les coordonnées et l’année 2017 proviennent du brandboard / brandbook du client. Les liens de contact ouvrent le téléphone ou le mail ; aucune réservation n’est enregistrée. Le lien Maps recherche l’établissement sans inventer une adresse.

## Interactions

Accueil en plein cadre (neuf plats, un par envie), photographies animées au défilement, ruban animé, catégories, recherche transversale insensible aux accents, fiches détaillées avec prix et suppléments, navigation et raccourcis mobiles.

Les liens internes sont traités dans `src/main.ts` plutôt que par le saut d’ancre natif : un rafraîchissement de ScrollTrigger annule le défilement doux du navigateur, et un lien de catégorie doit d’abord laisser la carte se redessiner. Chaque lien amène donc sa section exactement en haut de l’écran, sans laisser apparaître la fin de la section précédente. La section de contact occupe au moins une hauteur d’écran pour que la dernière ancre puisse elle aussi se caler en haut.

Les plats de l’accueil changent toutes les 5 s sur un minuteur CSS invisible (`.hero-timer`), soumis aux mêmes pauses ; aucune barre de progression, un glissement du doigt passe au suivant sur téléphone. La section desserts change de plat toute seule. Sa barre de progression *est* le minuteur : c’est une animation CSS, donc la mettre en pause — hors écran, derrière un dialogue, ou sous une préférence de mouvement réduit — arrête aussi la rotation, et les deux ne peuvent pas se désynchroniser. Un clic sur une pastille reprend la main immédiatement.

Sur téléphone, les trois cartes « Le plus dur, c’est de choisir » forment un rail que l’on fait glisser : une seule photographie occupe la largeur, sans morceau de la suivante ni barre de défilement, et trois repères de position sont posés au-dessus. Il avance seul toutes les 3,2 s en va-et-vient, et rend la main définitivement dès que le visiteur fait défiler le rail lui-même.

La prise de contrôle n’écoute pas le toucher : poser le doigt sur une carte pour faire défiler la page verticalement est le geste le plus courant sur téléphone, et il ne doit rien arrêter. Le signal retenu est un défilement horizontal du rail que le script n’a pas déclenché — une fenêtre de 900 ms couvre son propre défilement doux, tout ce qui arrive en dehors vient du visiteur.

Le ruban est dupliqué par script jusqu’à dépasser la largeur de la fenêtre d’un groupe complet : la boucle ne laisse donc aucun trou, à n’importe quelle largeur. Sa durée est calculée pour une vitesse constante de 88 px par seconde. Le motif alterne une accroche et le nom de la maison : GOOD MOOD · LE SAFE LOUNGE · GOOD FOOD · LE SAFE LOUNGE · GOOD VIBES · LE SAFE LOUNGE.

Les animations suivent la préférence système de réduction des mouvements : le pied de page n’a plus de bouton pour les couper. Navigation clavier dans les catégories, dialogues natifs accessibles, retour du focus et touche Échap.

## Mobile

Sur téléphone, le plat de l’accueil occupe la moitié basse de l’écran sous le texte, avec son nom et son
prix ; les boutons de l’accueil sont masqués pour ne pas le recouvrir. Le menu
mobile se ferme aussi bien au doigt posé à côté que sur la croix.

Les flèches `↗ ▶ ↓ ↑` portent toutes le sélecteur U+FE0E. Sans lui, iOS bascule sur la police
d’emoji couleur partout où la police en place n’a pas le glyphe — le menu mobile est en Fraunces,
qui n’en a pas, et les flèches devenaient des carrés bleus. Un test le vérifie sur le DOM rendu,
y compris le balisage écrit par le script.

Le téléphone est la cible principale. Aucun texte ne descend sous 9 px en dessous de 1024 px, aucun lien ni bouton n’offre moins de 36 px à toucher — les liens de texte gardent leur taille, c’est un pseudo-élément qui élargit la zone tactile —, et rien ne déborde à 360, 390 ni 430 px. Trois tests couvrent ces trois règles.

Les onze catégories de la carte s’affichent en pastilles qui reviennent à la ligne : tout est visible d’un coup, rien n’est coupé et il n’y a pas de défilement horizontal. L’ordre d’affichage suit un repas : salades, plats, desserts et crêpes, puis boissons fraîches, signatures et boissons chaudes (`DISPLAY_ORDER` dans `src/main.ts`) ; les burgers restent ouverts par défaut ; `src/menu.json` conserve l’ordre du site source.

## Maintenance

- Carte : `src/menu.json` ; archive et import disponibles pour vérifier les données.
- Contenus de page et contacts : `index.html`.
- Styles : `src/style.css`.
- Interactions et animations : `src/main.ts`.
- Tests : `tests/site.spec.ts`.


## Photos du lieu

Les photographies du salon et de la façade viennent du compte officiel `@lesafelounge` (sources dans `research/instagram/manifest.json`). Elles sont servies en WebP dans `public/assets/instagram/` : le salon en arrière-plan de l’accueil, la façade derrière le contact. Les vidéos Instagram et la section « Votre prochaine bonne adresse » ont été retirées ; elles restent dans l’historique git.

## Accueil en plein cadre

L’accueil affiche en plein cadre neuf plats de la carte, un par envie (burger, pizza, panuozzo, pâtes, salade, tiramisu, milkshake, iced latte, mocktail), avec leur nom et leur prix. Les photos de `public/assets/menu-v2/` partagent le fond vert de l’accueil et s’y fondent ; les boissons, plus hautes, sont montrées en entier et plus petites. Sur téléphone, le texte est en haut, le plat occupe la moitié basse et les boutons de l’accueil sont masqués. `hero-lab/` garde les maquettes locales qui ont servi au choix (non publiées).

## Lounge

La section lounge présente les chichas servies (Alpha, Brodator, Mig tradi) et leur chauffe Quasar. Les visuels montrent un hookah en bois ; les textes disent « chicha » (le mot le plus recherché) et jamais « Wookah » ni « hookah ». Les trois visuels de `public/assets/lounge/` sont générés à partir des photos d’origine du lounge (`research/lounge-originals/`), en gardant le même modèle ; seuls le décor, la lumière et la fumée changent. Les formules à 20 € et 25 € sont affichées sans fiche : la nouvelle carte ne les contient pas encore.

La fumée du fond est photographique : deux plaques de fumée sur fond noir, générées puis converties en calques transparents aux bords fondus (`smoke-tall.webp`, `smoke-wide.webp`). Cinq calques montent ou dérivent en boucle, décalés dans le temps pour qu’une volute soit toujours visible ; sans animation, ils restent affichés, immobiles et plus discrets.

## Infos pratiques

La dernière section réunit l’adresse (liens Google Maps, Waze et Plans), les horaires, le téléphone, l’e-mail et une carte Google intégrée, assombrie en CSS pour suivre la palette. Un badge indique « Ouvert maintenant » ou « Fermé » à l’heure de Paris et la ligne d’horaires du jour est mise en avant ; une nuit après minuit compte pour le jour où le service a commencé (`CLOSING_HOUR` dans `src/main.ts`). Le menu du haut y mène par « Infos & accès », et son bouton appelle directement le restaurant.

Sur téléphone, les catégories de la carte forment une seule barre d’onglets que l’on fait glisser, collée en haut de l’écran pendant la lecture ; choisir un onglet le centre et ramène le début de la liste juste sous la barre. La fumée du lounge couvre toute la section et monte du bas vers le haut, et la première ligne de l’accueil tient sur une seule ligne.

Tailles de texte : sur ordinateur, plus aucun texte courant sous 11 px et les paragraphes passent entre 15 et 17 px ; les tailles tablette et téléphone sont regroupées en fin de feuille de style.

## Référencement

- Titre, description, URL canonique, Open Graph et Twitter Card dans `index.html` ; `SITE_URL` fixe l’adresse publique au build (GitHub Pages par défaut).
- `vite.config.ts` injecte les données Schema.org `Restaurant` : adresse, téléphone, horaires et la carte complète, construite depuis `src/menu.json`.
- `public/robots.txt` et `public/sitemap.xml` ; `public/assets/og-image.jpg` pour les partages.
- Les photos de la carte sont servies en WebP 1080 px (les PNG d’origine sont dans `research/menu-v2-originals/`).
- Chaque titre de section commence par une ligne de mots-clés (« La carte · cuisine généreuse, comme à la maison, à Noisy-le-Sec », « Lounge chicha à Noisy-le-Sec », « Adresse, horaires & accès ») ; la grande phrase d’accroche reste en dessous.
- Les données Schema.org portent les coordonnées GPS (OpenStreetMap), le lien Google Maps et l’e-mail `lesafelounge@gmail.com`.
