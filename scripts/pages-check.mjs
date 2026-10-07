/**
 * Optional browser QA for root and project-site deployments.
 * PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
 * BASE_URL=http://127.0.0.1:4174/corsica-ranger/ node scripts/pages-check.mjs
 * CHROME_PATH, PAGES_OUTPUT, PAGES_VIEWPORTS=desktop,mobile and PAGES_STATES=0
 * are optional. PAGES_FOCUS=booking,nojs limits a follow-up to those scenarios.
 * Browser dependencies remain outside the website.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { languages, pathFor } from "../src/routes.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = new URL(
  process.env.BASE_URL || "http://127.0.0.1:4174/corsica-ranger/",
);
base.pathname = `${base.pathname.replace(/\/+$/, "")}/`;
base.search = "";
base.hash = "";
const mount = base.pathname === "/" ? "" : base.pathname.replace(/\/$/, "");
const assetsPath = `${mount}/assets/`;
const publicPath = (key, lang = "fr") => `${mount}${pathFor(key, lang)}`;
const localUrl = (key, lang = "fr") =>
  new URL(publicPath(key, lang), base.origin).href;
const inMount = (pathname) =>
  !mount || pathname === mount || pathname.startsWith(`${mount}/`);
const output =
  process.env.PAGES_OUTPUT ||
  `/private/tmp/corsica-pages-check/${mount ? "project" : "root"}`;
await mkdir(output, { recursive: true });
const report = {
  checkedAt: new Date().toISOString(),
  base: base.href,
  mount,
  config: null,
  checks: [],
  failures: [],
  errors: [],
  browserDiagnostics: [],
  visits: [],
  requests: [],
  screenshots: [],
};
const focus = process.env.PAGES_FOCUS?.split(",");
const wants = (name) => !focus || focus.includes(name);
const record = (label, pass, detail = "") => {
  const check = { label, pass: Boolean(pass), detail };
  report.checks.push(check);
  if (!pass) {
    report.failures.push(check);
    console.log(
      `FAIL ${label}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`,
    );
  }
};
const scenario = async (label, action) => {
  try {
    await action();
  } catch (error) {
    record(label, false, error.stack || String(error));
  }
};
const frame = (page) => page.screenshot({ animations: "allow" });
const pause = (page, milliseconds = 100) => page.waitForTimeout(milliseconds);
let config;

function listen(page, state) {
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== base.origin) return;
    report.requests.push({
      scenario: state.label,
      url: url.href,
      type: request.resourceType(),
    });
    if (!inMount(url.pathname))
      report.errors.push({
        scenario: state.label,
        type: "escaped-prefix",
        url: url.href,
      });
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      state.documents++;
  });
  page.on("response", (response) => {
    if (
      new URL(response.url()).origin === base.origin &&
      response.status() >= 400
    )
      report.errors.push({
        scenario: state.label,
        type: "http",
        status: response.status(),
        url: response.url(),
      });
  });
  page.on("requestfailed", (request) => {
    if (!request.failure()?.errorText?.includes("ERR_ABORTED"))
      report.errors.push({
        scenario: state.label,
        type: "requestfailed",
        url: request.url(),
        message: request.failure()?.errorText,
      });
  });
  page.on("pageerror", (error) =>
    report.errors.push({
      scenario: state.label,
      type: "pageerror",
      url: page.url(),
      message: error.message,
    }),
  );
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const error = {
      scenario: state.label,
      type: "console",
      url: page.url(),
      message: message.text(),
      location: message.location(),
    };
    // Chrome's native image viewer requests a domain favicon independently of
    // the document. Keep that browser diagnostic visible, separate from site
    // requests; no HTML/CSS/JS/image resource error receives this exception.
    const resource = message.location().url;
    if (
      state.label.startsWith("no-JS ") &&
      new URL(page.url()).pathname.startsWith(assetsPath) &&
      /\.webp$/.test(new URL(page.url()).pathname) &&
      resource === `${base.origin}/favicon.ico` &&
      message.text().includes("404")
    )
      report.browserDiagnostics.push({
        ...error,
        reason:
          "Native Chrome image-viewer favicon lookup, not an application URL",
      });
    else report.errors.push(error);
  });
}

async function ready(page, enhanced = true) {
  await page.evaluate(() => document.fonts.ready);
  if (enhanced)
    await page.waitForFunction(
      () => document.documentElement.dataset.clientReady === "true",
      null,
      { timeout: 10000 },
    );
  await frame(page);
}

async function visit(page, key, lang, state, enhanced = true) {
  const response = await page.goto(localUrl(key, lang), { waitUntil: "load" });
  record(
    `${state.label}: HTTP 200`,
    response?.status() === 200,
    response?.status(),
  );
  await ready(page, enhanced);
  report.visits.push({
    scenario: state.label,
    key,
    lang,
    url: page.url(),
    enhanced,
  });
}

async function scrollAll(page) {
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  const step = Math.max(350, Math.round(page.viewportSize().height * 0.7));
  for (let top = 0; top < height; top += step) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), top);
    await frame(page);
  }
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("main img")].every(
        (image) => image.complete,
      ),
    null,
    { timeout: 15000 },
  );
  await pause(page, 1900);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await frame(page);
}

async function screenshot(page, name) {
  const file = `${output}/${name}.png`;
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await frame(page);
  await pause(page, 1900);
  await page.screenshot({ path: file, animations: "allow" });
  report.screenshots.push(file);
}

async function audit(page, key, lang, label, allImages = true) {
  const audit = await page.evaluate(() => {
    const candidates = (value) =>
      value
        .split(",")
        .map((entry) => entry.trim().split(/\s+/)[0])
        .filter(Boolean);
    return {
      lang: document.documentElement.lang,
      h1: document.querySelectorAll("h1").length,
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      urls: [
        ...[...document.querySelectorAll("[href], [src]")].flatMap((element) =>
          ["href", "src"]
            .map((name) => element.getAttribute(name))
            .filter(Boolean),
        ),
        ...[...document.querySelectorAll("[srcset]")].flatMap((element) =>
          candidates(element.getAttribute("srcset")),
        ),
        ...[...document.querySelectorAll("[data-hero-scene]")].map(
          (element) => element.dataset.heroScene,
        ),
        ...[...document.querySelectorAll("[data-scene-srcset]")].flatMap(
          (element) => candidates(element.dataset.sceneSrcset),
        ),
      ],
      languages: [...document.querySelectorAll(".language-picker a[lang]")].map(
        (link) => ({ lang: link.lang, href: link.getAttribute("href") }),
      ),
      styles: [...document.querySelectorAll('link[rel="stylesheet"]')].map(
        (link) => ({
          href: link.href,
          loaded: Boolean(link.sheet?.cssRules.length),
        }),
      ),
      fonts: [...document.fonts].map((font) => ({
        family: font.family.replaceAll('"', ""),
        status: font.status,
      })),
      bodyFont: getComputedStyle(document.body).fontFamily,
      titleFont: getComputedStyle(document.querySelector("h1")).fontFamily,
      badImages: [...document.querySelectorAll("main img")]
        .filter((image) => !image.complete || !image.naturalWidth)
        .map((image) => ({
          src: image.currentSrc || image.src,
          loading: image.loading,
        })),
      heroLoaded:
        document.querySelector(".hero-image > img")?.complete &&
        document.querySelector(".hero-image > img")?.naturalWidth > 0,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      alternates: [
        ...document.querySelectorAll('link[rel="alternate"][hreflang]'),
      ].map((link) => ({ lang: link.hreflang, href: link.href })),
      ogUrl: document.querySelector('meta[property="og:url"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      schema: [
        ...document.querySelectorAll('script[type="application/ld+json"]'),
      ].map((script) => JSON.parse(script.textContent)),
      hiddenReveals: [...document.querySelectorAll("[data-reveal]")]
        .filter(
          (element) =>
            element.getClientRects().length &&
            !element.closest("[hidden], dialog:not([open])") &&
            Number(getComputedStyle(element).opacity) < 0.95,
        )
        .map((element) => element.className),
    };
  });
  const escaped = audit.urls.filter((raw) => {
    if (/^(?:#|data:|tel:|mailto:)/i.test(raw)) return false;
    const url = new URL(raw, page.url());
    return url.origin === base.origin && !inMount(url.pathname);
  });
  record(
    `${label}: all local URLs retain prefix`,
    escaped.length === 0,
    escaped,
  );
  record(`${label}: one H1 / language`, audit.h1 === 1 && audit.lang === lang);
  record(
    `${label}: no horizontal overflow`,
    audit.scrollWidth <= audit.width + 1,
    `${audit.scrollWidth}/${audit.width}`,
  );
  record(
    `${label}: language links retain page`,
    audit.languages.length === 3 &&
      audit.languages.every((link) => link.href === publicPath(key, link.lang)),
    audit.languages,
  );
  record(
    `${label}: stylesheets loaded`,
    audit.styles.length === 2 &&
      audit.styles.every(
        (style) =>
          style.loaded && new URL(style.href).pathname.startsWith(assetsPath),
      ),
    audit.styles,
  );
  record(
    `${label}: both local fonts loaded`,
    ["Barlow", "Manrope"].every((family) =>
      audit.fonts.some(
        (font) => font.family === family && font.status === "loaded",
      ),
    ) &&
      audit.bodyFont.includes("Manrope") &&
      audit.titleFont.includes("Barlow"),
    audit.fonts,
  );
  record(
    `${label}: images loaded`,
    audit.heroLoaded && (!allImages || audit.badImages.length === 0),
    audit.badImages,
  );
  if (allImages)
    record(
      `${label}: scrolled content visible`,
      audit.hiddenReveals.length === 0,
      audit.hiddenReveals,
    );
  const canonical = `${config.origin}${publicPath(key, lang)}`;
  record(
    `${label}: canonical / Open Graph URL`,
    audit.canonical === canonical && audit.ogUrl === canonical,
    { canonical: audit.canonical, ogUrl: audit.ogUrl, expected: canonical },
  );
  record(
    `${label}: hreflang URLs retain prefix`,
    audit.alternates.length === 4 &&
      audit.alternates.every(
        (link) =>
          link.href ===
          `${config.origin}${publicPath(key, link.lang === "x-default" ? "fr" : link.lang)}`,
      ),
    audit.alternates,
  );
  record(
    `${label}: social image URL retains prefix`,
    audit.ogImage === `${config.origin}${assetsPath}social.jpg`,
    audit.ogImage,
  );
  const business = audit.schema.find(
    (schema) => schema["@type"] === "LocalBusiness",
  );
  record(
    `${label}: structured image/logo URLs retain prefix`,
    business?.image.startsWith(`${config.origin}${assetsPath}`) &&
      business?.logo === `${config.origin}${assetsPath}logo.png`,
    business,
  );
}

async function navigate(page, locator, key, lang, state) {
  // Explicit scrolling renders lazy/reveal content before Playwright actionability
  // checks; automatic locator scrolling can stall on macOS headless hosts.
  await locator.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await frame(page);
  const settling = await locator.evaluate(
    (element) =>
      Boolean(element.closest("[data-reveal]")) &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  if (settling) await pause(page, 1750);
  await Promise.all([
    page.waitForURL((url) => url.pathname === publicPath(key, lang), {
      timeout: 15000,
    }),
    locator.click(),
  ]);
  await ready(page);
  record(
    `${state.label}: navigate ${key} ${lang}`,
    new URL(page.url()).pathname === publicPath(key, lang) &&
      (await page.locator("html").getAttribute("lang")) === lang,
  );
}

async function anchorCheck(page, locator, hash, state) {
  const before = state.documents;
  const pathname = new URL(page.url()).pathname;
  await locator.click();
  await frame(page);
  await pause(page, 800);
  record(
    `${state.label}: ${hash} stays on document`,
    new URL(page.url()).pathname === pathname &&
      new URL(page.url()).hash === hash &&
      state.documents === before &&
      !(await page
        .locator("body")
        .evaluate((body) => body.classList.contains("page-leaving"))),
  );
}

async function heroChecks(page, label, capture = false) {
  for (const index of [0, 1]) {
    const control = page.locator("[data-hero-scene]").nth(index);
    await control.hover();
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll(".hero-scene.scene-visible")].some(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      null,
      { timeout: 10000 },
    );
    await frame(page);
    await pause(page, 1350);
    const audit = await page
      .locator(".hero-scene.scene-visible")
      .evaluate((image) => ({
        src: image.currentSrc,
        opacity: Number(getComputedStyle(image).opacity),
        naturalWidth: image.naturalWidth,
        srcset: image.srcset,
      }));
    record(
      `${label}: hero hover ${index + 1} loads prefixed image`,
      new URL(audit.src).pathname.startsWith(assetsPath) &&
        audit.naturalWidth > 0 &&
        audit.opacity > 0.95,
      audit,
    );
    if (capture) {
      const file = `${output}/hero-hover-${index + 1}.png`;
      await page.screenshot({ path: file, animations: "allow" });
      report.screenshots.push(file);
    }
    await page.mouse.move(5, 90);
    await frame(page);
    record(
      `${label}: hero hover ${index + 1} restores image`,
      (await page.locator(".hero-scene.scene-visible").count()) === 0,
    );
  }
}

async function menuChecks(page, lang, state) {
  const opener = page.locator("[data-menu-open]");
  await opener.click();
  record(
    `${state.label}: mobile menu opens`,
    (await page.locator("#mobile-menu").evaluate((dialog) => dialog.open)) &&
      (await opener.getAttribute("aria-expanded")) === "true",
  );
  await page.keyboard.press("Escape");
  await frame(page);
  record(
    `${state.label}: mobile menu Escape/focus`,
    await page.evaluate(
      () =>
        !document.querySelector("#mobile-menu").open &&
        document.activeElement.matches("[data-menu-open]"),
    ),
  );
  await opener.click();
  await navigate(
    page,
    page.locator(
      `#mobile-menu .mobile-nav a[href="${publicPath("quad", lang)}"]`,
    ),
    "quad",
    lang,
    state,
  );
  record(
    `${state.label}: mobile menu closes on navigation`,
    !(await page.locator("#mobile-menu").evaluate((dialog) => dialog.open)),
  );
  await audit(page, "quad", lang, `${state.label} quad destination`, false);
}

async function galleryChecks(page, state) {
  for (const category of ["buggy", "quad", "corse", "maisons", "all"]) {
    await page.locator(`[data-filter="${category}"]`).click();
    await frame(page);
    await pause(page, 650);
    const items = await page
      .locator("a[data-gallery-item]:visible")
      .evaluateAll((items) => items.map((item) => item.dataset.category));
    record(
      `${state.label}: ${category} filter`,
      items.length > 0 &&
        (category === "all" || items.every((value) => value === category)),
      items.length,
    );
    record(
      `${state.label}: ${category} translated count`,
      (await page.locator("[data-gallery-count]").textContent()).includes(
        String(items.length),
      ),
    );
  }
  await page.locator('[data-filter="quad"]').click();
  await pause(page, 650);
  const first = page.locator("a[data-gallery-item]:visible").first();
  const href = await first.getAttribute("href");
  await first.click();
  await page.waitForFunction(
    () =>
      document.querySelector("#lightbox").open &&
      document.querySelector("[data-lightbox-image]").complete &&
      document.querySelector("[data-lightbox-image]").naturalWidth > 0,
  );
  record(
    `${state.label}: lightbox prefixed image`,
    await page
      .locator("[data-lightbox-image]")
      .evaluate(
        (image, prefix) => new URL(image.src).pathname.startsWith(prefix),
        assetsPath,
      ),
  );
  await page.locator("[data-lightbox-next]").click();
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-lightbox-counter]")
        .textContent.startsWith("2 /") &&
      document.querySelector("[data-lightbox-image]").complete &&
      document.querySelector("[data-lightbox-image]").naturalWidth > 0,
  );
  record(
    `${state.label}: lightbox next loads`,
    (await page.locator("[data-lightbox-counter]").textContent()).startsWith(
      "2 /",
    ),
  );
  await page.keyboard.press("ArrowLeft");
  await page.waitForFunction(() =>
    document
      .querySelector("[data-lightbox-counter]")
      .textContent.startsWith("1 /"),
  );
  await page.keyboard.press("Escape");
  await frame(page);
  record(
    `${state.label}: lightbox Escape/focus`,
    await page.evaluate(
      (selected) =>
        !document.querySelector("#lightbox").open &&
        document.activeElement.getAttribute("href") === selected,
      href,
    ),
  );
  await page.locator('[data-filter="all"]').click();
  await pause(page, 800);
}

async function languageChecks(page, key, state) {
  for (const lang of ["en", "it", "fr"]) {
    if (new URL(page.url()).pathname === publicPath(key, lang)) continue;
    await page.locator(".language-picker summary").click();
    await navigate(
      page,
      page.locator(`.language-picker a[lang="${lang}"]`),
      key,
      lang,
      state,
    );
  }
}

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--disable-background-networking", "--disable-component-update"],
});
try {
  const response = await fetch(new URL("site-config.json", base));
  record(
    "deployment config is available",
    response.status === 200,
    response.status,
  );
  config = await response.json();
  report.config = config;
  const configMount = String(config.basePath || "").replace(/\/+$/, "");
  record(
    "deployment config matches mounted prefix",
    configMount === mount &&
      new URL(config.siteUrl).origin === config.origin &&
      new URL(config.siteUrl).pathname.replace(/\/+$/, "") === mount,
    config,
  );
  const viewports = [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ].filter(
    ([name]) =>
      !process.env.PAGES_VIEWPORTS ||
      process.env.PAGES_VIEWPORTS.split(",").includes(name),
  );
  for (const [name, width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width < 500,
      hasTouch: width < 500,
    });
    const page = await context.newPage();
    const state = { label: name, documents: 0 };
    listen(page, state);
    for (const lang of languages.filter(() => wants("active"))) {
      state.label = `${name} ${lang}`;
      await scenario(state.label, async () => {
        await visit(page, "home", lang, state);
        await scrollAll(page);
        await audit(page, "home", lang, `${state.label} home`);
        if (lang === "fr") await screenshot(page, `home-${name}`);
        if (name === "desktop")
          await heroChecks(page, state.label, lang === "fr");
        await anchorCheck(
          page,
          page.locator('.hero-buttons a[href="#aventures"]'),
          "#aventures",
          state,
        );
        if (name === "mobile") {
          await menuChecks(page, lang, state);
          await navigate(
            page,
            page.locator(`.footer-nav a[href="${publicPath("buggy", lang)}"]`),
            "buggy",
            lang,
            state,
          );
        } else
          await navigate(
            page,
            page.locator(`.desktop-nav a[href="${publicPath("buggy", lang)}"]`),
            "buggy",
            lang,
            state,
          );
        await anchorCheck(
          page,
          page.locator('.hero-buttons a[href="#details"]'),
          "#details",
          state,
        );
        await navigate(
          page,
          page.locator(`.footer-nav a[href="${publicPath("gallery", lang)}"]`),
          "gallery",
          lang,
          state,
        );
        await scrollAll(page);
        await audit(page, "gallery", lang, `${state.label} gallery`);
        await galleryChecks(page, state);
        if (lang === "fr") await screenshot(page, `gallery-${name}`);
        console.log(
          `${state.label}: home/navigation/gallery complete (${report.failures.length} failures)`,
        );
      });
    }
    if (wants("active")) {
      state.label = `${name} language transitions`;
      await scenario(state.label, () => languageChecks(page, "gallery", state));
    }
    if (wants("booking")) {
      state.label = `${name} booking/back`;
      await scenario(state.label, async () => {
        if (new URL(page.url()).pathname !== publicPath("gallery", "fr"))
          await visit(page, "gallery", "fr", state);
        const headerBooking = page.locator(".header-actions > a.button");
        const booking = (await headerBooking.isVisible())
          ? headerBooking
          : page.locator(
              `.footer-nav a[href="${publicPath("contact", "fr")}"]`,
            );
        await navigate(page, booking, "contact", "fr", state);
        await Promise.all([
          page.waitForURL(
            (url) => url.pathname === publicPath("gallery", "fr"),
          ),
          page.goBack({ waitUntil: "load" }),
        ]);
        await ready(page);
        record(
          `${state.label}: Back restores gallery without veil`,
          new URL(page.url()).pathname === publicPath("gallery", "fr") &&
            !(await page
              .locator("body")
              .evaluate((body) => body.classList.contains("page-leaving"))),
        );
      });
    }
    await context.close();
  }
  if (process.env.PAGES_STATES !== "0") {
    for (const [name, width, height, lang] of [
      ["desktop", 1440, 1000, "fr"],
      ["mobile", 390, 844, "it"],
    ].filter(() => wants("reduced"))) {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: width < 500,
        hasTouch: width < 500,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const state = { label: `reduced ${name} ${lang}`, documents: 0 };
      listen(page, state);
      await scenario(state.label, async () => {
        await visit(page, "home", lang, state);
        await scrollAll(page);
        await audit(page, "home", lang, state.label);
        const sample = () =>
          page.evaluate(() => ({
            offsets: [
              ...document.querySelectorAll("[data-motion-parallax]"),
            ].map((element) =>
              getComputedStyle(element).getPropertyValue("--parallax-y").trim(),
            ),
            running: document
              .getAnimations()
              .filter((animation) => animation.playState === "running").length,
          }));
        const before = await sample();
        await page.evaluate(() => scrollTo({ top: 400, behavior: "instant" }));
        await frame(page);
        await pause(page, 300);
        const after = await sample();
        record(
          `${state.label}: parallax and animations static`,
          JSON.stringify(before.offsets) === JSON.stringify(after.offsets) &&
            after.running === 0,
          { before, after },
        );
        if (name === "desktop") {
          await page.locator("[data-hero-scene]").first().hover();
          await pause(page, 300);
          record(
            `${state.label}: hero hover remains static`,
            (await page.locator(".hero-scene.scene-visible").count()) === 0,
          );
        }
        await navigate(
          page,
          page.locator(`.footer-nav a[href="${publicPath("gallery", lang)}"]`),
          "gallery",
          lang,
          state,
        );
        await galleryChecks(page, state);
      });
      await context.close();
    }
    for (const [name, width, height, lang] of [
      ["desktop", 1440, 1000, "fr"],
      ["mobile", 390, 844, "it"],
    ].filter(() => wants("nojs"))) {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: width < 500,
        hasTouch: width < 500,
        javaScriptEnabled: false,
      });
      const page = await context.newPage();
      const state = { label: `no-JS ${name} ${lang}`, documents: 0 };
      listen(page, state);
      await scenario(state.label, async () => {
        await visit(page, "home", lang, state, false);
        await scrollAll(page);
        await audit(page, "home", lang, state.label);
        record(
          `${state.label}: fallback navigation visible`,
          await page.locator(".no-script-nav").isVisible(),
        );
        await Promise.all([
          page.waitForURL((url) => url.pathname === publicPath("buggy", lang)),
          page
            .locator(`.no-script-nav a[href="${publicPath("buggy", lang)}"]`)
            .click(),
        ]);
        record(
          `${state.label}: fallback buggy navigation`,
          new URL(page.url()).pathname === publicPath("buggy", lang),
        );
        await Promise.all([
          page.waitForURL(
            (url) => url.pathname === publicPath("gallery", lang),
          ),
          page
            .locator(`.footer-nav a[href="${publicPath("gallery", lang)}"]`)
            .click(),
        ]);
        await ready(page, false);
        await scrollAll(page);
        await audit(page, "gallery", lang, `${state.label} gallery`);
        const first = page.locator("a[data-gallery-item]").first();
        const imageUrl = new URL(await first.getAttribute("href"), page.url());
        await Promise.all([
          page.waitForURL((url) => url.pathname === imageUrl.pathname),
          first.click(),
        ]);
        await page.waitForFunction(
          () =>
            document.querySelector("img")?.complete &&
            document.querySelector("img")?.naturalWidth > 0,
        );
        record(
          `${state.label}: native photo opens under prefix`,
          new URL(page.url()).pathname.startsWith(assetsPath),
        );
        await Promise.all([
          page.waitForURL(
            (url) => url.pathname === publicPath("gallery", lang),
          ),
          page.goBack({ waitUntil: "load" }),
        ]);
        await Promise.all([
          page.waitForURL(
            (url) => url.pathname === publicPath("contact", lang),
          ),
          page
            .locator(`.footer-nav a[href="${publicPath("contact", lang)}"]`)
            .click(),
        ]);
        record(
          `${state.label}: Back and footer contact`,
          new URL(page.url()).pathname === publicPath("contact", lang),
        );
      });
      await context.close();
    }
  }
} catch (error) {
  record("browser execution", false, error.stack || String(error));
} finally {
  await browser.close();
  record(
    "zero escaped requests / HTTP / JavaScript errors",
    report.errors.length === 0,
    report.errors,
  );
  const requestedFonts = report.requests
    .filter((request) => request.type === "font")
    .map((request) => new URL(request.url).pathname);
  record(
    "font requests use mounted asset directory",
    requestedFonts.length >= 2 &&
      requestedFonts.every((pathname) =>
        pathname.startsWith(`${assetsPath}fonts/`),
      ),
    requestedFonts,
  );
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await writeFile(
    `${output}/summary.txt`,
    `${report.checks.length} checks; ${report.failures.length} failures; ${report.errors.length} browser errors.\n${report.failures.map((failure) => `${failure.label}: ${JSON.stringify(failure.detail)}`).join("\n")}\n`,
  );
}
console.log(
  JSON.stringify(
    {
      base: base.href,
      visits: report.visits.length,
      checks: report.checks.length,
      failures: report.failures,
      errors: report.errors,
      browserDiagnostics: report.browserDiagnostics,
      screenshots: report.screenshots,
      report: `${output}/report.json`,
    },
    null,
    2,
  ),
);
process.exitCode = report.failures.length ? 1 : 0;
