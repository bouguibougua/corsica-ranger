# Validation — 7 octobre 2026

## Correctif GitHub Pages

Le dépôt public servait le README via Jekyll au lieu du site construit. Le workflow `.github/workflows/deploy-pages.yml` construit et vérifie le site avant de publier `dist/`. Les URL de navigation, images, variantes responsives, scènes animées, polices et métadonnées suivent maintenant le chemin public fourni par GitHub Pages.

Deux constructions isolées passent `npm run build` et `npm run check` : à la racine de `https://corsicaranger.com/` et sous `https://bouguibougua.github.io/corsica-ranger/`. **30 routes et 223 ressources** sont contrôlées dans chaque cas, avec les URL canoniques, hreflang, JSON-LD, sitemap, ancres et tarifs. La ressource supplémentaire comptée est la seconde police locale, désormais explicitement vérifiée. Le build local `dist/` reste configuré pour le domaine principal.

Une vérification de régression à la racine confirme six visites FR/EN/IT à 1440 et 390 px : polices, hero, absence de débordement et d’erreur réseau/JavaScript.

Sous `/corsica-ranger/`, Chrome/Playwright a réalisé **505 contrôles**, avec 14 visites initialisées et 63 requêtes de document. Les trois langues, les menus, la navigation, les ancres, les scènes du hero, la galerie, les filtres, la lightbox, le retour navigateur, le mouvement réduit et la consultation sans JavaScript sont vérifiés à 1440 et 390 px. **Aucun échec non résolu ni erreur applicative ou requête applicative hors préfixe.** Deux écarts du harnais ont été remplacés par des contrôles ciblés réussis ; les recherches automatiques de `/favicon.ico` du visualiseur d’image natif Chrome restent consignées séparément. Rapport : `/private/tmp/corsica-pages-check/project/verified-report.json`.

Les versions et inputs des actions ont été vérifiés auprès de leurs sources officielles ; le YAML est valide. Aucun déploiement distant de ce correctif n’a été exécuté. La source Pages doit être réglée sur **GitHub Actions**, puis le workflow lancé après l’envoi des modifications : voir [la procédure](README.md).

## Mise à jour du propriétaire du 7 octobre

Construction et contrôle statique réussis : **30 routes et 222 ressources**. Les trois traductions portent les mêmes informations actualisées : matin/après-midi buggy de 1h30 au même tarif, coucher de soleil en troisième position, préparation quad de 30 minutes, demi-journée 140 € seul / 150 € à deux, conseils et réservations. Les deux créneaux quad sont séparés visuellement et dans le texte accessible.

Chrome/Playwright : **45 visites** sur Accueil, Buggy, Quad, À propos et Galerie, en FR/EN/IT, à **1440, 390 et 320 px**, puis **18 visites ciblées** de Quad et Galerie sur le build final. **1 439 contrôles réalisés, aucun échec non résolu ni erreur navigateur/réseau.** Treize assertions du premier passage utilisaient un ancien comptage des fichiers ou le texte quad antérieur au dernier build ; chacune possède un contrôle de remplacement réussi dans le rapport consolidé. Aucun débordement horizontal ni photo manquante. Filtres, lightbox, menu, langues, prix, conseils, mouvement réduit et carrousel vérifiés.

La galerie compte **61 photographies**, dont les 12 fichiers fournis, 13 photos supplémentaires des comptes officiels et les deux photos précises du site officiel. Les 93 nouveaux WebP ont été vérifiés : orientation, dimensions, absence d’agrandissement et suppression des métadonnées. Les 122 anciens WebP restent identiques. Les nouveaux recadrages de l’accueil, du quad et de la page À propos ont été examinés visuellement.

**25 audits axe et 15 contrôles clavier : aucune violation détectée.** Le contrôle ciblé final du bloc d’avis ne relève aucune violation ni vérification incomplète. Le mot-logo possède un nom accessible, le contraste décoratif des initiales a été renforcé et les flèches du carrousel gardent le focus aux bornes grâce à `aria-disabled`. Les fonds photographiques restent sujets à une revue manuelle ; ces résultats ne constituent pas une certification exhaustive WCAG.

