import { store } from './core.js';

// Tüm sesler WebAudio ile anlık sentezlenir: dosya yok, her osuruk biraz farklı.
let ctx = null, master, sfx, music, noiseBuf;
let muted = store.get('muted', false);
let musicOn = store.get('music', true);

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  sfx = ctx.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
  music = ctx.createGain(); music.gain.value = musicOn ? 0.22 : 0; music.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  startMusic();
  loadSamples();
}
export const isMuted = () => muted;
export function setMuted(m) { muted = m; store.set('muted', m); if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05); }
export const isMusicOn = () => musicOn;
export function setMusic(on) { musicOn = on; store.set('music', on); if (music) music.gain.setTargetAtTime(on ? 0.22 : 0, ctx.currentTime, 0.1); }
// Uygulama arka plana geçince sesi durdur.
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else ctx.resume();
});

const now = () => ctx.currentTime;
function noiseSrc() { const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.playbackRate.value = 0.8 + Math.random() * 0.4; return n; }

function tone(freq, dur, { type = 'sine', vol = 0.4, to = null, at = 0, attack = 0.005, dest = sfx } = {}) {
  if (!ctx) return;
  const t = now() + at;
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
function burst(dur, { from = 2000, to = 300, vol = 0.5, type = 'lowpass', q = 1, at = 0 } = {}) {
  if (!ctx) return;
  const t = now() + at;
  const n = noiseSrc(); const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(sfx); n.start(t); n.stop(t + dur + 0.05);
}

// --- ElevenLabs ile üretilmiş ses dosyaları (public/sfx). Yoksa sentez seslere düşülür.
const buffers = {};
const SAMPLE_NAMES = ['fart1', 'fart2', 'fart3', 'fart4', 'fartLoop', 'fartEnd', 'burp1', 'burp2', 'burp3', 'splash', 'bigSplash', 'bump', 'spike', 'pop', 'star', 'can', 'beans', 'climb', 'cheer', 'river', 'rapids', 'waterfall', 'whirl', 'ugh', 'whoa'];
let loading = null;
export function loadSamples() {
  if (!ctx || loading) return loading;
  loading = Promise.all(SAMPLE_NAMES.map(async (n) => {
    try {
      const r = await fetch(`./sfx/${n}.mp3`);
      if (!r.ok) return;
      buffers[n] = await ctx.decodeAudioData(await r.arrayBuffer());
    } catch { /* sentez sese düşer */ }
  }));
  return loading;
}
export function play(name, { vol = 1, rate = 1, loop = false, offset = 0, dest } = {}) {
  const b = buffers[name];
  if (!ctx || !b) return null;
  const src = ctx.createBufferSource(); src.buffer = b; src.loop = loop; src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(g).connect(dest || sfx); src.start(0, offset % b.duration);
  return {
    src, g,
    stop(fade = 0.08) { const n = now(); g.gain.setTargetAtTime(0.0001, n, fade / 3); src.stop(n + fade + 0.05); },
  };
}
const has = (n) => !!buffers[n];
const pick = (...n) => n[Math.floor(Math.random() * n.length)];

// Ortam sesi: nehir + akıntı döngüleri, seviyesi oyundan ayarlanır.
let amb = null;
export function setAmbient(on, rapids = 0, whirl = 0) {
  if (!ctx) return;
  if (on && !amb && has('river')) {
    amb = { river: play('river', { vol: 0, loop: true }), rapids: play('rapids', { vol: 0, loop: true }), whirl: play('whirl', { vol: 0, loop: true }) };
  }
  if (!amb) return;
  const n = now();
  amb.river?.g.gain.setTargetAtTime(on ? 0.35 : 0, n, 0.3);
  amb.rapids?.g.gain.setTargetAtTime(on ? rapids * 0.6 : 0, n, 0.3);
  amb.whirl?.g.gain.setTargetAtTime(on ? whirl * 0.7 : 0, n, 0.3);
}

// Sürekli osuruk: başlat → tutamak döner, stop() ile "pıt" diye biter.
export function startFart(pitch = 1, vol = 1) {
  if (!ctx) return { stop() {} };
  if (has('fartLoop')) {
    const rate = pitch * (0.92 + Math.random() * 0.16);
    const head = play(pick('fart1', 'fart2', 'fart3', 'fart4'), { vol: 0.55 * vol, rate });
    const loop = play('fartLoop', { vol: 0.75 * vol, rate, loop: true, offset: Math.random() * 2 });
    loop.g.gain.setValueAtTime(0.0001, now()); loop.g.gain.exponentialRampToValueAtTime(0.75 * vol, now() + 0.12);
    let alive = true;
    // Perdeyi hafifçe oynat ki döngü tekdüze duyulmasın
    const wob = () => { if (!alive) return; loop.src.playbackRate.setTargetAtTime(rate * (0.88 + Math.random() * 0.24), now(), 0.08); setTimeout(wob, 120 + Math.random() * 160); };
    wob();
    return { stop() { if (!alive) return; alive = false; loop.stop(0.1); head?.stop(0.1); play('fartEnd', { vol: 0.6 * vol, rate }); } };
  }
  const t = now();
  const out = ctx.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.55 * vol, t + 0.035);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.8;
  const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 78 * pitch;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 4 + Math.random() * 4;
  const lfoG = ctx.createGain(); lfoG.gain.value = 16 * pitch; lfo.connect(lfoG).connect(osc.frequency);
  // "brrrr" titreşimi: kare dalga genlik modülasyonu
  const flutter = ctx.createOscillator(); flutter.type = 'square'; flutter.frequency.value = 20 + Math.random() * 12;
  const flG = ctx.createGain(); flG.gain.value = 0.5;
  const am = ctx.createGain(); am.gain.value = 0.5;
  flutter.connect(flG).connect(am.gain);
  osc.connect(am);
  const nz = noiseSrc(); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 230 * pitch; bp.Q.value = 2.2;
  const nG = ctx.createGain(); nG.gain.value = 1.1; nz.connect(bp).connect(nG).connect(am);
  am.connect(lp).connect(out).connect(sfx);
  let alive = true;
  const wob = () => {
    if (!alive) return;
    const n = now();
    osc.frequency.setTargetAtTime((58 + Math.random() * 45) * pitch, n, 0.04);
    flutter.frequency.setTargetAtTime(16 + Math.random() * 20, n, 0.04);
    bp.frequency.setTargetAtTime((150 + Math.random() * 220) * pitch, n, 0.05);
    setTimeout(wob, 60 + Math.random() * 90);
  };
  wob();
  const nodes = [osc, lfo, flutter, nz];
  nodes.forEach((x) => x.start(t));
  return {
    stop() {
      if (!alive) return; alive = false;
      const n = now();
      osc.frequency.setTargetAtTime(42 * pitch, n, 0.03);
      flutter.frequency.setTargetAtTime(9, n, 0.03);
      out.gain.setTargetAtTime(0.0001, n + 0.05, 0.04);
      nodes.forEach((x) => x.stop(n + 0.35));
    },
  };
}

