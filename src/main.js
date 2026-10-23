import '@fontsource/baloo-2/latin-500.css';
import '@fontsource/baloo-2/latin-ext-500.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-ext-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/baloo-2/latin-ext-800.css';
import { THREE, $, renderer, scene, camera, sky, sun, SUN_OFFSET, clamp, angDiff, store, vibrate, project } from './core.js';
import { CHARS, POWERS, SLOT_COLORS, buildCharacter, animateCharacter } from './chars.js';
import * as A from './audio.js';
import { LEVELS, buildTrack, sampleAt, locate } from './track.js';
import { Sim } from './sim.js';
import { World, RaftView } from './world.js';
import * as FX from './fx.js';
import { readInput, resetInput } from './input.js';
import { net, hostRoom, joinRoom, broadcast, sendToHost, kick, closeNet } from './net.js';
import { initNative } from './native.js';

const profile = Object.assign({ name: '', char: Math.floor(Math.random() * 4), power: 'fart' }, store.get('profile', {}));
const saveProfile = () => store.set('profile', profile);
const TRACKS = [];
const getTrack = (i) => (TRACKS[i] ||= buildTrack(LEVELS[i]));
const BOT_NAMES = ['Pırtcan', 'Böğürtlen', 'Gazoz', 'Fasulye', 'Pofuduk', 'Bulut', 'Kokoş', 'Hıçkır'];

const G = {
  screen: 'menu', sim: null, world: null, raft: null, chars: [], tags: [],
  level: 0, roster: [], mySlot: -1, camH: 0, camInit: false, shake: 0, paused: false,
  resultsShown: false, finishWait: 0, attract: false, snapAcc: 0, inAcc: 0, acc: 0,
  remoteInputs: {}, netEvents: [], fartH: {}, chargeH: {}, puffAcc: {}, ringT: 0, hudT: 0, results: null,
};
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();

