import { $, isTouch } from './core.js';

// Dokunmatik: sol yarıda serbest joystick (parmağın değdiği yerde belirir), sağda büyük GAZ düğmesi.
// Masaüstünde: WASD/oklar + Boşluk/Enter. Gamepad de çalışır.
const state = { jx: 0, jy: 0, gas: false, kGas: false };
const keys = new Set();
const GAME_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter']);
addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (GAME_KEYS.has(e.code) && document.body.classList.contains('playing')) e.preventDefault();
  keys.add(e.code);
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); state.gas = false; state.jx = state.jy = 0; });

const zone = $('#joyZone'), base = $('#joyBase'), knob = $('#joyKnob'), gasBtn = $('#gasBtn');
let joyId = null, ox = 0, oy = 0;
const R = 56;
zone.addEventListener('pointerdown', (e) => {
  if (joyId !== null) return;
  joyId = e.pointerId; zone.setPointerCapture(e.pointerId);
  ox = e.clientX; oy = e.clientY;
  base.style.left = ox + 'px'; base.style.top = oy + 'px';
  base.classList.add('on');
  moveJoy(e);
});
zone.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) moveJoy(e); });
const endJoy = (e) => {
  if (e.pointerId !== joyId) return;
  joyId = null; state.jx = state.jy = 0;
  knob.style.transform = 'translate(-50%,-50%)';
  base.classList.remove('on');
};
zone.addEventListener('pointerup', endJoy);
zone.addEventListener('pointercancel', endJoy);
function moveJoy(e) {
  let dx = e.clientX - ox, dy = e.clientY - oy;
  const d = Math.hypot(dx, dy);
  // Parmak çok uzaklaşırsa joystick merkezi peşinden gelir
  if (d > R * 1.4) { ox += (dx / d) * (d - R * 1.4); oy += (dy / d) * (d - R * 1.4); base.style.left = ox + 'px'; base.style.top = oy + 'px'; dx = e.clientX - ox; dy = e.clientY - oy; }
  const m = Math.min(1, Math.hypot(dx, dy) / R), a = Math.atan2(dy, dx);
  state.jx = Math.cos(a) * m; state.jy = -Math.sin(a) * m;
  knob.style.transform = `translate(calc(-50% + ${Math.cos(a) * m * R}px), calc(-50% + ${Math.sin(a) * m * R}px))`;
}
let gasId = null;
gasBtn.addEventListener('pointerdown', (e) => { gasId = e.pointerId; gasBtn.setPointerCapture(e.pointerId); state.gas = true; gasBtn.classList.add('down'); e.preventDefault(); });
const endGas = (e) => { if (e.pointerId !== gasId) return; gasId = null; state.gas = false; gasBtn.classList.remove('down'); };
gasBtn.addEventListener('pointerup', endGas);
gasBtn.addEventListener('pointercancel', endGas);
gasBtn.addEventListener('contextmenu', (e) => e.preventDefault());

// Ekran-uzayı giriş: x sağ, y yukarı (ileri), g gaz
export function readInput() {
  let x = state.jx, y = state.jy, g = state.gas;
  const k = (c) => keys.has(c);
  const kx = (k('KeyD') || k('ArrowRight') ? 1 : 0) - (k('KeyA') || k('ArrowLeft') ? 1 : 0);
  const ky = (k('KeyW') || k('ArrowUp') ? 1 : 0) - (k('KeyS') || k('ArrowDown') ? 1 : 0);
  if (kx || ky) { const l = Math.hypot(kx, ky); x = kx / l; y = ky / l; }
  if (k('Space') || k('Enter')) g = true;
  for (const gp of navigator.getGamepads?.() || []) {
    if (!gp) continue;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (Math.hypot(ax, ay) > 0.2) { x = ax; y = -ay; }
    if (gp.buttons[12]?.pressed) y = 1; if (gp.buttons[13]?.pressed) y = -1;
    if (gp.buttons[14]?.pressed) x = -1; if (gp.buttons[15]?.pressed) x = 1;
    if (gp.buttons[0]?.pressed || gp.buttons[7]?.pressed || gp.buttons[5]?.pressed) g = true;
  }
  return { x, y, g };
}
export function resetInput() { state.jx = state.jy = 0; state.gas = false; gasBtn.classList.remove('down'); }
export { isTouch };
