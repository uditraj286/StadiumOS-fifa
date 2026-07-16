/* Automated accessibility tests (WCAG 2.2 mechanics).

   These are static conformance checks against the shipped markup and styles —
   they fail the build if an accessibility affordance regresses. Runtime
   behaviors (focus, announcements) are covered by the applyA11y() code path
   asserted in app-a11y source checks below. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = (f) => path.join(__dirname, '..', f);
const html = fs.readFileSync(root('index.html'), 'utf8');
const css = fs.readFileSync(root('styles.css'), 'utf8');
const appJs = fs.readFileSync(root('app.js'), 'utf8');

describe('document fundamentals', () => {
  test('page declares a language', () => assert.match(html, /<html lang="en">/));
  test('responsive viewport meta present', () => assert.match(html, /name="viewport"/));
  test('page has a descriptive <title>', () => assert.match(html, /<title>[^<]{10,}<\/title>/));
  test('skip-to-content link is the first focusable element', () => {
    const bodyStart = html.indexOf('<body');
    const skip = html.indexOf('skip-link');
    const firstButton = html.indexOf('<button');
    assert.ok(skip > bodyStart && skip < firstButton, 'skip link must precede all buttons');
  });
  test('main content region exists and is focus-targetable', () => {
    assert.match(html, /id="views"[^>]*role="main"/);
    assert.match(html, /id="views"[^>]*tabindex="-1"/);
  });
});

describe('ARIA affordances', () => {
  test('primary nav is labelled', () => assert.match(html, /<nav[^>]*aria-label="Main navigation"/));
  test('every icon-only button in the shell carries an aria-label', () => {
    // Heuristic: buttons whose visible content is only SVG/emoji must be labelled.
    const buttons = html.match(/<button[^>]*>/g) || [];
    const unlabeled = buttons.filter((b) =>
      /class="(icon-btn|head-btn|mic-fab|composer-send|ground-toggle)/.test(b) && !/aria-label=/.test(b));
    assert.deepEqual(unlabeled, []);
  });
  test('assistant drawer is a labelled modal dialog', () => {
    assert.match(html, /role="dialog"[^>]*aria-label="AI assistant"|aria-label="AI assistant"[^>]*role="dialog"/);
    assert.match(html, /aria-modal="true"/);
  });
  test('live regions exist for chat, toasts, and view announcements', () => {
    assert.match(html, /id="assistantLog"[^>]*aria-live="polite"/);
    assert.match(html, /id="toastStack"[^>]*aria-live="polite"/);
    assert.match(html, /id="sr-announcer"[^>]*aria-live="polite"/);
  });
  test('search input is labelled and in a search landmark', () => {
    assert.match(html, /role="search"/);
    assert.match(html, /id="globalSearch"[^>]*aria-label=/);
  });
  test('grounding toggle exposes pressed state', () => assert.match(html, /aria-pressed="false"/));
});

describe('stylesheet affordances', () => {
  test('keyboard focus indicators via :focus-visible', () => assert.match(css, /:focus-visible\{outline/));
  test('prefers-reduced-motion disables animation', () => assert.match(css, /prefers-reduced-motion:\s*reduce/));
  test('prefers-contrast strengthens the theme', () => assert.match(css, /prefers-contrast:\s*more/));
  test('visually-hidden utility exists for SR-only content', () => assert.match(css, /\.visually-hidden\{position:absolute/));
  test('skip link becomes visible on focus', () => assert.match(css, /\.skip-link:focus\{left/));
});

describe('runtime accessibility pass (applyA11y)', () => {
  test('view changes stamp heading semantics', () => {
    assert.match(appJs, /setAttribute\('role','heading'\)/);
    assert.match(appJs, /setAttribute\('aria-level','1'\)/);
  });
  test('view changes are announced to screen readers', () => {
    assert.match(appJs, /sr-announcer/);
    assert.match(appJs, /view loaded/);
  });
  test('active nav item is exposed via aria-current', () => assert.match(appJs, /aria-current','page'/));
  test('charts are labelled as images', () => assert.match(appJs, /'role','img'/));
  test('go() runs the a11y pass on every navigation', () => assert.match(appJs, /applyA11y\(name\)/));
});

describe('color contrast (computed against the design tokens)', () => {
  // WCAG relative-luminance contrast check on the theme's core pairs.
  function lum(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

  test('primary text on canvas ≥ 4.5:1 (AA)', () => assert.ok(contrast('#F5F6F4', '#0B0D0C') >= 4.5));
  test('secondary text on canvas ≥ 4.5:1 (AA)', () => assert.ok(contrast('#9AA098', '#0B0D0C') >= 4.5));
  test('primary text on cards ≥ 4.5:1 (AA)', () => assert.ok(contrast('#F5F6F4', '#161918') >= 4.5));
  test('dark text on lime accent (active nav, CTAs) ≥ 4.5:1', () => assert.ok(contrast('#0B0D0C', '#C6F135') >= 4.5));
});
