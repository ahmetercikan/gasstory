import { store } from './core.js';

// İki dil: Türkçe (kaynak) ve İngilizce. Türkçe metin anahtardır; İngilizce yoksa Türkçesi gösterilir.
// Telefonun dili Türkçe değilse oyun İngilizce açılır; menüdeki dil düğmesiyle değiştirilebilir.
export let LANG = store.get('lang', null) || ((navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en');

const EN = {
  // Menü
  'Pırrt! Böğğ! Dostluk bozan rafting macerası': 'Pfft! Burp! The friendship-ruining rafting adventure',
  'Adın': 'Your name', 'Adını yaz': 'Type your name', 'Karakterin': 'Your character', 'Süper gücün': 'Your superpower',
  'Tek Başına Oyna': 'Play Solo', 'botlarla': 'with bots', 'Hızlı Eşleş': 'Quick Match', 'online oyunculara katıl': 'join online players',
  'Oda Kur': 'Create Room', 'Odaya Katıl': 'Join Room', 'Arkadaşlar': 'Friends', 'Arkadaşının oda kodu': "Your friend's room code",
  'Katıl': 'Join', 'Nasıl Oynanır': 'How to Play', 'Oda kodu 4 harfli olmalı': 'Room code must be 4 letters',
  // Karakterler ve güçler
  'Kurbağa': 'Frog', 'Su Aygırı': 'Hippo', 'Penguen': 'Penguin', 'Ayı': 'Bear', 'Osurma': 'Fart', 'Geğirme': 'Burp',
  'Basılı tut: sürekli itiş. Gaz, salı durduğun taraftan karşıya iter.': 'Hold: steady push. The gas pushes the raft away from your side.',
  'Basılı tut, şişir, bırak: dev patlama! Sal karşı tarafa fırlar.': 'Hold, puff up, release: a mega blast! The raft shoots to the other side.',
  'OSUR': 'FART', 'GEĞİR': 'BURP', 'DENGE': 'BALANCE', 'Duraklat': 'Pause', 'Gaz': 'Gas',
  'Parmağını sağa sola kaydır: salın kenarında dön': 'Slide your finger left/right: move around the raft',
  // Lobi
  'ODA KODU': 'ROOM CODE', 'TEK BAŞINA': 'SOLO', 'Bölüm': 'Level', 'BAŞLA': 'START', 'Rekor yok': 'No record',
  'Oda kurucusu oyunu başlatınca başlayacak…': 'The game starts when the host starts it…',
  'Arkadaşların "Odaya Katıl" deyip bu kodu yazsın. Boş yerlere bot ekleyebilirsin.': 'Friends tap "Join Room" and enter this code. You can add bots to empty seats.',
  'Bağlandın! Sal hazırlanıyor…': 'Connected! Getting the raft ready…',
  'Botlar sana takım arkadaşlığı yapar. İstediğin kadar ekle ya da çıkar.': 'Bots are your teammates. Add or remove as many as you like.',
  'Boş koltuk': 'Empty seat', 'Bot ekle': 'Add bot', 'Sen': 'You', 'Bot': 'Bot', 'Online': 'Online',
  'Çevrimiçi arkadaşların': 'Friends online', 'Başka odada': 'In another room', 'Çevrimiçi': 'Online', 'Çevrimdışı': 'Offline',
  'Davet et': 'Invite', 'Davet edildi': 'Invited', 'Oyuncu': 'Player',
  'Açık oda bulunamadı, yeni oda kuruldu. Oyuncu bekleniyor…': 'No open room found, so we made one. Waiting for players…',
  'Oyun sürüyor. Bölüm bitince tekrar dene.': 'A game is in progress. Try again after the level.',
  'Oda dolu (4 kişi).': 'The room is full (4 players).', '{name} katıldı!': '{name} joined!',
  '{name} ayrıldı, yerine bot geçti': '{name} left, a bot took over', '{name} ayrıldı': '{name} left',
  'Oda kurucusu seni çıkardı.': 'The host removed you.', "Gas Story'de salıma gel! Oda kodu: {code}": 'Hop on my raft in Gas Story! Room code: {code}',
  'Kod kopyalandı': 'Code copied', 'Kod kopyalandı: {code}': 'Code copied: {code}', 'Biri': 'Someone',
  // Arkadaşlar
  'ARKADAŞ KODUN': 'YOUR FRIEND CODE', 'Arkadaşının kodunu yaz': "Enter your friend's code", 'Ekle': 'Add',
  'Arkadaşların': 'Your friends', 'Online verilerimi sil': 'Delete my online data', 'Emin misin? Tekrar bas': 'Sure? Tap again',
  'Arkadaşlık istekleri': 'Friend requests', 'seni ekledi': 'added you', 'Odada: {room}': 'In room: {room}',
  'Arkadaşlıktan çıkar': 'Remove friend', 'Henüz arkadaşın yok. Kodunu paylaş ya da arkadaşının kodunu yaz.': 'No friends yet. Share your code or enter a friend\'s code.',
  '{name} seni {room} odasına çağırıyor': '{name} is inviting you to room {room}', '{name} seni salına çağırıyor!': '{name} invites you to their raft!',
  "Gas Story'de beni arkadaş ekle! Kodum: {code}": 'Add me as a friend in Gas Story! My code: {code}',
  'Artık arkadaşsınız!': "You're now friends!", 'Silmek için tekrar bas': 'Tap again to delete', 'Online verilerin silindi.': 'Your online data was deleted.',
  'Arkadaş kodu 6 karakter olmalı.': 'Friend code must be 6 characters.', 'Bu senin kendi kodun :)': "That's your own code :)",
  'Bu kodla bir oyuncu bulunamadı.': 'No player found with this code.', 'Zaten arkadaşsınız.': "You're already friends.",
  'Arkadaşlık isteği gönderildi.': 'Friend request sent.', 'Oda kurulamadı, tekrar dene.': "Couldn't create a room, try again.",
  'Bu kodla bir oda bulunamadı.': 'No room found with this code.', 'Bu odada oyun sürüyor. Bölüm bitince tekrar dene.': 'A game is in progress in this room. Try again after the level.',
  'Oda kapandı.': 'The room was closed.', 'İnternet bağlantısı yok.': 'No internet connection.', 'İzin hatası. Uygulamayı güncelle.': 'Permission error. Please update the app.',
  'Bağlantı hatası: {e}': 'Connection error: {e}',
  // Oyun içi
  'Suya düştün! Sala yüz!': 'You fell in! Swim to the raft!', 'ŞAPŞAL!': 'SPLASH!', 'Hop!': 'Hop!', 'Kurtarıldı': 'Rescued',
  'UÇTUUU!': 'WHOOSH!', 'DELİNDİ!': 'PUNCTURED!', 'PATLADI!': 'POPPED!', 'kontrol noktasına dönülüyor': 'back to the checkpoint',
  'DEVRİLDİNİZ!': 'CAPSIZED!', 'dengeyi koruyun': 'keep your balance', 'FASULYE! süper osuruk': 'BEANS! super farts',
  'GAZOZ! süper geğirme': 'SODA! super burps', 'KONTROL NOKTASI': 'CHECKPOINT', 'BİTİŞ!': 'FINISH!', 'PIRRRT!': 'PFFFT!',
  'BRRRT!': 'BRRRT!', 'PÖRRT!': 'PRRRT!', 'FıSSS…': 'FSSS…', 'BÖĞĞĞĞ!!': 'BUUURRP!!', 'BÖĞĞ!': 'BURRP!', 'böğ': 'burp',
  'Çırak Deresi': 'Rookie Creek', 'Pırtlak Kanyonu': 'Toot Canyon', 'Gaz Şelalesi': 'Gas Falls',
  'Gaz, salı durduğun taraftan karşı tarafa iter!': 'Gas pushes the raft away from the side you stand on!',
  'Hepiniz bir tarafa toplanmayın, sal devrilir!': "Don't all crowd one side, the raft will tip!",
  'Girdaplar salı döndürür, dönen salda kenarlara savrulursunuz!': 'Whirlpools spin the raft. Hold on tight!',
  'Akıntı! Dengeyi birlikte koruyun!': 'Rapids! Keep your balance together!',
  'Şelaleler geliyor! İnişte sıkı durun, savrulmayın!': 'Waterfalls ahead! Hold tight on the way down!',
  // Sonuç ve mola
  '{name} bitti!': '{name} complete!', 'Sonraki Bölüm': 'Next Level', 'Tekrar': 'Again', 'Lobi': 'Lobby', 'Baştan Başla': 'Start Over',
  'Oda kurucusunun seçimi bekleniyor…': "Waiting for the host's choice…", 'YENİ REKOR': 'NEW RECORD', 'süre (par {par} sn)': 'time (par {par}s)',
  'yıldız': 'stars', 'patlama': 'pops', 'suya düşme · {n} devrilme': 'falls · {n} capsizes',
  'Gaz Kralı: <b>{name}</b> ({n} pırt puanı)': 'Gas King: <b>{name}</b> ({n} toot points)',
  'Su Perisi: <b>{name}</b> ({n} kez suya düştü)': 'Water Fairy: <b>{name}</b> (fell in {n} times)',
  'Dostluk Bozan: <b>{name}</b> ({n} arkadaşını uçurdu/kokuttu)': 'Friendship Ruiner: <b>{name}</b> (blasted/stunk {n} friends)',
  'Mola': 'Paused', '▶ Devam': '▶ Resume', 'Baştan': 'Restart', 'Lobiye Dön': 'Back to Lobby', 'Odadan Ayrıl': 'Leave Room',
  'Nasıl Oynanır?': 'How to Play?', 'Anladım!': 'Got it!', 'BİTİŞ  •  BİTİŞ': 'FINISH  •  FINISH',
  'Reklam yükleniyor…': 'Loading ad…', 'SEN': 'YOU',
};

// İçinde vurgu olan uzun paragraflar (Nasıl Oynanır)
const HTML = {
  how1: ['Hepiniz aynı şişme saldasınız. Amaç: nehrin sonundaki <b>bitişe</b> salı patlatmadan ulaşmak.', "You're all on the same inflatable raft. Goal: reach the <b>finish</b> without popping it."],
  how2: ['Herkes salın <b>kenarında</b> durur. <b>Sol tarafta parmağını sağa sola kaydır</b>: karakterin kenar boyunca o yöne döner. <b>Sağdaki büyük düğme</b>: gaz!', 'Everyone stands on the raft\'s <b>edge</b>. <b>Slide your finger left/right on the left side</b>: your character moves around the edge. <b>Big button on the right</b>: gas!'],
  how3: ['<b>Osuran</b>: basılı tutunca sürekli iter. Gaz salı, durduğun taraftan <b>karşı tarafa</b> doğru iter.', '<b>Farters</b>: hold for a steady push. The gas pushes the raft from your side to the <b>opposite side</b>.'],
  how4: ['<b>Geğiren</b>: basılı tut, şişir, bırak! Dev bir patlamayla salı karşı tarafa fırlatır, yanındakileri de savurur!', '<b>Burpers</b>: hold, puff up, release! A mega blast launches the raft and knocks your neighbours aside!'],
  how5: ["<b>Hızlı Eşleş</b> ile online oyunculara katıl, <b>Arkadaşlar</b>'dan kodunla arkadaş ekle ve odana çağır.", 'Use <b>Quick Match</b> to join online players, add friends with your code in <b>Friends</b> and invite them to your room.'],
  how6: ['<b>Denge</b>: herkes bir kenara toplanırsa sal yatar, kayıp suya düşersiniz. Çok yatarsa sal <b>devrilir</b>!', '<b>Balance</b>: if everyone crowds one side the raft tilts and you slide into the water. Too much and it <b>capsizes</b>!'],
  how7: ['Dikenler salı deler (3 can). Kayalar sektirir, girdaplar döndürür.', 'Spikes puncture the raft (3 lives). Rocks bounce you, whirlpools spin you.'],
  how8: ['Fasulye osuranları, gazoz geğirenleri süper yapar. Yıldızları topla!', 'Beans power up farters, soda powers up burpers. Collect the stars!'],
  how9: ['Suya düşersen yüzerek sala dön; yetişemezsen arkadaşların seni çeker.', "If you fall in, swim back to the raft; if you can't, your friends pull you up."],
};

export function t(s, vars) {
  let r = LANG === 'en' ? (EN[s] ?? s) : s;
  if (vars) r = r.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
  return r;
}

const orig = new WeakMap();
// Sayfadaki sabit metinleri seçili dile çevir (kaynak Türkçe metin saklanır, dil değişince geri dönülebilir)
export function applyLang(root = document.body) {
  document.documentElement.lang = LANG;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && !n.parentElement.closest('script,style,svg,[data-th],.notr') && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    if (!orig.has(n)) orig.set(n, n.nodeValue);
    const src = orig.get(n), key = src.trim();
    if (!(key in EN)) continue;
    n.nodeValue = src.replace(key, t(key));
  }
  root.querySelectorAll('[placeholder],[aria-label],[title]').forEach((el) => {
    for (const a of ['placeholder', 'aria-label', 'title']) {
      if (!el.hasAttribute(a)) continue;
      const k = 'tr' + a.replace(/-(\w)/g, (_, c) => c.toUpperCase()).replace(/^\w/, (c) => c.toUpperCase());
      if (!el.dataset[k]) el.dataset[k] = el.getAttribute(a);
      el.setAttribute(a, t(el.dataset[k]));
    }
  });
  root.querySelectorAll('[data-th]').forEach((el) => {
    const h = HTML[el.dataset.th]; if (!h) return;
    const icon = el.querySelector('.tile');
    el.innerHTML = (icon ? icon.outerHTML + ' ' : '') + `<span>${LANG === 'en' ? h[1] : h[0]}</span>`;
  });
}

export function setLang(l) { LANG = l; store.set('lang', l); applyLang(); }