// ---------------- Yardımcı arayüz
let toastT = 0;
function toast(msg, ms = 2600) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), ms);
}
let bannerT = 0;
function banner(html, ms = 1100) {
  const el = $('#banner'); el.innerHTML = html; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(bannerT); bannerT = setTimeout(() => el.classList.remove('show'), ms);
}
let hintT = 0;
function showHint(text) {
  const el = $('#hint'); el.textContent = text; el.classList.add('show');
  clearTimeout(hintT); hintT = setTimeout(() => el.classList.remove('show'), 4200);
}
function show(id) {
  for (const s of ['menu', 'lobby', 'results', 'pause', 'howto']) $('#' + s).classList.toggle('hidden', s !== id);
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = (t) => { t = Math.max(0, t); const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`; };

// ---------------- Menü
function buildMenu() {
  const nameIn = $('#nameIn');
  nameIn.value = profile.name;
  nameIn.addEventListener('input', () => { profile.name = nameIn.value.trim().slice(0, 12); saveProfile(); });
  const cp = $('#charPick');
  cp.innerHTML = CHARS.map((c, i) => `<button data-i="${i}">${c.emoji}<span>${c.name}</span></button>`).join('');
  cp.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    profile.char = +b.dataset.i; saveProfile(); renderMenu();
    A.sfxs.fartShort(CHARS[profile.char].pitch);
  });
  const pp = $('#powPick');
  pp.innerHTML = Object.entries(POWERS).map(([k, p]) => `<button data-k="${k}" class="${k}">${p.emoji} ${p.name}</button>`).join('');
  pp.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    profile.power = b.dataset.k; saveProfile(); renderMenu();
    if (profile.power === 'fart') A.sfxs.fartShort(CHARS[profile.char].pitch); else A.burp(0.4, CHARS[profile.char].pitch);
  });
  $('#soloBtn').onclick = () => enterLobby('local');
  $('#hostBtn').onclick = () => enterLobby('host');
  $('#joinOpen').onclick = () => { $('#joinBox').classList.toggle('hidden'); $('#codeIn').focus(); };
  $('#codeIn').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
  $('#codeIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#joinBtn').click(); });
  $('#joinBtn').onclick = () => {
    const code = $('#codeIn').value.trim();
    if (code.length !== 4) { toast('Oda kodu 4 harfli olmalı'); return; }
    enterLobby('client', code);
  };
  $('#howBtn').onclick = () => show('howto');
  $('#howClose').onclick = () => show(G.screen === 'game' ? null : 'menu');
  for (const id of ['#sndBtn', '#sndBtn2']) $(id).onclick = () => { A.setMuted(!A.isMuted()); renderSound(); };
  for (const id of ['#musBtn', '#musBtn2']) $(id).onclick = () => { A.setMusic(!A.isMusicOn()); renderSound(); };
  renderMenu(); renderSound();
}
function renderMenu() {
  document.querySelectorAll('#charPick button').forEach((b) => b.classList.toggle('on', +b.dataset.i === profile.char));
  document.querySelectorAll('#powPick button').forEach((b) => b.classList.toggle('on', b.dataset.k === profile.power));
  $('#powDesc').textContent = POWERS[profile.power].desc;
}
function renderSound() {
  for (const id of ['#sndBtn', '#sndBtn2']) $(id).textContent = A.isMuted() ? '🔇' : '🔊';
  for (const id of ['#musBtn', '#musBtn2']) { $(id).textContent = '🎵'; $(id).style.opacity = A.isMusicOn() ? 1 : 0.4; }
}
const myInfo = () => ({ name: profile.name || 'Oyuncu', char: profile.char, power: profile.power });

// ---------------- Lobi
const freeSlot = () => { for (let s = 0; s < 4; s++) if (!G.roster.some((r) => r.slot === s)) return s; return -1; };
function addToRoster(owner, info, bot = false) {
  const slot = freeSlot();
  if (slot < 0) return -1;
  G.roster.push({ slot, owner, bot, name: String(info.name || 'Oyuncu').slice(0, 12), char: clamp(info.char | 0, 0, 3), power: info.power === 'burp' ? 'burp' : 'fart' });
  G.roster.sort((a, b) => a.slot - b.slot);
  return slot;
}
function addBot() {
  const used = new Set(G.roster.map((r) => r.char));
  const free = [0, 1, 2, 3].filter((c) => !used.has(c));
  const char = free.length ? free[Math.floor(Math.random() * free.length)] : Math.floor(Math.random() * 4);
  const names = BOT_NAMES.filter((n) => !G.roster.some((r) => r.name === n));
  const fartCount = G.roster.filter((r) => r.power === 'fart').length;
  addToRoster('bot', { name: names[Math.floor(Math.random() * names.length)], char, power: fartCount > G.roster.length / 2 ? 'burp' : 'fart' }, true);
}
function pushLobby() {
  renderLobby();
  if (net.role === 'host') broadcast({ t: 'lobby', roster: G.roster, level: G.level });
}

async function enterLobby(role, code) {
  A.initAudio();
  G.roster = []; G.remoteInputs = {};
  if (role === 'local') {
    closeNet();
    addToRoster('host', myInfo());
    addBot(); addBot();
    G.mySlot = 0;
    G.screen = 'lobby'; show('lobby'); renderLobby();
    return;
  }
  const btn = role === 'host' ? $('#hostBtn') : $('#joinBtn');
  btn.disabled = true;
  try {
    if (role === 'host') {
      await hostRoom();
      setupHostHandlers();
      addToRoster('host', myInfo());
      G.mySlot = 0;
    } else {
      setupClientHandlers();
      await joinRoom(code, myInfo());
    }
    G.screen = 'lobby'; show('lobby'); renderLobby();
  } catch (e) {
    toast(e.message || String(e), 3500);
    closeNet();
  } finally { btn.disabled = false; }
}

function setupHostHandlers() {
  net.onJoin = (id, hello) => {
    if (G.screen === 'game' || G.screen === 'results') { kick(id, { t: 'deny', reason: 'Oyun sürüyor. Bölüm bitince tekrar dene.' }); return; }
    if (freeSlot() < 0) {
      const bot = [...G.roster].reverse().find((r) => r.bot);
      if (bot) G.roster = G.roster.filter((r) => r !== bot);
      else { kick(id, { t: 'deny', reason: 'Oda dolu (4 kişi).' }); return; }
    }
    addToRoster(id, hello);
    pushLobby();
    A.sfxs.fartShort(1.3);
    toast(`${hello.name || 'Biri'} katıldı! 🎉`);
  };
  net.onLeave = (id) => {
    const r = G.roster.find((x) => x.owner === id);
    if (!r) return;
    if (G.screen === 'game' || G.screen === 'results') {
      // Oyun sırasında ayrılanın yerine bot geçer
      r.bot = true; r.owner = 'bot';
      const p = G.sim?.players.find((q) => q.slot === r.slot); if (p) p.bot = true;
      toast(`${r.name} ayrıldı, yerine bot geçti 🤖`);
    } else {
      G.roster = G.roster.filter((x) => x !== r);
      toast(`${r.name} ayrıldı`);
    }
    pushLobby();
  };
  net.onMsg = (d, id) => {
    seen.set(id, performance.now());
    if (d.t === 'in') {
      const r = G.roster.find((x) => x.owner === id);
      if (r) G.remoteInputs[r.slot] = { mx: +d.mx || 0, mz: +d.mz || 0, g: !!d.g };
    }
  };
  net.onClose = (msg) => { toast(msg, 3500); leaveToMenu(); };
}

// Kopan bağlantıyı WebRTC'den önce fark etmek için: istemciler saniyede bir sinyal yollar.
const seen = new Map();
setInterval(() => {
  if (net.role === 'client') sendToHost({ t: 'ping' });
  if (net.role !== 'host') return;
  const now = performance.now();
  for (const id of [...net.conns.keys()]) {
    if (!seen.has(id)) seen.set(id, now);
    else if (now - seen.get(id) > 4500) { seen.delete(id); kick(id); net.onLeave?.(id); }
  }
}, 1000);

function setupClientHandlers() {
  net.onMsg = (d) => {
    if (d.t === 'lobby') {
      G.roster = d.roster; G.level = d.level;
      G.mySlot = G.roster.find((r) => r.owner === net.myId)?.slot ?? -1;
      if (G.screen !== 'lobby') { teardownGame(); startAttract(); G.screen = 'lobby'; show('lobby'); }
      renderLobby();
    } else if (d.t === 'start') {
      startGame(d.level, d.roster);
    } else if (d.t === 'snap') {
      if (!G.sim || G.attract) return;
      G.sim.applySnapshot(d.s);
      (d.s.ev || []).forEach(handleEvent);
    } else if (d.t === 'res') {
      G.results = d.r; showResults();
    } else if (d.t === 'deny') {
      toast(d.reason, 3500); leaveToMenu();
    }
  };
  net.onClose = (msg) => { toast(msg, 3500); leaveToMenu(); };
}

function renderLobby() {
  const role = net.role;
  const isBoss = role !== 'client';
  $('#roomLbl').textContent = role === 'local' ? 'TEK BAŞINA' : 'ODA KODU';
  $('#roomCode').textContent = role === 'local' ? '🛟' : net.code;
  $('#shareBtn').classList.toggle('hidden', role !== 'host');
  $('#roomHelp').textContent = role === 'host'
    ? 'Arkadaşların "Odaya Katıl" deyip bu kodu yazsın. Boş yerlere bot ekleyebilirsin.'
    : role === 'client' ? 'Bağlandın! 🎉 Sal hazırlanıyor…' : 'Botlar sana takım arkadaşlığı yapar. İstediğin kadar ekle ya da çıkar.';
  let html = '';
  for (let s = 0; s < 4; s++) {
    const r = G.roster.find((x) => x.slot === s);
    if (!r) {
      html += `<div class="slot empty" style="--c:${SLOT_COLORS[s]}"><span>Boş koltuk</span>${isBoss ? `<button class="add" data-add="1">+ 🤖 Bot ekle</button>` : ''}</div>`;
      continue;
    }
    const me = r.owner === (role === 'client' ? net.myId : 'host') && !r.bot;
    const tag = r.bot ? 'Bot 🤖' : me ? 'Sen' : 'Online 📡';
    const canKick = isBoss && !me;
    html += `<div class="slot" style="--c:${SLOT_COLORS[s]}"><span class="em">${CHARS[r.char].emoji}</span>
      <span class="nm">${esc(r.name)}<small>${tag} · ${POWERS[r.power].name}</small></span><span class="pw">${POWERS[r.power].emoji}</span>
      ${canKick ? `<button class="x" data-kick="${s}">✕</button>` : ''}</div>`;
  }
  $('#roster').innerHTML = html;
  $('#levels').innerHTML = LEVELS.map((L, i) => {
    const best = store.get('best-' + i, null);
    return `<button class="lvl ${i === G.level ? 'on' : ''}" data-l="${i}" ${isBoss ? '' : 'disabled'}><span class="e">${L.emoji}</span>${L.name}<small>${best ? '🏆 ' + fmtTime(best.time) + ' · ⭐' + best.stars : 'Rekor yok'}</small></button>`;
  }).join('');
  $('#startBtn').classList.toggle('hidden', !isBoss);
  $('#waitHost').classList.toggle('hidden', isBoss);
}
$('#roster').addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]'), k = e.target.closest('[data-kick]');
  if (add) { addBot(); pushLobby(); A.sfxs.click(); }
  if (k) {
    const r = G.roster.find((x) => x.slot === +k.dataset.kick);
    if (!r) return;
    if (!r.bot && r.owner !== 'host') kick(r.owner, { t: 'deny', reason: 'Oda kurucusu seni çıkardı.' });
    G.roster = G.roster.filter((x) => x !== r);
    pushLobby(); A.sfxs.click();
  }
});
$('#levels').addEventListener('click', (e) => {
  const b = e.target.closest('[data-l]'); if (!b || net.role === 'client') return;
  G.level = +b.dataset.l; pushLobby(); A.sfxs.click();
});
$('#startBtn').onclick = () => hostStart(G.level);
$('#lobbyBack').onclick = () => leaveToMenu();
$('#shareBtn').onclick = async () => {
  const text = `Gas Story'de salıma gel! 💨 Oda kodu: ${net.code}`;
  try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(net.code); toast('Kod kopyalandı: ' + net.code); } } catch { /* vazgeçti */ }
};

