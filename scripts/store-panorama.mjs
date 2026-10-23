// Örnek mağaza tasarımındaki gibi kesintisiz 3'lü ekran görseli + tanıtım görseli.
//   npm run dev  →  node scripts/store-panorama.mjs
// Çıktı: store/play/ekran-1..3.png (1080×1920), store/play/tanitim-1024x500.png, store/play/panorama.png (önizleme)
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = 'store/play';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
});
async function render(file, width, height, out) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => console.error('hata:', e.message));
  await page.goto(`http://localhost:5310/store/design/${file}`);
  await page.waitForFunction(() => window.done === true, null, { timeout: 30000 });
  await page.screenshot({ path: out });
  await page.close();
}
for (const lang of ['tr', 'en']) {
  const dir = `${OUT}/${lang}`;
  mkdirSync(dir, { recursive: true });
  await render(`panorama.html?lang=${lang}&shot=/store/raw/${lang}/2-osurma.png`, 3240, 1920, `${dir}/panorama.png`);
  for (let i = 0; i < 3; i++) {
    await sharp(`${dir}/panorama.png`).extract({ left: i * 1080, top: 0, width: 1080, height: 1920 }).png({ compressionLevel: 9 }).toFile(`${dir}/ekran-${i + 1}.png`);
  }
  await render(`feature.html?lang=${lang}`, 1024, 500, `${dir}/tanitim-1024x500.png`);
  console.log('✓', lang);
}
await sharp('assets/icon.png').resize(512, 512).png().toFile(`${OUT}/simge-512.png`);
console.log('✓ simge 512');
await browser.close();
