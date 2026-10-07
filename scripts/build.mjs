import { mkdir, readFile, writeFile, cp, access } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { languages, pages, pathFor } from "../src/routes.mjs";
import { createSiteConfig } from "../src/site-config.mjs";
import { renderPage } from "../src/render.mjs";
import * as assets from "../src/assets.mjs";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, process.env.BUILD_DIR || "dist");
const config = createSiteConfig(process.env.SITE_URL);
const { siteUrl, publicPath } = config;
await access(resolve(root, "public/assets/photos"));
await mkdir(out, { recursive: true });
await cp(resolve(root, "public"), out, { recursive: true });
await cp(resolve(root, "src/styles.css"), resolve(out, "assets/styles.css"));
await cp(resolve(root, "src/client.js"), resolve(out, "assets/client.js"));
await cp(resolve(root, "src/effects.css"), resolve(out, "assets/effects.css"));
await cp(resolve(root, "src/motion.js"), resolve(out, "assets/motion.js"));
await writeFile(resolve(out, ".nojekyll"), "");
await writeFile(
  resolve(out, "site-config.json"),
  JSON.stringify(
    {
      siteUrl,
      origin: config.origin,
      basePath: config.basePath,
    },
    null,
    2,
  ) + "\n",
);
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
const redirects = [
  ["/location-ranger", "/buggy/"],
  ["/location-quad", "/quad/"],
  ["/nos-partenaires", "/maisons/"],
  ["/historique", "/a-propos/"],
  ["/mentions-legales", "/mentions-legales/"],
];
await writeFile(
  resolve(out, "_redirects"),
  redirects
    .map(([from, to]) => `${publicPath(from)} ${publicPath(to)} 301\n`)
    .join(""),
);
await writeFile(
  resolve(out, ".htaccess"),
  `Options -Indexes\nDirectoryIndex index.html\nErrorDocument 404 ${publicPath("/404.html")}\n<IfModule mod_rewrite.c>\nRewriteEngine On\n${redirects
    .slice(0, 4)
    .map(
      ([from, to]) =>
        `RewriteRule ^${from.slice(1)}/?$ ${publicPath(to)} [R=301,L]\n`,
    )
    .join(
      "",
    )}</IfModule>\n<IfModule mod_headers.c>\nHeader always set X-Content-Type-Options "nosniff"\nHeader always set Referrer-Policy "strict-origin-when-cross-origin"\n</IfModule>\n<IfModule mod_expires.c>\nExpiresActive On\nExpiresByType image/webp "access plus 30 days"\nExpiresByType font/woff2 "access plus 1 year"\n</IfModule>\n`,
);
console.log(
  `Site construit : ${pages.length * languages.length} pages + pages 404, trois langues, ${relative(root, out)}/ — ${siteUrl}/`,
);
