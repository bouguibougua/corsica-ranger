/**
 * Optional accessibility audit. Tools remain outside website dependencies.
 * PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
 * AXE_MODULE=/path/to/@axe-core/playwright/dist/index.mjs node scripts/accessibility-check.mjs
 * BASE_URL, CHROME_PATH and A11Y_OUTPUT may override the local defaults.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { pages, pathFor } from '../src/routes.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { default: AxeBuilder } = await import(process.env.AXE_MODULE || '@axe-core/playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const output = process.env.A11Y_OUTPUT || '/private/tmp/corsica-check/accessibility';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--disable-background-networking', '--disable-component-update']
});
const report = { base, scans: [], keyboard: [], failures: [] };
const frame = page => page.screenshot({ animations: 'disabled' });
const record = (label, pass, detail = '') => {
  const result = { label, pass: Boolean(pass), detail };
  report.keyboard.push(result);
  if (!pass) report.failures.push(result);
};

async function scan(page, label) {
  await frame(page);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  const simplify = rule => ({
    id: rule.id, impact: rule.impact, description: rule.description,
    help: rule.help, helpUrl: rule.helpUrl,
    nodes: rule.nodes.map(node => ({
      target: node.target, html: node.html, failureSummary: node.failureSummary,
      any: node.any, all: node.all, none: node.none
    }))
  });
  report.scans.push({ label, violations: result.violations.map(simplify), incomplete: result.incomplete.map(simplify), passes: result.passes.length });
  for (const violation of result.violations) {
    report.failures.push({ label, rule: violation.id, impact: violation.impact,
      targets: violation.nodes.map(node => ({ target: node.target, failureSummary: node.failureSummary })) });
  }
  console.log(`${label}: ${result.violations.length} violations, ${result.incomplete.length} checks needing manual review`);
}

async function assertFocusInside(page, selector, label) {
  let remainsInside = true;
  const outside = [];
  for (let step = 0; step < 14; step++) {
    await page.keyboard.press(step % 3 === 0 ? 'Shift+Tab' : 'Tab');
    const focus = await page.evaluate(container => ({
      inside: Boolean(document.activeElement.closest(container)),
      hasFocus: document.hasFocus(),
      tag: document.activeElement.tagName,
      element: document.activeElement.outerHTML.slice(0, 300)
    }), selector);
    if (!focus.inside) {
      outside.push({ step, ...focus });
      // Native dialogs may yield to browser chrome. Background page controls stay inert.
      if (focus.tag !== 'BODY' || focus.hasFocus) remainsInside = false;
    }
  }
  record(label, remainsInside, outside);
}

try {
  for (const [viewport, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const key of pages) {
      await page.goto(base + pathFor(key, 'fr'), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await scan(page, `${viewport} ${key}`);
    }

    await page.goto(base, { waitUntil: 'load' });
    const language = page.locator('.language-picker');
    await language.locator('summary').focus();
    await page.keyboard.press('Enter');
    record(`${viewport}: language keyboard opens`, await language.evaluate(details => details.open));
    await page.keyboard.press('Tab');
    record(`${viewport}: language keyboard reaches link`, await page.evaluate(() => document.activeElement.matches('.language-picker a[lang]')));
    await scan(page, `${viewport} language open`);
    await language.evaluate(details => { details.open = false; });

    const question = page.locator('.faq-item').first();
    await question.locator('summary').focus();
    await page.keyboard.press('Enter');
    record(`${viewport}: FAQ keyboard opens`, await question.evaluate(details => details.open));
    await scan(page, `${viewport} FAQ open`);

    await page.goto(base + pathFor('gallery', 'fr'), { waitUntil: 'load' });
    const imageLink = page.locator('a[data-gallery-item]').first();
    const imageHref = await imageLink.getAttribute('href');
    await imageLink.focus();
    await page.keyboard.press('Enter');
    await frame(page);
    record(`${viewport}: lightbox keyboard opens`, await page.locator('#lightbox').evaluate(dialog => dialog.open));
    await scan(page, `${viewport} lightbox open`);
    await assertFocusInside(page, '#lightbox', `${viewport}: lightbox traps keyboard focus`);
    await page.keyboard.press('Escape');
    await frame(page);
    record(`${viewport}: lightbox Escape/focus`, await page.evaluate(href =>
      !document.querySelector('#lightbox').open && document.activeElement.getAttribute('href') === href, imageHref));

    if (viewport === 'mobile') {
      await page.goto(base, { waitUntil: 'load' });
      const toggle = page.locator('[data-menu-open]');
      await toggle.focus();
      await page.keyboard.press('Enter');
      await frame(page);
      record('mobile: menu keyboard opens', await page.locator('#mobile-menu').evaluate(dialog => dialog.open));
      await scan(page, 'mobile menu open');
      await assertFocusInside(page, '#mobile-menu', 'mobile: menu traps keyboard focus');
      await page.keyboard.press('Escape');
      await frame(page);
      record('mobile: menu Escape/focus', await page.evaluate(() =>
        !document.querySelector('#mobile-menu').open && document.activeElement.matches('[data-menu-open]')));
    }
    await context.close();
  }
} catch (error) {
  report.failures.push({ label: 'audit execution', detail: error.stack || String(error) });
} finally {
  await browser.close();
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ scans: report.scans.length, keyboardChecks: report.keyboard.length, failures: report.failures }, null, 2));
process.exitCode = report.failures.length ? 1 : 0;