function hostStart(level) {
  if (!G.roster.length) return;
  const roster = G.roster.map((r) => ({ ...r }));
  if (net.role === 'host') broadcast({ t: 'start', level, roster });
  startGame(level, roster);
}

function leaveToMenu() {
  closeNet();
  teardownGame();
  startAttract();
  G.screen = 'menu'; show('menu');
  document.body.classList.remove('playing');
}

// ---------------- Oyun kurulumu
function teardownGame() {
  for (const h of Object.values(G.fartH)) h.stop();
  for (const h of Object.values(G.chargeH)) h.stop();
  G.fartH = {}; G.chargeH = {}; G.puffAcc = {};
  if (G.world) G.world.dispose();
  if (G.raft) G.raft.dispose();
  for (const c of G.chars) c.root.parent?.remove(c.root);
  G.tags.forEach((t) => t.remove());
  G.sim = G.world = G.raft = null; G.chars = []; G.tags = [];
  FX.clearFx(); FX.clearFloaters();
  A.setAmbient(false);
}

function buildGame(level, roster) {
  teardownGame();
  G.level = level;
  G.roster = roster.map((r) => ({ ...r }));
  const T = getTrack(level);
  G.sim = new Sim(T, G.roster);
  G.world = new World(T, LEVELS[level]);
  G.raft = new RaftView();
  G.chars = G.sim.players.map((p) => { const c = buildCharacter(p.char, p.slot); G.raft.tilt.add(c.root); return c; });
  G.camH = T.P[0].h; G.camInit = false;
  G.acc = 0; G.resultsShown = false; G.finishWait = 0; G.paused = false;
}

