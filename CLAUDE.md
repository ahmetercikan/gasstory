# Gas Story — Claude için proje notları

- **Ne:** Mobil (Android, Capacitor 8) 3D co-op oyun. 1-4 oyuncu aynı şişme saldan nehirden iner; itici güç
  **osurma** (sürekli itiş, bakılan yöne) ya da **geğirme** (şarj et-bırak patlama, ters yöne). Denge bozulursa
  oyuncular suya düşer, çok yatarsa sal devrilir. Esin kaynağı: WhatsApp'tan gelen oyun videosu (yeşil gazla
  sal itme). Three.js + Vite, saf JavaScript (TypeScript yok, yalnızca capacitor.config.ts için kurulu).
- **Kullanıcı** teknik değil: her zaman **Türkçe ve sade** yaz.
- **Komutlar:** `npm run dev` (port 5310) · `npm run build` · `npm run apk` (debug APK:
  `android/app/build/outputs/apk/debug/app-debug.apk`) · `npm run bots` (bölümleri yalnız botlarla oynatıp
  süre/patlama sayar — bölüm/engel değişikliğinden sonra mutlaka çalıştır) · `npm run sfx` (eksik sesleri üretir)
  · `npm run assets` (simge/açılış görseli).
- **Yapı (src/):**
  - `util.js` saf yardımcılar; `sim.js` ve `track.js` yalnızca bunu içe aktarır → simülasyon Node'da da çalışır.
  - `track.js` bölüm tanımları (`LEVELS`: segs + objs) ve nehir örnekleme/konumlama.
  - `sim.js` tüm fizik: sal (itki, tork, sürüklenme, duvar/kaya), denge (eğim yayı, kayma, devrilme), suya düşme
    ve yüzüp geri tırmanma, dikenler/can, toplananlar, **botlar** (`botInput` + ortak rota `botPlan`), ağ anlık görüntüsü.
  - `world.js` görsel dünya (su shader'ı, kanyon duvarları, ağaçlar, engel modelleri, sal). `chars.js` 4 karakter + animasyon.
  - `fx.js` parçacıklar/yazılar, `audio.js` sesler, `input.js` dokunmatik joystick + gaz düğmesi (klavye/gamepad de),
    `net.js` PeerJS, `native.js` Capacitor kabuğu, `main.js` ekranlar + oyun döngüsü + kamera + HUD.
- **Açı kuralı:** yerel "ileri" = (0,-1); açı a'daki ileri = (sin a, -cos a). three nesnelerinde `rotation.y = -a`.
- **Kontrol (1.1.0):** karakterler salın kenarında (açı `ang`, `RIM_R`) durur; oyuncu yalnızca sağa/sola kaydırır
  (`input.js` sürgü, klavyede A/D). `main.js → screenTurn()` parmağın ekran yönünü kenardaki dönme yönüne çevirir.
  Gaz salı karakterin olduğu taraftan merkeze doğru iter (tork yok). Alçak taraftakiler `SLIP_TILT` aşılınca suya kayar.
- **Online (Firebase, proje `gas-story`, RTDB europe-west1):** `firebase.js` (ayar + anonim giriş), `online.js`
  (profil, 6 haneli arkadaş kodu, çevrimiçi durumu, istek/kabul, davet, "Online verilerimi sil"), `net.js` (odalar:
  `rooms/{kod}` — host oyunu yönetir, 12 Hz `snap`, istemci `in/{uid}`, mesajlar `msgs`, `dm`; Hızlı Eşleş `open` alanıyla).
  Kurallar `database.rules.json` (Firebase konsolunda yayınlandı; değişirse konsola yeniden yapıştır).
- **Dil:** `i18n.js` — Türkçe metin anahtar, `EN` sözlüğü İngilizce. Telefon dili Türkçe değilse İngilizce açılır,
  menüde TR/EN düğmesi. Yeni metin eklerken `tt('…')` (main.js) / `t('…')` ile sar ve `EN`'e ekle.
- **Reklam:** `ads.js` (AdMob, `@capacitor-community/admob`). Puan tablosundan ~2 sn sonra geçiş reklamı, en az 45 sn
  arayla; web'de reklam yok. Uygulama kimliği AndroidManifest'te. AB izin mesajı AdMob → Gizlilik ve mesajlaşma'da yayında.
- **Simgeler:** Çizio dili — `icons.js` lucide çizgi simgeleri, `tile()` renkli karo.
- **Sesler:** `public/sfx/*.mp3` ElevenLabs ses efektleriyle üretildi (`scripts/make-sfx.mjs`); anahtar
  `~/Sayio/.env.local` içinden okunur, bu projeye kopyalanmaz. Dosya yoksa `audio.js` sentez sese düşer.
- **Yayın:** GitHub `ahmetercikan/gasstory` (SSH ile push). `main`'e gönderilince Actions botlarla bölüm testi +
  derleme yapıp GitHub Pages'e yayınlar (https://ahmetercikan.github.io/gasstory/, gizlilik: `/gizlilik.html`).
  Commit mesajları Türkçe.
- **Android mağaza:** paket `com.ahmetercikan.gasstory` (değiştirilemez). `npm run aab` → imzalı
  `android/app/build/outputs/bundle/release/app-release.aab`. İmza: `android/gasstory-release.keystore` +
  `android/keystore.properties` (23 Ekim 2026'da oluşturuldu, git'e girmez, **yedeklenmeli**). Her yüklemede
  `android/app/build.gradle` → `versionCode` +1. Mağaza metinleri ve form cevapları: `store/play-metin.md`.
- **Mağaza görselleri:** kullanıcının verdiği örnek tasarım (Calemio) düzeninde kesintisiz 3'lü panorama:
  `store/design/panorama.html` (1: maskot + başlık, 2: logo + eğik telefon, 3: kesik çizgili özellik kartları).
  Sıra: `npm run dev` açıkken `store:shots` (oyun ekranları) → `store:mascots` (şeffaf karakterler) →
  `store:panorama` (store/play/*.png).
