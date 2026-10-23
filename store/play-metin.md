# Gas Story — Google Play mağaza bilgileri

Play Console'a kopyala-yapıştır için. Görseller: `store/play/`.

## Ana mağaza girişi

**Uygulama adı** (en çok 30): `Gas Story: Co-op Rafting`

**Kısa açıklama** (en çok 80):
`Osur, geğir, dengede kal! Arkadaşlarınla 1-4 kişilik dostluk bozan rafting.`

**Tam açıklama:**

```
Hepiniz aynı şişme saldasınız ve tek bir sorununuz var: kürek yok! 💨

Gas Story'de salı OSURARAK ya da GEĞİREREK itiyorsunuz. Kıvrılan bir nehirden aşağı inerken dikenlerin, girdapların ve şelalelerin arasından birlikte geçmeye çalışın.

💨 OSURMA: Düğmeyi basılı tut, sal baktığın yöne gider.
🫧 GEĞİRME: Basılı tut, şişir, bırak! Dev bir patlama salı arkana fırlatır. Önündeki arkadaşını da suya uçurur 😈

⚖️ DENGE HER ŞEY
Herkes salın bir kenarına toplanırsa sal yatar, kayıp suya düşersiniz. Çok yatarsa sal tamamen devrilir! Birlikte hareket edin, birbirinizi dengeleyin.

👥 1-4 KİŞİ CO-OP
• Odayı kur, 4 harfli kodu paylaş, arkadaşların kendi telefonlarından katılsın.
• Tek başına mı? Sorun değil: akıllı botlar takım arkadaşın olur ve salı seninle dengeler.

🌊 3 BÖLÜM
• Çırak Deresi: dikenli halkalar ve kayalar
• Pırtlak Kanyonu: kayan dikenli kütükler, girdaplar, sert akıntılar
• Gaz Şelalesi: şelalelerden aşağı düşüş, dönen dikenli çubuklar

⭐ Yıldızları topla, rekorunu kır. 🥫 Fasulye osuranları, 🥤 gazoz geğirenleri süper güçlü yapar!

🏆 Bölüm sonunda ödüller: Gaz Kralı, Su Perisi ve Dostluk Bozan kim olacak?

🐸🦛🐧🐻 4 sevimli karakter: Kurbağa, Su Aygırı, Penguen ve Ayı.

Reklam yok, hesap yok. Sadece gaz.
```

**Kategori:** Oyun → Gündelik (Casual)
**Etiketler:** Çok oyunculu, Co-op, Parti, Komik
**İletişim e-postası:** ahmetmesutercikan@hotmail.com
**Gizlilik politikası:** https://ahmetercikan.github.io/gasstory/gizlilik.html

## Grafikler

| Alan | Dosya |
| --- | --- |
| Uygulama simgesi 512×512 | `store/play/simge-512.png` |
| Öne çıkan görsel 1024×500 | `store/play/tanitim-1024x500.png` |
| Telefon ekran görüntüleri (bu sırayla) | `store/play/ekran-1.png`, `ekran-2.png`, `ekran-3.png` |

Üç ekran görüntüsü yan yana kesintisiz bir görsel oluşturur; **sırası önemli**.
Yeniden üretmek: `npm run dev` açıkken `node scripts/store-panorama.mjs`.

## Uygulama içeriği formları (önerilen cevaplar)

- **Reklamlar:** Hayır, reklam içermiyor.
- **Uygulama erişimi:** Tüm işlevler özel erişim gerektirmez.
- **Hedef kitle:** 13 yaş ve üzeri. (Online odada oyuncu adları diğer oyunculara görünür; 13 yaş
  altını hedeflemek Aileler politikasının ek kurallarını getirir.)
- **İçerik derecelendirmesi (IARC):** Şiddet yok. Kaba mizah: evet (osurma/geğirme şakaları).
  Kullanıcılar etkileşim kurabilir mi: evet, online odada; sohbet yok, yalnızca oyuncu adı görünür.
  Konum paylaşımı yok, satın alma yok.
- **Veri güvenliği:**
  - Geliştirici kullanıcı verisi toplamıyor veya paylaşmıyor.
  - Oyuncu adı ve oyun hareketleri yalnızca online odadaki oyunculara, cihazdan cihaza (WebRTC,
    şifreli) gider; bir sunucuda saklanmaz.
  - Eşleştirme için PeerJS sunucusu bağlantı sırasında IP adresini anlık olarak işler, saklamaz.
  - Veriler aktarım sırasında şifreleniyor: Evet. Veri silme talebi: hesap/veri yok.
- **Haber uygulaması / COVID / finans / sağlık:** Hayır.
- **Devlet uygulaması:** Hayır.

## Sürüm

- Paket adı: `com.ahmetercikan.gasstory` (değiştirilemez)
- İlk sürüm: 1.0.0 (versionCode 1)
- Dosya: `android/app/build/outputs/bundle/release/app-release.aab`
- **Sürüm notu:** `İlk sürüm: 3 bölüm, 4 karakter, osurma ve geğirme, 1-4 kişi online co-op ve botlar.`
- İlk yüklemede **Play App Signing**'i kabul et (asıl anahtarı Google saklar).
