// Simge ve açılış görselleri: assets-src/*.svg → assets/*.png, sonra `npx capacitor-assets generate`.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JOBS = [
  { in: 'icon.svg', out: 'icon.png', size: 1024, flatten: '#2b9bf0' },
  { in: 'icon-foreground.svg', out: 'icon-foreground.png', size: 1024 },
  { in: 'icon-background.svg', out: 'icon-background.png', size: 1024, flatten: '#2b9bf0' },
  { in: 'splash.svg', out: 'splash.png', size: 2732, flatten: '#a8dcff' },
  { in: 'splash.svg', out: 'splash-dark.png', size: 2732, flatten: '#a8dcff' },
];
await mkdir(resolve(root, 'assets'), { recursive: true });
for (const job of JOBS) {
  let img = sharp(await readFile(resolve(root, 'assets-src', job.in)), { density: 384 }).resize(job.size, job.size, { fit: 'cover' });
  if (job.flatten) img = img.flatten({ background: job.flatten });
  await writeFile(resolve(root, 'assets', job.out), await img.png({ compressionLevel: 9 }).toBuffer());
  console.log(`✓ assets/${job.out}`);
}