function startAttract() {
  G.attract = true;
  const bots = [0, 1, 2].map((i) => ({ slot: i, owner: 'bot', bot: true, name: BOT_NAMES[i], char: (i + 1) % 4, power: i === 1 ? 'burp' : 'fart' }));
  bots.push({ slot: 3, owner: 'bot', bot: true, name: 'Sen', char: profile.char, power: profile.power });
  const keepLevel = G.level;
  buildGame(Math.floor(Math.random() * LEVELS.length), bots);
  G.level = keepLevel;
  G.sim.mode = 'play';
  $('#hud').classList.add('hidden');
}

function startGame(level, roster) {
  G.attract = false;
  buildGame(level, roster);
  const myOwner = net.role === 'client' ? net.myId : 'host';
  G.mySlot = G.roster.find((r) => r.owner === myOwner && !r.bot)?.slot ?? -1;
  // İsim etiketleri
  G.tags = G.sim.players.map((p) => {
    const el = document.createElement('div');
    el.className = 'tag' + (p.slot === G.mySlot ? ' me' : '');
    el.style.setProperty('--c', SLOT_COLORS[p.slot]);
    el.innerHTML = `<span class="ch" style="width:0"></span>${esc(p.slot === G.mySlot ? 'SEN' : p.name)}`;
    $('#tags').appendChild(el);
    return el;
  });
  const me = G.sim.players.find((p) => p.slot === G.mySlot);
  const burp = me?.power === 'burp';
  $('#gasBtn').classList.toggle('burp', burp);
  $('#gasEmoji').textContent = burp ? '🫧' : '💨';
  $('#gasLabel').textContent = burp ? 'GEĞİR' : 'OSUR';
  $('#progCps').innerHTML = G.sim.cps.map((c) => `<i style="left:${(c.s / G.sim.T.finishS) * 100}%"></i>`).join('');
  $('#hud').classList.remove('hidden');
  resetInput();
  show(null);
  G.screen = 'game';
  document.body.classList.add('playing');
  A.setAmbient(true);
  showHint(`${LEVELS[level].emoji} ${LEVELS[level].name}`);
}

// ---------------- Olaylar (ses + efekt)
const charOf = (slot) => { const i = G.sim.players.findIndex((p) => p.slot === slot); return { p: G.sim.players[i], c: G.chars[i] }; };
function headPos(slot, up = 1.4) {
  const { c } = charOf(slot);
  if (!c) return _v.copy(G.raft.root.position);
  return c.root.getWorldPosition(_v).add(_v2.set(0, up, 0));
}
const objPos = (id) => { const o = G.sim.T.objs[id]; return new THREE.Vector3(o.x, o.y + 1.2, o.z); };
const isMine = (slot) => slot === G.mySlot;
const quiet = () => G.attract; // menü arka planında ses yok

