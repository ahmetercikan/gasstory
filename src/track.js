import { clamp, lerp } from './util.js';

// Bölüm tanımı: segs = nehir parçaları, objs = engeller (s: nehir boyunca mesafe, u: sağa kayma).
// L uzunluk, turn derece (artı = sağa), slope eğim (eksi = iniş), w yarı genişlik, cur akıntı hızı.
// Yay (arc) açıları: 0 = sağ, 90 = akış yönü (ileri).
export const LEVELS = [
  {
    name: 'Çırak Deresi', icon: 'leaf', par: 85, theme: { wallA: 0xe9776a, wallB: 0xf3a35b, grass: 0x8fd36a },
    segs: [
      { L: 30, turn: 0, slope: -0.03, w: 7, cur: 3.2 },
      { L: 40, turn: 35, slope: -0.04, w: 7, cur: 3.4 },
      { L: 30, turn: 0, slope: -0.03, w: 6.5, cur: 3.4 },
      { L: 50, turn: -55, slope: -0.04, w: 6.5, cur: 3.6 },
      { L: 35, turn: 0, slope: -0.05, w: 6.5, cur: 3.8 },
      { L: 45, turn: 40, slope: -0.04, w: 6.4, cur: 3.8 },
      { L: 40, turn: 0, slope: -0.03, w: 7, cur: 3.4 },
    ],
    objs: [
      { t: 'hint', s: 2, text: 'Gaz, salı durduğun taraftan karşı tarafa iter!' },
      { t: 'hint', s: 30, text: 'Hepiniz bir tarafa toplanmayın, sal devrilir!' },
      { t: 'rock', s: 35, u: -3.5, r: 1.2 }, { t: 'rock', s: 48, u: 3.6, r: 1.3 },
      { t: 'bean', s: 55, u: -2 }, { t: 'star', s: 62, u: 2.8 },
      { t: 'arc', s: 82, u: 1.6, r: 3, span: 200, rot: 90, spin: 0 },
      { t: 'star', s: 82, u: -3.9 },
      { t: 'soda', s: 100, u: 3 },
      { t: 'cp', s: 110 },
      { t: 'arc', s: 126, u: -2, r: 3, span: 220, rot: -90, spin: 0.4 },
      { t: 'rock', s: 142, u: 3, r: 1.1 }, { t: 'rock', s: 147, u: -3.8, r: 1.0 },
      { t: 'star', s: 152, u: 0 },
      { t: 'bar', s: 178, u: 0, len: 3.0, spin: 0.9 },
      { t: 'cp', s: 192 },
      { t: 'bean', s: 198, u: 0 },
      { t: 'arc', s: 214, u: 2.5, r: 2.8, span: 180, rot: 180, spin: -0.5 },
      { t: 'star', s: 224, u: -3.4 },
      { t: 'star', s: 252, u: 3 },
    ],
  },
  {
    name: 'Pırtlak Kanyonu', icon: 'canyon', par: 95, theme: { wallA: 0xd9693f, wallB: 0xf0b260, grass: 0xb8cf62 },
    segs: [
      { L: 25, turn: 0, slope: -0.03, w: 6.5, cur: 3.6 },
      { L: 40, turn: 45, slope: -0.05, w: 6.2, cur: 3.8 },
      { L: 35, turn: -45, slope: -0.05, w: 6.2, cur: 4 },
      { L: 28, turn: 0, slope: -0.1, w: 5.8, cur: 4.8 },
      { L: 45, turn: 55, slope: -0.05, w: 6.5, cur: 4 },
      { L: 30, turn: 0, slope: -0.04, w: 6.2, cur: 4 },
      { L: 45, turn: -65, slope: -0.05, w: 6.2, cur: 4.2 },
      { L: 30, turn: 0, slope: -0.08, w: 5.8, cur: 4.6 },
      { L: 40, turn: 30, slope: -0.04, w: 6.5, cur: 3.8 },
    ],
    objs: [
      { t: 'hint', s: 2, text: 'Girdaplar salı döndürür, dönen salda kenarlara savrulursunuz!' },
      { t: 'log', s: 40, amp: 2.6, speed: 0.96, len: 3.0 },
      { t: 'star', s: 48, u: 0 },
      { t: 'whirl', s: 72, u: -1.6, r: 3.2 },
      { t: 'bean', s: 74, u: 3.5 },
      { t: 'rapids', s: 98, e: 126, amp: 0.33 },
      { t: 'hint', s: 96, text: 'Akıntı! Dengeyi birlikte koruyun!' },
      { t: 'rock', s: 106, u: 2, r: 1.1 }, { t: 'rock', s: 116, u: -2.4, r: 1.2 },
      { t: 'star', s: 120, u: 2.6 },
      { t: 'cp', s: 132 },
      { t: 'bar', s: 150, u: -1.6, len: 3.0, spin: 1.2 },
      { t: 'bar', s: 166, u: 1.6, len: 3.0, spin: -1.2 },
      { t: 'soda', s: 176, u: 0 },
      { t: 'arc', s: 196, u: 1.4, r: 2.6, span: 210, rot: -30, spin: 0.5 },
      { t: 'star', s: 196, u: 1.4 },
      { t: 'cp', s: 216 },
      { t: 'log', s: 232, amp: 2.6, speed: 1.2, len: 3.0 },
      { t: 'log', s: 245, amp: 2.6, speed: -1.2, len: 3.0 },
      { t: 'rapids', s: 250, e: 280, amp: 0.38 },
      { t: 'whirl', s: 266, u: 1.8, r: 2.9 },
      { t: 'star', s: 269, u: -3.3 },
      { t: 'arc', s: 288, u: -2.3, r: 2.6, span: 200, rot: 0, spin: -0.6 },
      { t: 'star', s: 300, u: 2.8 },
    ],
  },
  {
    name: 'Gaz Şelalesi', icon: 'waterfall', par: 125, theme: { wallA: 0xc8667a, wallB: 0xe89a6a, grass: 0x7fcf7a },
    segs: [
      { L: 25, turn: 0, slope: -0.03, w: 7, cur: 3.6 },
      { L: 30, turn: 30, slope: -0.05, w: 6.5, cur: 4 },
      { L: 10, turn: 0, slope: -0.55, w: 6, cur: 7 },
      { L: 30, turn: 0, slope: -0.03, w: 7, cur: 3.6 },
      { L: 45, turn: -60, slope: -0.05, w: 6, cur: 4.2 },
      { L: 30, turn: 0, slope: -0.06, w: 5.6, cur: 4.4 },
      { L: 12, turn: 0, slope: -0.6, w: 5.6, cur: 7.5 },
      { L: 35, turn: 40, slope: -0.04, w: 6.5, cur: 3.8 },
      { L: 35, turn: -40, slope: -0.05, w: 6, cur: 4.2 },
      { L: 30, turn: 0, slope: -0.06, w: 5.6, cur: 4.4 },
      { L: 14, turn: 0, slope: -0.6, w: 6, cur: 8 },
      { L: 40, turn: 0, slope: -0.03, w: 7, cur: 3.4 },
    ],
    objs: [
      { t: 'hint', s: 2, text: 'Şelaleler geliyor! İnişte sıkı durun, savrulmayın!' },
      { t: 'star', s: 30, u: 3 }, { t: 'bean', s: 42, u: -3 },
      { t: 'star', s: 62, u: 0 },
      { t: 'arc', s: 82, u: -1.6, r: 2.8, span: 200, rot: 90, spin: 0.6 },
      { t: 'cp', s: 96 },
      { t: 'bar', s: 112, u: -1.8, len: 3.1, spin: 1.4 },
      { t: 'bar', s: 127, u: 1.8, len: 3.1, spin: -1.4 },
      { t: 'whirl', s: 146, u: 0, r: 3 },
      { t: 'star', s: 148, u: -3.3 },
      { t: 'log', s: 157, amp: 2.2, speed: 1.6, len: 3.0 },
      { t: 'rapids', s: 158, e: 178, amp: 0.42 },
      { t: 'cp', s: 186 },
      { t: 'soda', s: 190, u: 0 },
      { t: 'arc', s: 204, u: 2.2, r: 2.6, span: 220, rot: 180, spin: 0 },
      { t: 'arc', s: 222, u: -2.2, r: 2.6, span: 220, rot: 0, spin: 0 },
      { t: 'star', s: 212, u: 0 },
      { t: 'bar', s: 236, u: 0, len: 3.2, spin: 1.5 },
      { t: 'cp', s: 250 },
      { t: 'log', s: 260, amp: 2.2, speed: 1.44, len: 3.0 },
      { t: 'log', s: 268, amp: 2.2, speed: -1.44, len: 3.0 },
      { t: 'star', s: 272, u: 0 },
      { t: 'whirl', s: 304, u: -2, r: 3 },
      { t: 'star', s: 306, u: 3 },
      { t: 'arc', s: 316, u: 2.4, r: 2.6, span: 200, rot: 90, spin: 1 },
      { t: 'star', s: 324, u: -3 },
    ],
  },
];

