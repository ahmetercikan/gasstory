import { THREE, scene, PUFF_TEX, DOT_TEX, RING_TEX, project, $ } from './core.js';

// Basit parçacık havuzu (gaz bulutları, su damlaları, kıvılcımlar)
const MAX = 260;
const parts = [];
for (let i = 0; i < MAX; i++) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: PUFF_TEX, transparent: true, depthWrite: false }));
  m.visible = false; scene.add(m);
  parts.push({ m, life: 0, max: 1, vx: 0, vy: 0, vz: 0, s0: 1, s1: 1, g: 0, drag: 1, op: 1, spin: 0 });
}
let pi = 0;
export function emit(x, y, z, { vx = 0, vy = 0, vz = 0, life = 1, s0 = 0.5, s1 = 1.5, color = 0xffffff, g = 0, drag = 0.96, op = 0.95, tex = PUFF_TEX } = {}) {
  const p = parts[pi]; pi = (pi + 1) % MAX;
  p.m.position.set(x, y, z); p.m.visible = true;
  p.m.material.map = tex; p.m.material.color.set(color); p.m.material.opacity = op;
  p.m.material.rotation = Math.random() * 6;
  Object.assign(p, { life, max: life, vx, vy, vz, s0, s1, g, drag, op, spin: (Math.random() - 0.5) * 2 });
}

// Yatay su halkaları (salın arkasında, videodaki gibi)
const rings = [];
for (let i = 0; i < 24; i++) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: RING_TEX, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m);
  rings.push({ m, life: 0, max: 1, s0: 1, s1: 2 });
}
let ri = 0;
export function ring(x, y, z, { s0 = 4.5, s1 = 9, life = 1.5, op = 0.75 } = {}) {
  const r = rings[ri]; ri = (ri + 1) % rings.length;
  r.m.position.set(x, y + 0.04, z); r.m.visible = true; r.m.material.opacity = op;
  r.m.rotation.z = Math.random() * 6;
  Object.assign(r, { life, max: life, s0, s1, op });
}

// Geğirme şok dalgası
const shocks = [];
for (let i = 0; i < 6; i++) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 6, 24), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, depthWrite: false }));
  m.visible = false; scene.add(m); shocks.push({ m, life: 0, max: 0.5, vx: 0, vy: 0, vz: 0 });
}
let si = 0;
export function shock(x, y, z, dx, dz, k) {
  const s = shocks[si]; si = (si + 1) % shocks.length;
  s.m.position.set(x, y, z); s.m.visible = true;
  s.m.lookAt(x + dx, y, z + dz);
  Object.assign(s, { life: 0.5, max: 0.5, vx: dx * (6 + 6 * k), vy: 0, vz: dz * (6 + 6 * k), k });
}

export function updateFx(dt) {
  for (const p of parts) {
    if (!p.m.visible) continue;
    p.life -= dt;
    if (p.life <= 0) { p.m.visible = false; continue; }
    const f = 1 - p.life / p.max;
    p.vy -= p.g * dt;
    const d = Math.pow(p.drag, dt * 60);
    p.vx *= d; p.vy *= d; p.vz *= d;
    p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
    const s = p.s0 + (p.s1 - p.s0) * Math.sqrt(f);
    p.m.scale.set(s, s, s);
    p.m.material.opacity = p.op * (f < 0.1 ? f / 0.1 : 1 - Math.pow(f, 2));
    p.m.material.rotation += p.spin * dt;
  }
  for (const r of rings) {
    if (!r.m.visible) continue;
    r.life -= dt;
    if (r.life <= 0) { r.m.visible = false; continue; }
    const f = 1 - r.life / r.max, s = r.s0 + (r.s1 - r.s0) * f;
    r.m.scale.set(s, s, 1); r.m.material.opacity = r.op * (1 - f);
  }
  for (const s of shocks) {
    if (!s.m.visible) continue;
    s.life -= dt;
    if (s.life <= 0) { s.m.visible = false; continue; }
    const f = 1 - s.life / s.max;
    s.m.position.x += s.vx * dt; s.m.position.z += s.vz * dt;
    s.m.scale.setScalar(1 + f * (3 + s.k * 3));
    s.m.material.opacity = 0.8 * (1 - f);
  }
}