// Tek seferlik geğirme. strength 0..1
export function burp(strength = 0.6, pitch = 1) {
  if (!ctx) return;
  if (has('burp1')) {
    const n = strength < 0.35 ? 'burp1' : strength < 0.8 ? 'burp2' : 'burp3';
    play(n, { vol: 0.9 + strength * 0.3, rate: pitch * (0.95 + Math.random() * 0.1) });
    return;
  }
  const t = now(), dur = 0.28 + strength * 0.75;
  const osc = ctx.createOscillator(); osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(135 * pitch, t); osc.frequency.exponentialRampToValueAtTime(68 * pitch, t + dur);
  const vib = ctx.createOscillator(); vib.frequency.value = 6 + Math.random() * 5;
  const vg = ctx.createGain(); vg.gain.value = 14 * pitch; vib.connect(vg).connect(osc.frequency);
  const gurg = ctx.createOscillator(); gurg.type = 'square'; gurg.frequency.value = 28 + Math.random() * 16;
  const gg = ctx.createGain(); gg.gain.value = 0.35;
  const am = ctx.createGain(); am.gain.value = 0.65; gurg.connect(gg).connect(am.gain);
  const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 4;
  f1.frequency.setValueAtTime(680 * pitch, t); f1.frequency.linearRampToValueAtTime(400 * pitch, t + dur);
  const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 5; f2.frequency.value = 1000 * pitch;
  const env = ctx.createGain(); const pk = 2.2 + strength * 1.6;
  env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(pk, t + 0.035);
  env.gain.setValueAtTime(pk, t + dur * 0.65); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(am); am.connect(f1); am.connect(f2);
  f1.connect(env); f2.connect(env); env.connect(sfx);
  [osc, vib, gurg].forEach((n) => { n.start(t); n.stop(t + dur + 0.05); });
  if (strength > 0.6) burst(0.3, { from: 900, to: 200, vol: 0.25, at: dur * 0.2 });
}

// Geğirme şarjı sırasında yükselen "guruldama"
export function startCharge(pitch = 1) {
  if (!ctx) return { set() {}, stop() {} };
  const t = now();
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 90 * pitch;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.1);
  const trem = ctx.createOscillator(); trem.frequency.value = 9; const tg = ctx.createGain(); tg.gain.value = 0.06;
  trem.connect(tg).connect(g.gain);
  o.connect(g).connect(sfx); o.start(t); trem.start(t);
  return {
    set(c) { o.frequency.setTargetAtTime((90 + c * 160) * pitch, now(), 0.05); trem.frequency.setTargetAtTime(9 + c * 14, now(), 0.05); },
    stop() { const n = now(); g.gain.setTargetAtTime(0.0001, n, 0.03); o.stop(n + 0.2); trem.stop(n + 0.2); },
  };
}

