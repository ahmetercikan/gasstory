import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { native } from './native.js';

// Bölüm sonu geçiş reklamı (AdMob). Yalnızca telefon uygulamasında çalışır; web sürümünde reklam yok.
// iOS: iOS AdMob uygulaması açılana kadar Google'ın deneme reklamı (ios/App/App/Info.plist ile birlikte değiştir).
const IOS = Capacitor.getPlatform() === 'ios';
const AD_UNIT = import.meta.env.DEV
  ? (IOS ? 'ca-app-pub-3940256099942544/4411468910' : 'ca-app-pub-3940256099942544/1033173712') // Google'ın deneme reklamı (geliştirmede gerçek reklam tıklanmasın)
  : (IOS ? 'ca-app-pub-3940256099942544/4411468910' : 'ca-app-pub-8025731390860952/8149010720');
const MIN_GAP = 45000; // iki reklam arası en az süre

let ready = false, loading = false, lastShown = 0, started = false;
let onPause = () => {}, onResume = () => {};

export async function initAds(hooks = {}) {
  if (!native || started) return;
  started = true;
  onPause = hooks.pause || onPause; onResume = hooks.resume || onResume;
  try {
    await AdMob.initialize();
    // AB/İngiltere kullanıcıları için zorunlu izin penceresi (AdMob "Gizlilik ve mesajlaşma")
    const info = await AdMob.requestConsentInfo();
    if (info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm();
  } catch { /* izin penceresi açılamazsa reklam yine kişiselleştirilmemiş gösterilir */ }
  AdMob.addListener(InterstitialAdPluginEvents.Showed, () => onPause());
  AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => { onResume(); setTimeout(preload, 1500); });
  AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => { onResume(); setTimeout(preload, 5000); });
  preload();
}

async function preload() {
  if (!native || ready || loading) return;
  loading = true;
  try { await AdMob.prepareInterstitial({ adId: AD_UNIT }); ready = true; } catch { setTimeout(preload, 30000); }
  loading = false;
}

// Puan tablosundan sonra çağrılır. Hazır değilse oyunu bekletmez.
export async function showLevelEndAd() {
  if (!native || !ready || Date.now() - lastShown < MIN_GAP) { preload(); return false; }
  ready = false; lastShown = Date.now();
  try { await AdMob.showInterstitial(); return true; } catch { onResume(); setTimeout(preload, 5000); return false; }
}
