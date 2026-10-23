import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Gas Story telefon uygulaması (Capacitor). `npm run build` sonrası `npx cap sync`.
 * appId mağazadaki kimliktir; ilk yayından sonra DEĞİŞTİRİLEMEZ.
 */
const config: CapacitorConfig = {
  appId: 'com.ahmetercikan.gasstory',
  appName: 'Gas Story',
  webDir: 'dist',
  zoomEnabled: false,
  backgroundColor: '#a8dcff',
  android: {
    backgroundColor: '#a8dcff',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: { scrollEnabled: false, contentInset: 'never', backgroundColor: '#a8dcff' },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: '#a8dcff', showSpinner: false, androidScaleType: 'CENTER_CROP', splashFullScreen: true, splashImmersive: true },
    SystemBars: { style: 'DARK', insetsHandling: 'css', initialViewportFitValueHint: 'cover' },
  },
};

export default config;
