# Gas Story 💨🫧

Dostluk bozan, 1-4 kişilik co-op rafting oyunu. Hepiniz aynı şişme saldasınız; salı **osurarak** ya da
**geğirerek** itiyor, birlikte dengede kalıp dikenlerin, girdapların ve şelalelerin arasından bitişe
ulaşmaya çalışıyorsunuz.

- 🎮 Tarayıcıda oyna: https://ahmetercikan.github.io/gasstory/
- 📱 Android: Google Play (yakında)

## Nasıl oynanır

- **Sol taraf:** parmağını sürükle, salın üstünde yürü.
- **Sağdaki büyük düğme:** gaz!
  - 💨 **Osurma:** basılı tut, sal baktığın yöne gider.
  - 🫧 **Geğirme:** basılı tut, şişir, bırak; sal arkana fırlar (önündeki arkadaşını da uçurur).
- ⚖️ Herkes bir kenara toplanırsa sal yatar, çok yatarsa devrilir.
- 📡 **Oda Kur** ile 4 harfli kod al, arkadaşların **Odaya Katıl** ile gelsin. Boş yerlere bot eklenebilir.

Masaüstünde: WASD / oklar ile yürü, Boşluk / Enter ile gaz.

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:5310
npm run bots     # bölümleri botlarla oynatıp zorluğu ölçer
npm run build    # dist/
npm run apk      # Android debug APK
```

Android mağaza paketi: `npm run sync && cd android && ./gradlew bundleRelease`
(imza için `android/keystore.properties` gerekir, örnek: `keystore.properties.example`).

Three.js · Vite · Capacitor · PeerJS · ses efektleri ElevenLabs ile üretildi.
