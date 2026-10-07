# Audit et stratégie — 6 octobre 2026

## État initial

Le workspace contient uniquement `image/` et `.DS_Store`. Aucun HTML, CSS, JavaScript, package, configuration ou fichier AGENTS.md n’existe. Il n’y a donc pas de code existant à refactoriser. Les originaux sont conservés.

Inventaire initial : **124 fichiers**, dont **38 JPG, 85 HEIC et 1 MP4**, sans sous-dossier, environ 232 Mo. Les 123 photographies ont été inspectées sur planches contact après décodage des HEIC. Catégories : buggys, quads, coucher de soleil, paysages, bergerie, visiteurs, quelques jetskis hors périmètre. **Aucune photographie de villa et aucun logo local.** Le logo et les véritables photos des villas sont récupérés sur le site officiel ; aucune photographie générique n’est utilisée.

## Référence UX

[Mallorquad](https://mallorquad.com/fr/) a été observé dans Chrome à 1440 et 390 pixels. On retient le hero proche du plein écran, les grands visuels, la typographie marquée, l’alternance entre expérience et informations pratiques, puis galerie, avis et contact. Aucun code ni texte n’est copié. Corsica Ranger conserve son logo officiel et une direction liée à la lumière corse, au maquis et à la pierre : sable, vert sombre et accent terre cuite.

## Architecture

Site statique sans framework ni dépendance navigateur. Node génère de véritables pages HTML françaises, anglaises et italiennes depuis des gabarits communs et trois dictionnaires. Les contenus sont consultables sans JavaScript et disposent d’URL distinctes, de canonical et de hreflang. Les ressources sont hébergées localement, les images responsives en WebP. JavaScript réservé au menu, à la galerie accessible, au chargement volontaire de la carte et aux apparitions discrètes.

Pages : accueil, buggy, quad, maisons, histoire, galerie, contact/réservation, mentions légales, confidentialité. Pas de paiement, calendrier ou formulaire de réservation. Tous les CTA commerciaux conduisent au contact, à `tel:` ou à `mailto:`.

## Sources commerciales

- [Accueil](https://corsicaranger.com/) : localisation, activités, capacité 2–5 places, ouverture annuelle.
- [Buggy](https://corsicaranger.com/location-ranger) : trois formules, prix selon occupants, caution 800 €, permis et conditions.
- [Quad](https://corsicaranger.com/location-quad) : 150 € demi-journée et 230 € journée pour deux personnes, équipement, carburant, horaires et conditions.
- [Villas](https://corsicaranger.com/nos-partenaires) : Lavezzi cinq personnes avec piscine privée et spa ; Cavallo huit personnes, trois chambres et piscine privée. Nombre de chambres Lavezzi inconnu, aucun tarif villa publié.
- [Histoire](https://corsicaranger.com/historique) : Marlène et Jean, première villa en 2006. Activité depuis 2008 indiquée sur la page buggy.
- [Contact](https://corsicaranger.com/contact) et [mentions](https://corsicaranger.com/mentions-legales).

### Divergences à préserver et signaler

Le contrat quad indique à la fois 700 € et 1 950 € de caution. Les pages commerciales sont la source demandée : affichage 700 €, avec une réponse FAQ qui conseille de confirmer le montant. L’ancienneté est « plus de 3 ans » sur les pages et « au moins 3 ans » dans les CG : formulation commerciale conservée. Les clauses contradictoires de retard ne sont pas réécrites. Documents officiels accessibles par liens.

Sortie du soir : aucun départ fixe affiché, conformément au brief. La dégustation est indiquée séparément à 10 €/personne hors boissons, sans prétendre qu’elle est incluse.

Avis : aucune moyenne ni étoile inventée. Un seul court extrait authentique de Marion M., daté du 23 septembre 2024, est repris avec la provenance « avis Google relayé sur Petit Futé », lien source et CTA vers Google. Traduction identifiée dans les langues étrangères.

Hébergement : les mentions actuelles nomment Bulle Communication. Le site explique qu’il s’agit de l’hébergement existant ; l’identité du nouvel hébergeur doit être actualisée si le lancement change de prestataire.
