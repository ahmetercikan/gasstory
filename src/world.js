import { THREE, scene, mesh, toon, toonNew, canvasTex, clamp, lerp, rng, vnoise, QUALITY, SHADOW_TEX } from './core.js';
import { sampleAt } from './track.js';
import { logOffset } from './sim.js';

const waterMat = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    deep: { value: new THREE.Color(0x1f8fe6) },
    shallow: { value: new THREE.Color(0x5fd0ff) },
    foamC: { value: new THREE.Color(0xffffff) },
    fogColor: { value: scene.fog.color }, fogNear: { value: scene.fog.near }, fogFar: { value: scene.fog.far },
  },
  vertexShader: `attribute float rough; varying vec2 vUv; varying float vR; varying float vDepth;
void main(){ vUv = uv; vR = rough; vec4 mv = viewMatrix * modelMatrix * vec4(position,1.); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float time; uniform vec3 deep, shallow, foamC, fogColor; uniform float fogNear, fogFar;
varying vec2 vUv; varying float vR; varying float vDepth;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
void main(){
  float e = abs(vUv.x - 0.5) * 2.;
  vec3 col = mix(deep, shallow, smoothstep(0.35, 1.0, e));
  float sp = 4.0 + vR * 6.0;
  vec2 q = vec2(vUv.x * 10., (vUv.y - time * sp) * 0.32);
  q.x += sin(vUv.y * 0.6 + time) * 0.6;
  float n = noise(q) * 0.6 + noise(q * 2.3 + 3.1) * 0.4;
  float streak = smoothstep(0.66 - vR * 0.3, 0.72 - vR * 0.3, n) * (1. - smoothstep(0.62, 0.66, n + 0.09 - vR*0.3) * 0.0);
  float zig = smoothstep(0.93, 0.97, noise(vec2(vUv.x * 22., (vUv.y - time * sp) * 1.2)));
  float edgeFoam = smoothstep(0.84, 0.95, e + (noise(vec2(vUv.y * 0.9 - time * 3., vUv.x * 4.)) - 0.5) * 0.12);
  col = mix(col, foamC, clamp(max(max(streak * 0.6, zig * 0.7), edgeFoam) + vR * 0.25, 0., 1.));
  gl_FragColor = vec4(col, 1.);
  #include <colorspace_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vDepth));
}`,
});

export class World {
  constructor(T, levelDef) {
    this.T = T; this.def = levelDef;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.dynamic = [];
    this.pickups = new Map();
    this.cpFlags = [];
    this.buildWater();
    this.buildBanks();
    this.buildDecor();
    this.buildObjects();
    this.buildFinish();
  }

  dispose() {
    scene.remove(this.group);
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }

  buildWater() {
    const P = this.T.P, cols = 10, pos = [], uv = [], rough = [], idx = [];
    for (const p of P) {
      const rx = Math.cos(p.h), rz = Math.sin(p.h), W = p.w + 1.2;
      for (let j = 0; j <= cols; j++) {
        const t = j / cols, u = lerp(-W, W, t);
        pos.push(p.x + rx * u, p.y, p.z + rz * u); uv.push(t, p.s); rough.push(clamp(-p.slope * 5 - 0.2, 0, 1));
      }
    }
    for (let i = 0; i < P.length - 1; i++) for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j, b = a + cols + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('rough', new THREE.Float32BufferAttribute(rough, 1));
    g.setIndex(idx);
    g.computeBoundingSphere();
    this.water = new THREE.Mesh(g, waterMat);
    this.group.add(this.water);
  }

