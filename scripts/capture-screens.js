/* Capture README screenshots of the running app using the local Chrome.
   Usage: start the dev server (node server.js), then:
     node scripts/capture-screens.js
   Writes 1600×900 PNGs into screenshots/. */
/* global window */ // used inside page.evaluate(), which runs in the browser
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const BASE = process.env.APP_URL || 'http://127.0.0.1:4517';
const OUT = path.join(__dirname, '..', 'screenshots');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

/** view → filename. Order matters: dashboard first for the hero shot. */
const SHOTS = [
  ['dashboard', 'dashboard.png'],
  ['council', 'agent-council.png'],
  ['graph', 'knowledge-graph.png'],
  ['twin', 'digital-twin.png'],
  ['emergency', 'emergency.png'],
  ['sustainability', 'sustainability.png'],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--window-size=1600,900', '--hide-scrollbars'],
    defaultViewport: { width: 1600, height: 900 },
  });
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30_000 });
  await new Promise((r) => setTimeout(r, 3000)); // let counters/charts/Firestore settle

  for (const [view, file] of SHOTS) {
    await page.evaluate((v) => window.go(v), view);
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT, file) });
    console.log(`  ✓ ${file}`);
  }
  await browser.close();
  console.log(`\nSaved ${SHOTS.length} screenshots to screenshots/`);
})().catch((err) => { console.error('✗ capture failed:', err.message); process.exit(1); });
