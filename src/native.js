import { Capacitor, SystemBars } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Telefon kabuğu işleri: geri tuşu, durum çubuğu, açılış görseli, titreşim.
export const native = Capacitor.isNativePlatform();

export function initNative(onBack) {
  if (!native) return;
  // Tam ekran oyun: durum ve gezinme çubukları gizli (kaydırınca geçici görünür)
  SystemBars.hide().catch(() => {});
  setTimeout(() => SplashScreen.hide().catch(() => {}), 300);
  App.addListener('backButton', () => { if (!onBack()) App.minimizeApp(); });
}

export function haptic(ms) {
  if (!native) { navigator.vibrate?.(ms); return; }
  Haptics.impact({ style: ms > 60 ? ImpactStyle.Heavy : ms > 25 ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
}
