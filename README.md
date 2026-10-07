# Corsica Ranger

Refonte statique, responsive et multilingue du site de Corsica Ranger à Bonifacio. Français par défaut, anglais et italien. Les photos originales restent dans `image/`.

## Démarrer

Node.js 22 ou supérieur.

```sh
npm ci
npm run dev
```

Ouvrir **http://localhost:4173**. Le serveur reconstruit le site lorsque `src/` ou `public/` change ; actualiser le navigateur pour voir les modifications.

## Construire et vérifier

```sh
npm run build
npm run check
npm run preview
```

Le dossier **`dist/`** est le livrable à héberger. Il contient uniquement du HTML, du CSS, du JavaScript et des ressources statiques : aucun serveur Node n’est nécessaire en production. La seule dépendance de construction est Sharp. Aucun framework ni bibliothèque n’est chargé dans le navigateur.

Les photos WebP et polices locales sont déjà présentes. `npm run assets` permet de les régénérer sur macOS ; voir [scripts/ASSETS.md](scripts/ASSETS.md). Cette étape n’est pas nécessaire pour construire ou héberger le site.

## Modifier

- `src/content/fr.mjs`, `en.mjs`, `it.mjs` : textes et traductions, mêmes clés dans les trois fichiers.
- `src/render.mjs` : gabarits communs, sections et pages.
- `src/routes.mjs` : URL par langue.
- `src/styles.css` : direction graphique et adaptations d’écran.
- `src/effects.css`, `src/motion.js` : effets de défilement, titres, photos et transitions, avec respect du mouvement réduit.
- `src/client.js` : menu, galerie, lightbox et améliorations progressives.
- `src/reviews.mjs` : sélection d’extraits d’avis vérifiés et note Google constatée ; sources dans `docs/reviews-sources.json`.
- `scripts/photo-sources.mjs` : sélection des images, catégories et textes alternatifs.
- `docs/AUDIT.md`, `docs/IMAGES.md`, `docs/sources.json` : audit, inventaire et provenance des informations.

## Mise en ligne

La valeur canonical par défaut est `https://corsicaranger.com`. Pour une autre URL publique, reconstruire avec :

```sh
SITE_URL=https://exemple.fr npm run build
```

Copier **le contenu de `dist/`**, y compris `.htaccess` si le serveur est Apache, à la racine web. Les ressources et les liens utilisent des chemins depuis la racine : l’hébergement dans un sous-dossier n’est pas prévu. Les fichiers `_redirects` et `.htaccess` préservent les principales anciennes URL. Pour Nginx ou un autre hébergeur, configurer les mêmes redirections et la page `404.html`.

La réservation se fait sur place, par téléphone ou par e-mail. Il n’existe ni paiement, ni calendrier, ni formulaire. Aucun suivi publicitaire ou outil de mesure d’audience n’est intégré. Google Maps se charge uniquement à la demande. Les avis sont une sélection éditoriale de témoignages positifs, avec leur source et un lien vers tous les avis Google ; ils ne se synchronisent pas automatiquement.

Avant publication, renseigner l’hébergeur réel s’il diffère de Bulle Communication, actuellement nommé par le site officiel. Faire confirmer la caution quad : la page commerciale affiche 700 €, tandis que le contrat publié contient des montants contradictoires. La FAQ conserve cette précision. Les informations commerciales ont été actualisées selon les instructions du propriétaire du **7 octobre 2026**, conservées dans `docs/sources.json` en complément des sources du site existant.

## Tests navigateur facultatifs

Le script de contrôle utilise Playwright et Chrome sans les inclure dans les dépendances du site. Installer Playwright dans un dossier d’outils séparé et lancer :

```sh
PLAYWRIGHT_MODULE=/chemin/vers/playwright/index.mjs node scripts/browser-check.mjs
```

Le serveur de prévisualisation doit tourner. `CHROME_PATH`, `BASE_URL` et `CHECK_OUTPUT` permettent d’adapter le test à la machine. Il couvre les 27 pages à cinq largeurs, les images, les langues, les menus, les accordéons, les liens de contact et la galerie clavier/tactile. Rapports et captures sont écrits hors du livrable.

Le contrôle axe facultatif utilise `scripts/accessibility-check.mjs`, avec `PLAYWRIGHT_MODULE` et `AXE_MODULE` pointant vers les modules installés séparément. Les résultats et leurs limites sont détaillés dans [docs/VALIDATION.md](docs/VALIDATION.md).

`scripts/owner-update-check.mjs` contrôle les pages modifiées dans les trois langues à 1440, 390 et 320 px, les nouvelles photos, les formules et tarifs, la galerie et les cartes d’avis. Il utilise le même `PLAYWRIGHT_MODULE` ; son dossier de sortie se configure avec `OWNER_OUTPUT`.
