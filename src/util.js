// DOM'a ve three'ye bağımlı olmayan yardımcılar (simülasyon Node'da da çalışsın diye).
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;
export const angDiff = (a, b) => {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};
// Yatay düzlemde (x,z) döndürme. Açı a: +x ekseni +z'ye doğru döner.
// Bu oyunda "ileri" yerel (0,-1) yönüdür; a açısındaki ileri = (sin a, -cos a).
export const rot = (x, z, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c - z * s, x * s + z * c];
};
export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash1 = (x) => { const s = Math.sin(x * 127.1 + 17.3) * 43758.5453; return s - Math.floor(s); };
export function vnoise(x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash1(i), hash1(i + 1), u);
}

