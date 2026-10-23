// ElevenLabs ses efektleri üretici.  Kullanım: node scripts/make-sfx.mjs [--yeniden isim]
// Anahtar: ELEVENLABS_API_KEY ortam değişkeni, yoksa ../Sayio/.env.local okunur (anahtar bu projeye kopyalanmaz).
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
function key() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  for (const f of [join(root, '.env.local'), join(homedir(), 'Sayio', '.env.local')]) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, 'utf8').match(/^ELEVENLABS_API_KEY\s*=\s*"?([^"\n]+)"?/m);
    if (m) return m[1].trim();
  }
  throw new Error('ELEVENLABS_API_KEY bulunamadı');
}
const KEY = key();
const out = join(root, 'public', 'sfx');
mkdirSync(out, { recursive: true });

// [dosya adı, süre (sn), açıklama]
export const SOUNDS = [
  ['fart1', 1.0, 'short funny cartoon fart, wet brassy trumpet-like, comedic, clean, no background'],
  ['fart2', 1.2, 'cartoon fart with rising pitch flutter, silly and squeaky, comedic game sound effect'],
  ['fart3', 0.8, 'deep low rumbling fart, quick, cartoon comedy sound effect'],
  ['fart4', 1.4, 'long squeaky balloon-like fart that wobbles in pitch, cartoon, funny'],
  ['fartLoop', 3.0, 'continuous sustained cartoon fart, steady brrrrr motorboat-like rumble, comedic, no ending'],
  ['fartEnd', 0.5, 'tiny short cartoon fart puff ending, pfft'],
  ['burp1', 0.8, 'short cartoon burp, funny, clean'],
  ['burp2', 1.4, 'loud long cartoon burp, deep and resonant, comedic'],
  ['burp3', 2.2, 'gigantic monstrous epic burp, very long and loud, echoing, cartoon comedy'],
  ['splash', 1.0, 'character falls into water, cartoon splash'],
  ['bigSplash', 2.0, 'inflatable raft flips over into river, big water splash and bubbles'],
  ['bump', 0.6, 'inflatable rubber raft bumps into rock, bouncy rubber thud'],
  ['spike', 1.0, 'inflatable rubber raft punctured by spikes, sharp stab and quick air hiss'],
  ['pop', 2.0, 'inflatable rubber raft bursts with loud pop then deflates with long farting air hiss'],
  ['star', 0.8, 'magical sparkle coin pickup chime, bright, cartoon game'],
  ['can', 0.9, 'soda can opening, fizzy psst and quick gulp'],
  ['beans', 1.0, 'cartoon character quickly gobbles beans, munching and gulp, funny'],
  ['climb', 0.7, 'cartoon character climbs out of water onto rubber raft, wet squeak'],
  ['cheer', 3.0, 'small crowd cheering and clapping, victory, celebratory whistle'],
  ['river', 6.0, 'gentle flowing river stream ambience loop, water rushing softly, no birds, seamless'],
  ['rapids', 5.0, 'strong whitewater rapids rushing water ambience loop, seamless'],
  ['waterfall', 2.0, 'raft whooshes down a waterfall, rushing water and wind whoosh'],
  ['whirl', 3.0, 'swirling whirlpool water vortex gurgling loop'],
  ['ugh', 0.9, 'cartoon character disgusted ewww groan reaction to bad smell, funny'],
  ['whoa', 1.0, 'cartoon character surprised yelp whoa while falling, funny, no words'],
];

const only = process.argv.includes('--yeniden') ? process.argv[process.argv.indexOf('--yeniden') + 1] : null;
let made = 0;
for (const [name, dur, text] of SOUNDS) {
  const file = join(out, name + '.mp3');
  if (existsSync(file) && name !== only) continue;
  const r = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_96', {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ text, duration_seconds: dur, prompt_influence: 0.55, loop: /loop/i.test(text) || undefined }),
  });
  if (!r.ok) { console.error('HATA', name, r.status, (await r.text()).slice(0, 300)); continue; }
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  made++;
  console.log('✓', name);
}
console.log('bitti, yeni:', made);
