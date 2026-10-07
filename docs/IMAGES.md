# Audit visuel des images Corsica Ranger

## Mise à jour du 7 octobre 2026

La galerie contient maintenant **61 photos distinctes**, avec descriptions alternatives FR/EN/IT. Les 34 images de la première version sont complétées par 12 fichiers fournis par le propriétaire, 13 photos supplémentaires de ses comptes Instagram/Facebook et 2 photos du site officiel. Une quatorzième photo sociale était déjà présente : son original local est conservé, avec la publication ajoutée à sa provenance.

- Grande image d’introduction : `IMG_9386.JPG`, ID `convoi-ranger`, cadrage sur le premier véhicule.
- Petite image d’introduction : `quad-duo`, en remplacement de la chèvre.
- Carte buggy et hero : `buggy-maquis`, véhicule sans visage au premier plan.
- Carte quad et hero : `quad-coucher-soleil`, [source officielle](https://corsicaranger.com/images/2026/quad/slider/quad-slide-2.jpg), 2268×1135.
- Hero À propos : `general-bonifacio`, [source officielle](https://www.corsicaranger.com/images/2016/buggy/IMG_3063.JPG), 4032×3024, correspondant à la dernière image jointe. Les personnes à bord ne sont pas présentées comme des salariés.

Les nouveaux originaux sont conservés dans `image/ajouts-2026-10/` et `image/reseaux-officiels/`. Les publications sociales exactes figurent dans `image/reseaux-officiels/manifest.json` ; les choix, alias et provenances sont définis dans `scripts/photo-sources.mjs`. Les 93 nouveaux fichiers WebP ne sont pas agrandis et ne contiennent pas les métadonnées EXIF/IPTC/XMP ; les 122 anciens WebP sont inchangés. TikTok n’a fourni aucun média officiel identifiable en accès public.

## Audit initial du 6 octobre 2026

123 photos inspectées réellement sur six planches contact : 38 JPG et 85 HEIC. Une vidéo inspectée via six frames. Aucun sous-dossier. Originaux non modifiés.

## Limites et outils

- `sips` présent. Décodage HEIC dans le sandbox : images noires malgré code retour 0. Décodage correct hors sandbox avec escalation autorisée.
- Sharp présent dans `/private/tmp/corsica-tools/node_modules/sharp` ; ne décode pas le HEVC de ces HEIC (libde265 absent), mais parfait pour assemblage et export WebP après conversion JPEG par sips.
- Python Pillow, ffmpeg et ffprobe absents. Swift/AppKit/AVFoundation disponibles.
- Photos de maisons/villas : aucune. Logo : aucun. Les maisons doivent recevoir de vraies images issues des sites autorisés ou un état éditorial explicite.
- Watermark sur IMG_9252/9257/9258. Préférer HEIC équivalentes 2586/9873/9874 ou JPG Resized.
- Plusieurs JPEG et HEIC ont des orientations EXIF ; utiliser Sharp `.rotate()` lors des exports.

## Recommandations

| Usage | Fichier | Dimensions source | Observation |
|---|---|---|---|
| Hero panoramique prêt à utiliser | `Resized_20231001_185941.JPG` | 2016×908 | Panorama mer/baie + soleil rouge + buggy frontal en contrebas. Bonne lisibilité de paysage. 2016×908, sans watermark visible. |
| Hero haute résolution | `IMG_9873.HEIC` | 4032×3024 | Buggy frontal phares allumés au-dessus baie sous soleil orange. Netteté et résolution supérieures ; recadrer 16:9 après conversion sips hors sandbox. |
| Hero variante plus proche | `IMG_9874.HEIC` | 4032×3024 | Même scène, buggy plus grand. Prévoir placement titre évitant le véhicule. |
| Randonnées buggy action | `IMG_2412.HEIC` | 4032×3024 | Buggy bleu/noir incliné sur dalle rocheuse, deux passagers ; ciel bleu, végétation verte, dynamique. |
| Randonnées buggy clients | `IMG_4159.HEIC` | 4032×3024 | Deux clients souriants dans buggy bleu, lumière claire, visage/habitacle lisibles. |
| Randonnées quad | `IMG_1534.HEIC` | 5712×4284 | Deux femmes casquées sur quad bleu, profil, journée. Photo 5712×4284. |
| Quad alternative | `IMG_2227.JPG` | 4032×3024 | Deux hommes casqués sur quad blanc de profil, ombre sous arbres, 4032×3024. |
| Raids / groupe | `IMG_8353.HEIC` | 4032×3024 | Long convoi de buggys sur piste, arrière des véhicules, baie en fond, journée. |
| Sunset véhicule | `IMG_2588.HEIC` | 4032×3024 | Buggy 4 places rouge de trois quarts arrière, soleil et baie dans ciel orange. |
| Sunset paysage | `IMG_2583.HEIC` | 4032×3024 | Baie/mer et montagnes, ciel rouge, aucun véhicule au centre. Très belle section immersive. |
| Sunset convoi | `IMG_3790.HEIC` | 5712×4284 | Alignement de buggys au-dessus baie au sunset, ciel nuageux dramatique, 5712×4284. |
| Histoire / expérience humaine | `IMG_8714.HEIC` | 4032×3024 | Six adultes souriants sur belvédère et baie. Ne pas les identifier comme fondateurs sans preuve. |
| Histoire / bergerie | `IMG_5846.JPG` | 4032×3024 | Jeune homme portant chevreau devant bergerie, portrait une fois orientation corrigée. |
| Bergerie / territoire | `IMG_6183.JPG` | 4032×3024 | Deux chèvres sur rocher, mur pierre derrière ; orientation à corriger. |
| Bergerie détail | `IMG_0061.HEIC` | 4032×3024 | Chèvre blanche blottie entre rochers couverts de lichen et fleurs. |
| Familles / découverte | `IMG_9374.JPG` | 4032×3024 | Visiteurs adultes/enfants avec chèvres devant bergerie ; orientation à corriger. |

## Vidéo

`e1e34617-d877-45be-a73e-c9f303c7a36b.MP4` : 40,169 s, environ 29,97 fps, piste encodée 848×480 avec rotation 90° (affichage vertical 480×848). Convoi de buggys grimpant une piste fortement rocheuse puis passant devant caméra. Baie et maquis en fond ; visiteur souriant à bord. Adaptée à une vignette vidéo activité/raids ; faible résolution et format vertical pour hero plein écran. Frames : `/private/tmp/corsica-assets-audit/video-1.jpg` à `video-6.jpg`, planche `video-contact.jpg`.

## Correspondances exhaustives

| N° | Fichier | Catégorie | Dimensions | Sujet vu |
|---|---|---|---|---|
| 1 | `0E6F02BE-E882-4392-BEA3-B9BF0F83FB32.JPG` | buggy | 1080×809 | Couple dans buggy rouge/bleu, vue rapprochée, journée |
| 2 | `68DD436B-88A8-496E-A7B8-B1E0B0F4C2C6.JPG` | buggy_action | 1080×499 | Buggy de face sur piste boisée, cadre horizontal avec bandes noires intégrées |
| 3 | `A5688F95-D89C-4AE4-8BB2-FE3FB3026A77.JPG` | buggy_groupe | 1080×809 | Trois buggys arrêtés sur crête, mer/montagnes au fond |
| 4 | `IMG_0061.HEIC` | chevres | 4032×3024 | Chèvre blanche couchée entre rochers et fleurs |
| 5 | `IMG_0062.HEIC` | chevres_sunset | 4032×3024 | Troupeau blanc au soleil couchant, plan large |
| 6 | `IMG_0063.HEIC` | chevres_sunset | 4032×3024 | Troupeau de chèvres blanches au coucher de soleil |
| 7 | `IMG_0065.HEIC` | chevres_sunset | 4032×3024 | Chèvre blanche de face, soleil orange en arrière-plan, portrait |
| 8 | `IMG_0066.HEIC` | chevres_sunset | 4032×3024 | Chèvres blanches de face au sunset, portrait |
| 9 | `IMG_0067.HEIC` | chevres_sunset | 4032×3024 | Deux chèvres blanches au sunset, portrait |
| 10 | `IMG_0068.HEIC` | chevres_sunset | 4032×3024 | Chèvres blanches au sunset, portrait |
| 11 | `IMG_0274.HEIC` | buggy_sunset | 4032×3024 | Arrière buggy et visiteurs face au coucher de soleil sur vallée |
| 12 | `IMG_0282.HEIC` | buggy_sunset_groupe | 4032×3024 | Convoi de buggys sur piste au crépuscule, personne à pied |
| 13 | `IMG_0449.HEIC` | paysage_sunset | 4032×3024 | Soleil rouge sur mer et collines, rochers au premier plan |
| 14 | `IMG_0521.HEIC` | buggy_sunset | 4032×3024 | Deux buggys sur crête, soleil au-dessus des montagnes |
| 15 | `IMG_0522.HEIC` | buggy_sunset | 4032×3024 | Deux buggys sur crête, plus proche que 0521 |
| 16 | `IMG_0523.HEIC` | buggy_sunset | 4032×3024 | Buggy 4 places rouge sur crête, cadrage portrait |
| 17 | `IMG_0524.HEIC` | buggy | 4032×3024 | Buggy 4 places rouge sur crête, soleil haut, brume montagneuse |
| 18 | `IMG_0525.HEIC` | buggy_sunset | 4032×3024 | Buggy 4 places rouge de trois quarts, vallée et soleil |
| 19 | `IMG_0568.HEIC` | clients_buggy | 4032×3024 | Couple à l'intérieur d'un buggy, lumière de fin de journée |
| 20 | `IMG_0569.HEIC` | clients_buggy | 4032×3024 | Même couple à l'intérieur d'un buggy, plus proche |
| 21 | `IMG_0570.HEIC` | paysage_sunset | 4032×3024 | Soleil rouge derrière arbre nu et rochers |
| 22 | `IMG_0571 2.HEIC` | paysage_sunset | 4032×3024 | Soleil rouge sur mer, maquis et piste, portrait |
| 23 | `IMG_0571.HEIC` | paysage_sunset | 4032×3024 | Doublon visuel du 0571 2 |
| 24 | `IMG_0655.HEIC` | buggy_sunset_groupe | 4032×3024 | Plusieurs buggys arrêtés sous ciel orangé, fils électriques visibles |
| 25 | `IMG_0656.HEIC` | buggy_sunset_groupe | 4032×3024 | Même groupe de buggys au crépuscule, plus proche |
| 26 | `IMG_0657.HEIC` | buggy_sunset_groupe | 4032×3024 | Même groupe de buggys au crépuscule, vue frontale |
| 27 | `IMG_0665.HEIC` | buggy_sunset | 4032×3024 | Buggy rouge/bleu de profil, ciel rose/bleu, portrait |
| 28 | `IMG_0666.HEIC` | buggy_sunset | 4032×3024 | Même buggy rouge/bleu au crépuscule, portrait |
| 29 | `IMG_0967.JPG` | paysage_sunset | 756×1008 | Coucher de soleil marin encadré par arche rocheuse, portrait |
| 30 | `IMG_0968.JPG` | paysage_rochers | 1055×1080 | Grand rocher clair dans maquis, ciel bleu, presque carré |
| 31 | `IMG_0969.JPG` | clients_buggy_sunset | 1280×960 | Couple souriant dans buggy rouge/bleu de profil, coucher de soleil |
| 32 | `IMG_0970.JPG` | clients_buggy | 4032×3024 | Couple dans buggy rouge/bleu, sur piste boisée |
| 33 | `IMG_0972.JPG` | buggy_action | 4032×3024 | Buggy noir/rouge de face sur piste boisée |
| 34 | `IMG_1533.HEIC` | clients_quad | 5712×4284 | Femme casquée sur quad bleu de face, journée |
| 35 | `IMG_1534.HEIC` | clients_quad | 5712×4284 | Deux femmes casquées sur quad bleu de profil, journée |
| 36 | `IMG_1536.HEIC` | clients_quad | 5712×4284 | Deux femmes casquées sur quad bleu de profil, autre angle |
| 37 | `IMG_1969.JPG` | buggy_action | 4032×3024 | Buggy noir de face dans montée rocheuse, forêt |
| 38 | `IMG_1971.JPG` | clients_buggy | 4032×3024 | Trois adultes souriants dans buggy gris/noir, journée |
| 39 | `IMG_2188 2.HEIC` | buggy_sunset | 4032×3024 | Buggy bleu sur crête, soleil orange et vallée brumeuse, doublon de 2188 |
| 40 | `IMG_2188.HEIC` | buggy_sunset | 4032×3024 | Buggy bleu sur crête, soleil orange et vallée brumeuse |
| 41 | `IMG_2189.HEIC` | buggy_sunset | 4032×3024 | Même buggy bleu au sunset, frontal de trois quarts |
| 42 | `IMG_2221.JPG` | clients_quad | 4032×3024 | Deux hommes casqués sur quad blanc de face, base ombragée |
| 43 | `IMG_2223.JPG` | clients_quad | 4032×3024 | Deux hommes casqués sur quad blanc de profil, base ombragée |
| 44 | `IMG_2226.JPG` | clients_quad | 4032×3024 | Même duo sur quad blanc de profil, base et visiteurs en arrière-plan |
| 45 | `IMG_2227.JPG` | clients_quad | 4032×3024 | Même duo sur quad blanc de profil, regard appareil |
| 46 | `IMG_2259.JPG` | buggy_action | 4032×3024 | Buggy noir en franchissement de piste boisée |
| 47 | `IMG_2287.HEIC` | buggy | 4032×3024 | Buggy gris/bleu arrêté près de rochers, golden hour |
| 48 | `IMG_2288.HEIC` | buggy | 4032×3024 | Même buggy gris/bleu près de rochers, variante cadrage |
| 49 | `IMG_2307.JPG` | clients_buggy | 4032×3024 | Femme souriante au volant d'un buggy, portrait |
| 50 | `IMG_2347.HEIC` | paysage_sunset | 4032×3024 | Ciel doré, soleil et silhouettes maquis/mer |
| 51 | `IMG_2348.HEIC` | buggy_sunset | 4032×3024 | Buggy bleu de profil, soleil visible dans habitacle |
| 52 | `IMG_2349.HEIC` | buggy_sunset | 4032×3024 | Même buggy bleu de profil, soleil à gauche |
| 53 | `IMG_2350.HEIC` | buggy_sunset | 4032×3024 | Buggy 4 places rouge/noir de profil, ciel rose |
| 54 | `IMG_2351.HEIC` | buggy_sunset | 4032×3024 | Même buggy 4 places rouge/noir de profil, plus proche |
| 55 | `IMG_2384.HEIC` | buggy_sunset | 4032×3024 | Buggy bleu de trois quarts arrière au sunset, sur dalle rocheuse |
| 56 | `IMG_2406.HEIC` | buggy_action | 4032×3024 | Buggy bleu/noir de face en descente ou franchissement rocheux |
| 57 | `IMG_2408.HEIC` | buggy_action | 4032×3024 | Buggy bleu/noir frontal sur dalle rocheuse, deux passagers |
| 58 | `IMG_2411.HEIC` | buggy_action | 4032×3024 | Buggy bleu/noir incliné sur franchissement rocheux |
| 59 | `IMG_2412.HEIC` | buggy_action | 4032×3024 | Buggy bleu/noir frontal incliné sur roche, vue large dynamique |
| 60 | `IMG_2422.HEIC` | paysage_sunset | 4032×3024 | Soleil rouge et ciel orange, silhouettes arbres nus |
| 61 | `IMG_2430.HEIC` | buggy_sunset | 4032×3024 | Buggy de face sous soleil doré, cadrage portrait |
| 62 | `IMG_2470.HEIC` | clients_buggy_sunset | 4032×3024 | Conducteur dans buggy bleu de profil, main levée, sunset |
| 63 | `IMG_2471.HEIC` | clients_buggy_sunset | 4032×3024 | Même conducteur dans buggy bleu de profil, sunset |
| 64 | `IMG_2582.HEIC` | paysage_sunset | 4032×3024 | Baie/mer et montagnes au couchant, léger élément humain en bas à droite |
| 65 | `IMG_2583.HEIC` | paysage_sunset | 4032×3024 | Baie/mer et montagnes au couchant, horizon orange |
| 66 | `IMG_2584.HEIC` | buggy_sunset | 4032×3024 | Buggy gris et personne debout à côté, baie en arrière-plan |
| 67 | `IMG_2586.HEIC` | buggy_sunset | 4032×3024 | Arrière buggy gris au couchant, mer en arrière-plan, portrait |
| 68 | `IMG_2587.HEIC` | buggy_sunset | 4032×3024 | Buggy rouge 4 places de profil devant coucher de soleil |
| 69 | `IMG_2588.HEIC` | buggy_sunset | 4032×3024 | Buggy rouge 4 places de trois quarts arrière, coucher de soleil baie |
| 70 | `IMG_2589.HEIC` | clients_buggy_sunset | 4032×3024 | Visiteurs vus de dos à côté buggy devant baie au sunset |
| 71 | `IMG_2631.HEIC` | buggy_sunset | 4032×3024 | Buggy bleu de trois quarts arrière, soleil à travers cage |
| 72 | `IMG_2811.JPG` | buggy_sunset | 1600×902 | Buggy bleu proche de profil, ciel rose et soleil pâle |
| 73 | `IMG_2813.JPG` | buggy_sunset | 2880×2162 | Buggy bleu de trois quarts sur crête, soleil orange |
| 74 | `IMG_2817.JPG` | buggy_sunset | 2160×2880 | Arrière buggy rouge sur piste au sunset, portrait |
| 75 | `IMG_2818.JPG` | buggy_sunset | 2160×2880 | Même arrière buggy rouge sur piste au sunset, portrait |
| 76 | `IMG_2828.JPG` | buggy_action | 4032×3024 | Buggy noir de face incliné sur piste boisée |
| 77 | `IMG_2832.JPG` | buggy_action | 4032×3024 | Buggy noir frontal sur piste boisée, second buggy derrière |
| 78 | `IMG_3040.HEIC` | buggy_groupe | 5712×4284 | Grand groupe de buggys sur piste, homme à pied entre véhicules |
| 79 | `IMG_3307.HEIC` | buggy_sunset_groupe | 4032×3024 | Buggys arrêtés sur piste au coucher de soleil, portrait |
| 80 | `IMG_3678.HEIC` | buggy | 4032×3024 | Buggy bleu de trois quarts arrière au-dessus baie sous ciel nuageux |
| 81 | `IMG_3785.HEIC` | buggy_sunset_groupe | 5712×4284 | Long convoi de buggys sur piste, soleil à l'horizon, ciel nuageux |
| 82 | `IMG_3786.HEIC` | buggy_sunset_groupe | 4032×3024 | Groupe de buggys alignés au-dessus de la baie, soleil orange |
| 83 | `IMG_3789.HEIC` | buggy_sunset_groupe | 5712×4284 | Vue portrait du même convoi au soleil couchant |
| 84 | `IMG_3790.HEIC` | buggy_sunset_groupe | 5712×4284 | Convoi de buggys sur belvédère au sunset, ciel dramatique |
| 85 | `IMG_3791.HEIC` | buggy_sunset_groupe | 5712×4284 | Convoi de buggys au sunset, vue plus large |
| 86 | `IMG_4023.HEIC` | buggy_sunset | 3024×4032 | Buggy bleu de face au coucher de soleil, portrait |
| 87 | `IMG_4024.HEIC` | buggy_sunset | 4032×3024 | Buggy bleu/noir de face au sunset, cadrage portrait contenu dans paysage |
| 88 | `IMG_4025.HEIC` | buggy_sunset | 4032×3024 | Même buggy sombre au sunset, portrait contenu dans paysage |
| 89 | `IMG_4038.HEIC` | buggy_sunset_groupe | 4032×3024 | Trois buggys de face, ciel pastel doré, cadrage vertical contenu dans paysage |
| 90 | `IMG_4159.HEIC` | clients_buggy | 4032×3024 | Deux clients souriants dans buggy bleu, plan proche journée |
| 91 | `IMG_4648.HEIC` | paysage_sunset | 4032×3024 | Ciel pastel rose/orangé sur maquis et mer |
| 92 | `IMG_4649.HEIC` | buggy | 4032×3024 | Buggy bleu de trois quarts devant maquis au sunset doux |
| 93 | `IMG_5779.JPG` | clients_buggy | 4032×3024 | Couple dans buggy rouge/bleu, journée |
| 94 | `IMG_5781.JPG` | chevres | 4032×3024 | Plusieurs chèvres devant bâtiment en bois, portrait après rotation |
| 95 | `IMG_5846.JPG` | chevres_bergerie | 4032×3024 | Jeune homme portant un chevreau, autres chèvres devant bergerie bois |
| 96 | `IMG_6023.HEIC` | jetski | 4032×3024 | Deux jeunes hommes sur jetski bleu près de plage rocheuse, mer calme |
| 97 | `IMG_6024.HEIC` | jetski | 4032×3024 | Même duo jetski, cadrage portrait contenu dans paysage |
| 98 | `IMG_6025.HEIC` | jetski | 4032×3024 | Même duo jetski, cadrage rapproché vertical |
| 99 | `IMG_6183.JPG` | chevres | 4032×3024 | Deux chèvres sur gros rocher, mur en pierre au fond |
| 100 | `IMG_6184.JPG` | chevres | 4032×3024 | Même duo de chèvres sur rocher, légère variante |
| 101 | `IMG_7242.JPG` | chevres_famille | 4032×3024 | Enfant caressant chevreau noir devant clôture bois, portrait après rotation |
| 102 | `IMG_7243.JPG` | chevres_famille | 4032×3024 | Enfant accroupi à côté chevreau noir, portrait après rotation |
| 103 | `IMG_7244.JPG` | chevres_famille | 4032×3024 | Enfant penché près chevreau noir, portrait après rotation |
| 104 | `IMG_7246.JPG` | chevres_famille | 4032×3024 | Enfant accroupi près chevreau noir, plus large |
| 105 | `IMG_7687.HEIC` | clients_buggy_sunset | 4032×3024 | Famille de trois devant buggy bleu au sunset |
| 106 | `IMG_7688.HEIC` | clients_buggy_sunset | 4032×3024 | Même famille de trois devant buggy bleu au sunset, plus proche |
| 107 | `IMG_7689.HEIC` | clients_buggy_sunset | 4032×3024 | Même famille et buggy sous ciel orange, cadrage portrait contenu paysage |
| 108 | `IMG_8352.HEIC` | buggy_groupe | 4032×3024 | Convoi arrêté sur piste en journée, passagère à pied |
| 109 | `IMG_8353.HEIC` | buggy_groupe | 4032×3024 | Long convoi de buggys sur piste en journée, vue arrière |
| 110 | `IMG_8714.HEIC` | clients_groupe | 4032×3024 | Six adultes souriants sur belvédère, baie et village au fond |
| 111 | `IMG_8821.HEIC` | paysage_sunset | 4032×3024 | Soleil rouge sur mer et maquis, piste rocheuse au premier plan |
| 112 | `IMG_9252.JPG` | buggy_sunset | 1536×2048 | Arrière buggy gris au coucher de soleil, format portrait, watermark |
| 113 | `IMG_9257.JPG` | buggy_sunset | 1469×661 | Buggy frontal sur crête, grande baie et coucher de soleil, watermark |
| 114 | `IMG_9258.JPG` | buggy_sunset | 1814×817 | Même scène buggy frontal plus éloigné sur crête, baie et sunset, watermark |
| 115 | `IMG_9373.JPG` | chevres | 4032×3024 | Chèvre couchée avec chevreau sur sol de bergerie |
| 116 | `IMG_9374.JPG` | chevres_famille | 4032×3024 | Groupe adultes/enfants visitant chèvres devant bergerie, portrait après rotation |
| 117 | `IMG_9867.HEIC` | buggy_sunset | 4032×3024 | Buggy rouge/noir de face au sunset sur crête, baie au fond |
| 118 | `IMG_9868.HEIC` | buggy_sunset | 4032×3024 | Même buggy rouge/noir de face, plus proche, baie au fond |
| 119 | `IMG_9870.HEIC` | clients_buggy_sunset | 4032×3024 | Couple souriant dans buggy rouge/noir, sunset et baie au fond |
| 120 | `IMG_9873.HEIC` | buggy_sunset | 4032×3024 | Buggy frontal phares allumés au-dessus baie au coucher de soleil |
| 121 | `IMG_9874.HEIC` | buggy_sunset | 4032×3024 | Même buggy frontal phares allumés, plus proche, soleil orange sur baie |
| 122 | `Resized_20231001_185934.JPG` | buggy_sunset | 2016×908 | Buggy frontal phares allumés au-dessus baie, format panoramique sans watermark visible |
| 123 | `Resized_20231001_185941.JPG` | buggy_sunset | 2016×908 | Buggy frontal éloigné au-dessus baie, soleil rouge, format panoramique |

## Photos officielles des villas ajoutées après audit

Douze images originales téléchargées depuis la page officielle https://corsicaranger.com/nos-partenaires, conservées dans `image/villas-officielles/`. Inspection visuelle de chaque photo effectuée. Aucun agrandissement dans les exports.

| Fichier | Dimensions | Sujet vu | Source officielle |
|---|---|---|---|
| `villa-cavallo-1.jpg` | 953×768 | Façade en pierre et piscine privée, choisie pour image principale Cavallo | [Image officielle](https://corsicaranger.com/images/2024/villa-cavallo/villa-cavallo-1.jpg) |
| `villa-cavallo-2.jpg` | 1024×768 | Façade en pierre, jardin et arbres | [Image officielle](https://corsicaranger.com/images/2024/villa-cavallo/villa-cavallo-2.jpg) |
| `villa-cavallo-3.jpg` | 1024×769 | Salle à manger ouverte sur séjour | [Image officielle](https://corsicaranger.com/images/2024/villa-cavallo/villa-cavallo-3.jpg) |
| `villa-cavallo-4.jpg` | 1024×768 | Chambre double, mur rouge, fenêtre | [Image officielle](https://corsicaranger.com/images/2024/villa-cavallo/villa-cavallo-4.jpg) |
| `villa-cavallo-5.jpg` | 1024×768 | Terrasse couverte, table, maquis au fond | [Image officielle](https://corsicaranger.com/images/2024/villa-cavallo/villa-cavallo-5.jpg) |
| `villa-cavallo-6.jpg` | 1024×768 | Chambre double aux tons gris | [Image officielle](https://corsicaranger.com/images/2024/villa-cavallo/villa-cavallo-6.jpg) |
| `villa-lavezzi-1.jpg` | 1024×768 | Piscine privée et spa, vue plongeante parmi pierres et arbres, choisie pour image principale Lavezzi | [Image officielle](https://corsicaranger.com/images/2024/villa-lavezzi/villa-lavezzi-1.jpg) |
| `villa-lavezzi-2.jpg` | 1024×768 | Piscine et spa vus depuis terrasse | [Image officielle](https://corsicaranger.com/images/2024/villa-lavezzi/villa-lavezzi-2.jpg) |
| `villa-lavezzi-3.jpg` | 1024×768 | Séjour lumineux et table ronde | [Image officielle](https://corsicaranger.com/images/2024/villa-lavezzi/villa-lavezzi-3.jpg) |
| `villa-lavezzi-4.jpg` | 1024×768 | Chambre twin, placard miroir | [Image officielle](https://corsicaranger.com/images/2024/villa-lavezzi/villa-lavezzi-4.jpg) |
| `villa-lavezzi-5.jpg` | 1024×768 | Chambre double aux tons jaunes | [Image officielle](https://corsicaranger.com/images/2024/villa-lavezzi/villa-lavezzi-5.jpg) |
| `villa-lavezzi-6.jpg` | 1024×768 | Chambre double aux tons clairs | [Image officielle](https://corsicaranger.com/images/2024/villa-lavezzi/villa-lavezzi-6.jpg) |

Le logo officiel provient de https://corsicaranger.com/templates/corsica/images/logo-2021.jpg. La bannière originale 1200×68 est conservée dans `public/assets/logo-original.jpg`. Le fichier `logo.png` conserve la tête et le lettrage originaux sur fond transparent.

La sélection de 34 photos et les textes alternatifs FR/EN/IT sont définis dans `scripts/photo-sources.mjs`; les métadonnées des fichiers WebP servis figurent dans `src/assets.mjs` et `public/assets/photos/manifest.json`.
