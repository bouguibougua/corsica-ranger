/**
 * Optional motion regression QA. Playwright is kept outside the website.
 * PLAYWRIGHT_MODULE=/private/tmp/corsica-tools/node_modules/playwright-core/index.mjs \
 *   node scripts/motion-check.mjs
 * BASE_URL, CHROME_PATH, MOTION_OUTPUT, MOTION_MODES and MOTION_PAGES are optional.
 * Run against a fresh build served locally. Screenshots preserve animations.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { pages, pathFor } from '../src/routes.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const output = process.env.MOTION_OUTPUT || '/private/tmp/corsica-motion-check';
const modes = ['active', 'reduced', 'nojs'].filter(mode =>
  !process.env.MOTION_MODES || process.env.MOTION_MODES.split(',').includes(mode));
const checkedPages = pages.filter(page =>
  !process.env.MOTION_PAGES || process.env.MOTION_PAGES.split(',').includes(page));
const report = { base, modes, visits: [], checks: [], failures: [], errors: [], screenshots: [] };
const record = (label, pass, detail = '') => {
  const result = { label, pass: Boolean(pass), detail };
  report.checks.push(result);
  if (!pass) report.failures.push(result);
};
async function scenario(label, run) {
  try { await run(); }
  catch (error) { record(label, false, error.stack || String(error)); }
}
await mkdir(output, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--disable-background-networking', '--disable-component-update']
});
const frame = async (page, delay = 80) => {
  await page.waitForTimeout(delay);
  // A rendered frame is needed for some macOS headless observer/rAF updates.
  await page.screenshot({ animations: 'allow' });
};

async function scrollThrough(page) {
  const step = Math.max(260, Math.round(page.viewportSize().height * 0.65));
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += step) {
    await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
    await frame(page);
  }
  await frame(page, 1750);
  // Return to the hero so intentional scroll-linked hero fading is reset.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await frame(page, 250);
}

async function auditContent(page, source) {
  return page.evaluate(html => {
    const normalise = text => text.replace(/\s+/g, '');
    const original = new DOMParser().parseFromString(html, 'text/html');
    const semanticText = root => {
      const walker = document.createTreeWalker(root.querySelector('main'), NodeFilter.SHOW_TEXT);
      let text = '';
      while (walker.nextNode()) {
        if (!walker.currentNode.parentElement.closest('[aria-hidden="true"]')) text += walker.currentNode.textContent;
      }
      return normalise(text);
    };
    const headings = root => [...root.querySelectorAll('main h1, main h2, main h3')]
      .map(heading => ({ tag: heading.tagName, text: normalise(heading.textContent) }));
    const hidden = [...document.querySelectorAll('[data-reveal], main h1, main h2, main h3, main .motion-line-inner, main .hero-description, main .button')]
      .filter(element => {
        if (element.closest('[hidden], [aria-hidden="true"], dialog:not([open])')) return false;
        const box = element.getBoundingClientRect();
        if (!box.width || !box.height) return true;
        if (element.matches('.motion-line-inner')) {
          const transform = getComputedStyle(element).transform;
          if (transform !== 'none' && Math.abs(new DOMMatrixReadOnly(transform).m42) > box.height * 0.8) return true;
        }
        for (let parent = element; parent && parent !== document.body; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (style.display === 'none') return true;
          if (Number(style.opacity) <= 0.01 || style.visibility === 'hidden' ||
              /^inset\(100%/.test(style.clipPath)) return true;
          if (parent !== element) {
            const clip = parent.getBoundingClientRect();
            if (/hidden|clip/.test(style.overflowY) && Math.min(box.bottom, clip.bottom) - Math.max(box.top, clip.top) <= 1) return true;
            if (/hidden|clip/.test(style.overflowX) && Math.min(box.right, clip.right) - Math.max(box.left, clip.left) <= 1) return true;
          }
        }
        return false;
      }).map(element => ({ tag: element.tagName, class: element.className,
        text: element.textContent.trim().slice(0, 90), opacity: getComputedStyle(element).opacity }));
    const delayMetadata = [...document.querySelectorAll('main [data-reveal], main [data-motion], main [class*="motion-"], main [class*="reveal-"]')]
      .map(element => {
        const style = getComputedStyle(element);
        return { class: element.className, transition: style.transitionDelay,
          animation: style.animationDelay, inline: element.getAttribute('style') || '' };
      });
    const effectiveDelayed = delayMetadata.filter(item =>
      /(?:^|[,\s])(?:0\.\d*[1-9]\d*|[1-9]\d*(?:\.\d+)?)m?s/.test(item.transition + ' ' + item.animation));
    const delayed = delayMetadata.filter(item => effectiveDelayed.includes(item) ||
      /--[^:;]*(?:delay|stagger)\s*:\s*(?!0(?:m?s)?(?:;|$))/.test(item.inline));
    return {
      hidden,
      headingsIntact: JSON.stringify(headings(document)) === JSON.stringify(headings(original)),
      beforeHeadings: headings(original), afterHeadings: headings(document),
      h1: document.querySelectorAll('main h1').length,
      mainTextIntact: semanticText(document) === semanticText(original),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      runningAnimations: document.getAnimations().filter(animation => animation.playState === 'running').length,
      delayed,
      effectiveDelayed,
      revealCount: document.querySelectorAll('[data-reveal]').length,
      pendingCount: document.querySelectorAll('.reveal-pending').length,
      motionEnabled: document.documentElement.classList.contains('motion-ready'),
      noMapBeforeConsent: !document.querySelector('iframe'),
      badImages: [...document.querySelectorAll('main img')].filter(image =>
        image.getAttribute('src') && image.complete && !image.naturalWidth).map(image => image.src)
    };
  }, source);
}

async function parallaxState(page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-motion-parallax]')].slice(0, 8).map(element => {
    const style = getComputedStyle(element);
    return { selector: element.tagName + '.' + element.className,
      parallaxY: style.getPropertyValue('--parallax-y') };
  }));
}

async function parallaxCheck(page, label, mode) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await frame(page, 150);
  const before = await parallaxState(page);
  await page.evaluate(() => window.scrollTo({ top: 320, behavior: 'instant' }));
  await frame(page, 250);
  const after = await parallaxState(page);
  const changed = JSON.stringify(before) !== JSON.stringify(after);
  record(`${label}: ${mode === 'active' ? 'parallax updates on scroll' : 'parallax remains static'}`,
    mode === 'active' ? changed : !changed, { before, after });
}

async function heroSceneCheck(page, label, mode) {
  const control = page.locator('[data-hero-scene]').first();
  if (!await control.isVisible() || page.viewportSize().width < 1000) return;
  const before = await page.locator('.hero-scene.scene-visible').count();
  await control.hover();
  if (mode === 'active') {
    await page.waitForFunction(() => [...document.querySelectorAll('.hero-scene')]
      .some(image => image.complete && image.naturalWidth && image.classList.contains('scene-visible')));
    await frame(page, 700);
    record(`${label}: hero hover crossfade`, await page.locator('.hero-scene.scene-visible').evaluateAll(images =>
      images.length === 1 && Number(getComputedStyle(images[0]).opacity) > 0.1));
    record(`${label}: hero hover images remain decorative`, await page.locator('.hero-scene').evaluateAll(images =>
      images.every(image => image.alt === '' && image.getAttribute('aria-hidden') === 'true')));
  } else {
    await frame(page, 700);
    record(`${label}: hero scene stays static`, await page.locator('.hero-scene.scene-visible').count() === before);
  }
  await page.mouse.move(15, 15);
  await frame(page, 120);
  record(`${label}: hero scene hover restores base`, await page.locator('.hero-scene.scene-visible').count() === 0);
}

async function menuCheck(page, label) {
  const opener = page.locator('[data-menu-open]');
  if (!await opener.isVisible()) return;
  await opener.click();
  await frame(page, 250);
  record(`${label}: mobile menu opens`, await page.locator('#mobile-menu').evaluate(menu => menu.open));
  record(`${label}: menu expanded state`, await opener.getAttribute('aria-expanded') === 'true');
  const focusableCount = await page.locator('#mobile-menu a[href], #mobile-menu button:not([disabled])').count();
  for (const key of ['Tab', 'Shift+Tab']) {
    let focusContained = true;
    for (let index = 0; index < focusableCount + 2; index++) {
      await page.keyboard.press(key);
      focusContained &&= await page.evaluate(() => document.querySelector('#mobile-menu').contains(document.activeElement) || (document.activeElement.tagName === 'BODY' && !document.hasFocus()));
    }
    record(`${label}: full ${key} cycle stays in menu`, focusContained);
  }
  await page.keyboard.press('Escape');
  await frame(page, 250);
  record(`${label}: menu Escape and focus restoration`, await page.evaluate(() =>
    !document.querySelector('#mobile-menu').open && document.activeElement.matches('[data-menu-open]') &&
    document.activeElement.getAttribute('aria-expanded') === 'false'));
}

async function galleryCheck(page, label, mode) {
  await page.goto(base + pathFor('gallery', 'fr'), { waitUntil: 'load' });
  await scrollThrough(page);
  if (mode === 'nojs') {
    const first = page.locator('[data-gallery-item]').first();
    const href = await first.getAttribute('href');
    await Promise.all([page.waitForURL(url => url.pathname === href), first.click()]);
    record(`${label}: no-JS gallery opens the original image`, new URL(page.url()).pathname === href);
    await page.goBack({ waitUntil: 'load' });
    return;
  }
  await page.locator('[data-filter="buggy"]').click();
  const first = page.locator('[data-gallery-item]:visible').first();
  const href = await first.getAttribute('href');
  await first.click();
  await frame(page, 200);
  record(`${label}: lightbox opens`, await page.locator('#lightbox').evaluate(dialog => dialog.open));
  record(`${label}: lightbox selected image`, (await page.locator('[data-lightbox-image]').getAttribute('src')).endsWith(href));
  await page.waitForFunction(() => {
    const image = document.querySelector('[data-lightbox-image]');
    return image.complete && image.naturalWidth > 0;
  });
  record(`${label}: lightbox image loads`, true);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => {
    const image = document.querySelector('[data-lightbox-image]');
    return image.complete && image.naturalWidth > 0;
  });
  record(`${label}: lightbox keyboard next`, (await page.locator('[data-lightbox-counter]').textContent()).startsWith('2 /'));
  await page.locator('[data-lightbox-prev]').click();
  record(`${label}: lightbox previous`, (await page.locator('[data-lightbox-counter]').textContent()).startsWith('1 /'));
  await page.locator('[data-lightbox-image]').dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 19, clientX: 280, clientY: 230 });
  await page.locator('[data-lightbox-image]').dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 19, clientX: 110, clientY: 233 });
  record(`${label}: lightbox touch next`, (await page.locator('[data-lightbox-counter]').textContent()).startsWith('2 /'));
  await page.keyboard.press('Escape');
  await frame(page, 150);
  record(`${label}: lightbox Escape restores focus`, await page.evaluate(expected =>
    !document.querySelector('#lightbox').open && document.activeElement.getAttribute('href') === expected, href));
  await page.locator('[data-filter="maisons"]').click();
  record(`${label}: filters still work after lightbox`, await page.locator('[data-gallery-item]:visible').evaluateAll(items =>
    items.length > 0 && items.every(item => item.dataset.category === 'maisons')));
}

async function navigationCheck(page, label, mode) {
  await page.goto(base + pathFor('home', 'fr'), { waitUntil: 'load' });
  await frame(page, 850);
  if (mode === 'nojs') {
    const fallback = page.locator('.no-script-nav a[href="/buggy/"]').first();
    record(`${label}: no-JS navigation is visible`, await fallback.isVisible());
    await Promise.all([page.waitForURL(base + pathFor('buggy', 'fr')), fallback.click()]);
    record(`${label}: no-JS navigation works`, new URL(page.url()).pathname === pathFor('buggy', 'fr'));
    await Promise.all([page.waitForURL(base + pathFor('home', 'fr')), page.goBack({ waitUntil: 'load' })]);
  }
  await page.locator('.hero-buttons a').first().click();
  await page.waitForFunction(() => location.hash === '#aventures');
  await frame(page, 500);
  record(`${label}: native anchor navigation`, new URL(page.url()).hash === '#aventures');
  await Promise.all([
    page.waitForURL(base + pathFor('contact', 'fr'), { waitUntil: 'load' }),
    page.locator('.site-footer .footer-nav a[href="/contact/"]').click()
  ]);
  await frame(page, 700);
  record(`${label}: interpage booking navigation`, new URL(page.url()).pathname === pathFor('contact', 'fr'));
  record(`${label}: call and email targets preserved`, await page.evaluate(() =>
    Boolean(document.querySelector('a[href="tel:+33495703620"]')) &&
    Boolean(document.querySelector('a[href="tel:+33680437013"]')) &&
    Boolean(document.querySelector('a[href^="mailto:corsicaranger2a@gmail.com"]'))));
  record(`${label}: map stays opt-in`, await page.locator('iframe').count() === 0);
  if (mode !== 'nojs') {
    await page.route('**://maps.google.com/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Map test</title>' }));
    await page.locator('[data-map-load]').click();
    record(`${label}: map can still be requested`, await page.locator('iframe').count() === 1);
  }
  await Promise.all([
    page.waitForURL(url => url.pathname === pathFor('home', 'fr'), { waitUntil: 'load' }),
    page.goBack({ waitUntil: 'load' })
  ]);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await frame(page, 700);
  record(`${label}: browser Back restores visible content`, await page.locator('main h1').evaluate(element => {
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      if (Number(getComputedStyle(ancestor).opacity) <= 0.01) return false;
    }
    return true;
  }));
  const faq = page.locator('.faq-item').first();
  await faq.locator('summary').click();
  record(`${label}: FAQ remains operable`, await faq.evaluate(details => details.open));
  await faq.locator('summary').click();
  for (const lang of ['en', 'it']) {
    await page.locator('.language-picker summary').click();
    await Promise.all([
      page.waitForURL(base + pathFor('home', lang), { waitUntil: 'load' }),
      page.locator(`.language-picker a[lang="${lang}"]`).click()
    ]);
    await frame(page, 700);
    record(`${label}: language navigation ${lang}`, await page.locator('html').getAttribute('lang') === lang);
    const source = await (await fetch(base + pathFor('home', lang))).text();
    const audit = await auditContent(page, source);
    record(`${label}: animated ${lang} titles keep semantic text`, audit.headingsIntact);
  }
}

async function missingCoreCheck() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  await page.route('**/assets/client.js', route => route.fulfill({ status: 404,
    contentType: 'application/javascript', body: '/* Simulated core script failure. */' }));
  page.on('pageerror', error => report.errors.push({ route: 'missing-core', message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error' && !message.location().url.endsWith('/assets/client.js'))
      report.errors.push({ route: 'missing-core', message: message.text() });
  });
  const response = await page.goto(base + pathFor('home', 'fr'), { waitUntil: 'load' });
  const source = await response.text();
  await scrollThrough(page);
  const audit = await auditContent(page, source);
  record('missing-core: content stays visible', audit.hidden.length === 0, audit.hidden);
  record('missing-core: masking motion is never activated', !audit.motionEnabled);
  record('missing-core: semantic headings survive', audit.headingsIntact);
  const screenshot = `${output}/home-desktop-missing-core.png`;
  await page.screenshot({ path: screenshot, fullPage: true, animations: 'allow' });
  report.screenshots.push(screenshot);
  const first = page.locator('[data-gallery-item]').first();
  const href = await first.getAttribute('href');
  await Promise.all([page.waitForURL(url => url.pathname === href), first.click()]);
  record('missing-core: gallery retains its image link fallback', new URL(page.url()).pathname === href);
  await context.close();
}