  buildBanks() {
    const P = this.T.P, th = this.def.theme;
    const cA = new THREE.Color(th.wallA), cB = new THREE.Color(th.wallB), dark = new THREE.Color(0x6b3b3b), grass = new THREE.Color(th.grass);
    for (const side of [-1, 1]) {
      const wp = [], wc = [], gp = [], gc = [], wi = [], gi = [];
      P.forEach((p, i) => {
        const rx = Math.cos(p.h) * side, rz = Math.sin(p.h) * side;
        const H = 3.2 + vnoise(p.s * 0.08 + side * 50) * 4 + vnoise(p.s * 0.31 + side * 9) * 0.8;
        const lean = 0.5 + vnoise(p.s * 0.2 + side * 3) * 0.6;
        const band = vnoise(p.s * 0.12 + side * 20);
        const top = cA.clone().lerp(cB, band);
        // duvar: su altı → orta → üst kenar
        const rows = [[p.w + 0.4, -0.8, dark], [p.w + 0.55 + lean * 0.5, H * 0.45, top.clone().lerp(dark, 0.25)], [p.w + 0.6 + lean, H, top]];
        for (const [d, hh, c] of rows) { wp.push(p.x + rx * d, p.y + hh, p.z + rz * d); wc.push(c.r, c.g, c.b); }
        const gw = [[p.w + 0.6 + lean, H], [p.w + 5, H + vnoise(p.s * 0.1 + side) * 0.6], [p.w + 18, H + 1 + vnoise(p.s * 0.05 + side * 7) * 3]];
        for (const [d, hh] of gw) {
          const c = grass.clone().offsetHSL(0, 0, (vnoise(p.s * 0.4 + d + side * 11) - 0.5) * 0.08);
          gp.push(p.x + rx * d, p.y + hh, p.z + rz * d); gc.push(c.r, c.g, c.b);
        }
        if (i < P.length - 1) {
          for (let k = 0; k < 2; k++) {
            const a = i * 3 + k, b = a + 3;
            wi.push(a, b, a + 1, a + 1, b, b + 1);
            gi.push(a, b, a + 1, a + 1, b, b + 1);
          }
        }
      });
      for (const [pos, col, ind, rough] of [[wp, wc, wi, true], [gp, gc, gi, false]]) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        g.setIndex(ind); g.computeVertexNormals();
        const m = new THREE.Mesh(g, toonNew({ vertexColors: true, side: THREE.DoubleSide }));
        m.receiveShadow = true;
        this.group.add(m);
      }
    }
  }

  buildDecor() {
    const P = this.T.P, R = rng(this.def.name.length * 991);
    const trees = [], rocks = [];
    for (let s = 0; s < this.T.len; s += 3.2 / QUALITY.trees) {
      const p = sampleAt(this.T, s);
      for (const side of [-1, 1]) {
        if (R() < 0.45) continue;
        const d = p.w + 2.6 + R() * 13;
        const H = 3.2 + vnoise(p.s * 0.08 + side * 50) * 4;
        trees.push({ x: p.x + Math.cos(p.h) * side * d, z: p.z + Math.sin(p.h) * side * d, y: p.y + H + (d > p.w + 5 ? (d - p.w - 5) / 13 * 1.5 : 0) - 0.1, s: 0.7 + R() * 0.8 });
        if (R() < 0.18) rocks.push({ x: p.x + Math.cos(p.h) * side * (p.w + 0.2), z: p.z + Math.sin(p.h) * side * (p.w + 0.2), y: p.y, s: 0.5 + R() * 0.7 });
      }
    }
    const trunkG = new THREE.CylinderGeometry(0.18, 0.28, 1.6, 6); trunkG.translate(0, 0.8, 0);
    const leafG = new THREE.IcosahedronGeometry(1.25, 0);
    const trunks = new THREE.InstancedMesh(trunkG, toon(0x8a5a3b), trees.length);
    const leaves = new THREE.InstancedMesh(leafG, toonNew({ color: 0xffffff }), trees.length * 2);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
    trees.forEach((t, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), R() * 6);
      m4.compose(v.set(t.x, t.y, t.z), q, sc.setScalar(t.s)); trunks.setMatrixAt(i, m4);
      for (let k = 0; k < 2; k++) {
        m4.compose(v.set(t.x + (k ? 0.4 : -0.2) * t.s, t.y + (1.9 + k * 0.9) * t.s, t.z + (k ? -0.3 : 0.2) * t.s), q, sc.setScalar(t.s * (k ? 0.75 : 1.05)));
        leaves.setMatrixAt(i * 2 + k, m4);
        leaves.setColorAt(i * 2 + k, col.setHSL(0.27 + R() * 0.08, 0.55, 0.38 + R() * 0.12));
      }
    });
    trunks.castShadow = leaves.castShadow = true;
    this.group.add(trunks, leaves);
    const rockG = new THREE.DodecahedronGeometry(1, 0);
    const rk = new THREE.InstancedMesh(rockG, toonNew({ color: 0x9a9aa6 }), Math.max(1, rocks.length));
    rocks.forEach((r, i) => { q.setFromEuler(new THREE.Euler(R(), R() * 6, R())); m4.compose(v.set(r.x, r.y, r.z), q, sc.set(r.s * 1.3, r.s, r.s * 1.2)); rk.setMatrixAt(i, m4); });
    rk.count = rocks.length;
    this.group.add(rk);
    // Bulutlar
    const cloudM = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
    const cg = new THREE.SphereGeometry(1, 12, 8);
    const mid = sampleAt(this.T, this.T.len / 2);
    for (let i = 0; i < 14; i++) {
      const c = new THREE.Group();
      for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(cg, cloudM); b.position.set((k - 2) * 2.4 + R(), R() * 1.5, R() * 2); b.scale.setScalar(2 + R() * 2.2); c.add(b); }
      const a = R() * Math.PI * 2, d = 110 + R() * 60;
      c.position.set(mid.x + Math.cos(a) * d, mid.y + 35 + R() * 30, mid.z + Math.sin(a) * d);
      c.lookAt(mid.x, c.position.y, mid.z);
      this.group.add(c);
    }
  }

  buildObjects() {
    for (const o of this.T.objs) {
      let g = null;
      if (o.t === 'rock') g = makeRock(o);
      else if (o.t === 'arc') g = makeArc(o);
      else if (o.t === 'bar') g = makeBar(o);
      else if (o.t === 'log') g = makeLog(o);
      else if (o.t === 'whirl') g = makeWhirl(o);
      else if (o.t === 'star' || o.t === 'bean' || o.t === 'soda') { g = makePickup(o); this.pickups.set(o.id, g); }
      else if (o.t === 'cp') { this.cpFlags.push(...makeCheckpoint(o, this.T, this.group)); continue; }
      if (!g) continue;
      g.position.set(o.x, o.y, o.z);
      g.rotation.y = -o.h;
      g.userData.o = o;
      this.group.add(g);
      if (g.userData.update) this.dynamic.push(g);
    }
  }

  buildFinish() {
    const p = sampleAt(this.T, this.T.finishS);
    const g = new THREE.Group();
    const W = p.w + 0.8;
    for (const s of [-1, 1]) {
      const post = mesh(new THREE.CylinderGeometry(0.35, 0.4, 9, 10), 0xffffff, { mat: toon(0xff5a5f) });
      post.position.set(s * W, 4.5, 0); g.add(post);
      const ball = mesh(new THREE.SphereGeometry(0.6, 12, 10), 0xffd23f); ball.position.set(s * W, 9.2, 0); g.add(ball);
    }
    const tex = canvasTex((c, w, h) => {
      const n = 16;
      for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#222' : '#fff'; c.fillRect((i * w) / n, (j * h) / 4, w / n, h / 4); }
      c.fillStyle = '#ffd23f'; c.fillRect(0, h / 2, w, h / 2);
      c.fillStyle = '#d6336c'; c.font = `bold ${h * 0.38}px "Baloo 2", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('BİTİŞ  💨  BİTİŞ', w / 2, h * 0.76);
    }, 1024, 256);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, W * 0.5), new THREE.MeshToonMaterial({ map: tex, side: THREE.DoubleSide }));
    banner.position.y = 7.6;
    g.add(banner);
    g.position.set(p.x, p.y, p.z); g.rotation.y = -p.h;
    this.group.add(g);
  }

  update(sim, t, dt) {
    waterMat.uniforms.time.value = t;
    for (const g of this.dynamic) g.userData.update(t, dt, sim);
    for (const [id, g] of this.pickups) {
      const got = sim.collected.has(id);
      if (got && g.visible) {
        g.userData.gone = (g.userData.gone || 0) + dt * 3;
        g.scale.setScalar(Math.max(0, 1 - g.userData.gone) * (1 + g.userData.gone));
        g.position.y += dt * 6;
        if (g.userData.gone >= 1) g.visible = false;
      } else if (!got && !g.visible) { g.visible = true; g.userData.gone = 0; g.scale.setScalar(1); g.position.y = g.userData.o.y; }
    }
    this.cpFlags.forEach((f) => { f.material = f.userData.i <= sim.cp ? toon(0x4cd964) : toon(0xffd23f); });
  }
}

function spikesAlong(points, outward, count) {
  const cone = new THREE.ConeGeometry(0.11, 0.42, 6);
  const im = new THREE.InstancedMesh(cone, toon(0xfff7ea), count);
  im.castShadow = true;
  return im;
}

function makeArc(o) {
  const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
  const span = (o.span * Math.PI) / 180;
  const tube = mesh(new THREE.TorusGeometry(o.r, 0.3, 10, Math.ceil(o.span / 6), span), 0x8e2b3a);
  tube.rotation.x = -Math.PI / 2; tube.position.y = 0.45;
  spin.add(tube);
  const n = Math.max(4, Math.floor((span * o.r) / 0.55));
  const im = spikesAlong(null, null, n * 3);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < n; i++) {
    const phi = ((i + 0.5) / n) * span, cx = Math.cos(phi), cz = -Math.sin(phi);
    // dışa, içe ve yukarı bakan dikenler
    const dirs = [[cx, 0, cz], [-cx, 0, -cz], [0, 1, 0]];
    dirs.forEach((d, k) => {
      const rr = o.r + d[0] * cx * 0.32 + d[2] * cz * 0.32;
      v.set(cx * rr, 0.45 + d[1] * 0.32, cz * rr);
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...d));
      m4.compose(v, q, one); im.setMatrixAt(i * 3 + k, m4);
    });
  }
  spin.add(im);
  // Uç şamandıraları
  for (const phi of [0, span]) {
    const b = mesh(new THREE.SphereGeometry(0.45, 12, 10), 0xff5a5f);
    b.position.set(Math.cos(phi) * o.r, 0.4, -Math.sin(phi) * o.r); spin.add(b);
  }
  g.userData.update = (t) => {
    spin.rotation.y = (o.rot * Math.PI) / 180 + (o.spin || 0) * t;
    spin.position.y = Math.sin(t * 2 + o.s) * 0.08;
  };
  return g;
}

function spikedLog(len, color = 0x8e2b3a) {
  const g = new THREE.Group();
  const log = mesh(new THREE.CylinderGeometry(0.32, 0.32, len, 12), color);
  log.rotation.z = Math.PI / 2; g.add(log);
  const n = Math.floor(len / 0.45);
  const im = spikesAlong(null, null, n * 4);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + i * 0.6, dy = Math.cos(a), dz = Math.sin(a);
    v.set(-len / 2 + (i + 0.5) * (len / n), dy * 0.42, dz * 0.42);
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, dy, dz));
    m4.compose(v, q, one); im.setMatrixAt(i * 4 + k, m4);
  }
  g.add(im);
  for (const s of [-1, 1]) { const cap = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 12), 0xf2c76b); cap.rotation.z = Math.PI / 2; cap.position.x = (s * len) / 2; g.add(cap); }
  return g;
}

function makeBar(o) {
  const g = new THREE.Group();
  const post = mesh(new THREE.CylinderGeometry(0.45, 0.6, 2.4, 10), 0x9a6a44); post.position.y = 0.6; g.add(post);
  const capM = mesh(new THREE.ConeGeometry(0.6, 0.6, 10), 0xff5a5f); capM.position.y = 2.1; g.add(capM);
  const arm = spikedLog(o.len * 2); arm.position.y = 0.55; g.add(arm);
  g.userData.update = (t) => { arm.rotation.y = o.spin * t; };
  return g;
}

function makeLog(o) {
  const g = new THREE.Group();
  const log = spikedLog(o.len, 0x7a4a2e); log.position.y = 0.35; g.add(log);
  // Kenarlarda raylar
  g.userData.update = (t) => { log.position.x = logOffset(o, t); log.rotation.x = t * 3 * Math.sign(o.speed); };
  return g;
}

function makeRock(o) {
  const g = new THREE.Group();
  const r = mesh(new THREE.DodecahedronGeometry(o.r, 1), 0, { mat: toonNew({ color: 0x8e8e9c }) });
  r.scale.set(1, 0.75, 1); r.position.y = 0.1; r.rotation.set(0.3, o.s, 0.2);
  g.add(r);
  const moss = mesh(new THREE.SphereGeometry(o.r * 0.55, 8, 6), 0x7cc36a); moss.scale.set(1, 0.4, 1); moss.position.set(0.2, o.r * 0.62, 0); g.add(moss);
  const foam = new THREE.Mesh(new THREE.RingGeometry(o.r * 0.95, o.r * 1.35, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false }));
  foam.rotation.x = -Math.PI / 2; foam.position.y = 0.03; g.add(foam);
  g.userData.update = (t) => { foam.scale.setScalar(1 + Math.sin(t * 3 + o.s) * 0.06); };
  return g;
}

const SPIRAL = canvasTex((c, w) => {
  c.translate(w / 2, w / 2);
  for (let k = 0; k < 4; k++) {
    c.rotate(Math.PI / 2);
    c.beginPath();
    for (let a = 0; a < 9; a += 0.05) { const r = a * (w / 2 / 9); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 7; c.stroke();
  }
  const gr = c.createRadialGradient(0, 0, 0, 0, 0, w / 2);
  gr.addColorStop(0, 'rgba(0,40,110,0.85)'); gr.addColorStop(0.5, 'rgba(0,80,160,0.35)'); gr.addColorStop(1, 'rgba(0,80,160,0)');
  c.fillStyle = gr; c.beginPath(); c.arc(0, 0, w / 2, 0, Math.PI * 2); c.fill();
}, 256);
function makeWhirl(o) {
  const g = new THREE.Group();
  const d = new THREE.Mesh(new THREE.CircleGeometry(o.r * 1.5, 40), new THREE.MeshBasicMaterial({ map: SPIRAL, transparent: true, depthWrite: false }));
  d.rotation.x = -Math.PI / 2; d.position.y = 0.04; g.add(d);
  const d2 = d.clone(); d2.scale.setScalar(0.6); d2.position.y = 0.05; g.add(d2);
  g.userData.update = (t) => { d.rotation.z = t * 2.2; d2.rotation.z = t * 3.5; };
  return g;
}

const STAR_SHAPE = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.28 : 0.62, a = (i / 10) * Math.PI * 2 + Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  return s;
})();
function makePickup(o) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  if (o.t === 'star') {
    const st = mesh(new THREE.ExtrudeGeometry(STAR_SHAPE, { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 }), 0, { mat: toonNew({ color: 0xffd23f, emissive: 0x6a4a00 }) });
    st.geometry.center(); inner.add(st);
  } else {
    const can = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.9, 16), o.t === 'bean' ? 0xe8572a : 0x2fa8ff);
    const band = mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.38, 16), 0xffffff); can.add(band);
    const top = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 16), 0xcfd6de); top.position.y = 0.47; can.add(top);
    const icon = mesh(new THREE.SphereGeometry(0.14, 8, 6), o.t === 'bean' ? 0x7a3b1d : 0x9be22d); icon.scale.set(1.4, 0.8, 0.8); icon.position.set(0, 0, -0.36); can.add(icon);
    can.rotation.z = 0.35; inner.add(can);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.9, 24), new THREE.MeshBasicMaterial({ color: o.t === 'star' ? 0xffe680 : 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  g.userData.update = (t) => { inner.position.y = 0.9 + Math.sin(t * 3 + o.s) * 0.18; inner.rotation.y = t * 2.5; ring.scale.setScalar(1 + Math.sin(t * 4) * 0.1); };
  return g;
}

function makeCheckpoint(o, T, group) {
  const p = sampleAt(T, o.s), flags = [];
  const idx = T.objs.filter((x) => x.t === 'cp').sort((a, b) => a.s - b.s).indexOf(o);
  for (const s of [-1, 1]) {
    const d = p.w + 0.9;
    const pole = mesh(new THREE.CylinderGeometry(0.08, 0.08, 4, 6), 0xffffff);
    pole.position.set(p.x + Math.cos(p.h) * s * d, p.y + 4.5, p.z + Math.sin(p.h) * s * d);
    const flag = mesh(new THREE.PlaneGeometry(1.4, 0.9), 0, { mat: toon(0xffd23f) });
    flag.material = toon(0xffd23f);
    flag.position.set(0.7, 1.4, 0); flag.userData.i = idx;
    pole.add(flag); pole.rotation.y = -p.h;
    group.add(pole); flags.push(flag);
  }
  return flags;
}

// --- Sal
export class RaftView {
  constructor() {
    this.root = new THREE.Group();
    this.tilt = new THREE.Group(); this.root.add(this.tilt);
    this.body = new THREE.Group(); this.tilt.add(this.body);
    const segs = 8;
    this.tubes = [];
    for (let i = 0; i < segs; i++) {
      const t = mesh(new THREE.TorusGeometry(1.98, 0.42, 12, 10, (Math.PI * 2) / segs + 0.01), i % 2 ? 0xfff0dc : 0xffd2a8);
      t.rotation.x = -Math.PI / 2; t.rotation.z = (i / segs) * Math.PI * 2; t.position.y = 0.35;
      this.body.add(t); this.tubes.push(t);
    }
    const deckTex = canvasTex((c, w) => {
      c.fillStyle = '#9ed36a'; c.fillRect(0, 0, w, w);
      c.strokeStyle = 'rgba(60,110,40,0.55)'; c.lineWidth = 3;
      for (let i = 1; i < 7; i++) { c.beginPath(); c.moveTo(0, (i * w) / 7); c.lineTo(w, (i * w) / 7); c.stroke(); }
    }, 256);
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 0.16, 36), [toon(0x7fb956), new THREE.MeshToonMaterial({ map: deckTex }), toon(0x7fb956)]);
    deck.position.y = 0.2; deck.receiveShadow = true; deck.castShadow = true;
    this.body.add(deck);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const h = mesh(new THREE.BoxGeometry(0.34, 0.28, 0.5), 0xd8343f);
      h.position.set(Math.cos(a) * 2.02, 0.72, Math.sin(a) * 2.02); h.rotation.y = -a;
      this.body.add(h);
    }
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(2.7, 24), new THREE.MeshBasicMaterial({ map: SHADOW_TEX, transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.deckY = 0.28;
    scene.add(this.root, this.shadow);
    this.popK = 0;
  }
  dispose() { scene.remove(this.root, this.shadow); }
  update(sim, t, dt) {
    const r = sim.raft;
    const bob = Math.sin(t * 2.2) * 0.05;
    this.root.position.set(r.x, r.y + bob, r.z);
    this.root.rotation.y = -r.a;
    const MAX = 0.3;
    let rx = r.tz * MAX, rz = -r.tx * MAX;
    if (r.flip > 0) rx += (1 - r.flip) * Math.PI * 2 * (r.flip > 0 ? 1 : 0);
    this.tilt.rotation.set(rx, 0, rz);
    // Can kaybında simit söner, yanıp söner
    const hpK = clamp(r.hp / 3, 0, 1);
    this.body.scale.y = lerp(this.body.scale.y, 0.72 + 0.28 * hpK, dt * 4);
    this.popK = sim.mode === 'popped' ? Math.min(1, this.popK + dt * 1.2) : Math.max(0, this.popK - dt * 3);
    this.body.scale.x = this.body.scale.z = 1 - this.popK * 0.5;
    this.body.position.y = -this.popK * 0.5;
    this.body.visible = !(r.inv > 0 && sim.mode === 'play' && Math.floor(t * 12) % 2 === 0);
    this.shadow.position.set(r.x, r.y + 0.03, r.z);
  }
}
