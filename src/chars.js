import { THREE, mesh, toon, lerp } from './core.js';

export const CHARS = [
  { id: 'frog', name: 'Kurbağa', img: './img/char-frog.png', color: 0x86d94a, belly: 0xe4f8a8, feet: 0x6cc23a, pitch: 1.25 },
  { id: 'hippo', name: 'Su Aygırı', img: './img/char-hippo.png', color: 0x7a7393, belly: 0xc9b6d4, feet: 0x5f5878, pitch: 0.75 },
  { id: 'penguin', name: 'Penguen', img: './img/char-penguin.png', color: 0x2b3a67, belly: 0xf6f6f6, feet: 0xff9a2e, pitch: 1.1 },
  { id: 'bear', name: 'Ayı', img: './img/char-bear.png', color: 0x9a6240, belly: 0xe6b582, feet: 0x7a4a2e, pitch: 0.9 },
];
export const POWERS = {
  fart: { name: 'Osurma', icon: 'fart', desc: 'Basılı tut: sürekli itiş. Sal, baktığın yöne gider.' },
  burp: { name: 'Geğirme', icon: 'burp', desc: 'Basılı tut, şişir, bırak: dev patlama! Sal arkana fırlar.' },
};
export const SLOT_COLORS = ['#ff5a5f', '#3fa7ff', '#ffc93c', '#b26bff'];
export const SLOT_HEX = [0xff5a5f, 0x3fa7ff, 0xffc93c, 0xb26bff];

const sph = (r, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h);

function eye(parent, x, y, z, r, white = 0xffffff) {
  const e = mesh(sph(r, 12, 10), white, { cast: false });
  e.position.set(x, y, z);
  const p = mesh(sph(r * 0.55, 10, 8), 0x161616, { cast: false });
  p.position.set(0, r * 0.05, -r * 0.6);
  const hl = mesh(sph(r * 0.18, 6, 6), 0xffffff, { cast: false });
  hl.position.set(r * 0.18, r * 0.25, -r * 0.95);
  e.add(p, hl);
  parent.add(e);
  return e;
}

// Model -z yönüne bakar. Ayak tabanı y=0.
export function buildCharacter(ci, slot) {
  const C = CHARS[ci];
  const root = new THREE.Group();
  const pivot = new THREE.Group(); root.add(pivot);
  const body = new THREE.Group(); pivot.add(body);

  const torso = mesh(sph(0.42, 20, 16), C.color);
  torso.scale.set(1, 1.08, 0.95); torso.position.y = 0.5;
  body.add(torso);
  const belly = mesh(sph(0.34, 16, 12), C.belly, { cast: false });
  belly.scale.set(0.9, 1, 0.55); belly.position.set(0, 0.46, -0.21);
  body.add(belly);

  // Oyuncu rengindeki boyun atkısı (kimin kim olduğu hemen anlaşılsın)
  const scarf = mesh(new THREE.TorusGeometry(0.3, 0.075, 8, 20), 0xffffff, { mat: toon(SLOT_HEX[slot % 4]) });
  scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.8;
  body.add(scarf);
  const tail = mesh(new THREE.BoxGeometry(0.1, 0.22, 0.05), 0, { mat: toon(SLOT_HEX[slot % 4]) });
  tail.position.set(0.16, 0.66, 0.31); tail.rotation.z = 0.4;
  body.add(tail);

  const head = new THREE.Group(); head.position.y = 0.98; body.add(head);
  const headM = mesh(sph(0.36, 20, 16), C.color); head.add(headM);
  const mouth = new THREE.Group(); head.add(mouth);

  if (C.id === 'frog') {
    headM.scale.set(1.25, 0.82, 1.05);
    eye(head, -0.17, 0.25, -0.12, 0.13); eye(head, 0.17, 0.25, -0.12, 0.13);
    const m = mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 16, Math.PI), 0x3a1f1f, { cast: false });
    m.rotation.z = Math.PI; m.rotation.x = -0.35; m.scale.set(1, 0.55, 1); m.position.set(0, 0.03, -0.37); mouth.add(m);
    for (const s of [-1, 1]) { const c = mesh(sph(0.06, 8, 6), 0xff8fa3, { cast: false }); c.position.set(s * 0.27, -0.03, -0.25); head.add(c); }
  } else if (C.id === 'hippo') {
    headM.scale.set(1.05, 0.95, 1);
    const sn = mesh(sph(0.3, 16, 12), C.belly); sn.scale.set(1.3, 0.85, 1); sn.position.set(0, -0.1, -0.3); head.add(sn);
    for (const s of [-1, 1]) {
      const n = mesh(sph(0.045, 6, 6), 0x3b3550, { cast: false }); n.position.set(s * 0.12, -0.02, -0.56); head.add(n);
      const ear = mesh(sph(0.08, 8, 6), C.color); ear.position.set(s * 0.24, 0.3, 0.04); head.add(ear);
    }
    eye(head, -0.15, 0.16, -0.24, 0.08); eye(head, 0.15, 0.16, -0.24, 0.08);
    const m = mesh(new THREE.BoxGeometry(0.34, 0.03, 0.04), 0x3b3550, { cast: false }); m.position.set(0, -0.2, -0.57); mouth.add(m);
  } else if (C.id === 'penguin') {
    const face = mesh(sph(0.3, 16, 12), C.belly, { cast: false }); face.scale.set(0.95, 0.85, 0.7); face.position.set(0, -0.03, -0.14); head.add(face);
    const beak = mesh(new THREE.ConeGeometry(0.09, 0.26, 8), 0xff9a2e); beak.rotation.x = -Math.PI / 2; beak.position.set(0, -0.05, -0.42); mouth.add(beak);
    eye(head, -0.12, 0.08, -0.3, 0.07); eye(head, 0.12, 0.08, -0.3, 0.07);
  } else {
    for (const s of [-1, 1]) {
      const ear = mesh(sph(0.11, 10, 8), C.color); ear.position.set(s * 0.25, 0.28, 0); head.add(ear);
      const inner = mesh(sph(0.06, 8, 6), C.belly, { cast: false }); inner.position.set(0, 0, -0.06); ear.add(inner);
    }
    const sn = mesh(sph(0.15, 12, 10), C.belly); sn.scale.set(1.2, 0.85, 1); sn.position.set(0, -0.08, -0.31); head.add(sn);
    const nose = mesh(sph(0.055, 8, 6), 0x2a1a12, { cast: false }); nose.position.set(0, -0.03, -0.46); head.add(nose);
    eye(head, -0.13, 0.1, -0.29, 0.07); eye(head, 0.13, 0.1, -0.29, 0.07);
    const m = mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 10, Math.PI), 0x2a1a12, { cast: false }); m.rotation.z = Math.PI; m.position.set(0, -0.16, -0.43); mouth.add(m);
  }

  const arms = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(s * 0.38, 0.62, -0.02);
    const a = mesh(C.id === 'penguin' ? new THREE.BoxGeometry(0.08, 0.36, 0.2) : sph(0.11, 10, 8), C.color);
    if (C.id !== 'penguin') a.scale.set(0.85, 1.5, 0.85);
    a.position.y = -0.14;
    g.add(a); g.rotation.z = s * 0.35;
    body.add(g); arms.push(g);
  }
  const feet = [];
  for (const s of [-1, 1]) {
    const f = mesh(sph(0.13, 10, 8), C.feet); f.scale.set(1, 0.5, 1.4); f.position.set(s * 0.18, 0.06, -0.06);
    pivot.add(f); feet.push(f);
  }
  // Gaz çıkış noktaları (karakterin kendi uzayında)
  const butt = new THREE.Object3D(); butt.position.set(0, 0.32, 0.42); body.add(butt);
  const mouthPt = new THREE.Object3D(); mouthPt.position.set(0, -0.08, -0.5); head.add(mouthPt);

  root.scale.setScalar(0.95);
  return {
    root, pivot, body, head, mouth, arms, feet, butt, mouthPt, torso,
    phase: Math.random() * 10,
    k: { walk: 0, lean: 0, back: 0, inflate: 0, head: 0, swim: 0 },
  };
}

