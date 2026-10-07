/**
 * Optional browser QA; no browser dependency is shipped with the website.
 * PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/browser-check.mjs
 * BASE_URL, CHROME_PATH and CHECK_OUTPUT may override the defaults below.
 * CHECK_VIEWPORTS=mobile,small limits a follow-up to the changed layouts.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { languages, pages, pathFor } from '../src/routes.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const output = process.env.CHECK_OUTPUT || '/private/tmp/corsica-check';
await mkdir(output, { recursive: true });
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    if ((await fetch(base)).ok) break;
  } catch { /* Preview may still be starting. */ }
  if (attempt === 29) throw new Error(`Preview unavailable: ${base}`);
  await new Promise(resolve => setTimeout(resolve, 500));
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--disable-background-networking', '--disable-component-update']
});
const report = { base, visits: [], interactions: [], failures: [], screenshots: [], consoleErrors: [] };
const record = (label, pass, detail = '') => {
  const result = { label, pass: Boolean(pass), detail };
  report.interactions.push(result);
  if (!pass) report.failures.push(result);
};
const frame = page => page.screenshot({ animations: 'disabled' });

async function scrollAndLoad(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.max(400, Math.round(page.viewportSize().height * 0.75));
  for (let top = 0; top < height; top += step) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), top);
    await frame(page); // Native events/rAF need rendered frames on some macOS headless hosts.
  }
  await page.waitForFunction(() => [...document.querySelectorAll('main img')]
    .every(img => img.complete), null, { timeout: 10000 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await frame(page);
}

async function menuChecks(page, label) {
  const opener = page.locator('[data-menu-open]');
  if (!await opener.isVisible()) return;
  await opener.click();
  await frame(page);
  record(`${label}: menu opens`, await page.locator('#mobile-menu').evaluate(dialog => dialog.open));
  record(`${label}: menu expanded`, await opener.getAttribute('aria-expanded') === 'true');
  await page.keyboard.press('Escape');
  await frame(page);
  record(`${label}: menu Escape/focus`, await page.evaluate(() =>
    !document.querySelector('#mobile-menu').open &&
    document.activeElement.matches('[data-menu-open]') &&
    document.activeElement.getAttribute('aria-expanded') === 'false'));
}

async function galleryChecks(page, lang) {
  const label = `${lang} gallery 390`;
  await page.goto(base + pathFor('gallery', lang), { waitUntil: 'load' });
  await page.locator('[data-filter="buggy"]').click();
  await frame(page);
  const visible = await page.locator('a[data-gallery-item]:visible').count();
  record(`${label}: category filter`, visible > 0 && await page.locator('a[data-gallery-item]:visible')
    .evaluateAll(items => items.every(item => item.dataset.category === 'buggy')));
  record(`${label}: translated count`, (await page.locator('[data-gallery-count]').textContent()).includes(String(visible)));
  const first = page.locator('a[data-gallery-item]:visible').first();
  const firstHref = await first.getAttribute('href');
  await first.click();
  await frame(page);
  record(`${label}: lightbox open`, await page.locator('#lightbox').evaluate(dialog => dialog.open));
  record(`${label}: selected image`, (await page.locator('[data-lightbox-image]').getAttribute('src')).endsWith(firstHref));
  if (visible > 1) {
    await page.locator('[data-lightbox-next]').click();
    record(`${label}: next`, (await page.locator('[data-lightbox-counter]').textContent()).startsWith('2 /'));
    await page.keyboard.press('ArrowLeft');
    record(`${label}: keyboard previous`, (await page.locator('[data-lightbox-counter]').textContent()).startsWith('1 /'));
    await page.locator('[data-lightbox-image]').dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 7, clientX: 250, clientY: 250 });
    await page.locator('[data-lightbox-image]').dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 7, clientX: 120, clientY: 255 });
    record(`${label}: touch next`, (await page.locator('[data-lightbox-counter]').textContent()).startsWith('2 /'));
    await page.locator('[data-lightbox-prev]').click();
    record(`${label}: previous button`, (await page.locator('[data-lightbox-counter]').textContent()).startsWith('1 /'));
  }
  await page.keyboard.press('Escape');
  await frame(page);
  record(`${label}: Escape restores focus`, await page.evaluate(href =>
    !document.querySelector('#lightbox').open && document.activeElement.getAttribute('href') === href, firstHref));
  await first.click();
  await frame(page);
  await page.mouse.click(3, 3);
  await frame(page);
  record(`${label}: backdrop closes`, await page.locator('#lightbox').evaluate(dialog => !dialog.open));
  if (await page.locator('#lightbox').evaluate(dialog => dialog.open)) {
    await page.locator('[data-lightbox-close]').click();
    await frame(page);
  }
  for (const category of ['quad', 'corse', 'maisons', 'all']) {
    await page.locator(`[data-filter="${category}"]`).click();
    const categories = await page.locator('a[data-gallery-item]:visible').evaluateAll(items => items.map(item => item.dataset.category));
    record(`${label}: ${category} filter`, categories.length > 0 && (category === 'all' || categories.every(value => value === category)));
  }
}

