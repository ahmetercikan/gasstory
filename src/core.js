import * as THREE from 'three';
import { haptic } from './native.js';

export { THREE };
export const $ = (s) => document.querySelector(s);
import { clamp, lerp, TAU, angDiff, rot, rng, hash1, vnoise } from './util.js';
export { clamp, lerp, TAU, angDiff, rot, rng, hash1, vnoise };

export const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const lowEnd = isTouch && (navigator.hardwareConcurrency || 4) <= 4;
export const QUALITY = {
  pixelRatio: Math.min(devicePixelRatio, isTouch ? (lowEnd ? 1.25 : 1.75) : 2),
  shadow: lowEnd ? 1024 : 2048,
  trees: lowEnd ? 0.5 : 1,
};

export const canvas = $('#c');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowEnd, powerPreference: 'high-performance' });
renderer.setPixelRatio(QUALITY.pixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

export const scene = new THREE.Scene();
// Sis rengi ekranda doğrudan görünen değer olsun diye doğrusal uzayda veriliyor
// (three, sisi renk dönüşümünden sonra karıştırır).
const FOG = new THREE.Color().setRGB(0.78, 0.91, 1.0, THREE.LinearSRGBColorSpace);
scene.fog = new THREE.Fog(FOG, 55, 150);
export const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 400);

function onResize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  // Dikey ekranda görüş alanını biraz aç ki nehir genişliği sığsın.
  camera.fov = camera.aspect < 0.8 ? 68 : 55;
  camera.updateProjectionMatrix();
}
addEventListener('resize', onResize);
onResize();

// Gökyüzü: ufukta sis rengine birebir karışan degrade.
export const sky = new THREE.Mesh(
  new THREE.SphereGeometry(300, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(0x3d9dff) },
      mid: { value: new THREE.Color(0xa8dcff) },
      fogC: { value: FOG },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 fogC; varying vec3 vP;
void main(){ float h = vP.y; gl_FragColor = vec4(mix(mid, top, smoothstep(0.05, 0.7, h)), 1.);
#include <colorspace_fragment>
gl_FragColor.rgb = mix(fogC, gl_FragColor.rgb, smoothstep(-0.04, 0.2, h)); }`,
  })
);
sky.frustumCulled = false;
sky.renderOrder = -10;
scene.add(sky);

export const hemi = new THREE.HemisphereLight(0xe4f4ff, 0x7d8a5a, 1.25);
scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xfff6e8, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(QUALITY.shadow, QUALITY.shadow);
{
  const sc = sun.shadow.camera;
  sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 120;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
}
scene.add(sun, sun.target);
export const SUN_OFFSET = new THREE.Vector3(18, 38, 12);

// Çizgi film görünümü için 3 basamaklı toon geçişi.
const GRAD = (() => {
  const t = new THREE.DataTexture(new Uint8Array([110, 180, 235, 255]), 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const matCache = new Map();
export function toon(color, extra) {
  const key = color + (extra ? JSON.stringify(extra) : '');
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshToonMaterial({ color, gradientMap: GRAD, ...extra }));
  return matCache.get(key);
}
export function toonNew(opts) { return new THREE.MeshToonMaterial({ gradientMap: GRAD, ...opts }); }
export function mesh(geo, color, { cast = true, receive = false, mat } = {}) {
  const m = new THREE.Mesh(geo, mat || toon(color));
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}

export function canvasTex(draw, w = 128, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export const PUFF_TEX = canvasTex((g, s) => {
  const blob = (x, y, r) => {
    const gr = g.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.7, 'rgba(235,235,235,0.95)');
    gr.addColorStop(1, 'rgba(210,210,210,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  };
  blob(s * 0.5, s * 0.55, s * 0.3); blob(s * 0.33, s * 0.5, s * 0.2); blob(s * 0.67, s * 0.48, s * 0.21);
  blob(s * 0.5, s * 0.35, s * 0.2); blob(s * 0.42, s * 0.68, s * 0.17); blob(s * 0.62, s * 0.66, s * 0.17);
});
export const DOT_TEX = canvasTex((g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
}, 64);
export const RING_TEX = canvasTex((g, s) => {
  g.strokeStyle = 'rgba(255,255,255,0.95)';
  for (let i = 0; i < 3; i++) {
    g.lineWidth = s * 0.05 - i * 1.5; g.globalAlpha = 1 - i * 0.3;
    g.beginPath(); g.arc(s / 2, s / 2, s * 0.42 - i * s * 0.03 + Math.sin(i) * 2, 0, TAU); g.stroke();
  }
}, 256);
export const SHADOW_TEX = canvasTex((g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(0,30,60,0.45)'); gr.addColorStop(0.6, 'rgba(0,30,60,0.3)'); gr.addColorStop(1, 'rgba(0,30,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
}, 128);

const _pv = new THREE.Vector3();
export function project(v) {
  _pv.copy(v).project(camera);
  return { x: (_pv.x * 0.5 + 0.5) * innerWidth, y: (-_pv.y * 0.5 + 0.5) * innerHeight, vis: _pv.z < 1 && _pv.z > -1 };
}

export const store = {
  get(k, d) { try { const v = localStorage.getItem('gasstory-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('gasstory-' + k, JSON.stringify(v)); } catch { /* gizli mod */ } },
};

export function vibrate(ms) { haptic(ms); }