// p: oyuncu durumu (sim). t: süre.
export function animateCharacter(ch, p, t, dt) {
  const k = ch.k, f = Math.min(1, dt * 12);
  const fart = p.power === 'fart';
  k.walk = lerp(k.walk, p.moving && p.onRaft ? 1 : 0, f);
  k.lean = lerp(k.lean, p.onRaft && fart && p.gasOn ? 1 : 0, f);
  k.back = lerp(k.back, p.onRaft && !fart ? p.charge : 0, f);
  k.head = lerp(k.head, p.burpT > 0 ? 1 : 0, Math.min(1, dt * 20));
  k.swim = lerp(k.swim, p.onRaft ? 0 : 1, Math.min(1, dt * 6));

  const ph = t * 13 + ch.phase;
  const bob = Math.abs(Math.sin(ph)) * 0.09 * k.walk;
  ch.pivot.position.y = bob - k.swim * 0.62 + (k.swim > 0.5 ? Math.sin(t * 3 + ch.phase) * 0.06 : 0);
  ch.pivot.rotation.z = Math.sin(ph) * 0.12 * k.walk + (p.dizzy > 0 ? Math.sin(t * 9) * 0.15 : 0);
  ch.feet[0].position.z = -0.06 + Math.sin(ph) * 0.12 * k.walk;
  ch.feet[1].position.z = -0.06 - Math.sin(ph) * 0.12 * k.walk;

  // Osururken öne eğilip popoyu çıkarır, titrer. Geğirmeye hazırlanırken geriye yaslanıp şişer.
  ch.body.rotation.x = -0.55 * k.lean + 0.32 * k.back - 0.35 * k.head;
  const shake = k.lean * Math.sin(t * 45) * 0.04;
  const inflate = 1 + 0.18 * k.back;
  ch.body.scale.set(inflate + shake, 1 + 0.06 * k.back - k.head * 0.05, inflate);
  ch.head.rotation.x = 0.55 * k.back - 0.45 * k.head + (p.dizzy > 0 ? Math.sin(t * 7) * 0.2 : 0);
  ch.mouth.scale.setScalar(1 + k.head * 1.6);

  const flail = k.swim * (1.6 + Math.sin(t * 11 + ch.phase) * 0.6);
  const armBase = 0.35 + k.walk * Math.sin(ph) * 0.3;
  ch.arms[0].rotation.z = -(armBase + flail + k.back * 0.6);
  ch.arms[1].rotation.z = armBase + flail + k.back * 0.6;
  ch.arms[0].rotation.x = k.lean * -0.9;
  ch.arms[1].rotation.x = k.lean * -0.9;
}
