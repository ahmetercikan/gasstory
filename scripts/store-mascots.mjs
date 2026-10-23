// Maskot PNG'leri (şeffaf): store/design/img/mascot-*.png ve bulanık arka plan sahnesi.
//   npm run dev  →  node scripts/store-mascots.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = 'store/design/img';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
page.on('pageerror', (e) => console.error('hata:', e.message));
for (const [name, c, p] of [['frog-fart', 0, 'fart'], ['penguin-burp', 2, 'burp'], ['hippo', 1, 'wave'], ['bear', 3, 'wave']]) {
  await page.goto(`http://localhost:5310/store/design/mascot.html?c=${c}&p=${p}&w=1400`);
  await page.waitForFunction(() => window.done === true, null, { timeout: 30000 });
  await page.locator('#m').screenshot({ path: `${OUT}/mascot-${name}.png`, omitBackground: true });
  console.log('✓', name);
}
// Arka plan: HUD'suz geniş nehir sahnesi
const ctx = await browser.newContext({ viewport: { width: 1620, height: 960 }, deviceScaleFactor: 2 });
const g = await ctx.newPage();
await g.addInitScript(() => { localStorage.clear(); localStorage.setItem('gasstory-muted', 'true'); });
await g.goto('http://localhost:5310/');
await sleep(2500);
await g.click('#soloBtn'); await sleep(300); await g.click('#startBtn'); await sleep(800);
await g.evaluate(() => { const s = window.G.sim; s.mode = 'play'; s.placeAt(150); for (const h of s.hints) s.hintDone.add(h.id); s.cp = 0; });
await sleep(2500);
await g.evaluate(() => { for (const id of ['#hud', '#tags', '#floaters']) document.querySelector(id).style.visibility = 'hidden'; });
await g.screenshot({ path: `${OUT}/scene.png` });
console.log('✓ sahne');
await browser.close();
