# Publier Corsica Ranger sur GitHub Pages

Le dépôt est [bouguibougua/corsica-ranger](https://github.com/bouguibougua/corsica-ranger). Son adresse GitHub Pages est **https://bouguibougua.github.io/corsica-ranger/**.

Le workflow [deploy-pages.yml](../.github/workflows/deploy-pages.yml) construit les pages, vérifie le résultat puis publie uniquement le contenu de `dist/`. Les sources, les photos optimisées de `public/` et le workflow sont versionnés ; **ne pas committer `dist/`**.

## Premier déploiement

1. Mettre les modifications du projet sur la branche `main`, y compris `.github/workflows/deploy-pages.yml`.
2. Dans le dépôt GitHub, ouvrir [**Settings → Pages**](https://github.com/bouguibougua/corsica-ranger/settings/pages).
3. Sous **Build and deployment → Source**, choisir **GitHub Actions**. Ce réglage remplace la publication directe d’une branche avec Jekyll.
4. Ouvrir l’onglet **Actions**, sélectionner **Déployer le site sur GitHub Pages**, puis **Run workflow → main → Run workflow**. Ce lancement manuel est utile si les fichiers ont été envoyés avant le changement de source.
5. Attendre la réussite des deux jobs **Construire et vérifier** et **Publier sur GitHub Pages**. Le job de publication fournit le lien du site.
6. Ouvrir **https://bouguibougua.github.io/corsica-ranger/** et vérifier une page intérieure ainsi que le changement de langue.

Les prochains **push sur `main`** reconstruisent et publient automatiquement le site. Aucun secret supplémentaire ni branche `gh-pages` n’est nécessaire : le workflow utilise le jeton fourni par GitHub Actions.

## Ce que fait le workflow

- Installe Node.js 24 et les dépendances avec `npm ci`.
- Récupère l’URL effective de Pages avec `actions/configure-pages`.
- Passe sa sortie `base_url` à `SITE_URL` pour `npm run build` et `npm run check`. Les liens, ressources et URL canoniques utilisent ainsi le préfixe `/corsica-ranger/`.
- Envoie `dist/` avec `actions/upload-pages-artifact`.
- Publie cet artefact avec `actions/deploy-pages`, dans l’environnement `github-pages`.

Les images WebP et les polices optimisées sont déjà dans `public/`. Le workflow ne lance pas `npm run assets`, qui régénère les médias sur macOS.

Les actions sont fixées à des versions officielles vérifiées : `checkout@v7.0.1`, `setup-node@v7.0.0`, `configure-pages@v6.0.0`, `upload-pages-artifact@v5.0.0` et `deploy-pages@v5.0.1`.

L’artefact inclut les fichiers cachés générés dans `dist/`, notamment `.nojekyll`. Aucun traitement Jekyll n’est appliqué au site construit par ce workflow.

## Vérifier localement la même URL

Depuis la racine du projet :

```sh
npm ci
SITE_URL=https://bouguibougua.github.io/corsica-ranger/ npm run build
SITE_URL=https://bouguibougua.github.io/corsica-ranger/ npm run check
SITE_URL=https://bouguibougua.github.io/corsica-ranger/ npm run preview
```

Ouvrir **http://localhost:4173/corsica-ranger/**. Le serveur local ne publie rien sur GitHub.

Le contrôle navigateur facultatif `scripts/pages-check.mjs` vérifie les ressources, les langues, le menu, la galerie et les animations sous ce préfixe. Il utilise Playwright installé séparément :

```sh
PLAYWRIGHT_MODULE=/chemin/vers/playwright/index.mjs \
BASE_URL=http://localhost:4173/corsica-ranger/ node scripts/pages-check.mjs
```

## Si l’affichage ne correspond pas au site

- **Le README s’affiche** : vérifier **Settings → Pages → Source = GitHub Actions**, puis lancer le workflow ci-dessus. GitHub doit publier `dist/`, pas les sources du dépôt avec Jekyll.
- **Images, styles ou pages intérieures introuvables** : vérifier dans le dernier workflow que `SITE_URL` provient bien de `steps.pages.outputs.base_url`, puis reconstruire et republier avec ce workflow.
- **Le workflow échoue** : ouvrir le job et l’étape en erreur dans **Actions**. Une erreur de construction ou de vérification bloque la publication ; corriger la source puis envoyer la modification sur `main`.
- **Le workflow attend une autorisation** : ouvrir l’environnement `github-pages` dans le dépôt et examiner ses éventuelles règles de validation. Le workflow ne modifie pas ces règles.

La procédure officielle est décrite dans [la documentation des workflows GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) et [le choix de la source de publication](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
