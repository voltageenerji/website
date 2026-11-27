# Yeni ana sayfa tasarımı — hazırlık dosyası

**Durum:** yayında değil. `index.html` bu klasörde bekler; yayın 10 Aralık SEO ölçümünden sonra, sahibin tam sayfa onayı ve QA (yeni cümleler için Hukuk) kararıyla yapılır. `/docs/*` sitede sunulmaz.

Bu sürüm **24.11 revizyon talimatının** sonucudur (önceki hazırlık sürümü: `bc826d4`). Sahibin kararı: genel yön onaylı; **ilk ekran (üst bant + kapak) masaüstünde ve telefonda aynen kalır**. Değişenler: Hizmetler dizgisi, fotoğraflı Sektörler, kısalan sayfa ve telefonda açılır alanlar, tek kurumsal blok (Hakkında + lisans), sakinleşen şirket cümlesi, yerelleştirilmiş dosya seçici, zemin ritmi.

**24.11 eki (sahibin isteği: "Kayan PTF barını koymayalım mı?"): saatlik PTF şeridi.** Canlıdaki ray (`#mcpRail`, `#mcpTrack`) geri geldi; onay bekliyor.
- Yeri: kapağın alt kenarı, 40 px, `position: absolute` (kapağın alt boşluğunun içinde). Üst bant, başlık, düğmeler ve PTF kartının yeri piksel olarak aynı; kapak yüksekliği aynı. Değişen tek şey fotoğrafın en alt 40 pikselinin koyu şeritle örtülmesi.
- Telefonda ve dar ekranda da var (sahip, 24.11: "Telefona da ekle"). 1040 px altında kapağın altına 44 px yer ayrılır (`.hero { padding-bottom: 44px }`) ve şerit oraya oturur; yer veri olsa da olmasa da ayrıldığı için kayma olmaz. Sonuç: dar ekranda kapak 44 px uzadı (390 px'te 767 → 811), üst bant, başlık, düğmeler ve kartın yeri aynı; sayfa boyu 44 px arttı. Şerit dar ekranda 44 px (dokunma hedefi). Durdur/devam düğmesi (`#mcpDur`, sahip 24.11): şeridin sağ ucunda, dar ekranda 44×44, geniş ekranda 44×40; `aria-pressed` ile durum bildirir, tercih `localStorage` (`voltage-serit-durdu`) ile bu tarayıcıda hatırlanır; hareket azaltma tercihinde şerit zaten durduğu için düğme gösterilmez. Şerit artık `<div id="mcpRail">` içinde bir bağlantı (`.mcp-rail-link`) ve bir düğmedir (düğme bağlantının içine konamaz).
- Veri: yalnız `/ptf/today` yanıtı; veri yoksa ya da 6 saatten az geçerli değer varsa `hidden` kalır. Uydurma değer yok.
- Betik canlıdakiyle aynı (ilk saatte fark yazılmaması 24.11'de canlıya da işlendi); burada kalan iki fark (`yapi/kur.py`, 2c): fark sıfırsa ok yazılmaz, fark binlik ayraçla yazılır.
- Hareket: 140 sn'de bir tur; üstüne gelince ve klavye odağında durur; hareket azaltma tercihinde durur. Şeridin tamamı `/canli-ptf` bağlantısıdır, erişilebilir adı dille değişir (`data-aria-tr` / `data-aria-en`).
- Bilinen ödün: saatlik değerler sayfada üçüncü kez görünür (kart: o saat; şerit: 24 saat, yuvarlanmış; bölüm: grafik ve tablo). Monospace yalnız piyasa verisinde kuralına uyar.
- Test: 365/365 (`sonuclar/test-sonucu.txt`, "şerit" satırları). 27.11'den beri testler izin gerçekten yer değiştirdiğini ölçer (D3: 375/390/320/430 px'te 1,5 sn'de ≥ 25 px; E1: 1440 px'te 2 sn'de ≥ 40 px; üstüne gelince, odakta ve durdur düğmesiyle yerinde kalır).

**27.11 — "PTF kayan yazıları kaymıyor, sabit duruyor" incelemesi (sahip, tam site önizlemesi `6da52819`).** Kod değişikliği gerekmedi; bulgu:
- Yerelde (taklit 24 saat) ve dağıtılmış önizlemede (gerçek veri, geçici GitHub iş akışıyla; yalnız sayılar yazdırıldı) iz içerikle doluyor (48 hücre, 24 × 2), görünür ve kayıyor: Chromium, WebKit ve Firefox'ta 1440 px'te ≈40 px/sn, 390 px'te ≈35 px/sn. Dağıtılan sayfa depodaki yapıdan yalnız iki satırda ayrılıyor (`robots`, `PTF_PROXY`); şerit kodu aynı. Veri yenilemede animasyon yeniden başlamıyor (iz bir kez yazılıyor), açılışta durdurma tercihi boş, genişlik/küçülme sorunu yok (−%50 ≈ 5.000 px).
- Şerit üç durumda durur: (1) işletim sisteminde hareket azaltma açıksa (`prefers-reduced-motion: reduce`; Windows'ta "Animasyon efektleri" kapalı, uzak masaüstü oturumları, iOS/Android "Hareketi azalt"). **Canlı ana sayfa da bu tercihte aynı kuralla durur** (ölçüldü: iki sayfada da 3 sn'de 0 px). (2) İmleç şeridin üstündeyken: **canlıdan tek davranış farkı budur** — canlı şerit imleç üstündeyken kaymaya devam eder (2 sn'de 81 px), yeni şerit durur (0 px; erişilebilirlik için eklenmişti, durdur düğmesi de var). (3) Durdur düğmesine basılmışsa (tercih tarayıcıda saklanır).
- Karar sahibin: (1) ise erişilebilirlik kuralı kalır, sahibe ayar sorulur; (2) ise üstüne gelince durma kaldırılabilir (durdur düğmesi ve klavye odağında durma WCAG 2.2.2 için yeterli), bu tek satırlık bir değişikliktir ve bu turda yapılmadı.

**27.11 eki (sahibin isteği): yeşil enerji seçeneğinde "bahar anı".** Kutucuk işaretlenince mevcut etkilerin (form yeşerir, dal çizilir, `fl-sal` / `cimSal` salınımları) hepsi aynen kalır; üstüne ≈4,5 sn'lik bir süs eklenir:
- Ne: dalın dibinde (formun sağ iç boşluğunda) krem yapraklı, kehribar göbekli küçük bir çiçek açar (0,15–1,25 sn); gönder düğmesinin altındaki çimde sapı çizilerek ikinci bir çiçek açar (sap 0–0,8 sn, çiçek 0,55–1,65 sn); 0,35 sn'de sağdan kehribar kanatlı, lacivert gövdeli bir kelebek gelir, 2,05 sn'de dal çiçeğine konar (kanatlar yavaşlar), 2,7 sn'de kalkıp sağ üstten çıkar. 3,6 sn'de hepsi 0,8 sn'de söner, ≈4,45 sn'de DOM'dan silinir. Çizgiler dalın rengi ve kalınlığında; konfeti, yazı, dış dosya yok (satır içi SVG + ≈2,5 KB stil + ≈6 KB betik, yorumlar dahil; gzip ile ≈3,5 KB; betik `yapi/kur.py` `// 9)`, stil `yapi/stil.css` "BAHAR ANI").
- Neden böyle: süs formun alanlarına hiç girmez. Dal çiçeği ve kelebeğin yolu formun içerik kenarının sağında (iç boşluk + sayfa kenarı), çim çiçeği düğmenin altındaki iç boşlukta kalır; 320 px'te alt boşluk dar olduğu için çim çiçeği çizilmez. Hepsi `aria-hidden`, `pointer-events: none`, mutlak konumlu; yalnız `transform` ve `opacity` değişir (yerleşim kayması yok). Kelebek, sayfa genişliğinde taşmayı kesen mutlak bir şeritte uçar (yatay taşma yok); sayfa kaydırılsa da forma göre yerinde kalır. Üst bandın altında kalır (z-index 60 < 100).
- Kurallar: yalnız kutucuk işaretlenince başlar (açılışta, geri gelişte, kutucuk kaldırılınca başlamaz); aynı anda tek gösterim (hızlı aç-kapada üst üste binmez); gösterim sürerken kutucuk kaldırılırsa 0,3 sn'de söner. Hareket azaltma tercihinde kelebek ve açılma yoktur: dal çiçeği açık hâliyle 3,5 sn içinde belirip söner (yalnız saydamlık). Betik kapalıyken hiçbir şey olmaz.
- Aynı turda düzeltilen hata: form `overflow: hidden` iken 640 px'lik çim çizimi formu kaydırılabilir yapıyordu; yeşil kutucuğa tıklayınca form içeriği yana kayıyordu (390 px'te 22 px; içerik sola yaslanıp sağda boş şerit kalıyordu). `.form` artık `overflow: clip` (kaydırma kabı kurmaz; desteklemeyen eski tarayıcıda `hidden` kalır). **Canlı ana sayfada da aynı hata var** (1440 px'te 44 px, 390 px'te 24 px); canlı dondurulmuş olduğu için dokunulmadı, yeni tasarımla kapanır.
- Testler (F8, 28 test): açılışta yok; işaretlenince 2 çiçek + kelebek (320 px'te 1 çiçek), hepsi `aria-hidden` / `pointer-events: none` / mutlak; kelebek her karede formun içerik kutusunun dışında; etki boyunca taşma 0, form ve sayfa boyu sabit, `scrollLeft` 0; ≈4,5 sn'de silinir, yeşil görünüm kalır; kaldırınca başlamaz; hızlı aç-kapada en çok 1 kelebek + 2 çiçek; ortada kaldırılınca 0,5 sn'de silinir; etki sürerken alan doldurulur, KVKK işaretlenir, form gönderilir (`yesil:true`), süs `elementFromPoint` ile tıklamayı yakalamaz; hareket azaltmada yalnız saydamlık; betik kapalıyken yok; konsol hatası yok. 1440, 390, 320 px.

**27.11 — bahar anı 2. tur (sahip: "Bahar efektini daha belirgin bir hâle getir.").** İlk turda çiçekler ≈15–20 px, kelebek 30 px (telefonda 22 px) idi; 1440 px'te gözden kaçıyordu. Mevcut yeşil etkiler (form yeşerir, dal çizilir, çim, salınımlar) ve bütün kurallar aynen kaldı; yalnız süs büyüdü ve çoğaldı:
- Ne: formun **iki kenarında** sırayla dört çiçek açar — dalın dibinde krem yapraklı / kehribar göbekli büyük çiçek (0,1 sn), onun üstünde kehribar yapraklı / lacivert göbekli çiçek (0,5 sn), solda yeşil kutunun hizasında kehribar çiçek (0,85 sn) ve altında papatya (1,2 sn). Her biri kısa sap ve iki yaprakla, form çerçevesinin üstünde durur. Gönder düğmesinin altındaki çimde geniş formda iki, dar formda bir küçük çiçek (1,45 / 1,75 sn; 320 px'te yer yok, çizilmez). **İki kelebek**: biri 0,3 sn'de ekranın sağ kenarından girer, inip çıkarak 2,25 sn'de dalın dibindeki çiçeğe konar (≈0,95 sn; kanatlar yavaş ve yarım çırpar), sağ üstten çıkar; öteki 0,75 sn'de girer (tek sütunda ekranın sol kenarından, iki sütunda üst bandın altından), 2,7 sn'de soldaki kehribar çiçeğe konar (≈0,85 sn), geldiği yöne gider. 1,9–3,3 sn arasında beş yaprak çiçeklerden kopar ve ≈2,5 sn boyunca yavaşça süzülür (döner, salınır, söner). 4,95 sn'de hepsi 0,8 sn'de söner; **≈5,8 sn'de DOM'dan silinir**.
- Ölçüler: kenar çiçeği en çok 60 px genişlik (baş ≈57 px; masaüstünde 60 / 42 / 52 / 38 px; 390 px'te 40 / 28 / 35 / 26 px; 320 px'te 31 / 22 / 27 / 20 px); çim çiçeği en çok 40 px boy. Kelebek masaüstünde 64 px (önce 30), 390 px'te 40 px (önce 22), 320 px'te 32 px. Yaprak 10 px (telefonda 8). Renkler mevcut paletten: krem #FCF8EE, kehribar #E3A72F / #F2BC48, lacivert #1E2536, dal yeşili #3F7F4C; kelebek kanadında lacivert uçta iki krem benek ve ince damarlar, hafif gölge.
- Yerleşim kuralı: süs, sayfa genişliğinde taşmayı kesen **tek** mutlak katmandadır (`.bh-kat`, z-index 60 < üst bant 100 < mobil menü 90'ın da altında). Hiçbir öğe formun içerik kutusuna (alanlar, etiketler, düğmeler, metin) girmez: çiçekler formun iç boşluğu + sayfa kenarı şeridine sığan en büyük ölçüde, çerçeve çizgisine ortalanır; kelebeğin x'i her karede o anki eğimle dönmüş kutunun yarısı hesaba katılarak şeride kıstırılır; yapraklar şeritte kalır. İki sütunlu düzende sol sütun (başlık ve yapışkan künye) yasaktır; kelebek ve çiçekler yalnız sütun aralığı + formun sol iç boşluğunda kalır. Tek sütunda katman formun üstündeki başlığa uzanmaz. Konunca kelebek ekrana tam sığar (390 px'te sağ kenar tam 390).
- Yeni kural: gösterim sürerken formun boyu değişirse (dil değişimi, hata iletisi, gönderimde başarı iletisi) ya da pencere boyu değişirse süs yerinden kayacağı için 0,3 sn'de söner; gönderimde de söner.
- Hareket azaltma: kelebek ve yaprak yok, açılma yok; altı (390 px'te beş) çiçek aynı büyük ölçüde, yerlerinde 120 ms arayla yalnız saydamlıkla belirip söner (≈4,5 sn).
- Animasyonlar yalnız `transform` ve `opacity` (sap çizimi `stroke-dashoffset`; yalnız boyama, yerleşim değil). Kelebek yolu betikte 40 ms'lik karelerle (Hermite eğrisi, uçarken hafif inip kalkma ve ≤ 12° eğim) WAAPI ile oynatılır; çiçek açılması CSS.
- Ağırlık: betik 6,2 → 14,4 KB (yorumlar dahil; yorumsuz 13,4 KB), stil 2,5 → 3,2 KB; ikisi gzip ile 3,6 → 6,9 KB. Dış dosya yok.
- Testler (F8, 2. tur, 38 test; önce 28): sayılar (1440: 6 çiçek, 390: 5, 320: 4; her genişlikte 2 kelebek, 5 yaprak, 1 katman), hepsi `aria-hidden` / `pointer-events: none` / mutlak; belirginlik (en büyük çiçek ≥ 56 px masaüstü / ≥ 30 px telefon, kelebek ≥ 60 / ≥ 34 px, aynı anda ≥ 5 süs öğesi ekranda); iki kelebek de uçuyor (≥ 40 konum, ≥ 150 px dikey yol) ve her biri ≥ 0,8 sn tamamen ekranda (konduğu süre); her karede hiçbir öğe içerik kutusuna, başlığa ya da künyeye girmiyor, çim çiçekleri düğmenin altında; animasyon özellikleri yalnız transform / opacity / stroke-dashoffset; taşma 0, form ve sayfa boyu sabit; 5 sn'de sürüyor, ≈5,8 sn'de silinir, yeşil görünüm kalır; hızlı aç-kapada tek gösterim; ortada kaldırınca ve pencere boyu değişince 0,5 sn'de silinir; etki sürerken form doldurulur ve gönderilir (süs tıklamayı yakalamaz), gönderilince 0,6 sn'de silinir; hareket azaltmada yalnız saydamlık; betik kapalıyken yok; konsol hatası yok.
- Ekran görüntüleri (deviceScaleFactor 2; depoda değil): oturum scratchpad'inde `bahar2/` (1440 ve 390 px'te 0,6–5,3 sn arası altı an, 320 px, hareket azaltma).

**27.11 — Hukuk ve Uyum düzeltmeleri ("CLEAR WITH CHANGES", ana sayfa hazırlığı ve alt sayfa çıktıları).** Alt bilgi: "Est. 2011 · EPİAŞ Üyesi" / "Est. 2011 · EPIAS Member" → "Kuruluş 2011 · EPİAŞ Piyasa Katılımcısı" / "Est. 2011 · EPIAS Market Participant" (EPİAŞ'ta üyelik değil piyasa katılımcılığı vardır; rozet 13.11'de aynı gerekçeyle düzeltilmişti). Sektör notu: "Görseller temsilîdir; müşterilerimizin tesislerini ya da belirli bir tesisi göstermez." / "Images are illustrative and do not show our customers' facilities or any specific site." EN kaynak satırı: "Source: EPIAS Transparency Platform." Alt bilgi 320 px'te TR ve EN taşmaz (test L4b). Alt sayfalar `sayfalar/kur-sayfalar.py` ile yeniden üretildi (29 sayfa; alt bilgi satırı, ayrıca üreticinin zaten yaptığı ama çıktılara henüz işlenmemiş iki TR erişilebilirlik etiketi: menü düğmesi "Menü", alt bilgi gezinmesi "Alt bilgi"). **Canlı `index.html` hâlâ "EPİAŞ Üyesi" taşır**; canlı dondurulmuş olduğu için dokunulmadı.
- Doğrulanamayan: gerçek iOS Safari / Firefox'ta görünüm (yalnız Chromium'la bakıldı).

## Dosyalar

- `index.html` — ana sayfanın tamamı, tek dosya (stil ve betik satır içi).
- `img/kapak-800.webp`, `kapak-1200.webp`, `kapak-1600.webp`, `kapak-2172.webp` (3:1) ve `kapak-mobil-579.webp` (4:5, 700 px ve altı).
- `img/sektor-{demir-celik,kimya,osb,lojistik,cam-seramik,veri-merkezi,tekstil}-{480,800,1200}.webp` — 21 dosya, 3:2 (1200×800, 800×533, 480×320). Orkestratör üretir. **Bu not yazılırken klasörde yoktu**; sayfa dosya adlarına hazırdır, görsel gelene kadar yerinde aynı ölçüde koyu kutu ve alt metni durur.

## İlk ekran: aynı kaldığının kanıtı

`sonuclar/test-sonucu.txt`, M1: bekleme durumunda 1440×900, 390×844 ve 390×844@2x ekran görüntüleri önceki hazırlık sürümüyle piksel piksel karşılaştırıldı.

| Görünüm | Üst bant + kapak + bilgi satırı | Ekranın geri kalanı |
|---|---|---|
| 1440×900 | 0 farklı piksel (ilk 729 px) | 815–887. satırlar farklı: yeniden düzenlenen Hizmetler bölümünün başı |
| 390×844 | 0 farklı piksel | ekranın tamamı aynı |
| 390×844 @2x | 0 farklı piksel | ekranın tamamı aynı |

Üst bant, kapak, PTF kartı ve bilgi satırının stil kuralları ile işaretlemesi değişmedi.

## Canlı sayfadan aynen alınanlar

- Baş bölümü: yazı tipi bağlantısına kadar bayt bayt aynı (title, description, canonical, robots, OG, Twitter, JSON-LD).
- Teklif formu: `<form>…</form>` canlıyla aynı; **tek fark aşağıdaki dosya seçici dönüşümü**. Form betiği (`// 6) Teklif formu` … ilk kullanım) bayt bayt aynı.
- Bölüm metinleri, beş hizmet, yedi sektör ve rehber bağlantıları, lisans bilgileri, dört rozet, Hakkında metninin üç paragrafı ve imza, üç ilke ve etiketleri, şirket cümlesi, iletişim bilgileri, alt bilgi.
- Canlı veri mantığı: proxy çağrıları (`/ptf/today`, `/ptf/stats`), önbellek anahtarı (`voltage-ptf-cache`), dürüstlük merdiveni.

## Formdaki tek değişiklik: dosya seçici

Sorun: yerli `<input type="file">` tarayıcının kendi dilinde "Choose Files / No file chosen" yazar. Çözüm `yapi/kur.py` içindeki `dosya_secici()` dönüşümüdür. Girdi etiketi **bayt bayt aynı** kalır (id, name, accept, multiple); yalnız bir sarmalayıcıya alınır, ardına bir `<label>` (düğme) ve bir durum satırı eklenir:

```diff
           <label class="form-label" for="lead-fatura" data-tr="Son faturanız (opsiyonel)" data-en="Latest invoice (optional)">Son faturanız (opsiyonel)</label>
-          <input type="file" class="form-input" id="lead-fatura" name="fatura" accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif" multiple>
+          <div class="dosya" id="leadFaturaKutu">
+            <input type="file" class="form-input" id="lead-fatura" name="fatura" accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif" multiple>
+            <label class="dosya-dugme" for="lead-fatura" data-tr="Dosya Seç" data-en="Choose Files">Dosya Seç</label>
+            <span class="dosya-durum" id="leadFaturaDurum" aria-live="polite" data-tr="Dosya seçilmedi" data-en="No file chosen">Dosya seçilmedi</span>
+          </div>
           <small class="form-hint" …>
```

- Betik çalışınca kutu `hazir` sınıfını alır: yerli girdi görsel olarak gizlenir (1×1 px, saydam) ama DOM'da ve sekme sırasında kalır; odak çerçevesi etiket düğmesinde görünür. Durum satırı: dosya yokken "Dosya seçilmedi / No file chosen", bir dosyada dosya adı, birden çok dosyada "{n} dosya seçildi / {n} files selected". Dil düğmesiyle birlikte değişir.
- Betik çalışmazsa kutu `hazir` olmaz: yerli girdi olduğu gibi görünür ve kullanılır, düğme ve durum satırı gizlidir.
- Yükleme mantığı (en fazla 3 dosya, 8 MB, toplam 10 MB, küçültme, hata iletileri, 5xx'te dosyasız yeniden deneme) form betiğindedir; dokunulmadı. Testler: K1–K9 ve F6.
- Karşılaştırma betiği dönüşümü geri alıp formu canlıyla bayt bayt karşılaştırır (`sonuclar/once-sonra-canli.txt`, 1. bölüm).

## Betikte yapılanlar

Çıkarılanlar (sayfada öğesi yok): SMIL temizliği, kaydırınca belirme, folyo, tek hat şeması (saatlik ray 24.11 ekiyle geri geldi). **Bu turda:** KPI bandına (`kpiNow`, `kpiMin`, `kpiMax`, `kpiStamp`) ait sekiz satır çıkarıldı (bir arama, yedi yazma), baştaki koruma `if(!kfPtf && !kpiNow)` → `if(!kfPtf)` oldu. Çıkarılanlar yalnız DOM'a yazan, zaten `if(öğe)` ile korunan satırlardı; en düşük, en yüksek ve ortalama hesabı, önbellek ve veri çağrıları aynıdır. Betiğin aradığı her id artık sayfada vardır (`once-sonra-*.txt`, 6. bölüm: "OLMAYAN id: []").

Eklenenler:
1. Atlama bağlantısı yumuşak kaydırma işleyicisinin dışında.
2. Dil düğmelerinde `aria-pressed`.
3. Bağlantıyla gelişte yeniden hizalama `#hakkimizda`, `#yaklasim`, `#hizmetler` ve `#canli-piyasa` için de çalışır.
4. Canlı veri denetleyicisi kapak kartını (`ptfKart`, `heroLine`, `heroArea`, `heroDot`) ve saatlik tabloyu (`#saatTablo`) da doldurur. Tabloda eksik saat "—" kalır.
5. **Bu turda — görsel alt metni:** `setLanguage` yalnız metin düğümlerini çeviriyordu. Bir satır eklendi: `img[data-alt-tr][data-alt-en]` öğelerinin `alt` değeri dile göre değişir.
6. **Bu turda — açılır alanlar** (`// 7)`): geniş ekranda alanlar hep açıktır, başlık düğme gibi davranmaz (sekme sırasında değildir, tıklama kapatmaz); ekran genişlerse telefonda kapalı kalmış alan açılır.
7. **Bu turda — dosya seçici** (`// 8)`): yukarıda anlatılan düğme ve durum satırı.
8. **Bu turda — dört tek satırlık betik:** her `<details>` öğesinin hemen ardında, 759 px ve altında `open` niteliğini boyamadan önce kaldırır.
9. **27.11 — bahar anı** (`// 9)`): yeşil enerji kutucuğu işaretlenince çiçek ve kelebek (yukarıda). Form betiğine (`// 6)`) dokunulmadı; ayrı bir dinleyicidir.

## Canlı sayfadan farklar

- **Kapak:** H1 iki parçadır: üst satır (`.h1-ust`, arama niyeti) ve slogan (`.h1-ana`). PTF kartı düz, opak paneldir. (Bu turda değişmedi.)
- **Marka yazısı:** işaret aynı; "Voltage Enerji" yazısı üst bantta ve altta Archivo, büyük harf.
- **Kaldırılan süsler:** bölüm numaraları, folyo, hizmet numaraları, tek hat şeması, halkalar, "EXHIBIT A", "S1–S5", "A/B/C", "VOLTAGE FELSEFESİ · EST. 2011", işlevsiz oklar, kart gölgeleri, belirme animasyonları.
- **Bölüm sırası ve zemin:** Kapak (fotoğraf) → bilgi satırı (krem) → Hizmetler (beyaz) → Sektörler (lacivert, fotoğraflı) → Piyasa Verileri (krem) → Süreç (lacivert) → Modeller (beyaz) → Hakkında + lisans (krem) → Neden Voltage (lacivert) → İletişim ve form (krem) → alt bilgi. Art arda en çok iki açık bölüm gelir. Ayrı "EPDK Lisansı" bölümü ve ayrı koyu söz bandı yoktur.
- **Hizmetler:** başlık solda, giriş cümlesi sağda aynı satırda. Ana hizmet (Endüstriyel Tedarik, `/sanayi-elektrik-tedariki` bağlantılı) tam genişlikte krem bir bantta; dört hizmet altında dört sütun. Görsel, şema, numara, simge yok.
- **Sektörler:** başlık ve giriş solda, ilk sektörün fotoğrafı sağda büyük, yazısı solda fotoğrafın alt hizasında; altı sektör iki sıra hâlinde değişen genişliklerde (5-4-3 ve 3-4-5 sütun). Yazılar fotoğrafın altında düz dizgidir: kart kutusu, yuvarlak köşe, gölge, fotoğraf üstü yazı ya da örtü yok. Bölüm sonunda "Görseller temsilîdir…" notu. Telefonda: bir büyük + altı küçük (ikişerli).
- **Piyasa verisi:** grafik solda, "Günlük Piyasa Özeti" sağda, altında saatlik tablo. Tablo artık 24 alt alta satır değil, **dört kısa gerçek tablo**dur (00–05, 06–11, 12–17, 18–23; grafiğin saat çizgileriyle aynı bölünme); telefonda 2 × 2 ve kapalı başlar. Hücreler HTML'de "—"dir; sayıyı yalnız betik, EPİAŞ verisinden yazar. Betik kapalıyken bölüm bir cümle ve `/canli-ptf` bağlantısı gösterir.
- **Süreç:** gerçek `<ol>`, lacivert zeminde. 4. adımın adı "Tedarikçi Değişimi".
- **Hakkında + lisans:** tek kurumsal blok. Solda üç paragraf ve imza; sağda iki künye: "Şirket Bilgileri" (H3) ve "EPDK Tedarik Lisansı" (H3). Altında dört rozet tek satır. Fotoğraf yok. Slogan satırı kaldırıldı.
- **Neden Voltage:** üç ilke lacivert zeminde; ilke etiketleri küçük ve soluk. Şirket cümlesi bölümün sonunda, ince çizginin altında küçük serif bir cümle (en çok 21 px).
- **İletişim:** kaynak sırası başlık → form → iletişim ve sicil bilgileri. Geniş ekranda başlık ve bilgiler solda, form sağda; telefonda form bilgilerden önce gelir.
- **Telefon:** üst bantta "Teklif Al" ve menü düğmesi; dil seçimi menü panelinde. Açılır alanlar (kapalı başlar): saatlik tablo, şirket bilgileri, EPDK lisansı, iletişim ve sicil bilgileri. İçerikleri HTML'de baştan vardır. Formda ad ve soyad yan yana (360 px ve üstü).
- **Menü:** "Canlı PTF" eklendi. 1039 px ve altında panel.

### Sayfa boyu

| Genişlik | Önceki hazırlık | Bu sürüm | Hedef |
|---|---|---|---|
| 1440 px | 9.541 px | 7.998 px | ≈ 8.000 |
| 390 px | 14.106 px | 10.587 px | ≈ 10.500 |

390 px'te hedefin 87 px üstünde kalındı. Kalan uzunluğun 2.190 px'i formun kendisidir (işaretlemesi değiştirilemez); kapak ve bilgi satırı (922 px) onaylı olduğu için dokunulmadı. İçerik silinmedi.

## Değişen ve kaldırılan metinler

### Bu turda (önceki hazırlık sürümüne göre; `sonuclar/once-sonra-onceki-hazirlik.txt`)

Kaldırılan (talimatla):

| TR | EN |
|---|---|
| Bir firma kadar köklü, bir ortak kadar yakın. | As established as a firm, as close as a partner. |
| Onboard | Onboard |
| Bugünün Cetveli | Today's Ledger |

Eklenen:

| TR | EN | Yer |
|---|---|---|
| Tedarikçi Değişimi | Supplier Switch | Süreç, 4. adım (Onboard yerine) |
| Günlük Piyasa Özeti | Daily Market Summary | piyasa özeti başlığı (Bugünün Cetveli yerine) |
| Görseller temsilîdir; müşterilerimizin tesislerini ya da belirli bir tesisi göstermez. | Images are illustrative and do not show our customers' facilities or any specific site. | Sektörler bölümünün sonu (27.11 Hukuk düzeltmesi; önceki: "… Voltage Enerji tesislerini göstermez.") |
| Şirket Bilgileri | Company Details | Hakkında, künye başlığı (H3) |
| İletişim ve Sicil Bilgileri | Contact and Registry Details | İletişim, bilgi listesi başlığı (H3) |
| Dosya Seç | Choose Files | form, dosya düğmesi |
| Dosya seçilmedi | No file chosen | form, durum satırı |
| {n} dosya seçildi | {n} files selected | form, durum satırı (betikte) |

Yeri ya da düzeyi değişen (metin aynı): "EPDK Tedarik Lisansı" H2 → Hakkında bölümünde H3; "Saatlik PTF · ₺/MWh" tablo başlığı (`<caption>`) → H3; şirket cümlesi ayrı banttan "Neden Voltage?" bölümünün içine.

Bağlantılar: 40 bağlantı, 22 hedef; kaldırılan ya da eklenen yok.

Görsel alt metinleri (yeni; görseller gelince her fotoğrafın gerçekten gösterdiğine göre gözden geçirilmeli):

| Görsel | TR | EN |
|---|---|---|
| demir-celik | Çelik fabrikasında elektrik ark ocağından erimiş çelik dökümü | Molten steel being poured at an electric arc furnace steel plant |
| kimya | Alacakaranlıkta bir petrokimya tesisinin damıtma kuleleri ve boru hatları | Distillation columns and pipe racks of a petrochemical plant at dusk |
| osb | Organize sanayi bölgesindeki fabrika binalarının havadan görünümü | Aerial view of factory buildings in an organised industrial zone |
| lojistik | Yüksek raflı soğuk hava deposunun içi | Interior of a high-bay cold storage warehouse |
| cam-seramik | Cam üretim hattında kızgın cam | Glowing glass on a glass production line |
| veri-merkezi | Veri merkezinde sunucu kabinleri arasındaki koridor | Aisle between server racks in a data centre |
| tekstil | Dokuma fabrikasında sıra sıra dokuma tezgâhları | Rows of looms in a weaving mill |

### Önceki turlardan (canlıya göre; `sonuclar/once-sonra-canli.txt`)

Başlıklar:

| Canlı | Hazırlık |
|---|---|
| Türkiye'nin endüstriyel enerji ortağı, Voltage. | Sanayi ve Ticarethaneler için Elektrik Tedariki + Sanayinin enerjisini piyasayla buluşturuyoruz. |
| Uçtan uca enerji çözüm portföyü. | Hizmetlerimiz |
| Çalıştığımız Tesis Sınıfları | Hizmet Verdiğimiz Sektörler |
| Canlı Piyasa | Güncel Elektrik Piyasası Verileri |
| EPİAŞ piyasasını anlık okuyoruz. | Gün öncesi piyasasında oluşan saatlik PTF değerleri. Kaynak: EPİAŞ Şeffaflık Platformu. |
| Teklif'ten ilk faturaya, beş adım. (H2) | Elektrik Tedarik Süreci (H2); eski cümle alt satır olarak duruyor |
| Üç Sözleşme Modeli | Elektrik Tedarik Sözleşmesi Modelleri |
| Bir firma kadar köklü, bir ortak kadar yakın. (H2) | Voltage Enerji Hakkında (H2); eski cümle bu turda kaldırıldı |
| Piyasa Zekâsı | Elektrik Piyasalarında Uzmanlık |

Eski kapak metinleri (kaldırıldı): Kurumsal Enerji Tedariki; kapak paragrafının eski hâli; ETS/3424-8/2074 · EST. 2011 · İSTANBUL; Teklif Talep Edin; Hizmetlerimiz (düğme); Gün Öncesi PTF — Canlı; Piyasa Deneyimi; 15 yıl · Est. 2011.

Etiketler (kaldırıldı): KAPAK · 01 / 09 ve bölüm numaraları; S1–S5; A, B, C; EXHIBIT A; TEK HAT ŞEMASI — ŞEMATİK · ÖLÇEKSİZ; VOLTAGE FELSEFESİ · EST. 2011; ◆ ve ▸ işaretleri.

Tekrarı önlemek için kaldırılan piyasa etiketleri: Şu Anki Saat · Gün Öncesi PTF; Bugünün En Düşüğü; Bugünün En Yükseği; KAYNAK: EPİAŞ ŞEFFAFLIK PLATFORMU · SAATLİK PTF.

## Hukuk ve İngilizce denetimi bekleyen yeni metinler

Bu turdan: yukarıdaki "Eklenen" tablosu (sekiz çift) ve yedi alt metni çifti. Özellikle bakılacaklar: temsilî görsel notu; "Tedarikçi Değişimi" adım adı (açıklaması aynı).

Önceki turlardan (değişmedi):

| TR | EN |
|---|---|
| Sanayi ve Ticarethaneler için Elektrik Tedariki | Electricity Supply for Industry and Businesses |
| Sanayinin enerjisini piyasayla buluşturuyoruz. | We connect industry's energy with the market. |
| … sanayi ve ticarethanelere sözleşmeye dayalı elektrik tedariki sağlıyoruz. | … to industrial and commercial consumers … |
| Teklif Al / Hizmetlerimizi İncele | Get a Quote / Explore Our Services |
| Güncel Piyasa Verisi · PTF | Current Market Data · MCP |
| Saatlik veri bekleniyor | Awaiting hourly data |
| Piyasa verilerini detaylı incele | View detailed market data |
| 2011'den bu yana · EPDK lisanslı tedarikçi | Since 2011 · EPDK-licensed supplier |
| Piyasa katılımcısı · GÖP ve GİP | Market participant · DAM and IDM |
| Türkiye'nin tamamı · Sanayi ve ticarethane | All of Türkiye · Industrial and commercial |
| Hizmetlerimiz | Our Services |
| Hizmet Verdiğimiz Sektörler | Sectors We Serve |
| Tüm sektör rehberleri | All sector guides |
| Güncel Elektrik Piyasası Verileri | Current Electricity Market Data |
| Gün öncesi piyasasında oluşan saatlik PTF değerleri. Kaynak: EPİAŞ Şeffaflık Platformu. | Hourly day-ahead market clearing prices (MCP). Source: EPIAS Transparency Platform. (27.11: EN'de "EPIAS") |
| Saatlik PTF · ₺/MWh · Saat · PTF | Hourly MCP · ₺/MWh · Hour · MCP |
| Elektrik Tedarik Süreci | Electricity Supply Process |
| Elektrik Tedarik Sözleşmesi Modelleri | Electricity Supply Contract Models |
| Voltage Enerji Hakkında | About Voltage Enerji |
| Elektrik Piyasalarında Uzmanlık | Expertise in Electricity Markets |
| Canlı PTF (menü) | Live MCP |
| İçeriğe atla | Skip to content |
| Betik kapalıyken: "Grafik ve saatlik tablo bu sayfada tarayıcı betiğiyle dolar. Güncel saatlik değerler Canlı PTF sayfasında yer alır." | yalnız Türkçe (dil değişimi betik ister) |

## Görseller

**Kapak:** `<picture class="hero-photo">` içinde; yollar göreli (`img/…`). Yüklenemezse `<img onerror>` `.hero-media` öğesine `yedek` sınıfını ekler ve çizim silüet görünür. `sizes` değeri kapağın gerçek çizim genişliğine göredir. Bu turda değişmedi.

**Sektör görselleri:** her biri `<img>`; `srcset` 480w/800w/1200w, `width="1200" height="800"`, `loading="lazy" decoding="async"`, `alt` + `data-alt-tr` / `data-alt-en`. Hepsi ilk ekranın altındadır; kapak görseli masaüstünde LCP öğesi kalır. Kutunun ölçüsü stilde sabittir (yer ayrılır, kayma olmaz); görsel `object-fit: cover` ile kırpılır.

Çizim ölçüleri (CSS pikseli) ve tarayıcının seçtiği dosya (`sonuclar/test-sonucu.txt`, L6):

| Genişlik | demir-celik | kimya, tekstil | osb, veri-merkezi | lojistik, cam-seramik |
|---|---|---|---|---|
| 1440 @1x | 710×376 → 800 | 498×214 → 800 | 392×214 → 480 | 286×214 → 480 |
| 1280 @1x | 660×349 → 800 | 463×192 → 480 | 364×192 → 480 | 266×192 → 480 |
| 1024 @1x | 922×369 → 1200 | 292×194 → 480 | 292×194 → 480 | 292×194 → 480 |
| 768 @1x | 691×276 → 800 | 217×145 → 480 | 217×145 → 480 | 217×145 → 480 |
| 390 @1x | 351×197 → 480 | 168×112 → 480 | 168×112 → 480 | 168×112 → 480 |
| 390 @3x | 351×197 → 1200 | 168×112 → 800 | 168×112 → 800 | 168×112 → 800 |
| 320 @2x | 288×162 → 800 | 136×91 → 480 | 136×91 → 480 | 136×91 → 480 |

`sizes`: ilk görsel `(min-width: 1384px) 710px, (min-width: 1040px) 53vw, 90vw`; 5 sütunluklar `… 498px, … 36vw, (min-width: 760px) 29vw, 43vw`; 4 sütunluklar `… 392px, … 28vw, …`; 3 sütunluklar `… 286px, … 21vw, …`. Test, bildirilen genişliğin çizim genişliğinden en çok %8 saptığını doğrular.

Kırpma: geniş ekranda ilk görsel 1,89:1; 5 sütunluklar 2,3:1 (üstten ve alttan kırpılır); 3 sütunluklar 1,3:1 (yanlardan kırpılır). Konu kenarda kalan bir fotoğrafta `object-position` o görsele özel ayarlanmalıdır; görseller gelince bakılacak.

## Yayın adımları

1. Sahibin tam sayfa onayı; QA kararı; yukarıdaki yeni metinler için Hukuk ve Uyum.
2. Canlı `index.html` o güne kadar değiştiyse `python3 yapi/kur.py` yeniden çalıştırılır (form ya da betik değiştiyse doğrulama satırları durur ve neyin değiştiğini söyler), önce/sonra karşılaştırması yenilenir, fark buraya işlenir.
3. **26 `.webp` dosyası** (5 kapak + 21 sektör) kökteki `/img/` klasörüne kopyalanır. Sayfadaki yollar köke çevrilir: `img/kapak-…` 6 yerde, `img/sektor-…` 28 yerde (her görselde 1 `src` + 3 `srcset`) → `/img/…`.
4. Bu `index.html` kök `index.html` yerine konur (kanca sahip onayı sorar).
5. `_headers`: `/img/*` için önbellek kuralı (ör. `/og/*` ile aynı). CSP `img-src 'self'` yeterlidir; satır içi betikler için `script-src 'unsafe-inline'` zaten vardır (dört tek satırlık betik buna dayanır).
6. `sitemap.xml` ana sayfa `<lastmod>`; `.claude/rules/homepage.md` içindeki kanonik tasarım tarihi; `docs/OPERASYON-DEFTERI.md` ve `CHANGELOG.md` kaydı.
7. Yayından sonra: kapak kartı ve saatlik tablo (yalnız "—" ise önce proxy); `/?kaynak=deneme#leadForm` ile bir deneme talebi (bir kez dosyalı); telefonda dört açılır alan ve dosya düğmesi; yedi sektör görseli (ağ sekmesinde 404 olmamalı); 375 ve 1280 px görünüm; Search Console'da H1 ve başlık değişikliğinin izlenmesi.

## Doğrulanamayanlar

- **Sektör görselleri bu oturumda klasöre gelmedi.** Kırpmaların konuyu kesip kesmediği, alt metinlerin fotoğrafla örtüşmesi, gerçek dosya boyutlarıyla aktarım ve LCP ölçümü yapılamadı. Testler eksik dosyalar için aynı ölçüde düz renkli bir test görseli döndürür (klasöre dosya yazılmaz) ve L0 testi dosyalar gelene kadar bilerek KALDI verir. Dosyalar gelince: `node yapi/test2.mjs`, `node yapi/perf.mjs` ve ekran görüntüleri yeniden alınmalı.
- Gerçek PTF proxy'si (bu ortamdan erişilemiyor). Üç durum (canlı, "SON SENKRON", bekleme) taklit yanıtla sınandı; konsol ve sayfa hatası yok.
- Temiz adresler ve `_redirects` (`wrangler pages dev` bu ortamda yok); denetimler `python3 -m http.server` ile yapıldı.
- Lighthouse puanı. Ölçümler Chromium + CDP ile laboratuvarda alındı; gerçek kullanıcı verisi değildir.
- iOS Safari ve Firefox. Denetimlerin tamamı Chromium iledir. Bakılacak yerler: `<details>` başlığındaki işaret, `clip-path` ile gizlenen dosya girdisinin odağı, `display: contents` (ilk sektör, geniş ekran).
- Telefon kapak görseli 579×724 pikseldir; 3× ekranda yumuşak görünür (önceki turdan açık madde).
- Sıkıştırılmış (Brotli) HTML ile LCP; yerel sunucu sıkıştırmaz.

## Bilinen ödünler

- Geniş ekranda sekme sırası kaynak sırasını izler: İletişim başlığı → form alanları → soldaki e-posta bağlantısı. Telefonda görsel sıra ile aynıdır (çoğunluk telefondadır).
- Geniş ekranda açılır alan başlıkları düğme gibi davranmaz ama `<summary>` öğesidir; ekran okuyucu "genişletilmiş" diye okuyabilir.
- Betik kapalıyken telefonda dört alan açık gelir (içerik gizlenmez); sayfa o durumda daha uzundur.
- Dosya düğmesi sürükle-bırak kabul etmez (yerli girdi görünürken ediyordu).

## Yapım dosyaları ve sonuçlar (24.11)

- `yapi/` — sayfa `yapi/kur.py` ile üretilir: baş bölümü, form ve betikler canlı `index.html`'den **okunur** (yazılmaz); gövde `yapi/govde.html`, stil `yapi/stil.css`. Değişiklik bu iki dosyada yapılır, sonra `python3 yapi/kur.py`.
- `karsilastir.py [önce] [sonra]` önce/sonra karşılaştırmasını üretir (canlıya ya da önceki hazırlık sürümüne göre).
- `test2.mjs` davranış testleri. İki yerel sunucu ister: depo kökünde `python3 -m http.server 8765 --bind 127.0.0.1`; önceki sürümle piksel karşılaştırması ve `perf.mjs` için ölçüm kökünde (scratchpad; `olcum/onceki` = `git show bc826d4:…/index.html`, `olcum/yeni` = güncel yapı, ikisinde de `img/`, kökte `voltage-enerji-logo.svg`) `python3 -m http.server 8766`. Gerçek veri gönderilmez: `/api/lead` ve proxy taklit edilir.
- `perf.mjs` laboratuvar ölçümü, `kontrast2.mjs` karşıtlık denetimi (her metin kutusu, çizilmiş piksellere karşı; açılır alanlar açıkken).
- `ortak.mjs` içindeki çıktı yolu oturuma özeldir; yeni oturumda `CIKTI_DIZIN` ortam değişkeniyle verilir.
- `sonuclar/` — son koşunun çıktıları: `test-sonucu.txt`, `once-sonra-canli.txt`, `once-sonra-onceki-hazirlik.txt`, `performans.txt`, `karsitlik.txt`.
  - Davranış testleri (27.11, bahar anı 2. tur + Hukuk düzeltmeleri): 377/377 (önceki koşu 365/365; +10 F8, +2 L4b). Önceki koşu notu: 312 testten 311'i geçti. Kalan tek test L0'dır (21 sektör görseli dosyası klasörde yok); dosyalar gelince geçer.
  - Karşıtlık: 5.754 metin kutusu, eşik altı 0; en düşük 4,74:1 ("CANLI" etiketi, önceki turla aynı).
  - Laboratuvar (yazı tipleri kapalı, sıkıştırmasız yerel sunucu; önceki → yeni): masaüstü LCP 112 → 68 ms, LCP öğesi iki sürümde de kapak görseli; telefon (4× işlemci, yavaş ağ) LCP 448 → 504 ms, LCP öğesi iki sürümde de kapak alt metni. Telefondaki 56 ms'lik artış büyüyen HTML'dendir (153 → 171 KB; gzip 42,1 → 46,1 KB): satır içi stil 8,5 KB arttı ve yavaş ağda ilk boyamayı o kadar geciktirir. CLS 0 (yüklemede ve sayfa sonuna kaydırınca). DOM 885 → 945 öğe.
  - Sektör görselleri gerçek dosyalarla ölçülmedi (yukarıda). Masaüstünde (1440×900) tarayıcı yedi görseli de yüklemenin hemen ardından ister (tembel yükleme eşiği içinde kalıyorlar); telefonda yüklemede hiçbiri istenmez, kaydırdıkça gelir.
  - `performans.txt` içindeki sayfa yükseklikleri (375 px'te 11.031, 1440 px'te 8.106) yazı tipleri kapalıyken ölçülmüştür; yazı tipleriyle 390 px'te 10.587, 1440 px'te 7.998 px'tir.
- Eski `sonuclar/once-sonra.txt` silindi; yerine iki karşılaştırma dosyası geldi.
- Önizleme bağlantısı üretilirken sunulan kopyada iki fark olur: `robots` değeri `noindex, nofollow` ve `PTF_PROXY` aynı kökenli geçici aktarıcıya bakar. Bu klasördeki `index.html` üretim değerlerini taşır.

## Sektör görselleri (24.11)

- Yedi görsel yapay zekâ üretimidir (Kling, ücretsiz hesap; altısı `kling-image-v4_0` 2k, tekstil `kling-image-v3_0` 1k). Ortak dil: alacakaranlık / lacivert gölge, kehribar ışık; insan, yazı, logo yok.
- Kaynak görsellerin sağ alt köşesinde araç filigranı vardı. Sahibin talimatıyla (24.11: "Alttan kırparak KlingAI filigranlarını kaldır") alttan %9,5 kırpıldı, 3:2 oranı için yanlardan eşit kırpıldı; sonra 1200×800, 800×533, 480×320 WebP üretildi (`img/sektor-*-{1200,800,480}.webp`, toplam ≈1,1 MB; tarayıcı tek ziyarette yalnız ihtiyacı olan genişliği indirir).
- YAYIN ÖNCESİ AÇIK NOKTA: ücretsiz hesapla üretilen görsellerin ticari kullanım ve filigran koşulları aracın kullanım şartlarına bağlıdır. Canlıya almadan önce ya şartlar teyit edilir ya da görseller kapak görselinde olduğu gibi sahibin kullanım hakkı bulunan bir araçla yeniden üretilip aynı dosya adlarıyla değiştirilir (üretim istemleri `GORSEL-ISTEMLERI.md` dosyasında).
- Alt metinler görsele göre düzeltildi: çelik "Çelik fabrikasında potadan dökülen erimiş metal" / "Molten metal being poured from a ladle in a steel plant"; cam "Cam şişe üretim hattında kızgın şişeler" / "Glowing hot bottles on a glass production line". Diğer beşi ilk taslaktaki gibi.
- Bölümde "Görseller temsilîdir; müşterilerimizin tesislerini ya da belirli bir tesisi göstermez." notu yer alır (27.11 Hukuk düzeltmesi).
- Son koşu (gerçek görsellerle): davranış testi 312/312; telefon LCP 464 → 520 ms (metin öğesi; fark HTML boyutundan), CLS 0; masaüstü LCP 120 → 76 ms, CLS 0; masaüstünde yedi sektör görseli yüklemede iner (≈215 KB, LCP'yi engellemez), telefonda yalnız kaydırınca iner (≈170 KB).