export const FART_COLORS = [0xa6e22e, 0x8fd12a, 0xc4ef4a, 0x9bd94a];
export const BURP_COLORS = [0xfff3b0, 0xffe27a, 0xffd6e6, 0xfff9d9];
export function fartPuff(x, y, z, dx, dz, rvx, rvz, boost) {
  const sp = 3 + Math.random() * 2;
  emit(x, y, z, {
    vx: -dx * sp + (Math.random() - 0.5) * 1.4 + rvx * 0.6, vy: 0.4 + Math.random() * 0.8, vz: -dz * sp + (Math.random() - 0.5) * 1.4 + rvz * 0.6,
    life: 0.9 + Math.random() * 0.4, s0: 0.4, s1: boost ? 2.8 : 2.1, color: boost ? 0xd6ff3a : FART_COLORS[(Math.random() * 4) | 0], drag: 0.95,
  });
}
export function burpBurst(x, y, z, dx, dz, k) {
  const n = 10 + Math.floor(k * 22);
  for (let i = 0; i < n; i++) {
    const a = (Math.random() - 0.5) * 1.1, sp = 4 + Math.random() * 6 * (0.5 + k);
    const ex = dx * Math.cos(a) - dz * Math.sin(a), ez = dx * Math.sin(a) + dz * Math.cos(a);
    emit(x, y, z, { vx: ex * sp, vy: (Math.random() - 0.3) * 2, vz: ez * sp, life: 0.6 + Math.random() * 0.5, s0: 0.3, s1: 1.4 + k * 1.6, color: BURP_COLORS[(Math.random() * 4) | 0], drag: 0.92 });
  }
  shock(x, y, z, dx, dz, k);
}
export function splash(x, y, z, n = 18, power = 1) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = (1.5 + Math.random() * 3) * power;
    emit(x, y + 0.2, z, { vx: Math.cos(a) * sp, vy: (3 + Math.random() * 4) * power, vz: Math.sin(a) * sp, life: 0.8, s0: 0.25, s1: 0.5, color: 0xeaf8ff, g: 14, drag: 0.99, tex: DOT_TEX });
  }
  ring(x, y, z, { s0: 1, s1: 5, life: 0.9, op: 0.9 });
}
export function sparks(x, y, z, color = 0xffe066, n = 14) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 4;
    emit(x, y, z, { vx: Math.cos(a) * sp, vy: 2 + Math.random() * 4, vz: Math.sin(a) * sp, life: 0.7, s0: 0.35, s1: 0.1, color, g: 6, tex: DOT_TEX });
  }
}
export function clearFx() {
  parts.forEach((p) => (p.m.visible = false));
  rings.forEach((r) => (r.m.visible = false));
  shocks.forEach((s) => (s.m.visible = false));
}

// --- Ekranda yükselen yazılar (PIRRRT!, BÖĞĞ!, +⭐ ...)
const layer = $('#floaters');
const floaters = [];
export function floatText(pos, text, { color = '#fff', size = 1, life = 1.2, cls = '' } = {}) {
  const el = document.createElement('div');
  el.className = 'ftxt ' + cls;
  el.textContent = text;
  el.style.color = color;
  el.style.setProperty('--s', size);
  layer.appendChild(el);
  floaters.push({ el, pos: pos.clone(), life, max: life, dx: (Math.random() - 0.5) * 30 });
}
export function updateFloaters(dt) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.life -= dt;
    if (f.life <= 0) { f.el.remove(); floaters.splice(i, 1); continue; }
    const k = 1 - f.life / f.max;
    const p = project(f.pos);
    f.el.style.transform = `translate(${p.x + f.dx * k}px, ${p.y - k * 70}px) translate(-50%,-50%) scale(${k < 0.15 ? k / 0.15 : 1})`;
    f.el.style.opacity = p.vis ? (k > 0.7 ? (1 - k) / 0.3 : 1) : 0;
  }
}
export function clearFloaters() { floaters.forEach((f) => f.el.remove()); floaters.length = 0; }
