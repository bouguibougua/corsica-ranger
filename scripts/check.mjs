import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { languages, pages, pathFor } from "../src/routes.mjs";
import { createSiteConfig } from "../src/site-config.mjs";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, process.env.BUILD_DIR || "dist");
const config = createSiteConfig(
  JSON.parse(await readFile(resolve(out, "site-config.json"), "utf8")).siteUrl,
);
const { basePath, absoluteUrl } = config;
function localPath(publicUrl) {
  assert.ok(
    publicUrl.startsWith(`${basePath}/`),
    `URL hors du préfixe public : ${publicUrl}`,
  );
  return publicUrl.slice(basePath.length);
}
const locales = Object.fromEntries(
  await Promise.all(
    languages.map(async (lang) => [
      lang,
      (await import(`../src/content/${lang}.mjs`)).default,
    ]),
  ),
);
function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, shape(child)]),
    );
  return typeof value;
}
for (const lang of languages)
  assert.deepEqual(
    shape(locales[lang]),
    shape(locales.fr),
    `Schéma de traduction ${lang}`,
  );
const documents = new Map();
for (const lang of languages)
  for (const page of [...pages, "notFound"]) {
    const path = pathFor(page, lang);
    const html = await readFile(resolve(out, `.${path}`, "index.html"), "utf8");
    documents.set(path, html);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${path} : H1 unique`);
    assert.ok(html.includes(`<html lang="${lang}">`), `${path} : langue`);
    assert.ok(
      html.includes(`<link rel="canonical" href="${absoluteUrl(path)}">`),
      `${path} : URL canonique`,
    );
    assert.ok(
      html.includes(`<meta name="site-base-path" content="${basePath}">`),
      `${path} : préfixe public`,
    );
    assert.ok(
      !/undefined|\[object Object\]|NaN/.test(html),
      `${path} : contenu incomplet`,
    );
    for (const code of languages)
      assert.ok(
        html.includes(
          `hreflang="${code}" href="${absoluteUrl(pathFor(page, code))}"`,
        ),
        `${path} : hreflang ${code}`,
      );
    for (const match of html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    )) {
      const schema = JSON.parse(match[1]);
      if (schema["@type"] === "LocalBusiness") {
        assert.equal(schema.url, config.siteUrl, `${path} : URL entreprise`);
        assert.ok(
          schema.image.startsWith(absoluteUrl("/assets/")),
          `${path} : image entreprise`,
        );
        assert.equal(
          schema.logo,
          absoluteUrl("/assets/logo.png"),
          `${path} : logo entreprise`,
        );
      }
      if (schema["@type"] === "BreadcrumbList")
        assert.equal(
          schema.itemListElement.at(-1).item,
          absoluteUrl(path),
          `${path} : fil d'Ariane`,
        );
    }
    assert.ok(
      !/<form\b|type="date"|<input\b/.test(html),
      `${path} : aucune fausse réservation`,
    );
    assert.ok(
      html.includes("tel:+33495703620") && html.includes("tel:+33680437013"),
      `${path} : téléphones officiels`,
    );
    assert.ok(
      html.includes("mailto:corsicaranger2a@gmail.com"),
      `${path} : e-mail officiel`,
    );
    assert.ok(
      !/<iframe\b/.test(html),
      `${path} : carte chargée uniquement à la demande`,
    );
  }
const assetPaths = new Set();
for (const [path, html] of documents) {
  const ids = new Set(
    [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  );
  for (const match of html.matchAll(
    /\b(?:src|href|data-hero-scene)="([^"]+)"/g,
  )) {
    const href = match[1].replace(/&amp;/g, "&");
    if (href.startsWith("#")) {
      assert.ok(ids.has(href.slice(1)), `${path} : ancre ${href}`);
      continue;
    }
    if (!href.startsWith("/")) continue;
    const local = localPath(href);
    if (local.startsWith("/assets/")) {
      assetPaths.add(local);
      continue;
    }
    const [route, fragment] = local.split("#");
    assert.ok(documents.has(route), `${path} : route ${route}`);
    if (fragment)
      assert.ok(
        documents.get(route).includes(`id="${fragment}"`),
        `${path} : ancre externe ${href}`,
      );
  }
  for (const match of html.matchAll(/srcset="([^"]+)"/g))
    for (const entry of match[1].split(","))
      assetPaths.add(localPath(entry.trim().split(/\s+/)[0]));
}
const stylesheet = await readFile(resolve(out, "assets/styles.css"), "utf8");
for (const match of stylesheet.matchAll(/url\("(fonts\/[^\"]+)"\)/g))
  assetPaths.add(`/assets/${match[1]}`);
for (const asset of assetPaths) await access(resolve(out, `.${asset}`));
for (const lang of languages) {
  const buggy = documents.get(pathFor("buggy", lang));
  const buggyRows = [
    ...buggy.matchAll(/<article class="offer-row"[^>]*>([\s\S]*?)<\/article>/g),
  ];
  assert.equal(buggyRows.length, 3, `Trois sorties buggy, ${lang}`);
  for (const [index, expected] of [
    [180, 200, 210, 220],
    [180, 200, 210, 220],
    [260, 270, 280, 290],
  ].entries()) {
    const actual = [...buggyRows[index][1].matchAll(/<td>(\d+) €<\/td>/g)].map(
      (match) => Number(match[1]),
    );
    assert.deepEqual(
      actual,
      expected,
      `Tarifs buggy sortie ${index + 1}, ${lang}`,
    );
  }
  assert.ok(
    buggyRows[2][0].includes('id="soir"'),
    `Sortie du soir en troisième position, ${lang}`,
  );
  const quad = documents.get(pathFor("quad", lang));
  for (const price of [140, 150, 230])
    assert.ok(
      quad.includes(`quad-price">${price}<span> €`),
      `Tarif quad ${price}, ${lang}`,
    );
  for (const page of pages)
    assert.ok(
      !documents.get(pathFor(page, lang)).includes("data-motion-toggle"),
      `Bouton pause supprimé ${page}, ${lang}`,
    );
}
const sitemap = await readFile(resolve(out, "sitemap.xml"), "utf8");
for (const page of pages)
  for (const lang of languages)
    assert.ok(
      sitemap.includes(`<loc>${absoluteUrl(pathFor(page, lang))}</loc>`),
      `Sitemap ${page}, ${lang}`,
    );
assert.ok(
  (await readFile(resolve(out, "robots.txt"), "utf8")).includes(
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
  ),
);
await access(resolve(out, ".nojekyll"));
console.log(
  `Contrôles statiques OK : ${documents.size} routes, ${assetPaths.size} ressources, traductions, liens, SEO et tarifs officiels — préfixe ${basePath || "/"}.`,
);