const S = (name, fallback, opts) => (...a) => (has(name) ? play(name, typeof opts === 'function' ? opts(...a) : opts) : fallback(...a));
export const sfxs = {
  splash: S('splash', (v = 1) => synth.splash(v), (v = 1) => ({ vol: 0.7 * v, rate: 0.9 + Math.random() * 0.2 })),
  bump: S('bump', () => synth.bump(), { vol: 0.8 }),
  hit: S('spike', () => synth.hit(), { vol: 0.9 }),
  pop: S('pop', () => synth.pop(), { vol: 1 }),
  star: S('star', () => synth.star(), { vol: 0.7 }),
  climb: S('climb', () => synth.climb(), { vol: 0.6 }),
  bean: S('beans', () => synth.pickup(), { vol: 0.9 }),
  soda: S('can', () => synth.pickup(), { vol: 0.9 }),
  ugh: S('ugh', () => {}, () => ({ vol: 0.6, rate: 0.9 + Math.random() * 0.3 })),
  whoa: S('whoa', () => {}, (p = 1) => ({ vol: 0.6, rate: p })),
  waterfall: S('waterfall', () => synth.splash(1.3), { vol: 0.8 }),
  capsize() { if (has('bigSplash')) play('bigSplash', { vol: 1 }); else synth.capsize(); },
  win() { synth.win(); if (has('cheer')) play('cheer', { vol: 0.7 }); },
  cp: () => synth.cp(), beep: () => synth.beep(), go: () => synth.go(), click: () => synth.click(), pickup: () => synth.pickup(),
  fartShort(pitch = 1) { if (has('fart1')) play(pick('fart1', 'fart2', 'fart3', 'fart4'), { vol: 0.8, rate: pitch }); else synth.fartShort(pitch); },
};
const synth = {
  splash(v = 1) { burst(0.55, { from: 3000, to: 300, vol: 0.5 * v }); tone(500, 0.2, { type: 'sine', vol: 0.15 * v, to: 140 }); },
  bump() { tone(110, 0.18, { vol: 0.55, to: 50 }); burst(0.12, { from: 600, to: 150, vol: 0.3 }); },
  hit() { tone(420, 0.3, { type: 'square', vol: 0.22, to: 70 }); burst(0.35, { from: 4000, to: 500, vol: 0.45, type: 'highpass' }); },
  pop() {
    burst(0.15, { from: 5000, to: 1200, vol: 0.7, type: 'highpass' });
    tone(300, 1.1, { type: 'sawtooth', vol: 0.18, to: 40, at: 0.05 });
    burst(1.0, { from: 1500, to: 200, vol: 0.25, type: 'bandpass', q: 3, at: 0.05 });
  },
  pickup() { tone(880, 0.09, { type: 'triangle', vol: 0.3 }); tone(1320, 0.14, { type: 'triangle', vol: 0.3, at: 0.07 }); },
  star() { [660, 880, 1100, 1320].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.28, at: i * 0.06 })); },
  cp() { [523, 659, 784].forEach((f, i) => tone(f, 0.2, { type: 'square', vol: 0.12, at: i * 0.08 })); },
  beep() { tone(520, 0.14, { type: 'square', vol: 0.18 }); },
  go() { tone(1040, 0.45, { type: 'square', vol: 0.18 }); },
  capsize() { tone(500, 0.8, { type: 'sawtooth', vol: 0.15, to: 90 }); sfxs.splash(1.2); },
  climb() { tone(300, 0.1, { type: 'triangle', vol: 0.25, to: 600 }); },
  click() { tone(700, 0.05, { type: 'triangle', vol: 0.2 }); },
  win() {
    [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, i === 5 ? 0.6 : 0.18, { type: 'square', vol: 0.13, at: i * 0.13 }));
    
  },
  fartShort(pitch = 1) { const h = startFart(pitch, 0.8); setTimeout(() => h.stop(), 180 + Math.random() * 200); },
};

// Hafif, neşeli bir döngü müziği (pentatonik).
let musicTimer = null;
function startMusic() {
  if (musicTimer) return;
  const bpm = 116, step = 60 / bpm / 2;
  const prog = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 53, 57, 60], [43, 55, 59, 62]];
  const scale = [0, 2, 4, 7, 9, 12, 14, 16];
  const mel = []; let seed = 7;
  for (let i = 0; i < 64; i++) { seed = (seed * 9301 + 49297) % 233280; mel.push(seed / 233280); }
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let next = now() + 0.1, i = 0;
  musicTimer = setInterval(() => {
    if (!ctx || ctx.state !== 'running') return;
    while (next < now() + 0.2) {
      const bar = Math.floor(i / 8) % 4, chord = prog[bar], s = i % 8;
      const at = next - now();
      if (s % 2 === 0) tone(mtof(chord[0] - 12 + (s === 4 ? 7 : 0)), step * 1.6, { type: 'triangle', vol: 0.32, at, dest: music });
      if (s === 0 || s === 4) tone(140, 0.12, { vol: 0.5, to: 45, at, dest: music });
      if (s === 2 || s === 6) {
        const t = now() + at, n = noiseSrc(), f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        n.connect(f).connect(g).connect(music); n.start(t); n.stop(t + 0.06);
      }
      const r = mel[i % 64];
      if (r > 0.35) tone(mtof(60 + scale[Math.floor(r * 100) % scale.length]), step * 0.9, { type: 'square', vol: 0.06, at, dest: music });
      next += step; i++;
    }
  }, 50);
}