function handleEvent(e) {
  if (!G.sim) return;
  const sim = G.sim, r = sim.raft, rp = new THREE.Vector3(r.x, r.y + 1, r.z);
  if (G.attract) { if (e.type === 'burp') burpFx(e); return; }
  switch (e.type) {
    case 'count': banner(String(e.n)); A.sfxs.beep(); break;
    case 'go': banner('PIRRRT! 💨', 900); A.sfxs.go(); break;
    case 'fall': {
      const { c } = charOf(e.slot);
      const pos = c ? c.root.getWorldPosition(new THREE.Vector3()) : rp;
      FX.splash(pos.x, r.y, pos.z, 20, 1);
      A.sfxs.splash(); A.sfxs.whoa(CHARS[charOf(e.slot).p.char].pitch);
      FX.floatText(pos.clone().setY(pos.y + 1.5), isMine(e.slot) ? 'Suya düştün! 🏊 Sala yüz!' : 'ŞAPŞAL! 🏊', { color: '#8fd3ff' });
      if (isMine(e.slot)) vibrate(60);
      break;
    }
    case 'climb': A.sfxs.climb(); FX.floatText(headPos(e.slot).clone(), 'Hop! 🙌', { color: '#b6f05a', size: 0.8 }); break;
    case 'rescue': A.sfxs.climb(); FX.floatText(headPos(e.slot).clone(), '🛟 Kurtarıldı', { color: '#fff', size: 0.8 }); break;
    case 'burp': burpFx(e); break;
    case 'blown': FX.floatText(headPos(e.slot).clone(), 'UÇTUUU! 😵', { color: '#ffd84d', size: 0.9 }); if (isMine(e.slot)) vibrate(40); break;
    case 'stink': FX.floatText(headPos(e.slot).clone(), '🤢', { size: 1.4 }); A.sfxs.ugh(); break;
    case 'bump': A.sfxs.bump(); G.shake = Math.max(G.shake, 0.2); vibrate(15); break;
    case 'hit':
      A.sfxs.hit(); FX.sparks(rp.x, rp.y, rp.z, 0xff5a5f, 20);
      banner('DELİNDİ! 💥'); G.shake = 0.7; vibrate(90); flashHearts();
      break;
    case 'pop':
      A.sfxs.pop(); FX.splash(rp.x, r.y, rp.z, 40, 1.5);
      banner('PATLADI! 💥<small>kontrol noktasına dönülüyor</small>', 2400); G.shake = 1.1; vibrate(250); flashHearts();
      break;
    case 'capsize':
      A.sfxs.capsize(); FX.splash(rp.x, r.y, rp.z, 40, 1.4);
      banner('DEVRİLDİNİZ! 🙃<small>dengeyi koruyun</small>', 1800); G.shake = 0.8; vibrate(160); flashHearts();
      break;
    case 'respawn': FX.clearFloaters(); break;
    case 'star': { const p = objPos(e.id); FX.sparks(p.x, p.y, p.z, 0xffd23f, 18); A.sfxs.star(); FX.floatText(p, '+⭐', { color: '#ffd23f' }); vibrate(10); break; }
    case 'bean': { const p = objPos(e.id); FX.sparks(p.x, p.y, p.z, 0xa6e22e, 18); A.sfxs.bean(); FX.floatText(p, 'FASULYE! 💨 süper osuruk', { color: '#b6f05a', size: 0.8, life: 1.8 }); break; }
    case 'soda': { const p = objPos(e.id); FX.sparks(p.x, p.y, p.z, 0x6fd0ff, 18); A.sfxs.soda(); FX.floatText(p, 'GAZOZ! 🫧 süper geğirme', { color: '#ffd84d', size: 0.8, life: 1.8 }); break; }
    case 'cp': A.sfxs.cp(); banner('KONTROL NOKTASI ✔', 1300); break;
    case 'hint': showHint(e.text); break;
    case 'land': A.sfxs.waterfall(); FX.splash(rp.x, r.y, rp.z, 36, 1.3); G.shake = 0.9; vibrate(70); break;
    case 'finish': A.sfxs.win(); banner('BİTİŞ! 🏁', 2200); vibrate(120); break;
  }
}
function burpFx(e) {
  const { p, c } = charOf(e.slot);
  if (!c) return;
  const pos = c.mouthPt.getWorldPosition(new THREE.Vector3());
  const a = p.face + G.sim.raft.a, dx = Math.sin(a), dz = -Math.cos(a);
  FX.burpBurst(pos.x, pos.y, pos.z, dx, dz, e.k);
  if (quiet()) return;
  A.burp(e.k, CHARS[p.char].pitch);
  FX.floatText(pos.clone().setY(pos.y + 0.6), e.k > 0.75 ? 'BÖĞĞĞĞ!!' : e.k > 0.4 ? 'BÖĞĞ!' : 'böğ', { color: '#ffd84d', size: 0.8 + e.k * 0.7 });
  G.shake = Math.max(G.shake, 0.15 + e.k * 0.45);
  if (isMine(e.slot)) vibrate(30 + e.k * 60);
}
function flashHearts() { const h = $('#hHearts'); h.classList.remove('flash'); void h.offsetWidth; h.classList.add('flash'); }

