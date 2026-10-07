import { mkdir, readFile, writeFile, cp, access } from "node:fs/promises";
import { resolve } from "node:path";
import { languages, pages, pathFor } from "../src/routes.mjs";
import { renderPage } from "../src/render.mjs";
import * as assets from "../src/assets.mjs";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "dist");
const siteUrl = (process.env.SITE_URL || "https://corsicaranger.com").replace(
  /\/$/,
  "",
);
if (!/^https?:\/\/[^\s]+$/.test(siteUrl))
  throw new Error("SITE_URL doit être une URL HTTP(S) valide.");
await access(resolve(root, "public/assets/photos"));
await mkdir(out, { recursive: true });
await cp(resolve(root, "public"), out, { recursive: true });
await cp(resolve(root, "src/styles.css"), resolve(out, "assets/styles.css"));
await cp(resolve(root, "src/client.js"), resolve(out, "assets/client.js"));
await cp(resolve(root, "src/effects.css"), resolve(out, "assets/effects.css"));
await cp(resolve(root, "src/motion.js"), resolve(out, "assets/motion.js"));
await sharp(resolve(root, `public${assets.photos.hero.src}`))
  .resize(1200, 630, { fit: "cover" })
  .composite([
    {
      input: await sharp(resolve(root, "public/assets/logo.png"))
        .resize(410)
        .toBuffer(),
      left: 45,
      top: 35,
    },
  ])
  .jpeg({ quality: 86 })
  .toFile(resolve(out, "assets/social.jpg"));
await sharp(resolve(root, "public/assets/logo.png"))
  .extract({ left: 3, top: 0, width: 98, height: 68 })
  .resize(64, 64, { fit: "contain", background: "#20352e" })
  .flatten({ background: "#20352e" })
  .png()
  .toFile(resolve(out, "assets/favicon.png"));
const locales = {};
for (const lang of languages) {
  const t = (await import(`../src/content/${lang}.mjs`)).default;
  locales[lang] = t;
  for (const page of [...pages, "notFound"]) {
    const route = pathFor(page, lang);
    const dir = resolve(out, `.${route}`);
    await mkdir(dir, { recursive: true });
    const html = renderPage({ page, lang, t, assets, siteUrl });
    await writeFile(resolve(dir, "index.html"), html);
    if (page === "notFound" && lang === "fr")
      await writeFile(resolve(out, "404.html"), html);
  }
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${pages.flatMap((page) => languages.map((lang) => `<url><loc>${siteUrl}${pathFor(page, lang)}</loc>${languages.map((code) => `<xhtml:link rel="alternate" hreflang="${code}" href="${siteUrl}${pathFor(page, code)}"/>`).join("")}<xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${pathFor(page, "fr")}"/></url>`)).join("")}</urlset>`;
await writeFile(resolve(out, "sitemap.xml"), sitemap);
await writeFile(
  resolve(out, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
);
await writeFile(
  resolve(out, "_redirects"),
  "/location-ranger /buggy/ 301\n/location-quad /quad/ 301\n/nos-partenaires /maisons/ 301\n/historique /a-propos/ 301\n/mentions-legales /mentions-legales/ 301\n",
);
await writeFile(
  resolve(out, ".htaccess"),
  'Options -Indexes\nDirectoryIndex index.html\nErrorDocument 404 /404.html\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteRule ^location-ranger/?$ /buggy/ [R=301,L]\nRewriteRule ^location-quad/?$ /quad/ [R=301,L]\nRewriteRule ^nos-partenaires/?$ /maisons/ [R=301,L]\nRewriteRule ^historique/?$ /a-propos/ [R=301,L]\n</IfModule>\n<IfModule mod_headers.c>\nHeader always set X-Content-Type-Options "nosniff"\nHeader always set Referrer-Policy "strict-origin-when-cross-origin"\n</IfModule>\n<IfModule mod_expires.c>\nExpiresActive On\nExpiresByType image/webp "access plus 30 days"\nExpiresByType font/woff2 "access plus 1 year"\n</IfModule>\n',
);
console.log(
  `Site construit : ${pages.length * languages.length} pages + pages 404, trois langues, dist/`,
);