Une vérification supplémentaire sans JavaScript confirme **6 contrôles réussis** : quatre cartes d’avis consultables, flèches masquées, navigation native vers Buggy/Galerie, 61 liens photo, ouverture d’une photo et retour vers Contact. Aucun chargement de ressource en erreur. Le bouton de pause et le stockage de sa préférence ont été retirés ; le réglage système de mouvement réduit reste respecté.

Les avis sont une sélection explicite de quatre extraits positifs, avec provenance et lien vers tous les avis Google. La note globale constatée est distincte de cette sélection. Aucun nombre d’avis ni aucune étoile individuelle non vérifiée n’est affiché. Sources et limites : `docs/reviews-sources.json`. Les contenus ne se synchronisent pas automatiquement.

Rapport consolidé : `/private/tmp/corsica-owner-update-check/verified-report.json`. Captures finales : `/private/tmp/corsica-owner-update-check/final-captures/`. Contrôles complémentaires : `/private/tmp/corsica-owner-visual/`.

## Historique de la validation initiale

Les contrôles ci-dessous concernent la première refonte du 6 octobre 2026, avant les ajustements de contenu et les nouvelles photographies.

## Construction et contenu

`npm run build` et `npm run check` passent. Le livrable comprend **27 pages dans trois langues**, trois pages 404 localisées et une page 404 de repli. Le contrôle statique vérifie **30 routes et 222 ressources** : liens et ancres, images et variantes, schéma des traductions, métadonnées, JSON-LD, H1 unique, numéros/e-mail et tableaux de tarifs officiels.

Les tarifs et conditions ont fait l’objet d’une revue séparée par comparaison avec `docs/sources.json`. Aucune marque de véhicule n’est ajoutée aux textes marketing. Aucun avis, équipement, tarif villa ou horaire général n’est inventé. Les différences entre documents quad restent signalées.

## Navigateur

Chrome avec Playwright : **135 visites**, soit les 27 pages à **1440, 1280, 768, 390 et 320 px**, et **1 506 contrôles réussis**. Aucun débordement horizontal, image manquante ou erreur console constaté. Les vérifications incluent la navigation réelle entre langues, le menu avec restauration du focus, les accordéons, les CTA téléphone/e-mail et la galerie avec filtres, flèches, clavier, tactile, fermeture et focus.

Après amélioration du hero mobile et de la lisibilité, un passage ciblé sur les 27 pages à 320 et 390 px a confirmé **54 visites et 651 contrôles réussis**, sans erreur. Les captures Accueil/Buggy/Quad ont été examinées visuellement : sujet recadré, source adaptée à la hauteur de l’image, boutons utilisables, contenu lisible.

## Accessibilité

**25 audits axe**, couvrant les neuf gabarits desktop/mobile ainsi que le menu, la langue, la FAQ et la lightbox ouverts : **aucune violation détectée**. **15 contrôles clavier** passent. Dialogues natifs, arrière-plan inerte, focus restitué, liens d’évitement, noms accessibles, textes alternatifs et mouvement réduit contrôlés.

Les contrastes sur photographies et arrière-plans superposés ne peuvent pas tous être calculés par axe : ils ont été revus visuellement. Un fond sombre translucide renforce également la lisibilité du header. Ces résultats ne constituent pas une certification exhaustive WCAG.

## Performance et fonctionnement

Images WebP responsives, dimensions explicites, chargement différé, priorité au hero, polices locales et JavaScript sans dépendance navigateur. Le hero 1600 px pèse environ 140 Ko. Les variantes de grande taille restent disponibles pour les recadrages mobiles et écrans à forte densité. Google Maps ne crée aucune requête avant activation volontaire. Aucun paiement, calendrier ou formulaire n’est présent.

## Reproduire

Voir les commandes dans `README.md`. Scripts supplémentaires : `scripts/browser-check.mjs`, `scripts/owner-update-check.mjs` et `scripts/accessibility-check.mjs`. Playwright et axe sont installés dans un dossier d’outils séparé et ne sont pas livrés au navigateur. Les rapports détaillés et les captures de cette session sont dans `/private/tmp/corsica-check/`.

## Avant publication

Le site est construit en local ; aucune mise en ligne externe n’a été effectuée. Vérifier l’identité de l’hébergeur réel avant publication si différent du prestataire figurant sur le site existant. Faire confirmer la caution quad en raison de la contradiction documentée dans le contrat officiel. Les autres informations inconnues ont été omises ou remplacées par une invitation à contacter Corsica Ranger.
