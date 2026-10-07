# Photo and logo preparation

The 123 supplied photos and the supplied video were inspected before choosing
the website assets. The 22 selected local photographs are real Corsica Ranger
images. Twelve additional villa originals come from the six official photographs
of each property on https://corsicaranger.com/nos-partenaires. All originals remain
unchanged in `image/`; the villa additions live in `image/villas-officielles/`.

Run `node scripts/prepare-assets.mjs` (or `npm run assets` when configured) on macOS
to regenerate. Install the project dependencies first. HEIC conversion uses the
system `sips` command and needs access to macOS media services. A restricted sandbox
can return solid black images even with exit code 0; the script detects this and
stops. The generated WebP images can be built and served on other platforms.

`--fetch` downloads missing official villa originals, the official logo, and the
two Google Fonts files. The website serves the fonts locally and does not contact
Google Fonts in the browser. Manrope's downloaded Latin file is a variable font;
Barlow Condensed is the 700 Latin cut. Both are distributed under the SIL Open
Font License: https://github.com/google/fonts/tree/main/ofl/manrope and
https://github.com/google/fonts/tree/main/ofl/barlowcondensed.

For additions, use `npm run assets -- --only=photo-id,other-id` to regenerate only
selected or new entries. Existing entries are reused from the photo manifest,
so old HEIC files need not be decoded again. Editorial `photoAliases` in
`photo-sources.mjs` choose the homepage, activity and story images without
duplicating gallery entries.

Each selected image gets 640, 1000, 1600 and 2000 pixel variants where its native
width permits. Smaller images also get a native width variant. No image is
upscaled; orientations are applied and EXIF/location metadata are stripped.
`src/assets.mjs` exports `photos`, `gallery` and `villaPhotos`.
`width` and `height` describe the default `src` file's actual dimensions.

The official banner stays intact as `public/assets/logo-original.jpg`. `logo.png`
is a crop of its existing white head and Corsica Ranger lettering; the JPEG's
blue matte has been removed. The original mark and type have not been redrawn.

The selected `story` photograph depicts visitors. It must not be captioned as a
portrait of Marlène and Jean: the supplied photographs do not establish their
identities. Photographs with visible repost watermarks were not selected.

On 7 October 2026, twelve supplied originals were added in
`image/ajouts-2026-10/`. Official Instagram/Facebook originals and their exact
publication sources are kept in `image/reseaux-officiels/manifest.json`.
One social photo already present locally was deduplicated. Two additional
official website photos replace the quad and About hero images. All photographs
remain authentic, with French, English and Italian alternative descriptions.
No TikTok image was imported: the supplied hashtag did not expose an identifiable
official publication through public access.