export const DS = 0.5;
export const LEAD = 12;

export function buildTrack(def) {
  const first = def.segs[0];
  const segs = [{ L: LEAD, turn: 0, slope: -0.02, w: first.w, cur: first.cur * 0.8 }, ...def.segs, { L: 34, turn: 0, slope: -0.02, w: 7.5, cur: 2.4 }];
  const P = [];
  let x = 0, y = 0, z = 0, h = 0, w = first.w, cur = first.cur * 0.8, s = 0;
  P.push({ x, y, z, h, w, cur, s, slope: -0.02 });
  for (const sg of segs) {
    const n = Math.max(1, Math.round(sg.L / DS));
    const dh = (sg.turn * Math.PI) / 180 / n;
    const w0 = w, c0 = cur;
    for (let i = 1; i <= n; i++) {
      const f = Math.min(1, i / Math.max(1, n * 0.35));
      w = lerp(w0, sg.w, f); cur = lerp(c0, sg.cur, f);
      h += dh;
      x += Math.sin(h) * DS; z -= Math.cos(h) * DS; y += sg.slope * DS; s += DS;
      P.push({ x, y, z, h, w, cur, s, slope: sg.slope });
    }
  }
  const finishS = LEAD + def.segs.reduce((a, b) => a + b.L, 0);
  const objs = def.objs.map((o, id) => {
    const r = { ...o, id, s: o.s + LEAD, u: o.u || 0 };
    if (o.e != null) r.e = o.e + LEAD;
    const p = sampleAt({ P }, r.s);
    r.x = p.x + Math.cos(p.h) * r.u; r.z = p.z + Math.sin(p.h) * r.u; r.y = p.y; r.h = p.h;
    return r;
  });
  return { P, len: s, finishS, objs, def };
}

export function sampleAt(T, s) {
  return T.P[clamp(Math.round(s / DS), 0, T.P.length - 1)];
}

// Bir dünya noktasının nehirdeki yerini bul. hint: önceki indeks (yakın arama).
export function locate(T, x, z, hint = -1) {
  const P = T.P;
  let a = 0, b = P.length - 1;
  if (hint >= 0) { a = Math.max(0, hint - 40); b = Math.min(P.length - 1, hint + 40); }
  let best = a, bd = Infinity;
  for (let i = a; i <= b; i++) {
    const dx = P[i].x - x, dz = P[i].z - z, d = dx * dx + dz * dz;
    if (d < bd) { bd = d; best = i; }
  }
  const p = P[best];
  const fx = Math.sin(p.h), fz = -Math.cos(p.h), rx = Math.cos(p.h), rz = Math.sin(p.h);
  const dx = x - p.x, dz = z - p.z;
  const along = dx * fx + dz * fz;
  return { i: best, s: p.s + along, u: dx * rx + dz * rz, h: p.h, w: p.w, cur: p.cur, y: p.y + along * p.slope, slope: p.slope, fx, fz, rx, rz };
}