try {
  const viewports = [['desktop', 1440, 1000], ['laptop', 1280, 800], ['tablet', 768, 1024], ['mobile', 390, 844], ['small', 320, 740]]
    .filter(([label]) => !process.env.CHECK_VIEWPORTS || process.env.CHECK_VIEWPORTS.split(',').includes(label));
  for (const [label, width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width <= 768, hasTouch: width <= 768 });
    const page = await context.newPage();
    let route = '';
    page.on('pageerror', error => report.consoleErrors.push({ route, width, message: error.message }));
    page.on('console', message => {
      if (message.type() === 'error') report.consoleErrors.push({ route, width, message: message.text() });
    });
    for (const lang of languages) {
      for (const key of pages) {
        route = pathFor(key, lang);
        const response = await page.goto(base + route, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        await scrollAndLoad(page);
        const audit = await page.evaluate(() => ({
          h1: document.querySelectorAll('h1').length,
          lang: document.documentElement.lang,
          width: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          badImages: [...document.querySelectorAll('main img')].filter(img => !img.complete || !img.naturalWidth).map(img => img.currentSrc || img.src),
          languageLinks: [...document.querySelectorAll('.language-picker .language-links a')].map(a => ({ lang: a.lang, href: a.getAttribute('href') })),
          reserve: document.querySelector('.header-actions>a.button')?.getAttribute('href'),
          tel: [...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href')),
          email: [...document.querySelectorAll('a[href^="mailto:"]')].map(a => a.getAttribute('href')),
          iframes: document.querySelectorAll('iframe').length,
          missingAlt: [...document.querySelectorAll('img')].filter(img => !img.hasAttribute('alt')).length
        }));
        const result = { route, viewport: label, status: response.status(), ...audit };
        report.visits.push(result);
        const prefix = `${label} ${route}`;
        record(`${prefix}: HTTP 200`, response.status() === 200);
        record(`${prefix}: one H1`, audit.h1 === 1);
        record(`${prefix}: document language`, audit.lang === lang);
        record(`${prefix}: no horizontal overflow`, audit.scrollWidth <= audit.width + 1, `${audit.scrollWidth}/${audit.width}`);
        record(`${prefix}: image loading`, audit.badImages.length === 0, audit.badImages.join(', '));
        record(`${prefix}: image alt`, audit.missingAlt === 0);
        record(`${prefix}: same page languages`, audit.languageLinks.length === 3 && audit.languageLinks.every(link => link.href === pathFor(key, link.lang)));
        record(`${prefix}: reserve contact`, audit.reserve === pathFor('contact', lang));
        record(`${prefix}: official call/email`, audit.tel.includes('tel:+33495703620') && audit.tel.includes('tel:+33680437013') && audit.email.includes('mailto:corsicaranger2a@gmail.com'));
        record(`${prefix}: no map before consent`, audit.iframes === 0);
        if (key === 'home') await menuChecks(page, prefix);
        const faq = page.locator('.faq-item').first();
        if (await faq.count()) {
          await faq.locator('summary').click();
          record(`${prefix}: FAQ opens`, await faq.evaluate(details => details.open));
          await faq.locator('summary').click();
        }
        if (lang === 'fr' && ['desktop', 'mobile'].includes(label) && ['home', 'buggy', 'quad'].includes(key)) {
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          await frame(page);
          for (const fullPage of [false, true]) {
            const file = `${output}/${key}-${label}-${fullPage ? 'full' : 'hero'}.png`;
            await page.screenshot({ path: file, fullPage, animations: 'disabled' });
            report.screenshots.push(file);
          }
        }
      }
    }
    console.log(`${label}: 27 pages checked (${report.failures.length} failures so far)`);
    if (width === 390) for (const lang of languages) await galleryChecks(page, lang);
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  for (const key of pages) {
    await page.goto(base + pathFor(key, 'fr'), { waitUntil: 'load' });
    for (const lang of ['en', 'it', 'fr']) {
      await page.locator('.language-picker summary').click();
      await page.locator(`.language-picker a[lang="${lang}"]`).click();
      record(`${key}: navigate to ${lang}`, new URL(page.url()).pathname === pathFor(key, lang) && await page.locator('html').getAttribute('lang') === lang);
    }
  }
  await context.close();
} catch (error) {
  report.failures.push({ label: 'browser execution', detail: error.stack || String(error) });
} finally {
  await browser.close();
  if (report.consoleErrors.length) report.failures.push({ label: 'console errors', detail: report.consoleErrors });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify({ visits: report.visits.length, checks: report.interactions.length, failures: report.failures, consoleErrors: report.consoleErrors, screenshots: report.screenshots }, null, 2));
process.exitCode = report.failures.length ? 1 : 0;
