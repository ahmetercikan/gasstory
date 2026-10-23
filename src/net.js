import { ref, get, set, update, remove, push, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, serverTimestamp, query, orderByChild, equalTo, startAt, limitToFirst, runTransaction } from 'firebase/database';
import { fb, signIn, fbError } from './firebase.js';
import { t } from './i18n.js';

// Oyun odaları (Firebase Realtime Database). Oda kuran cihaz oyunu yönetir (host);
// diğerleri girişlerini yazar, host'un yazdığı durum anlık görüntülerini okur.
//   rooms/{kod}            : { host, hostName, status, open, n, t }
//   rooms/{kod}/join/{uid} : katılan oyuncunun bilgisi (bağlantı koparsa silinir)
//   rooms/{kod}/in/{uid}   : oyuncu girişi { turn, g }
//   rooms/{kod}/snap       : host'un durum görüntüsü
//   rooms/{kod}/msgs       : host → herkese mesajlar (lobi, başlat, sonuç)
//   rooms/{kod}/dm/{uid}   : host → tek oyuncuya mesaj
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');

export const net = {
  role: 'local', // 'local' | 'host' | 'client'
  code: '', myId: 'host', conns: new Map(), open: false,
  onMsg: null, onJoin: null, onLeave: null, onClose: null,
};
let offs = [];
let serverOffset = 0;
const R = (p) => ref(fb().db, `rooms/${net.code}${p ? '/' + p : ''}`);

function listen(unsub) { offs.push(unsub); }

export async function hostRoom({ open = false, hostName = '' } = {}) {
  closeNet();
  const uid = await signIn();
  const { db } = fb();
  let code = null;
  for (let i = 0; i < 8 && !code; i++) {
    const c = newCode();
    const res = await runTransaction(ref(db, `rooms/${c}`), (cur) => {
      if (cur !== null) return undefined; // kod kullanımda
      return { host: uid, hostName: String(hostName).slice(0, 12), status: 'lobby', open: !!open, n: 1, t: Date.now() };
    }).catch(() => ({ committed: false }));
    if (res.committed) code = c;
  }
  if (!code) throw new Error(t('Oda kurulamadı, tekrar dene.'));
  net.role = 'host'; net.code = code; net.myId = 'host'; net.open = !!open;
  onDisconnect(R()).remove();
  listen(onChildAdded(R('join'), (s) => { net.conns.set(s.key, true); net.onJoin?.(s.key, s.val() || {}); }));
  listen(onChildRemoved(R('join'), (s) => { if (net.conns.delete(s.key)) net.onLeave?.(s.key); }));
  const onIn = (s) => { const v = s.val(); if (v) net.onMsg?.({ t: 'in', ...v }, s.key); };
  listen(onChildAdded(R('in'), onIn));
  listen(onChildChanged(R('in'), onIn));
  return code;
}

export async function joinRoom(code, hello) {
  closeNet();
  code = String(code).trim().toUpperCase();
  const uid = await signIn();
  const { db } = fb();
  const snap = await get(ref(db, `rooms/${code}`)).catch((e) => { throw new Error(fbError(e)); });
  const room = snap.val();
  if (!room || !room.host) throw new Error(t('Bu kodla bir oda bulunamadı.'));
  if (room.status !== 'lobby') throw new Error(t('Bu odada oyun sürüyor. Bölüm bitince tekrar dene.'));
  if ((room.n || 1) >= 4) throw new Error(t('Oda dolu (4 kişi).'));
  net.role = 'client'; net.code = code; net.myId = uid;
  serverOffset = await new Promise((res) => onValue(ref(db, '.info/serverTimeOffset'), (v) => res(v.val() || 0), () => res(0), { onlyOnce: true }));
  const since = Date.now() + serverOffset - 1500;
  listen(onChildAdded(query(R('msgs'), orderByChild('t'), startAt(since)), (s) => { const v = s.val(); if (v?.d) net.onMsg?.(v.d, 'host'); }));
  listen(onChildAdded(R(`dm/${uid}`), (s) => { const v = s.val(); remove(s.ref); if (v?.d) net.onMsg?.(v.d, 'host'); }));
  listen(onValue(R('snap'), (s) => { const v = s.val(); if (v) net.onMsg?.({ t: 'snap', s: v }, 'host'); }));
  let seenHost = false;
  listen(onValue(R('host'), (s) => {
    if (s.val()) { seenHost = true; return; }
    if (seenHost && net.role === 'client') net.onClose?.(t('Oda kapandı.'));
  }));
  const me = R(`join/${uid}`);
  await onDisconnect(me).remove();
  await onDisconnect(R(`in/${uid}`)).remove();
  await set(me, { ...hello, t: Date.now() });
  return uid;
}

// Herkese açık bir lobi bul, yoksa yenisini kur.
export async function quickMatch(hello) {
  await signIn();
  const { db } = fb();
  const s = await get(query(ref(db, 'rooms'), orderByChild('open'), equalTo(true), limitToFirst(20))).catch((e) => { throw new Error(fbError(e)); });
  const rooms = Object.entries(s.val() || {})
    .filter(([, r]) => r.status === 'lobby' && (r.n || 1) < 4 && Date.now() - (r.t || 0) < 3600e3)
    .sort((a, b) => (b[1].n || 1) - (a[1].n || 1));
  for (const [code] of rooms) {
    try { await joinRoom(code, hello); return { role: 'client', code }; } catch { /* sıradakini dene */ }
  }
  const code = await hostRoom({ open: true, hostName: hello.name });
  return { role: 'host', code };
}

// Host: oda bilgisini güncel tut (hızlı eşleşme bunu okur)
export function updateRoomMeta(meta) {
  if (net.role !== 'host') return;
  update(R(), { ...meta, t: Date.now() }).catch(() => {});
}

export function broadcast(msg) {
  if (net.role !== 'host') return;
  if (msg.t === 'snap') { set(R('snap'), msg.s).catch(() => {}); return; }
  push(R('msgs'), { t: serverTimestamp(), d: msg }).catch(() => {});
}
export function sendTo(id, msg) { if (net.role === 'host') push(R(`dm/${id}`), { d: msg }).catch(() => {}); }
export function sendToHost(msg) {
  if (net.role !== 'client' || msg.t !== 'in') return;
  set(R(`in/${net.myId}`), { turn: msg.turn || 0, g: !!msg.g, k: Date.now() }).catch(() => {});
}
export function kick(id, msg) {
  if (net.role !== 'host') return;
  if (msg) sendTo(id, msg);
  net.conns.delete(id);
  setTimeout(() => { remove(R(`join/${id}`)).catch(() => {}); remove(R(`in/${id}`)).catch(() => {}); }, 400);
}

export function closeNet() {
  offs.splice(0).forEach((u) => { try { u(); } catch { /* yok */ } });
  if (net.code && fb().auth.currentUser) {
    if (net.role === 'host') { remove(R()).catch(() => {}); onDisconnect(R()).cancel().catch(() => {}); }
    else if (net.role === 'client') { remove(R(`join/${net.myId}`)).catch(() => {}); remove(R(`in/${net.myId}`)).catch(() => {}); }
  }
  net.role = 'local'; net.code = ''; net.myId = 'host'; net.open = false;
  net.conns.clear();
}
