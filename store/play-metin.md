# Gas Story — Google Play mağaza bilgileri

Play Console'a kopyala-yapıştır için. Görseller: `store/play/`.

## Ana mağaza girişi

**Uygulama adı** (en çok 30): `Gas Story: Co-op Rafting`

**Kısa açıklama** (en çok 80):
`Osur, geğir, dengede kal! Arkadaşlarınla 1-4 kişilik dostluk bozan rafting.`

**Tam açıklama:** (emojisiz; Play Console'a girilen hali)

```
Hepiniz aynı şişme saldasınız ve tek bir sorununuz var: kürek yok!

Gas Story'de salı OSURARAK ya da GEĞİREREK itiyorsunuz. Kıvrılan bir nehirden aşağı inerken dikenlerin, girdapların ve şelalelerin arasından birlikte geçmeye çalışın.

OSURMA: Düğmeyi basılı tut, sal baktığın yöne gider.
GEĞİRME: Basılı tut, şişir, bırak! Dev bir patlama salı arkana fırlatır. Önündeki arkadaşını da suya uçurur.

DENGE HER ŞEY
Herkes salın bir kenarına toplanırsa sal yatar, kayıp suya düşersiniz. Çok yatarsa sal tamamen devrilir! Birlikte hareket edin, birbirinizi dengeleyin.

1-4 KİŞİ CO-OP
• Odayı kur, 4 harfli kodu paylaş, arkadaşların kendi telefonlarından katılsın.
• Tek başına mı? Sorun değil: akıllı botlar takım arkadaşın olur ve salı seninle dengeler.

3 BÖLÜM
• Çırak Deresi: dikenli halkalar ve kayalar
• Pırtlak Kanyonu: kayan dikenli kütükler, girdaplar, sert akıntılar
• Gaz Şelalesi: şelalelerden aşağı düşüş, dönen dikenli çubuklar

Yıldızları topla, rekorunu kır. Fasulye osuranları, gazoz geğirenleri süper güçlü yapar!

Bölüm sonunda ödüller: Gaz Kralı, Su Perisi ve Dostluk Bozan kim olacak?

4 sevimli karakter: Kurbağa, Su Aygırı, Penguen ve Ayı.

Reklam yok, hesap yok. Sadece gaz.
```

**Kategori:** Oyun → Gündelik (Casual)
**Etiketler:** Çok oyunculu, Co-op, Parti, Komik
**İletişim e-postası:** ahmetmesutercikan@hotmail.com
**Gizlilik politikası:** https://ahmetercikan.github.io/gasstory/gizlilik.html

## English (en-US) store listing

**App name:** `Gas Story: Co-op Rafting`

**Short description:** `Fart, burp, stay balanced! Friendship-ruining co-op rafting for 1-4 players.`

**Full description:**

```
You're all on the same inflatable raft and there's just one problem: no paddles!

In Gas Story you push the raft by FARTING or BURPING. Stand on the raft's edge, slide left and right, and blast your way down a winding river past spikes, whirlpools and waterfalls.

FART: Hold the button for a steady push. The gas pushes the raft away from the side you stand on.
BURP: Hold, puff up, release! A mega blast launches the raft and knocks your neighbours aside.

BALANCE IS EVERYTHING
If everyone crowds one side, the raft tilts and you slide into the water. Too much and it capsizes! Spread out and work together.

PLAY ONLINE WITH FRIENDS
• Quick Match: jump into a raft with players online.
• Add friends with your friend code, see who's online and invite them to your room.
• Create a room and share the 4-letter code.
• Playing alone? Smart bots join your crew and keep the raft balanced.

3 LEVELS
• Rookie Creek: spiky rings and rocks
• Toot Canyon: sliding spiked logs, whirlpools and rapids
• Gas Falls: waterfall drops and spinning spike bars

Collect stars and beat your records. Beans power up farters, soda powers up burpers!

End-of-level awards: who will be the Gas King, the Water Fairy and the Friendship Ruiner?

4 cute characters: Frog, Hippo, Penguin and Bear.
```

## Grafikler

| Alan | Dosya |
| --- | --- |
| Uygulama simgesi 512×512 | `store/play/simge-512.png` |
| Öne çıkan görsel 1024×500 | `store/play/tr/tanitim-1024x500.png` (İngilizce: `store/play/en/…`) |
| Telefon ekran görüntüleri (bu sırayla) | `store/play/tr/ekran-1..3.png` (İngilizce: `store/play/en/ekran-1..3.png`) |

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

## Durum (23 Ekim 2026)

- Play Console'da uygulama oluşturuldu (KingSmile Studios, uygulama kimliği `4974293839289811937`).
- Doldurulanlar: gizlilik politikası, uygulama erişimi (kısıtlama yok), reklam yok, hedef kitle 13+,
  veri güvenliği (veri toplanmıyor/paylaşılmıyor), içerik derecelendirme (kaba mizah: geğirme/gaz sesleri ve
  gaz bulutu → IARC 3+, ESRB E), reklam kimliği yok, resmi kurum değil, finans/sağlık özelliği yok,
  kategori Gündelik, iletişim e-postası, mağaza girişi (metinler + simge + tanıtım görseli + 3 panorama ekranı).
- Mağaza öğeleri için yapay zekâ beyanı: "etiketleme" (görseller oyunun kendi çizimleri; kullanıcı kararı).
- Üretim sürümü 1 (1.0.0), 178 ülke, tam kullanıma sunma. Yönetilen yayın kapalı → onaylanınca otomatik yayına girer.
- İncelemeye gönderildi. Not: Play "tanıtımlardan yararlanmak için en az 4 ekran görüntüsü" öneriyor; şu an 3 var.

## Sürüm 1.1.0 (versionCode 2)

- Yeni kontrol: karakterler salın kenarında, sağa-sola kaydırarak dönülüyor.
- Online: Firebase ile Hızlı Eşleş, arkadaş kodu, arkadaş listesi, davet; "Online verilerimi sil".
- İngilizce dil desteği. Bölüm sonunda AdMob geçiş reklamı. Çizio tarzı simgeler, daha yüksek görüntü kalitesi.
- Veri güvenliği değişti: Firebase (anonim kimlik, takma ad, arkadaş listesi) + AdMob (reklam kimliği, IP, etkileşim).