// ---------------- Sonuç
function computeResults() {
  const s = G.sim, L = LEVELS[G.level];
  const best = store.get('best-' + G.level, null);
  const time = s.finishTime;
  const medal = s.deaths === 0 && s.stars === s.totalStars && time <= L.par ? '🥇' : s.deaths === 0 && s.stars >= s.totalStars * 0.5 ? '🥈' : '🥉';
  const ps = s.players;
  const top = (f) => ps.reduce((a, b) => (f(b) > f(a) ? b : a), ps[0]);
  const awards = [];
  const gasKing = top((p) => p.stat.gas); if (gasKing.stat.gas > 1) awards.push(`👑 Gaz Kralı: <b>${esc(gasKing.name)}</b> (${gasKing.stat.gas.toFixed(0)} pırt puanı)`);
  const swimmer = top((p) => p.stat.falls); if (swimmer.stat.falls > 0) awards.push(`🏊 Su Perisi: <b>${esc(swimmer.name)}</b> (${swimmer.stat.falls} kez suya düştü)`);
  const villain = top((p) => p.stat.annoy); if (villain.stat.annoy > 0) awards.push(`😈 Dostluk Bozan: <b>${esc(villain.name)}</b> (${villain.stat.annoy} arkadaşını uçurdu/kokuttu)`);
  return { level: G.level, time, stars: s.stars, total: s.totalStars, deaths: s.deaths, capsizes: s.capsizes, falls: s.falls, medal, awards, prevBest: best };
}
function showResults() {
  const R = G.results; if (!R) return;
  G.resultsShown = true;
  let isNew = false;
  if (!R.prevBest || R.time < R.prevBest.time) { isNew = true; store.set('best-' + R.level, { time: R.time, stars: Math.max(R.stars, R.prevBest?.stars || 0) }); }
  else if (R.stars > R.prevBest.stars) store.set('best-' + R.level, { ...R.prevBest, stars: R.stars });
  $('#resTitle').textContent = `${LEVELS[R.level].name} bitti!`;
  $('#resMedal').textContent = R.medal;
  $('#resStats').innerHTML = `
    <div class="${isNew ? 'new' : ''}">${fmtTime(R.time)}<small>${isNew ? '🏆 YENİ REKOR' : 'süre (par ' + LEVELS[R.level].par + ' sn)'}</small></div>
    <div>⭐ ${R.stars}/${R.total}<small>yıldız</small></div>
    <div>💥 ${R.deaths}<small>patlama</small></div>
    <div>🏊 ${R.falls}<small>suya düşme · ${R.capsizes} devrilme</small></div>`;
  $('#resAwards').innerHTML = R.awards.map((a) => `<div class="award">${a}</div>`).join('');
  const boss = net.role !== 'client';
  $('#resBtns').classList.toggle('hidden', !boss);
  $('#resWait').classList.toggle('hidden', boss);
  $('#nextBtn').innerHTML = R.level < LEVELS.length - 1 ? `Sonraki Bölüm ➜ <small>${LEVELS[R.level + 1].emoji} ${LEVELS[R.level + 1].name}</small>` : `🔁 Baştan Başla <small>${LEVELS[0].name}</small>`;
  G.screen = 'results';
  show('results');
  $('#hud').classList.add('hidden');
  document.body.classList.remove('playing');
}
$('#nextBtn').onclick = () => hostStart((G.level + 1) % LEVELS.length);
$('#againBtn').onclick = () => hostStart(G.level);
$('#toLobbyBtn').onclick = () => backToLobby();
function backToLobby() {
  teardownGame(); startAttract();
  G.screen = 'lobby'; show('lobby');
  document.body.classList.remove('playing');
  if (net.role === 'host') G.roster = G.roster.filter((r) => r.owner === 'host' || r.bot || net.conns.has(r.owner));
  pushLobby();
}

// ---------------- Duraklat
$('#pauseBtn').onclick = () => {
  if (G.screen !== 'game') return;
  if (net.role === 'local') G.paused = true;
  resetInput();
  $('#restartBtn').classList.toggle('hidden', net.role === 'client');
  $('#quitBtn').textContent = net.role === 'client' ? '🚪 Odadan Ayrıl' : '🏠 Lobiye Dön';
  show('pause');
};
$('#resumeBtn').onclick = () => { G.paused = false; show(null); };
$('#restartBtn').onclick = () => { show(null); hostStart(G.level); };
$('#quitBtn').onclick = () => { if (net.role === 'client') leaveToMenu(); else backToLobby(); };
document.addEventListener('visibilitychange', () => { if (document.hidden && G.screen === 'game' && net.role === 'local' && !G.paused) $('#pauseBtn').click(); });

// Android geri tuşu
export function onBack() {
  if (!$('#howto').classList.contains('hidden')) { $('#howClose').click(); return true; }
  if (G.screen === 'game') { if ($('#pause').classList.contains('hidden')) $('#pauseBtn').click(); else $('#resumeBtn').click(); return true; }
  if (G.screen === 'lobby' || G.screen === 'results') { leaveToMenu(); return true; }
  return false;
}

