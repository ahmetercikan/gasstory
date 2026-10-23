import { $, isTouch } from './core.js';

// Dokunmatik: sol yarıda serbest joystick (parmağın değdiği yerde belirir), sağda büyük GAZ düğmesi.
// Masaüstünde: WASD/oklar + Boşluk/Enter. Gamepad de çalışır.
const state = { jx: 0, gas: false };
const keys = new Set();
const GAME_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter']);
addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (GAME_KEYS.has(e.code) && document.body.classList.contains('playing')) e.preventDefault();
  keys.add(e.code);
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); state.gas = false; state.jx = 0; });

// Sol taraf: parmağı sağa sola kaydırınca karakter salın kenarında o yöne döner (yalnızca yatay).
const zone = $('#joyZone'), base = $('#joyBase'), knob = $('#joyKnob'), gasBtn = $('#gasBtn');
let joyId = null, ox = 0, oy = 0;
const R = 64;
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
  joyId = null; state.jx = 0;
  knob.style.transform = 'translate(-50%,-50%)';
  base.classList.remove('on', 'l', 'r');
};
zone.addEventListener('pointerup', endJoy);
zone.addEventListener('pointercancel', endJoy);
function moveJoy(e) {
  let dx = e.clientX - ox;
  // Parmak çok uzaklaşırsa sürgü merkezi peşinden gelir
  if (Math.abs(dx) > R * 1.3) { ox += dx - Math.sign(dx) * R * 1.3; base.style.left = ox + 'px'; dx = e.clientX - ox; }
  const m = Math.max(-1, Math.min(1, dx / R));
  state.jx = Math.abs(m) < 0.12 ? 0 : m;
  base.classList.toggle('l', state.jx < 0); base.classList.toggle('r', state.jx > 0);
  knob.style.transform = `translate(calc(-50% + ${m * R}px), -50%)`;
}
let gasId = null;
gasBtn.addEventListener('pointerdown', (e) => { gasId = e.pointerId; gasBtn.setPointerCapture(e.pointerId); state.gas = true; gasBtn.classList.add('down'); e.preventDefault(); });
const endGas = (e) => { if (e.pointerId !== gasId) return; gasId = null; state.gas = false; gasBtn.classList.remove('down'); };
gasBtn.addEventListener('pointerup', endGas);
gasBtn.addEventListener('pointercancel', endGas);
gasBtn.addEventListener('contextmenu', (e) => e.preventDefault());

// Ekran-uzayı giriş: x sağ/sol (-1..1), g gaz
export function readInput() {
  let x = state.jx, g = state.gas;
  const k = (c) => keys.has(c);
  const kx = (k('KeyD') || k('ArrowRight') ? 1 : 0) - (k('KeyA') || k('ArrowLeft') ? 1 : 0);
  if (kx) x = kx;
  if (k('Space') || k('Enter') || k('KeyW') || k('ArrowUp')) g = true;
  for (const gp of navigator.getGamepads?.() || []) {
    if (!gp) continue;
    const ax = gp.axes[0] || 0;
    if (Math.abs(ax) > 0.2) x = ax;
    if (gp.buttons[14]?.pressed) x = -1; if (gp.buttons[15]?.pressed) x = 1;
    if (gp.buttons[0]?.pressed || gp.buttons[7]?.pressed || gp.buttons[5]?.pressed) g = true;
  }
  return { x, g };
}
export function resetInput() { state.jx = 0; state.gas = false; gasBtn.classList.remove('down'); }
export { isTouch };
