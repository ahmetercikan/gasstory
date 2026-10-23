import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { t } from './i18n.js';

// Firebase web ayarı gizli değildir; erişimi database.rules.json kuralları korur.
const config = {
  apiKey: 'AIzaSyBAkZtY_iNO1Sved5qkJ7Vtaz5OrRABNZA',
  authDomain: 'gas-story.firebaseapp.com',
  databaseURL: 'https://gas-story-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'gas-story',
  storageBucket: 'gas-story.firebasestorage.app',
  messagingSenderId: '442516283396',
  appId: '1:442516283396:web:017505cc32ad0f6028d551',
};

let app, auth, db, ready = null;

export function fb() {
  if (!app) { app = initializeApp(config); auth = getAuth(app); db = getDatabase(app); }
  return { app, auth, db };
}

// Anonim oturum: hesap açmadan cihaza özel bir kimlik. Aynı cihazda kalıcıdır.
export function signIn() {
  if (ready) return ready;
  const { auth } = fb();
  ready = new Promise((resolve, reject) => {
    const off = onAuthStateChanged(auth, (u) => {
      if (u) { off(); resolve(u.uid); }
    });
    signInAnonymously(auth).catch((e) => { off(); ready = null; reject(new Error(fbError(e))); });
  });
  return ready;
}

export function resetSignIn() { ready = null; }
export const myUid = () => fb().auth.currentUser?.uid || null;

export function fbError(e) {
  const c = e?.code || '';
  if (c.includes('network')) return t('İnternet bağlantısı yok.');
  if (c.includes('PERMISSION_DENIED') || c.includes('permission')) return t('İzin hatası. Uygulamayı güncelle.');
  return t('Bağlantı hatası: {e}', { e: c || e?.message || '?' });
}