// ---------------- Kare döngüsü
const STEP = 1 / 60;
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const t = now / 1000;
  const sim = G.sim;
  if (sim) {
    const inp = readInput();
    const ch = G.camH, fx = Math.sin(ch), fz = -Math.cos(ch), rx = Math.cos(ch), rz = Math.sin(ch);
    const my = { mx: rx * inp.x + fx * inp.y, mz: rz * inp.x + fz * inp.y, g: inp.g && G.screen === 'game' };
    if (net.role === 'client' && !G.attract) {
      G.inAcc += dt;
      if (G.inAcc >= 1 / 30) { G.inAcc = 0; sendToHost({ t: 'in', mx: +my.mx.toFixed(2), mz: +my.mz.toFixed(2), g: my.g }); }
      sim.clientUpdate(dt);
    } else if (!G.paused) {
      const inputs = { ...G.remoteInputs };
      if (G.mySlot >= 0 && !G.attract) inputs[G.mySlot] = my;
      G.acc += dt;
      while (G.acc >= STEP) { sim.step(STEP, inputs); G.acc -= STEP; }
      const evs = sim.events.splice(0);
      evs.forEach(handleEvent);
      if (net.role === 'host' && !G.attract) {
        G.netEvents.push(...evs);
        G.snapAcc += dt;
        if (G.snapAcc >= 1 / 20) { G.snapAcc = 0; const s = sim.snapshot(); s.ev = G.netEvents.splice(0); broadcast({ t: 'snap', s }); }
      }
    }
    renderGame(dt, t);
    if (G.attract && (sim.mode === 'finished' || sim.mode === 'popped' && sim.modeT < 0.1 || sim.time > 140)) startAttract();
    if (!G.attract && sim.mode === 'finished' && !G.resultsShown && net.role !== 'client') {
      G.finishWait += dt;
      if (G.finishWait > 2.6) {
        G.results = computeResults();
        if (net.role === 'host') broadcast({ t: 'res', r: G.results });
        showResults();
      }
    }
  }
  FX.updateFx(dt);
  FX.updateFloaters(dt);
  sky.position.copy(camera.position);
  renderer.render(scene, camera);
}

function renderGame(dt, t) {
  const sim = G.sim, r = sim.raft, T = sim.T;
  G.world.update(sim, sim.time, dt);
  G.raft.update(sim, t, dt);
  sim.players.forEach((p, i) => {
    const c = G.chars[i];
    if (p.onRaft) {
      if (c.root.parent !== G.raft.tilt) G.raft.tilt.add(c.root);
      c.root.position.set(p.lx, G.raft.deckY, p.lz);
      c.root.rotation.y = -p.face;
    } else {
      if (c.root.parent !== scene) scene.add(c.root);
      const loc = locate(T, p.wx, p.wz, r.hint);
      c.root.position.set(p.wx, loc.y, p.wz);
      c.root.rotation.y = -(p.face + r.a);
    }
    animateCharacter(c, p, t, dt);
    // Osuruk bulutu + ses
    if (p.gasOn) {
      G.puffAcc[p.slot] = (G.puffAcc[p.slot] || 0) + dt * (p.boost > 0 ? 55 : 38);
      const a = p.face + r.a, dx = Math.sin(a), dz = -Math.cos(a);
      c.butt.getWorldPosition(_v);
      while (G.puffAcc[p.slot] >= 1) { G.puffAcc[p.slot]--; FX.fartPuff(_v.x, _v.y, _v.z, dx, dz, r.vx, r.vz, p.boost > 0); }
      if (!G.fartH[p.slot] && !quiet()) {
        G.fartH[p.slot] = A.startFart(CHARS[p.char].pitch, isMine(p.slot) ? 1 : 0.75);
        if (Math.random() < 0.35) FX.floatText(_v.clone().setY(_v.y + 1.2), ['PIRRRT!', 'BRRRT!', 'PÖRRT!', 'FıSSS…'][Math.floor(Math.random() * 4)], { color: '#b6f05a', size: 0.8 });
      }
      if (isMine(p.slot) && Math.random() < dt * 8) vibrate(8);
    } else if (G.fartH[p.slot]) { G.fartH[p.slot].stop(); delete G.fartH[p.slot]; }
    if (p.charge > 0 && !quiet()) {
      if (!G.chargeH[p.slot]) G.chargeH[p.slot] = A.startCharge(CHARS[p.char].pitch);
      G.chargeH[p.slot].set(p.charge);
    } else if (G.chargeH[p.slot]) { G.chargeH[p.slot].stop(); delete G.chargeH[p.slot]; }
    // Etiket
    const tag = G.tags[i];
    if (tag) {
      c.head.getWorldPosition(_v); _v.y += 0.85;
      const pr = project(_v);
      tag.style.transform = `translate(${pr.x}px, ${pr.y}px) translate(-50%, -100%)`;
      tag.style.opacity = pr.vis ? 1 : 0;
      tag.firstChild.style.width = p.charge > 0 ? `${p.charge * 100}%` : '0';
    }
  });
  // Su halkaları
  G.ringT -= dt;
  if (G.ringT <= 0 && sim.mode !== 'popped') { G.ringT = 0.28; FX.ring(r.x, r.y, r.z); }
  // Kamera
  const ahead = sampleAt(T, r.s + 7);
  G.camH += angDiff(G.camH, ahead.h) * Math.min(1, dt * 1.8);
  const portrait = camera.aspect < 0.8;
  if (G.attract) {
    // Salın arkasından, iki yana yavaşça salınan kamera (kıyı duvarlarına girmesin diye)
    const fx = Math.sin(G.camH), fz = -Math.cos(G.camH), sw = Math.sin(t * 0.25) * 4.5;
    _v.set(r.x - fx * 10 + Math.cos(G.camH) * sw, r.y + 8, r.z - fz * 10 + Math.sin(G.camH) * sw);
    camera.position.lerp(_v, G.camInit ? Math.min(1, dt * 2) : 1);
    G.camInit = true;
    camera.lookAt(r.x, r.y + 0.8, r.z);
  } else {
    const fx = Math.sin(G.camH), fz = -Math.cos(G.camH);
    const D = portrait ? 9.5 : 10, H = portrait ? 12.5 : 8.5;
    _v.set(r.x - fx * D, r.y + H, r.z - fz * D);
    camera.position.lerp(_v, G.camInit ? Math.min(1, dt * 5) : 1);
    G.camInit = true;
    _v2.set(r.x + fx * (portrait ? 4.5 : 6), r.y, r.z + fz * (portrait ? 4.5 : 6));
    if (G.shake > 0.01) {
      camera.position.x += (Math.random() - 0.5) * G.shake * 0.6;
      camera.position.y += (Math.random() - 0.5) * G.shake * 0.6;
      G.shake *= Math.exp(-dt * 6);
    }
    camera.lookAt(_v2);
  }
  sun.position.set(r.x + SUN_OFFSET.x, r.y + SUN_OFFSET.y, r.z + SUN_OFFSET.z);
  sun.target.position.set(r.x, r.y, r.z);
  if (!G.attract) { updateHud(dt); updateAmbient(); }
}

