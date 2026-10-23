import { ref, get, set, update, remove, onValue, onChildAdded, onChildRemoved, onDisconnect, serverTimestamp, runTransaction } from 'firebase/database';
import { deleteUser } from 'firebase/auth';
import { fb, signIn, resetSignIn } from './firebase.js';
import { store } from './core.js';
import { t } from './i18n.js';

// Arkadaşlar, çevrimiçi durumu ve davetler (Firebase Realtime Database).
//   users/{uid}      : ad, karakter, güç, arkadaş kodu
//   codes/{kod}      : uid
//   status/{uid}     : { on, t, room }
//   friends/{uid}/{f}: true
//   requests/{uid}/{from}: { name, char, t }
//   invites/{uid}/{from} : { name, room, t }
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = (n = 6) => Array.from({ length: n }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

export const social = {
  uid: null, code: store.get('friendCode', ''), friends: new Map(), requests: new Map(),
  onChange: null, onInvite: null, room: null,
};
const unsubs = [];
const changed = () => social.onChange?.();

export async function startOnline(profile) {
  const uid = await signIn();
  if (social.uid === uid) { await saveProfile(profile); return uid; }
  social.uid = uid;
  const { db } = fb();
  // Arkadaş kodu al (çakışırsa yenisini dene)
  if (!social.code) {
    for (let i = 0; i < 6; i++) {
      const c = newCode();
      const res = await runTransaction(ref(db, `codes/${c}`), (cur) => (cur === null ? uid : undefined));
      if (res.committed) { social.code = c; store.set('friendCode', c); break; }
    }
  } else {
    await set(ref(db, `codes/${social.code}`), uid).catch(async () => { social.code = ''; store.set('friendCode', ''); });
  }
  await saveProfile(profile);
  // Çevrimiçi durumu: bağlantı koparsa sunucu "çevrimdışı" yazar
  const st = ref(db, `status/${uid}`);
  unsubs.push(onValue(ref(db, '.info/connected'), (s) => {
    if (s.val() !== true) return;
    onDisconnect(st).set({ on: false, t: serverTimestamp() }).then(() => set(st, { on: true, t: serverTimestamp(), room: social.room || null }));
  }));
  // Arkadaş listesi
  unsubs.push(onChildAdded(ref(db, `friends/${uid}`), (s) => watchFriend(s.key)));
  unsubs.push(onChildRemoved(ref(db, `friends/${uid}`), (s) => { const f = social.friends.get(s.key); f?.off?.(); social.friends.delete(s.key); changed(); }));
  // Gelen istekler
  unsubs.push(onValue(ref(db, `requests/${uid}`), (s) => {
    social.requests = new Map(Object.entries(s.val() || {}));
    changed();
  }));
  // Davetler
  unsubs.push(onChildAdded(ref(db, `invites/${uid}`), (s) => {
    const v = s.val();
    remove(s.ref);
    if (v && Date.now() - (v.t || 0) < 120000) social.onInvite?.({ from: s.key, ...v });
  }));
  return uid;
}

function watchFriend(fuid) {
  const { db } = fb();
  const f = { uid: fuid, name: '…', char: 0, on: false, room: null };
  social.friends.set(fuid, f);
  const a = onValue(ref(db, `users/${fuid}`), (s) => { const v = s.val() || {}; f.name = v.name || 'Oyuncu'; f.char = v.char | 0; changed(); });
  const b = onValue(ref(db, `status/${fuid}`), (s) => { const v = s.val() || {}; f.on = !!v.on; f.room = v.room || null; changed(); });
  f.off = () => { a(); b(); };
  changed();
}

export async function saveProfile(p) {
  if (!social.uid) return;
  const { db } = fb();
  await update(ref(db, `users/${social.uid}`), { name: String(p.name || 'Oyuncu').slice(0, 12), char: p.char | 0, power: p.power === 'burp' ? 'burp' : 'fart', code: social.code, t: serverTimestamp() });
}

export async function setRoom(code) {
  social.room = code || null;
  if (!social.uid) return;
  await update(ref(fb().db, `status/${social.uid}`), { room: social.room }).catch(() => {});
}

export async function addFriendByCode(code, profile) {
  code = String(code || '').trim().toUpperCase();
  if (code.length !== 6) throw new Error(t('Arkadaş kodu 6 karakter olmalı.'));
  if (code === social.code) throw new Error(t('Bu senin kendi kodun :)'));
  const { db } = fb();
  const s = await get(ref(db, `codes/${code}`));
  const fuid = s.val();
  if (!fuid) throw new Error(t('Bu kodla bir oyuncu bulunamadı.'));
  if (social.friends.has(fuid)) throw new Error(t('Zaten arkadaşsınız.'));
  // Karşı taraf da bize istek atmışsa doğrudan arkadaş ol
  if (social.requests.has(fuid)) { await acceptRequest(fuid); return t('Artık arkadaşsınız!'); }
  await set(ref(db, `requests/${fuid}/${social.uid}`), { name: String(profile.name || 'Oyuncu').slice(0, 12), char: profile.char | 0, t: Date.now() });
  return t('Arkadaşlık isteği gönderildi.');
}

export async function acceptRequest(fuid) {
  const { db } = fb();
  await update(ref(db), {
    [`friends/${social.uid}/${fuid}`]: true,
    [`friends/${fuid}/${social.uid}`]: true,
    [`requests/${social.uid}/${fuid}`]: null,
  });
}
export const declineRequest = (fuid) => remove(ref(fb().db, `requests/${social.uid}/${fuid}`));
export async function removeFriend(fuid) {
  await update(ref(fb().db), { [`friends/${social.uid}/${fuid}`]: null, [`friends/${fuid}/${social.uid}`]: null });
}

export async function inviteFriend(fuid, room, profile) {
  await set(ref(fb().db, `invites/${fuid}/${social.uid}`), { name: String(profile.name || 'Oyuncu').slice(0, 12), room, t: Date.now() });
}

// Mağaza kuralı: kullanıcı online verilerini tek dokunuşla silebilmeli.
export async function deleteMyData() {
  const { db, auth } = fb();
  const uid = social.uid || auth.currentUser?.uid;
  if (!uid) return;
  const up = {
    [`users/${uid}`]: null, [`status/${uid}`]: null, [`friends/${uid}`]: null,
    [`requests/${uid}`]: null, [`invites/${uid}`]: null,
  };
  for (const f of social.friends.keys()) up[`friends/${f}/${uid}`] = null;
  if (social.code) up[`codes/${social.code}`] = null;
  await update(ref(db), up);
  unsubs.splice(0).forEach((u) => u());
  social.friends.forEach((f) => f.off?.()); social.friends.clear(); social.requests.clear();
  try { await deleteUser(auth.currentUser); } catch { /* yeniden giriş gerekirse oturum zaten silinmiş sayılır */ }
  social.uid = null; social.code = ''; store.set('friendCode', ''); resetSignIn();
  changed();
}
