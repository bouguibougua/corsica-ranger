# Effets et interactions

Le rythme visuel s’inspire du site [Mallorquad](https://mallorquad.com/fr/) consulté le 6 octobre 2026 : grands titres contour/plein, panneaux arrondis, photos immersives, apparition décalée des blocs et mouvement des images au défilement. Les photos, le logo et les contenus restent ceux de Corsica Ranger.

`src/effects.css` complète la feuille principale. `src/motion.js` prépare les lignes des titres, le décalage des blocs, la profondeur des photos, les variations d’image au survol des liens buggy/quad de l’accueil et une courte transition entre pages. `src/client.js` conserve les interactions natives du menu, des accordéons et de la galerie, et pilote les flèches du carrousel d’avis.

Les mouvements des photos utilisent `requestAnimationFrame` et des transformations CSS ; seuls les éléments proches de l’écran sont suivis. Il n’y a pas de défilement forcé. Les titres se révèlent en environ 1,6 seconde et les changements de page attendent 320 ms. La navigation téléphone/e-mail, les liens externes, les ancres et les ouvertures dans un nouvel onglet conservent leur fonctionnement normal.

La préférence système `prefers-reduced-motion` désactive les déplacements, les bandeaux animés et les transitions, y compris si elle change en cours de visite. Un élément atteint au clavier se révèle immédiatement. Les contenus restent visibles sans JavaScript, et les masques de révélation ne s’activent qu’après l’installation de l’observateur du script principal.

Selon la demande du propriétaire du 7 octobre 2026, le bouton de pause a été retiré, ainsi que sa préférence de session. Le site ne conserve aucune préférence d’animation dans le navigateur. Le carrousel d’avis ne défile pas automatiquement : il utilise les flèches, le geste tactile ou les liens atteints au clavier.
