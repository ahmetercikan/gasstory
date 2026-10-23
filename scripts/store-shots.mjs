// Play Store ham ekran görüntüleri: oyun görünmez Chrome'da açılıp sahneler yakalanır.
//   1) npm run dev   2) node scripts/store-shots.mjs
// Çıktı: store/raw/*.png (telefon 1080×1920) ve store/raw/wide.png (tanıtım görseli arka planı).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const URL = 'http://localhost:5310/';
const OUT = 'store/raw';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'],
});

async function open(profile, view = { width: 405, height: 720, deviceScaleFactor: 1080 / 405 }) {
  const ctx = await browser.newContext({ viewport: { width: view.width, height: view.height }, deviceScaleFactor: view.deviceScaleFactor });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('sayfa hatası:', e.message));
  await page.addInitScript((p) => { localStorage.clear(); localStorage.setItem('gasstory-profile', JSON.stringify(p)); localStorage.setItem('gasstory-muted', 'true'); }, profile);
  await page.goto(URL);
  await sleep(2500);
  return page;
}
async function solo(page, level = 0) {
  await page.click('#soloBtn');
  await sleep(400);
  if (level) await page.click(`[data-l="${level}"]`);
  await page.click('#startBtn');
  await sleep(800);
  // Görünmez tarayıcıda çizim yavaş: geri sayımı atla
  await page.evaluate(() => { window.G.sim.mode = 'play'; window.G.sim.modeT = 0; });
}
// Salı s noktasına koy; geride kalan kontrol noktası/ipucu yazıları çıkmasın
const place = (page, s) => page.evaluate((s) => {
  const sim = window.G.sim;
  sim.placeAt(s);
  sim.cp = sim.cps.filter((c) => c.s < s + 3).length - 1;
  for (const h of sim.hints) sim.hintDone.add(h.id);
  sim.raft.inv = 0;
  sim.time = 3.5 + s / 3.4;
}, s);
const clean = (page) => page.evaluate(() => { for (const id of ['#banner', '#hint']) { const el = document.querySelector(id); el.style.transition = 'none'; el.classList.remove('show'); el.style.opacity = '0'; } });
const shot = async (page, name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('✓', name); };

// 1) Menü
{
  const p = await open({ name: 'Ahmet', char: 0, power: 'fart' });
  await sleep(1500);
  await shot(p, '1-menu');
  await p.context().close();
}
// 2) Osurma: kurbağa salı itiyor
{
  const p = await open({ name: 'Ahmet', char: 0, power: 'fart' });
  await solo(p, 0);
  await place(p, 60);
  await p.keyboard.down('KeyA'); await sleep(450); await p.keyboard.up('KeyA');
  await p.keyboard.down('KeyD'); await sleep(250); await p.keyboard.up('KeyD');
  await p.keyboard.down('Space'); await sleep(2600);
  await clean(p);
  await shot(p, '2-osurma');
  await p.keyboard.up('Space');
  await p.context().close();
}
// 3) Geğirme: penguen şişip patlatıyor
{
  const p = await open({ name: 'Ahmet', char: 2, power: 'burp' });
  await solo(p, 1);
  await place(p, 168);
  await p.keyboard.down('KeyS'); await sleep(350); await p.keyboard.up('KeyS');
  await p.keyboard.down('Space'); await sleep(2200); await p.keyboard.up('Space');
  await sleep(250);
  await clean(p);
  await shot(p, '3-gegirme');
  await p.context().close();
}
// 4) Şelale
{
  const p = await open({ name: 'Ahmet', char: 3, power: 'fart' });
  await solo(p, 2);
  await place(p, 64);
  await sleep(2600);
  await clean(p);
  await shot(p, '4-selale');
  await p.context().close();
}
// 5) Online lobi (oda kodu görünsün)
{
  const p = await open({ name: 'Ahmet', char: 1, power: 'fart' });
  await p.click('#hostBtn');
  await sleep(5000);
  for (let i = 0; i < 2; i++) { await p.click('[data-add]'); await sleep(150); }
  await p.evaluate(() => { window.G.roster[1].name = 'Elif'; window.G.roster[1].bot = false; window.G.roster[1].owner = 'x'; });
  await p.click('[data-l="1"]');
  await sleep(500);
  await shot(p, '5-lobi');
  await p.context().close();
}
// 6) Sonuç ekranı
{
  const p = await open({ name: 'Ahmet', char: 0, power: 'fart' });
  await solo(p, 0);
  await p.keyboard.down('Space'); await sleep(2500); await p.keyboard.up('Space');
  await p.evaluate(() => { const s = window.G.sim; s.stars = 4; s.time = 3.5 + 78.4; });
  await place(p, (await p.evaluate(() => window.G.sim.T.finishS)) - 5);
  await sleep(6500);
  await shot(p, '6-sonuc');
  await p.context().close();
}
// Tanıtım görseli arka planı (yatay)
{
  const p = await open({ name: 'Ahmet', char: 0, power: 'fart' }, { width: 1024, height: 500, deviceScaleFactor: 1 });
  await solo(p, 0);
  await place(p, 66);
  await p.keyboard.down('Space'); await sleep(2400);
  await clean(p);
  await p.evaluate(() => { for (const id of ['#hud', '#tags', '#floaters']) document.querySelector(id).style.visibility = 'hidden'; });
  await shot(p, 'wide');
  await p.context().close();
}
await browser.close();
