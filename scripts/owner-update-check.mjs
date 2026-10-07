/**
 * Optional QA for the owner's 7 October 2026 changes. No dependency is shipped.
 * PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/owner-update-check.mjs
 * BASE_URL, CHROME_PATH, OWNER_OUTPUT, OWNER_VIEWPORTS, OWNER_LANGS, OWNER_PAGES
 * may override defaults. OWNER_STATES=0 skips the additional reduced-motion runs.
 * OWNER_FOLLOWUP=1 adds focused French review/quad checks at the selected widths.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { languages, pathFor } from '../src/routes.mjs';
import { photos, gallery } from '../src/assets.mjs';
import { photoSources, photoProvenance } from './photo-sources.mjs';
import { reviewSelection, googleSummary } from '../src/reviews.mjs';

const content = Object.fromEntries(await Promise.all(languages.map(async lang =>
  [lang, (await import(`../src/content/${lang}.mjs`)).default])));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = (process.env.BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const output = process.env.OWNER_OUTPUT || '/private/tmp/corsica-owner-update-check';
const select = (name, values) => process.env[name] ? values.filter(value => process.env[name].split(',').includes(Array.isArray(value) ? value[0] : value)) : values;
const viewports = select('OWNER_VIEWPORTS', [['desktop', 1440, 1000], ['mobile', 390, 844], ['small', 320, 740]]);
const testedLanguages = select('OWNER_LANGS', languages);
const testedPages = select('OWNER_PAGES', ['home', 'buggy', 'quad', 'about', 'gallery']);
const report = { checkedAt: new Date().toISOString(), base, visits: [], checks: [], failures: [], errors: [], screenshots: [], observations: [] };
await mkdir(output, { recursive: true });
const record = (label, pass, detail = '') => {
  const check = { label, pass: Boolean(pass), detail };
  report.checks.push(check);
  if (!pass) { report.failures.push(check); console.log(`FAIL ${label}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`); }
};
const scenario = async (label, action) => {
  try { await action(); }
  catch (error) { record(label, false, error.stack || String(error)); }
};
const normalize = value => String(value || '').replace(/\s+/g, ' ').trim();
const headingText = value => String(value || '').replace(/\s+/g, '');
const frame = page => page.screenshot({ animations: 'allow' });
const pause = (page, milliseconds) => page.waitForTimeout(milliseconds);

function listen(page, state) {
  page.on('pageerror', error => report.errors.push({ scenario: state.label, url: page.url(), type: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push({ scenario: state.label, url: page.url(), type: 'console', message: message.text(), location: message.location() });
  });
  page.on('response', response => {
    if (response.status() >= 400 && response.url().startsWith(base)) report.errors.push({ scenario: state.label, url: response.url(), type: 'http', status: response.status() });
  });
  page.on('requestfailed', request => {
    if (!request.failure()?.errorText?.includes('ERR_ABORTED')) report.errors.push({ scenario: state.label, url: request.url(), type: 'requestfailed', message: request.failure()?.errorText });
  });
}

async function ready(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.documentElement.dataset.clientReady === 'true', null, { timeout: 10000 });
  await frame(page);
}

async function scrollAndLoad(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.max(300, Math.round(page.viewportSize().height * 0.65));
  for (let top = 0; top < height; top += step) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), top);
    await frame(page); // Rendered frames deliver rAF/IntersectionObserver on macOS headless.
    await pause(page, 20);
  }
  await page.waitForFunction(() => [...document.querySelectorAll('main img')].every(img => img.complete), null, { timeout: 15000 });
  await pause(page, 1900); // The final title/reveal transition lasts up to 1.6 seconds.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await frame(page);
  await pause(page, 100);
}

async function capture(page, name, locator) {
  const file = `${output}/${name}.png`;
  // Finishing animations for artifacts avoids Chrome omitting off-screen layers.
  // Every motion/visibility assertion runs before this temporary screenshot mode.
  if (locator) await locator.screenshot({ path: file, animations: 'disabled' });
  else await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  report.screenshots.push(file);
}

async function menuChecks(page, label) {
  const opener = page.locator('[data-menu-open]');
  if (!await opener.isVisible()) return;
  await opener.click();
  await frame(page);
  record(`${label}: menu opens`, await page.locator('#mobile-menu').evaluate(dialog => dialog.open));
  record(`${label}: menu expanded`, await opener.getAttribute('aria-expanded') === 'true');
  await page.keyboard.press('Tab');
  record(`${label}: menu first Tab stays inside`, await page.evaluate(() => document.querySelector('#mobile-menu').contains(document.activeElement)));
  await page.keyboard.press('Escape');
  await frame(page);
  record(`${label}: menu Escape restores focus`, await page.evaluate(() =>
    !document.querySelector('#mobile-menu').open && document.activeElement.matches('[data-menu-open]') && document.activeElement.getAttribute('aria-expanded') === 'false'));
}

async function reviewChecks(page, lang, label, screenshots = false) {
  const expected = [...reviewSelection].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.date.localeCompare(a.date));
  const panel = page.locator('[data-reviews]');
  await panel.scrollIntoViewIfNeeded();
  await frame(page);
  await pause(page, 1750);
  const audit = await panel.evaluate(element => {
    const track = element.querySelector('.reviews-track');
    return {
      cards: [...element.querySelectorAll('.google-review-card')].map(card => ({
        author: card.querySelector('h3')?.textContent.trim(), date: card.querySelector('time')?.dateTime,
        quote: card.querySelector('blockquote')?.textContent.trim(), source: card.querySelector('a')?.href,
        provenance: card.querySelector('.review-provenance')?.textContent,
      })),
      summary: element.querySelector('.google-summary')?.textContent,
      trackWidth: track.clientWidth, trackScrollWidth: track.scrollWidth,
      arrowsHidden: element.querySelector('.reviews-arrows').hidden,
      animationNames: [...element.querySelectorAll('*')].map(node => getComputedStyle(node).animationName).filter(name => name !== 'none'),
    };
  });
  record(`${label}: verified review cards`, audit.cards.length === expected.length && audit.cards.every((card, index) =>
    card.author === expected[index].author && card.date === expected[index].date && card.quote.includes(expected[index].excerpt[lang]) && card.source === expected[index].source), audit.cards);
  record(`${label}: review provenance translated`, audit.cards.every(card => card.provenance.includes(content[lang].reviews.provenance) && (lang === 'fr' || card.provenance.includes(content[lang].reviews.translation))));
  if (googleSummary) record(`${label}: Google summary without invented count`, normalize(audit.summary) === `${new Intl.NumberFormat(lang).format(Number(googleSummary.rating))}/5 · Google`, audit.summary);
  record(`${label}: no review autoplay`, audit.animationNames.length === 0, audit.animationNames);
  const hasOverflow = audit.trackScrollWidth > audit.trackWidth + 2;
  record(`${label}: review arrows match overflow`, audit.arrowsHidden !== hasOverflow, audit);
  if (hasOverflow) {
    const track = page.locator('.reviews-track');
    const before = await track.evaluate(element => element.scrollLeft);
    record(`${label}: review previous announces start boundary`, await page.locator('[data-review-prev]').getAttribute('aria-disabled') === 'true');
    await page.locator('[data-review-next]').click();
    await page.waitForFunction(previous => document.querySelector('.reviews-track').scrollLeft > previous + 20, before);
    await pause(page, 500);
    const next = await track.evaluate(element => element.scrollLeft);
    record(`${label}: review next scrolls`, next > before + 20, { before, next });
    record(`${label}: review next preserves focus`, await page.locator('[data-review-next]').evaluate(button => document.activeElement === button));
    await page.locator('[data-review-prev]').click();
    await page.waitForFunction(previous => document.querySelector('.reviews-track').scrollLeft < previous - 20, next);
    await pause(page, 500);
    record(`${label}: review previous returns`, await track.evaluate(element => element.scrollLeft < 5));
    record(`${label}: review previous boundary retains focus`, await page.locator('[data-review-prev]').evaluate(button => button.getAttribute('aria-disabled') === 'true' && document.activeElement === button && !button.disabled));
  }
  if (screenshots) await capture(page, `reviews-${label.replaceAll(/[^a-z0-9]+/gi, '-')}`, panel);
}

async function galleryChecks(page, lang, label) {
  for (const category of ['buggy', 'quad', 'corse', 'maisons', 'all']) {
    await page.locator(`[data-filter="${category}"]`).click();
    await frame(page);
    await pause(page, 600);
    const visible = await page.locator('a[data-gallery-item]:visible').evaluateAll(items => items.map(item => item.dataset.category));
    record(`${label}: gallery ${category} filter`, visible.length > 0 && (category === 'all' || visible.every(value => value === category)), visible.length);
    record(`${label}: gallery ${category} count`, (await page.locator('[data-gallery-count]').textContent()).includes(String(visible.length)));
  }
  await page.locator('[data-filter="quad"]').click();
  await pause(page, 650);
  const first = page.locator('a[data-gallery-item]:visible').first();
  const href = await first.getAttribute('href');
  await first.click();
  await page.waitForFunction(() => document.querySelector('#lightbox').open && document.querySelector('[data-lightbox-image]').complete && document.querySelector('[data-lightbox-image]').naturalWidth > 0);
  record(`${label}: lightbox selected photo`, (await page.locator('[data-lightbox-image]').getAttribute('src')).endsWith(href));
  await page.locator('[data-lightbox-next]').click();
  await page.waitForFunction(() => document.querySelector('[data-lightbox-image]').complete && document.querySelector('[data-lightbox-image]').naturalWidth > 0 && document.querySelector('[data-lightbox-counter]').textContent.startsWith('2 /'));
  record(`${label}: lightbox next`, (await page.locator('[data-lightbox-counter]').textContent()).startsWith('2 /'));
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => document.querySelector('[data-lightbox-counter]').textContent.startsWith('1 /'));
  record(`${label}: lightbox keyboard previous`, (await page.locator('[data-lightbox-counter]').textContent()).startsWith('1 /'));
  await page.keyboard.press('Escape');
  await frame(page);
  record(`${label}: lightbox Escape/focus`, await page.evaluate(selected => !document.querySelector('#lightbox').open && document.activeElement.getAttribute('href') === selected, href));
  await page.locator('[data-filter="all"]').click();
  await pause(page, 900);
}

async function commercialChecks(page, key, lang, label) {
  const t = content[lang];
  if (key === 'home') {
    const intro = await page.locator('.intro-images img').evaluateAll(images => images.map(img => ({ src: img.getAttribute('src'), alt: img.alt })));
    record(`${label}: distinct new intro photos`, intro.length === 2 && intro[0].src === photos.introMain?.src && intro[1].src === photos.introSmall?.src && intro[0].src !== intro[1].src, intro);
    record(`${label}: small intro is a quad`, intro[1]?.alt.toLowerCase().includes('quad'), intro[1]);
    record(`${label}: quad starts at 140`, await page.locator('.activity-card').nth(1).locator('.activity-price strong').textContent() === '140 €');
    record(`${label}: sunset links to third offer`, (await page.locator('.sunset-content .button').getAttribute('href')) === `${pathFor('buggy', lang)}#soir`);
  }
  if (key === 'about') {
    const src = await page.locator('.hero-image > img').getAttribute('src');
    const oldStory = photoSources.find(item => item.id === 'story' && item.file === 'IMG_8714.HEIC');
    record(`${label}: old story hero replaced`, src === photos.story.src && (!oldStory || !src.includes('/story-')), src);
  }
  if (key === 'buggy') {
    const offers = await page.locator('.buggy-offers > .offer-row').evaluateAll(rows => rows.map(row => ({
      id: row.id, title: row.querySelector('h3')?.textContent, duration: row.querySelector('.offer-heading .eyebrow')?.textContent,
      prices: [...row.querySelectorAll('.offer-prices td')].map(cell => Number(cell.textContent.replace(/[^\d]/g, ''))),
    })));
    record(`${label}: three buggy offers in order`, offers.length === 3 && offers.every((offer, index) => headingText(offer.title) === headingText(t.buggy.offers[index].name)), offers);
    record(`${label}: buggy durations 1h30 / 1h30 / 3h`, offers.length === 3 && offers.every((offer, index) => normalize(offer.duration) === normalize(t.buggy.offers[index].duration)) && /1\s*h\s*30/i.test(offers[0].duration) && /1\s*h\s*30/i.test(offers[1].duration) && /3\s*h/i.test(offers[2].duration), offers.map(offer => offer.duration));
    record(`${label}: owner buggy prices`, JSON.stringify(offers.map(offer => offer.prices)) === JSON.stringify([[180, 200, 210, 220], [180, 200, 210, 220], [260, 270, 280, 290]]), offers.map(offer => offer.prices));
    record(`${label}: sunset anchor is third offer`, offers[2]?.id === 'soir' && offers.slice(0, 2).every(offer => offer.id !== 'soir'));
    const tips = await page.locator('.packing-list > li').allTextContents();
    record(`${label}: eight practical tips`, tips.length === 8 && tips.every((tip, index) => normalize(tip) === normalize(t.buggy.conditions.at(-1).items[index])), tips);
    record(`${label}: no obsolete buggy SMS booking`, !/SMS|2\s*[–-]\s*3/.test(await page.locator('.conditions-grid').textContent()));
  }
  if (key === 'quad') {
    const steps = await page.locator('.process-steps > li').allTextContents();
    record(`${label}: five quad steps / 30 minutes`, steps.length === 5 && steps.some(text => /30\s*(?:minutes|minuti)/i.test(text)) && steps.every(text => !/45\s*(?:minutes|minuti)/i.test(text)), steps);
    const halfday = page.locator('.quad-offer').first();
    record(`${label}: both half-day time slots`, headingText(await halfday.locator('h3').textContent()) === headingText(t.quad.offers[0].duration), await halfday.locator('h3').textContent());
    const options = await halfday.locator('.quad-price-options > div').evaluateAll(items => items.map(item => ({ price: item.querySelector('.quad-price').textContent.trim(), people: item.querySelector('p:last-child').textContent.trim() })));
    record(`${label}: quad 140 one / 150 two`, options.length === 2 && normalize(options[0].price) === '140 €' && normalize(options[0].people) === `1 ${t.ui.person}` && normalize(options[1].price) === '150 €' && normalize(options[1].people) === `2 ${t.ui.people}`, options);
    const day = page.locator('.quad-offer').nth(1);
    record(`${label}: quad day 230 for two`, normalize(await day.locator('.quad-price').textContent()) === '230 €' && normalize(await day.locator('.small-text').textContent()).includes(t.quad.offers[1].time));
    const inclusion = await page.locator('.included-row').evaluate(element => {
      const style = getComputedStyle(element);
      const title = getComputedStyle(element.querySelector('strong'));
      return { items: [...element.querySelectorAll(':scope > span')].map(item => item.textContent.trim()), background: style.backgroundColor, paddingTop: parseFloat(style.paddingTop), paddingBottom: parseFloat(style.paddingBottom), weight: Number(title.fontWeight), border: style.borderTopWidth, rect: { width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height } };
    });
    record(`${label}: four inclusions visible`, inclusion.items.length === 4 && inclusion.items.every((item, index) => normalize(item) === normalize(t.quad.included[index])), inclusion);
    record(`${label}: inclusions visually emphasized`, inclusion.paddingTop >= 20 && inclusion.paddingBottom >= 20 && inclusion.weight >= 600 && inclusion.background !== 'rgba(0, 0, 0, 0)', inclusion);
    record(`${label}: quad hero uses new photo`, await page.locator('.hero-image > img').getAttribute('src') === photos.quadHero?.src);
  }
  if (key === 'gallery') {
    const hrefs = await page.locator('a[data-gallery-item]').evaluateAll(items => items.map(item => item.getAttribute('href')));
    const userPhotos = Object.entries(photoProvenance).filter(([, source]) => source.kind === 'user').map(([id]) => gallery.find(photo => photo.id === id)?.src);
    record(`${label}: gallery at least 46 photos`, hrefs.length >= 46 && hrefs.length === gallery.length, hrefs.length);
    record(`${label}: new owner photos in gallery`, userPhotos.length >= 12 && userPhotos.every(src => src && hrefs.includes(src)), { count: userPhotos.length, missing: userPhotos.filter(src => !src || !hrefs.includes(src)) });
    record(`${label}: translated Villas filter`, normalize(await page.locator('[data-filter="maisons"]').textContent()) === (lang === 'it' ? 'Ville' : 'Villas'));
  }
}

async function routeAudit(page, response, key, lang, label) {
  const audit = await page.evaluate(() => {
    const bounds = element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
    const visible = element => element.getClientRects().length && !element.closest('dialog:not([open]), [hidden]');
    const screenWidth = innerWidth;
    return {
      h1: document.querySelectorAll('h1').length, lang: document.documentElement.lang, width: screenWidth, scrollWidth: document.documentElement.scrollWidth,
      badImages: [...document.querySelectorAll('main img')].filter(img => !img.complete || !img.naturalWidth).map(img => img.currentSrc || img.src),
      missingAlt: [...document.querySelectorAll('img')].filter(img => !img.hasAttribute('alt')).length,
      pauseButtons: document.querySelectorAll('[data-motion-toggle]').length,
      header: [...document.querySelectorAll('.header-inner > .brand, .header-actions > *')].filter(visible).map(element => ({ selector: element.className, ...bounds(element) })),
      links: [...document.querySelectorAll('.language-picker .language-links a')].map(a => ({ lang: a.lang, href: a.getAttribute('href') })),
      reserve: document.querySelector('.header-actions > a.button')?.getAttribute('href'),
      hiddenReveals: [...document.querySelectorAll('[data-reveal]')].filter(visible).filter(element => Number(getComputedStyle(element).opacity) < .95).map(element => element.className),
      clippedTitles: [...document.querySelectorAll('.motion-line-inner')].filter(visible).filter(element => {
        const matrix = getComputedStyle(element).transform;
        return matrix !== 'none' && Math.abs(new DOMMatrixReadOnly(matrix).m42) > 2;
      }).map(element => element.textContent),
      oversized: [...document.querySelectorAll('main *')].filter(visible).filter(element => {
        if (element.closest('.reviews-track, .motion-drift-track, .motion-marquee-track, .motion-image-target') || element.matches('img, svg, path, .motion-image-target')) return false;
        const r = element.getBoundingClientRect(); return r.width > screenWidth + 2 && (r.left < -2 || r.right > screenWidth + 2);
      }).slice(0, 8).map(element => ({ tag: element.tagName, class: element.className, ...bounds(element) })),
    };
  });
  report.visits.push({ route: pathFor(key, lang), label, status: response?.status(), ...audit });
  record(`${label}: HTTP 200`, response?.status() === 200);
  record(`${label}: one H1 / document language`, audit.h1 === 1 && audit.lang === lang);
  record(`${label}: no horizontal overflow`, audit.scrollWidth <= audit.width + 1, { scrollWidth: audit.scrollWidth, viewport: audit.width, oversized: audit.oversized });
  record(`${label}: loaded images / alt text`, !audit.badImages.length && !audit.missingAlt, { badImages: audit.badImages, missingAlt: audit.missingAlt });
  record(`${label}: header inside viewport`, audit.header.every(item => item.left >= -1 && item.right <= audit.width + 1 && item.height > 0), audit.header);
  record(`${label}: header controls do not overlap`, audit.header.every((item, i) => audit.header.slice(i + 1).every(other => item.right <= other.left + 1 || other.right <= item.left + 1)), audit.header);
  record(`${label}: translated page language links`, audit.links.length === 3 && audit.links.every(link => link.href === pathFor(key, link.lang)));
  record(`${label}: reserve contact`, audit.reserve === pathFor('contact', lang));
  record(`${label}: no pause control`, audit.pauseButtons === 0);
  record(`${label}: all scrolled content revealed`, audit.hiddenReveals.length === 0 && audit.clippedTitles.length === 0, { hidden: audit.hiddenReveals, clipped: audit.clippedTitles });
  const serverTitles = await page.evaluate(async () => {
    const server = new DOMParser().parseFromString(await (await fetch(location.href)).text(), 'text/html');
    const text = doc => [...doc.querySelectorAll('main h1, main h2, main h3')].map(element => element.textContent.replace(/\s+/g, ' ').trim());
    return { server: text(server), client: text(document) };
  });
  record(`${label}: semantic titles preserve server text`, JSON.stringify(serverTitles.server) === JSON.stringify(serverTitles.client), serverTitles);
  await commercialChecks(page, key, lang, label);
}

async function languageChecks(page, key, label) {
  for (const lang of ['en', 'it', 'fr'].filter(lang => testedLanguages.includes(lang))) {
    if (new URL(page.url()).pathname === pathFor(key, lang)) continue;
    await page.locator('.language-picker summary').click();
    await Promise.all([
      page.waitForURL(url => url.pathname === pathFor(key, lang), { timeout: 15000 }),
      page.locator(`.language-picker a[lang="${lang}"]`).click(),
    ]);
    await ready(page);
    record(`${label}: language navigation ${lang}`, new URL(page.url()).pathname === pathFor(key, lang) && await page.locator('html').getAttribute('lang') === lang);
  }
}

async function reducedChecks(browser, viewport, lang) {
  const [name, width, height] = viewport;
  const label = `reduced ${name} ${lang}`;
  const context = await browser.newContext({ viewport: { width, height }, isMobile: width <= 390, hasTouch: width <= 390, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const state = { label };
  listen(page, state);
  await scenario(label, async () => {
    await page.goto(base + pathFor('home', lang), { waitUntil: 'load' });
    await ready(page);
    await scrollAndLoad(page);
    const sample = () => page.evaluate(() => ({
      offsets: [...document.querySelectorAll('[data-motion-parallax]')].map(element => getComputedStyle(element).getPropertyValue('--parallax-y').trim()),
      heroOffset: getComputedStyle(document.documentElement).getPropertyValue('--hero-offset').trim(),
      active: document.getAnimations().filter(animation => animation.playState === 'running').map(animation => ({ type: animation.constructor.name, name: animation.animationName || '' })),
      transforms: [...document.querySelectorAll('.motion-line-inner')].map(element => getComputedStyle(element).transform),
    }));
    const before = await sample();
    await page.evaluate(() => window.scrollTo({ top: 360, behavior: 'instant' }));
    await frame(page);
    await pause(page, 300);
    const after = await sample();
    record(`${label}: parallax remains static`, JSON.stringify(before.offsets) === JSON.stringify(after.offsets) && before.heroOffset === after.heroOffset, { before, after });
    record(`${label}: no running animations`, after.active.length === 0, after.active);
    record(`${label}: titles unclipped`, after.transforms.every(transform => transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)'), after.transforms);
    await reviewChecks(page, lang, label);
    const activeAfterReviews = await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length);
    record(`${label}: reviews preserve static motion preference`, activeAfterReviews === 0, activeAfterReviews);
  });
  await context.close();
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--disable-background-networking', '--disable-component-update'],
});
try {
  for (const viewport of viewports) {
    const [name, width, height] = viewport;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width <= 390, hasTouch: width <= 390 });
    const page = await context.newPage();
    const state = { label: name };
    listen(page, state);
    for (const lang of testedLanguages) {
      for (const key of testedPages) {
        const label = `${name} ${lang} ${key}`;
        state.label = label;
        await scenario(label, async () => {
          const response = await page.goto(base + pathFor(key, lang), { waitUntil: 'load' });
          await ready(page);
          await scrollAndLoad(page);
          await routeAudit(page, response, key, lang, label);
          if (key === 'home') {
            await menuChecks(page, label);
            await reviewChecks(page, lang, label, lang === 'fr' && name !== 'small');
          }
          if (key === 'gallery') await galleryChecks(page, lang, label);
          if (lang === 'fr' && ['desktop', 'mobile'].includes(name)) {
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
            await frame(page);
            await capture(page, `${key}-${name}`);
          }
          if (lang === 'fr' && name === 'small') {
            const file = `${output}/${key}-320-hero.png`;
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
            await frame(page);
            await page.screenshot({ path: file, animations: 'allow' });
            report.screenshots.push(file);
          }
          if (lang === 'fr' && key === 'quad' && process.env.OWNER_FOLLOWUP === '1') {
            await page.locator('.quad-offers-section').scrollIntoViewIfNeeded();
            await frame(page);
            await pause(page, 1900);
            await capture(page, `quad-offers-${name}-final`, page.locator('.quad-offers-section'));
          }
        });
        console.log(`${label}: checked (${report.failures.length} failures so far)`);
      }
    }
    for (const key of testedPages.filter(key => name === 'desktop' || key === 'home')) {
      state.label = `${name} ${key} language transitions`;
      await scenario(state.label, async () => {
        await page.goto(base + pathFor(key, 'fr'), { waitUntil: 'load' });
        await ready(page);
        await languageChecks(page, key, state.label);
      });
    }
    await context.close();
  }
  if (process.env.OWNER_FOLLOWUP === '1') {
    for (const [name, width, height] of viewports) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width <= 390, hasTouch: width <= 390 });
      const page = await context.newPage();
      const state = { label: `follow-up ${name} reviews` };
      listen(page, state);
      await scenario(state.label, async () => {
        await page.goto(base + pathFor('home', 'fr'), { waitUntil: 'load' });
        await ready(page);
        await scrollAndLoad(page);
        await reviewChecks(page, 'fr', state.label, true);
        record(`${state.label}: Google logo is an accessible image`, await page.locator('.google-word').getAttribute('role') === 'img');
      });
      if (!testedPages.includes('quad')) {
        state.label = `follow-up ${name} quad`;
        await scenario(state.label, async () => {
          await page.goto(base + pathFor('quad', 'fr'), { waitUntil: 'load' });
          await ready(page);
          await scrollAndLoad(page);
          await commercialChecks(page, 'quad', 'fr', state.label);
          await capture(page, `quad-${name}-final`);
          await page.locator('.quad-offers-section').scrollIntoViewIfNeeded();
          await frame(page);
          await pause(page, 1900);
          await capture(page, `quad-offers-${name}-final`, page.locator('.quad-offers-section'));
        });
      }
      await context.close();
    }
  }
  if (process.env.OWNER_STATES !== '0') for (const viewport of viewports.filter(([name]) => name !== 'small')) for (const lang of testedLanguages) await reducedChecks(browser, viewport, lang);
} catch (error) {
  record('browser execution', false, error.stack || String(error));
} finally {
  await browser.close();
  record('no browser JavaScript/network errors', report.errors.length === 0, report.errors);
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await writeFile(`${output}/summary.txt`, `${report.visits.length} page visits; ${report.checks.length} checks; ${report.failures.length} failures; ${report.errors.length} browser errors.\n${report.failures.map(failure => `${failure.label}: ${JSON.stringify(failure.detail)}`).join('\n')}\n`);
}
console.log(JSON.stringify({ visits: report.visits.length, checks: report.checks.length, failures: report.failures, errors: report.errors, screenshots: report.screenshots, report: `${output}/report.json` }, null, 2));
process.exitCode = report.failures.length ? 1 : 0;