let ambT = 0;
function updateAmbient() {
  if ((ambT -= 1) > 0) return; ambT = 20;
  const sim = G.sim, r = sim.raft;
  let rap = r.slope < -0.3 ? 1 : 0, wh = 0;
  for (const o of sim.T.objs) {
    if (o.t === 'rapids' && r.s > o.s - 5 && r.s < o.e + 5) rap = Math.max(rap, 0.8);
    if (o.t === 'whirl') { const d = Math.hypot(r.x - o.x, r.z - o.z); wh = Math.max(wh, clamp(1 - d / 14, 0, 1)); }
  }
  A.setAmbient(G.screen === 'game', rap, wh);
}

const hudCache = {};
function setHud(id, html) { if (hudCache[id] !== html) { hudCache[id] = html; $(id).innerHTML = html; } }
function updateHud() {
  const sim = G.sim, r = sim.raft;
  setHud('#hHearts', '🛟'.repeat(Math.max(0, r.hp)) + '<span style="opacity:.25">' + '🛟'.repeat(Math.max(0, 3 - r.hp)) + '</span>');
  const tm = sim.mode === 'countdown' ? 0 : sim.mode === 'finished' ? sim.finishTime : sim.time - 3.5;
  setHud('#hTime', fmtTime(tm));
  setHud('#hStars', `⭐ ${sim.stars}/${sim.totalStars}`);
  const prog = clamp(r.s / sim.T.finishS, 0, 1);
  $('#progFill').style.width = prog * 100 + '%';
  $('#progRaft').style.left = prog * 100 + '%';
  document.querySelectorAll('#progCps i').forEach((el, i) => el.classList.toggle('got', i <= sim.cp));
  // Takım listesi
  setHud('#team', sim.players.map((p) => `<div class="tm ${p.power} ${p.onRaft ? '' : 'water'}" style="--c:${SLOT_COLORS[p.slot]}">${CHARS[p.char].emoji}<span class="m"><i style="width:${Math.round(p.meter * 100)}%"></i></span>${p.onRaft ? (p.dizzy > 0 ? '🤢' : p.boost > 0 ? '⚡' : '') : '🏊'}</div>`).join(''));
  // Denge göstergesi (kamera yönüne göre)
  const [wx, wz] = [r.tx * Math.cos(r.a) - r.tz * Math.sin(r.a), r.tx * Math.sin(r.a) + r.tz * Math.cos(r.a)];
  const fx = Math.sin(G.camH), fz = -Math.cos(G.camH), rx = Math.cos(G.camH), rz = Math.sin(G.camH);
  const sx = wx * rx + wz * rz, sy = wx * fx + wz * fz, m = Math.hypot(sx, sy), k = Math.min(1, m) * 30;
  $('#tiltDot').style.transform = `translate(${(sx / (m || 1)) * k}px, ${(-sy / (m || 1)) * k}px)`;
  $('#tiltDot').style.background = m > 0.75 ? '#ff3b3b' : m > 0.5 ? '#ffb020' : '#23324d';
  $('#tiltGauge').classList.toggle('danger', m > 0.72);
  // Gaz düğmesi
  const me = sim.players.find((p) => p.slot === G.mySlot);
  if (me) {
    $('#gasRing').style.strokeDashoffset = String(283 * (1 - me.meter));
    $('#gasBtn').classList.toggle('empty', me.meter < 0.05 && me.charge === 0);
    $('#gasBtn').classList.toggle('charged', me.charge > 0.95);
  }
}

// ---------------- Başlat
buildMenu();
startAttract();
initNative(onBack);
document.addEventListener('pointerdown', () => A.initAudio(), { capture: true });
document.addEventListener('keydown', () => A.initAudio(), { capture: true });
requestAnimationFrame((n) => { last = n; frame(n); setTimeout(() => $('#loading').classList.add('gone'), 150); });
if (import.meta.env.DEV) window.G = G;