try {
  for (const [viewport, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    for (const mode of modes) {
      const context = await browser.newContext({ viewport: { width, height },
        isMobile: viewport === 'mobile', hasTouch: viewport === 'mobile',
        javaScriptEnabled: mode !== 'nojs', reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      let currentRoute = '';
      page.on('pageerror', error => report.errors.push({ viewport, mode, route: currentRoute, message: error.message }));
      page.on('console', message => {
        if (message.type() === 'error') report.errors.push({ viewport, mode, route: currentRoute, message: message.text() });
      });
      for (const key of checkedPages) {
        currentRoute = pathFor(key, 'fr');
        const label = `${viewport} ${mode} ${currentRoute}`;
        await scenario(`${label}: execution`, async () => {
        const response = await page.goto(base + currentRoute, { waitUntil: 'load' });
        const source = await response.text();
        await page.evaluate(() => document.fonts.ready);
        await frame(page, 850);
        record(`${label}: HTTP 200`, response.status() === 200);
        if (key === 'home') {
          await heroSceneCheck(page, label, mode);
          await parallaxCheck(page, label, mode);
        }
        await scrollThrough(page);
        const audit = await auditContent(page, source);
        report.visits.push({ label, ...audit });
        record(`${label}: no hidden final content`, audit.hidden.length === 0, audit.hidden);
        record(`${label}: one semantic H1`, audit.h1 === 1);
        record(`${label}: heading text remains intact`, audit.headingsIntact,
          audit.headingsIntact ? '' : { before: audit.beforeHeadings, after: audit.afterHeadings });
        record(`${label}: all main text remains intact`, audit.mainTextIntact);
        record(`${label}: no horizontal overflow`, audit.overflow <= 1, audit.overflow);
        record(`${label}: no broken images`, audit.badImages.length === 0, audit.badImages);
        record(`${label}: map not loaded automatically`, audit.noMapBeforeConsent);
        if (mode === 'reduced') record(`${label}: no running motion`, audit.runningAnimations === 0, audit.runningAnimations);
        if (mode === 'nojs') record(`${label}: content does not depend on motion JS`, !audit.motionEnabled);
        if (key === 'home') {
          if (mode === 'active') {
            const staggerValues = new Set(audit.delayed.map(item =>
              item.inline.match(/--motion-delay\s*:\s*([^;]+)/)?.[1] || item.transition || item.animation));
            record(`${label}: reveal stagger configured`, audit.delayed.length > 1 && staggerValues.size > 1, audit.delayed.slice(0, 12));
          }
          else record(`${label}: no delayed motion`, audit.effectiveDelayed.length === 0, audit.effectiveDelayed.slice(0, 12));
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          await frame(page, 650);
          const screenshot = `${output}/home-${viewport}-${mode}.png`;
          await page.screenshot({ path: screenshot, fullPage: true, animations: 'allow' });
          report.screenshots.push(screenshot);
          if (mode !== 'nojs') await menuCheck(page, label);
        }
        });
      }
      record(`${viewport} ${mode}: removed pause control stays absent`, await page.locator('[data-motion-toggle]').count() === 0);
      await scenario(`${viewport} ${mode}: gallery execution`, () => galleryCheck(page, `${viewport} ${mode}`, mode));
      await scenario(`${viewport} ${mode}: navigation execution`, () => navigationCheck(page, `${viewport} ${mode}`, mode));
      if (mode === 'active') {
        await scenario(`${viewport}: live reduced-motion execution`, async () => {
        await page.goto(base + pathFor('home', 'it'), { waitUntil: 'load' });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await frame(page, 350);
        await parallaxCheck(page, `${viewport}: live reduced-motion`, 'reduced');
        await scrollThrough(page);
        const source = await (await fetch(base + pathFor('home', 'it'))).text();
        const audit = await auditContent(page, source);
        record(`${viewport}: live reduced-motion change reveals content`, audit.hidden.length === 0, audit.hidden);
        record(`${viewport}: live reduced-motion stops animation`, audit.runningAnimations === 0, audit.runningAnimations);
        });
      }
      await context.close();
      console.log(`${viewport} ${mode}: ${checkedPages.length} pages and core flows checked; ${report.failures.length} failures so far`);
    }
  }
  await scenario('missing-core: execution', missingCoreCheck);
} catch (error) {
  report.failures.push({ label: 'motion execution', pass: false, detail: error.stack || String(error) });
} finally {
  await browser.close();
  if (report.errors.length) report.failures.push({ label: 'console/page errors', pass: false, detail: report.errors });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ visits: report.visits.length, checks: report.checks.length,
  failures: report.failures, errors: report.errors, screenshots: report.screenshots }, null, 2));
process.exitCode = report.failures.length ? 1 : 0;
