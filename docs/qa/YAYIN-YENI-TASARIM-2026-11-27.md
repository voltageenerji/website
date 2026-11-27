# QA — Yeni tasarım yayın adayı (27.11.2026)

**Kapsam:** üretim `main` 50649ca ↔ yayın adayı `claude/yayin-yeni-tasarim`. Karar, Orkestratörün bildirdiği son aday
**81e4688** (önizleme `https://c9c6f0d1.website-dh5.pages.dev`) üzerinedir. 81e4688, 0879f2b'ye göre yalnız 25 alt sayfaya
4 satır CSS ekler ('Archivo Fallback' @font-face + `--sans`); ana sayfa, görseller, başlıklar, sitemap ve içerik aynıdır
(`git diff --stat 0879f2b 81e4688`: 25 dosya, +100 satır). Bu yüzden ana sayfa, bahar anı ve Safari sonuçları iki aday için
de geçerlidir; alt sayfa denetimleri 81e4688'de yeniden koşuldu.

**QA (bağımsız doğrulama), Teknoloji Yöneticisine; nihai yetki Orkestratör.**

> **Son karar (yeniden doğrulama, aynı gün): RC 4bf70d5 — PASS** (önizleme `https://4a382727.website-dh5.pages.dev`).
> QA-YT-1 kapandı, QA-YT-2 kapandı. Ayrıntı: en alttaki "Yeniden doğrulama — RC 4bf70d5" bölümü. Aşağıdaki BLOCK kararı
> 81e4688 içindir ve geçmiş kayıt olarak korunur.

## İlk karar: BLOCK (81e4688)

Tek engelleyici bulgu **QA-YT-1: masaüstü CLS kabul ölçütü tutmuyor** (Orkestratörün ölçütü: `/rehber` ve
`/rehber/tekstil-elektrik`, 7 koşu, medyan ≤ 0,02, hiçbir koşu > 0,1). `/rehber/tekstil-elektrik` her iki ölçümde,
`/rehber` Lighthouse ölçümünde kalıyor; üretimden kötü. Kök neden iki satırlık yazı tipi eksikliği; düzeltme bu turda
yerelde denendi ve ölçülen bütün sayfalarda CLS'yi ≤ 0,001'e indirdi (aşağıda). Düzeltme işlenip yeni önizleme
geldiğinde yalnız CLS ölçümü ve alt sayfa görsel/taşma denetimi yeniden koşulur (≈ 30 dk); geri kalan her şey geçti.

Bahar anı: yükleme anındaki Core Web Vitals'a etkisi ölçülemeyecek kadar küçük (LCP/TBT/CLS aynı, +6 KB), formu hiçbir
koşulda örtmüyor ve temizleniyor. Kutucuğa dokunuşa yavaş telefonda ≈ 40–50 ms ekliyor (QA-YT-2, düşük, engellemez).

Yasaklı içerik taraması: RC'de eklenen satırlarda tasarruf / "en ucuz" / garanti ifadesi yok (yalnız CSS yüzdeleri);
yasak telefon numarası 26 sayfanın hiçbirinde yok; "EPİAŞ Üyesi" ifadesi kalmadı.

## Denetim tablosu

| # | Denetim | Sonuç | Kanıt (sayılar) |
|---|---|---|---|
| 1a | Node/Playwright paketleri, RC'nin temiz kopyasında | GEÇTİ | test-score 39/39, test-ssr-ptf 72/72, test-admin 97/97, test-report-windows 16/16, test-lead 101/101, test-gsc-export 92/92, test-ssr-hydration 25/25, test-panel 25/25, test-guard 79/79, smoke/smoke2/smoke3/smoke4/qa-lb-submit/censor-probe çıkış 0 (yayın mühendisinin sonuçlarıyla aynı). Not: yayın mühendisinin `test-score` koşusu `/home/user/website/functions` içe aktarıyordu (çalışma dalı, RC değil); RC kopyasına yönlendirilerek yeniden koşuldu: 39/39 |
| 1b | Ana sayfa davranış paketi (`test2.mjs`) — L3 düzeltmesi | GEÇTİ | L3 artık göreli `img/` ve köke göre `/img/` yolunu kabul ediyor (yedisi aynı biçimde olmalı). Hazırlık sayfası (göreli) **377/377**. RC (`/img/`): üç ayrı koşuda L3 geçti; bkz. 1c. Commit `ecdb3d9` (yalnız `test2.mjs`) |
| 1c | RC ana sayfa (`/img/` yolları) | GEÇTİ | **3. koşu, tek başına: 377/377.** Eşzamanlı ağır ölçümler sırasında 1. koşu 376/377 (D11), 2. koşu 376/377 (M1); bkz. QA-YT-7 |
| 2a | Gerçek Safari (macOS 26.7.2, Safari 27.2, safaridriver) | GEÇTİ | Önizlemeye doğrudan: 43/43 (hareket azaltma kapalı; tam bahar anı 149 öğe). Aktarıcı üzerinden canlı EPİAŞ verisiyle: 46/46 (koşucunun varsayılanı **hareket azaltma açık**: şerit duruyor, durdur düğmesi gizli, bahar anı azaltılmış yol). 1263 ve 373 px: taşma 0, menü, PTF kartı, saatlik tablo, form doldurma, bahar anı, temizlik, 5 alt sayfa, hesaplayıcı |
| 2b | iOS Simülatörü, Mobile Safari 26.5, iPhone 17 (iOS 26.5), 402 px @3x | GEÇTİ | 12 sayfa içi rapor + 7 ekran OCR'ı. Ana sayfa: canlı kart (24 sayı, 0 yok), şerit 2 sn'de 71 px akıyor, menü aç/kapa, bahar anı tek katman, 0 örtülme, 0 geometrik kesişim, kayma 0, ≈5,8 sn sonra 0 süs öğesi, gönder düğmesi ulaşılabilir; rehber, canlı PTF (48 hücre, 0 sıfır), hesaplayıcı (4,71 TL/kWh), kurumsal, 404: taşma 0, JS hatası 0. **Bu bir simülatördür, fiziksel iPhone değildir**; safaridriver simülatöre bağlanamadı ("Server terminated early"), sayfalar `simctl openurl` ile açılıp sayfa içi senaryoyla ölçüldü. Fiziksel cihaz denetimi sahibindedir |
| 2c | Firefox 157 (Playwright, Linux) | GEÇTİ | 45/45 (1280 ve 390 px; hareket azaltma dahil). Canlı veri hâli Firefox'ta görülemedi (bkz. QA-YT-5), dürüst bekleme hâli doğrulandı |
| 2d | WebKit (Playwright, iPhone 15 öykünmesi) | GEÇTİ* | 25/26; tek kalan "sayfa hatası" Cloudflare'in pages.dev'e kendisinin eklediği RUM beacon'ının CORS hatası (QA-YT-6), sitenin kodu değil |
| 3a | Bahar anı — INP / olay süresi (Chromium, iPhone sınıfı 390×844 @3, 4× CPU, yavaş 4G; 5 koşu, medyan) | DÜŞÜK BULGU | En kötü etkileşim (INP): açık **184 ms** (en çok 208) ↔ kapalı 136 ms (en çok 152). Kutucuğa dokunuş 176 ↔ 136 ms. Etki sürerken yazma: medyan 96 ↔ 80 ms, en çok 208 ↔ 88 ms. QA-YT-2 |
| 3b | Uzun görevler | DÜŞÜK BULGU | Medyan 1 uzun görev (toplam 92 ms, en uzun 136 ms) ↔ 0 (en uzun 64). Long Animation Frame engelleme medyanı 49 ↔ 0 ms. >50 ms kare: 3 ↔ 1; en uzun kare 117 ↔ 50 ms |
| 3c | CLS (etki sırasında ve sonrasında) | GEÇTİ | 5/5 koşuda etki CLS'si **0**; form ve denetimler 0 px kaydı, sayfa boyu farkı 0, yatay taşma 0 (Chromium, Firefox, Safari, Mobile Safari, WebKit) |
| 3d | Form kullanılabilirliği | GEÇTİ | Etki sürerken 17 denetimde `elementFromPoint` örtülmesi 0 (5 motor, ≈ 13.000 örnek); süs kutuları ile denetim/etiket kutuları geometrik kesişimi 0 (≈ 500.000 karşılaştırma); yazılan metin tam (9/29 karakter, 20/4 karakter), odak alanda kalıyor; gönder düğmesi etkin ve örtülmüyor |
| 3e | Lighthouse mobil, ana sayfa, 5 koşu medyan (12.6.1, simüle yavaşlatma) | GEÇTİ | Yazı tipleri ve EPİAŞ engelli (belirlenimci): RC skor 98, FCP 1701, LCP 2227, TBT 0, CLS 0 ↔ bahar çıkarılmış RC 97 / 1703 / 2361 / 0 / 0 ↔ main 99 / 1688 / 1688 / 0 / 0. Bahar maliyeti: ağırlık +6 KB (282 ↔ 276), JS açılışı +16 ms; LCP'de anlamlı fark yok. Yazı tipleri açık koşuda LCP iki tepeli (≈2,0 / ≈4,0 sn, Google Fonts gecikmesi), açık/kapalı dağılımları örtüşüyor. RC ↔ main LCP farkı (+0,5 sn) kapak görselinden; sayfa düzeyi SEO ajanında |
| 3f | Hareket azaltma yolu | GEÇTİ | Chromium, Firefox, WebKit: kelebek 0, yaprak 0, 5 çiçek, yalnız `opacity`, ≈6 sn'de 0 öğe. Gerçek Safari (sistem tercihi açık): şerit durur, düğme gizli, 110 öğe (kelebeksiz) |
| 3g | Bellek / DOM temizliği | GEÇTİ | DOM 1095 → 1095 öğe; etki sonrası süs öğesi 0, katman 0; çalışan animasyon sayısı kapalı varyantla aynı (16 = kalıcı yeşil görünüm). GC sonrası yığın: ilk gösterimde +930 KB ↔ kapalı +870 KB; 6 ek tam gösterimde toplam +190 KB (≈32 KB/gösterim), DOM ve animasyon artığı yok — sızıntı işareti değil |
| 4a | Yatay taşma 320–1440 px | GEÇTİ (81e4688) | 26 sayfa + 404 × 9 genişlik (320, 360, 375, 390, 414, 768, 1024, 1280, 1440): 0 taşma. Safari 373/1263, Mobile Safari 402, WebKit 393, Firefox 390/1280: 0 |
| 4b | Atla bağlantısı, alt bilgi | GEÇTİ | 25 sayfada ilk Tab "İçeriğe atla", Enter odağı `#icerik`e taşıyor; 26 sayfada alt bilgi "Kuruluş 2011 · EPİAŞ Piyasa Katılımcısı". 404: QA-YT-4 (main ile aynı) |
| 4c | Odak sırası | GEÇTİ | 26 sayfada 40 Tab: gizli öğeye odak 0. Ana sayfada 3 "geri" adım iki sütunlu düzenden (kapak düğmesi → PTF kartı, KVKK bağlantısı, iletişim sütunu); belge sırası doğru |
| 4d | Mobil menü | GEÇTİ | 25 sayfa @390 (Chromium) + 6 sayfa × 4 motor: açılır, `aria-expanded`, ≥ 6 bağlantı görünür, Esc/ikinci dokunuş kapatır, taşma 0 |
| 4e | Kontrast ve WCAG A/AA (axe-core) | GEÇTİ* | 26 sayfa × 2 genişlik = 52 tarama: renk kontrastı ihlali **0**. Tek ihlal: QA-YT-3 (main'de de var) |
| 4f | JS kapalı okunabilirlik | GEÇTİ | 26 sayfa @390: h1 görünür, metin var, saydam kalan içerik 0, taşma 0 |
| 4g | `?kaynak=` etiketleri | GEÇTİ | 26 sayfada RC'deki etiket kümesi main'le birebir aynı |
| 4h | Teklif formu ↔ main | GEÇTİ | Form işaretlemesi, dosya seçici sarmalayıcısı çıkarılınca **bayt bayt aynı** (31.219 B); form betiği (6. bölüm) aynı (yalnız bir boş satır) |
| 4i | Dosya seçici | GEÇTİ | 22/22 (1280 ve 390): "Dosya Seç" etiketi seçiciyi açar (çoklu), 1 dosya → adı, 2 → "2 dosya seçildi", EN "2 files selected" / "Choose Files", temizlenince "Dosya seçilmedi", Tab ile odak halkası (2 px), Space açar; 4 dosya / 8 MB üstü / .txt doğru iletiler ve istek yok. Ayrıca test2 F6 (6 test) geçti |
| 4j | Hesaplayıcı (bağımsız yeniden hesap) | GEÇTİ | Betik main'le aynı. 2.450,80 TL / 520 kWh = 4,7131 → "4,71 TL/kWh" (5 motor), 2. araca aktarım, 10 satırlık tablo |
| 4k | Önizleme başlıkları | GEÇTİ | 25 sayfa 200 + `X-Robots-Tag: noindex` + künye; 404 → 404; `/docs`, `/CLAUDE.md`, `/lib`, `/tools`, `/.github` → 302; `/img/*.webp` 200 `image/webp` |
| 5 | Dürüstlük merdiveni (ana sayfa, `/canli-ptf`) | GEÇTİ | test2 E1–E8 (43 test: canlı, bugünkü önbellek "SON SENKRON ss:dd", dünkü önbellek 24 × "—", veri yok "—" + "EPİAŞ VERİSİ BEKLENİYOR", eksik saat "—", hiçbir yerde 0,00 yok); test-ssr-ptf 72, hidrasyon 25. Gerçek tarayıcılarda: önizlemede bekleme hâli 24 × "—", 0 sıfır; canlı veriyle 24 sayı, 0 sıfır; `/canli-ptf` 48 hücre, 0 sıfır, "CANLI" ve "SON SENKRON" hâlleri görüldü |
| 6 | Masaüstü CLS (81e4688) | **KALDI** | QA-YT-1 |

\* Kalan maddeler yayın adayının kodundan değil, ortamdan ya da main'den gelir.

## Bulgular

### QA-YT-1 — Masaüstü CLS ölçütü tutmuyor (YÜKSEK, engelleyici)

**Ölçüm** (GitHub Actions ubuntu, Chromium 1440×900, soğuk önbellek, her koşu yeni bağlam; web-vitals oturum penceresi;
ayrıca Lighthouse 12.6.1 `--preset=desktop`):

| Sayfa | Ölçüm | Önizleme 81e4688 | Üretim | Ölçüt |
|---|---|---|---|---|
| `/rehber/tekstil-elektrik` | Playwright, 7 koşu | medyan **0,0311**, en çok 0,0311 (7/7 aynı) | 0,0105 / 0,0110 | KALDI |
| `/rehber/tekstil-elektrik` | Lighthouse, 7 koşu | medyan **0,0483**, en çok **0,1227** (3 koşu > 0,1) | 0,0095 / 0,0129 | KALDI |
| `/rehber` | Playwright, 7 koşu | medyan 0,0007, en çok 0,0007 | 0,0169 / 0,0203 | geçti |
| `/rehber` | Lighthouse, 7 koşu | medyan **0,0256**, en çok 0,0256 | 0,0190 / 0,0190 | KALDI |

25 alt sayfanın tamamı, 3 koşu (Playwright): ölçütü aşan RC sayfaları `demir-celik`, `kimya`, `osb`, `soguk-zincir`
(hepsi 0,031), `elektrik-tedarikcisi-nasil-secilir` 0,024, `sktt` 0,089 (üretim 0,056), `cerez-politikasi` 0,060 (üretim
medyan 0,002, en çok 0,068). Öteki 16 sayfa ≤ 0,005 ve çoğu üretimden iyi.

**Kök neden** (yerelde `layout-shift` kaynakları ve yedek/web yazı tipiyle ölçülen kutu farkları):
1. Sayfa başlığı (`.sayfa-bas h1`, Newsreader 500, 50 px, `text-wrap: balance`) için ölçüleri eşitlenmiş yedek yok.
   Newsreader, Times New Roman / Liberation Serif'ten **%8,75 geniş** (6 başlıkta ölçüldü, aralık 1,079–1,097). Web yazı
   tipi gelince başlık bir satır daha alıyor, `.sayfa-govde` ve `.updated` 55 px aşağı kayıyor (sektör rehberlerindeki
   sabit 0,031).
2. 'Archivo Fallback' yalnız normal ağırlık için tanımlı; 600 ağırlıklı metin (kart başlıkları) Arial'ın sentetik
   kalınıyla çiziliyor ve gerçek Archivo 600'den **%3 dar** (91 öğe). `/rehber`'de "SKTT'den nasıl çıkılır" kartı yedekte
   1, web yazı tipinde 2 satır → kartlar 29 px kayıyor. 400 ağırlıkta da yedek %1,4 geniş (171 öğe, medyan oran 0,986).
3. (Var olan, main'de de) `cerez-politikasi`: IBM Plex Mono `<code>` öğeleri yedekte farklı kırılıyor; main'de de aynı
   (yerel: main 0,077 ↔ RC 0,061). Bu madde engelleyici değildir.

**Asgari düzeltme** (25 alt sayfanın kabuk CSS'i, üretici `sayfalar/kur-sayfalar.py`), yerelde aynı 25 sayfaya uygulanıp
ölçüldü:

```css
@font-face{font-family:'Newsreader Fallback';src:local('Times New Roman'),local('Liberation Serif'),local('Tinos');size-adjust:108.7%;ascent-override:85%;descent-override:22%;line-gap-override:0%}
@font-face{font-family:'Archivo Fallback';font-weight:100 549;src:local('Arial'),local('ArialMT'),local('Liberation Sans'),local('Helvetica');size-adjust:98.3%;ascent-override:89.4%;descent-override:21.4%;line-gap-override:0%}
@font-face{font-family:'Archivo Fallback';font-weight:550 900;src:local('Arial Bold'),local('Arial-BoldMT'),local('Liberation Sans Bold'),local('Helvetica Bold');size-adjust:95.3%;ascent-override:92.2%;descent-override:22.1%;line-gap-override:0%}
--serif:'Newsreader','Newsreader Fallback',Georgia,serif
```

Yerel sonuç (Chromium 1440×900, 7 koşu, medyan / en çok): `/rehber` **0,0002 / 0,0002** (RC 0,0231 / 0,0423),
`/rehber/tekstil-elektrik` **0,0004 / 0,0004** (RC 0,0319 / 0,0376), `kimya` 0,0004 (RC 0,0299), `kurumsal` 0,0009,
`sktt` 0,0004, `sanayi-elektrik-tedariki` 0,0002. `size-adjust` değerleri tarayıcıda ölçülen genişlik oranlarından
(Liberation, Arial/Times ile ölçü uyumludur); `ascent/descent-override` değerleri yazı tipi dosyasından türetilmedi —
satır yüksekliği sabit olduğu için kaymaya etkileri ölçülemeyecek kadar küçük (başlıkta 3–4 px dikey, skor 0,0001),
uygulayan ajan isterse yazı tipi ölçülerinden kesinleştirir.

**Yeniden doğrulama:** yeni önizlemede aynı 7 koşu (Playwright + Lighthouse) iki sayfada, 3 koşu 25 sayfada; macOS
Safari'de ve 320–1440'ta alt sayfa görsel/taşma denetimi.

### QA-YT-2 — Bahar anı kutucuk etkileşimine ≈ 40–50 ms ekliyor (DÜŞÜK, engellemez)

**Yeniden üretim:** Chromium, iPhone sınıfı 390×844 @3, 4× CPU, yavaş 4G; forma in, yeşil kutucuğa dokun, hemen iki alana
yaz. Aynı etkileşim bahar betiği çıkarılmış kopyada (CSS + JS ≈ 17,6 KB ham / 6,4 KB gzip çıkarıldı).

| 5 koşu medyanı | Bahar açık | Bahar kapalı |
|---|---|---|
| INP (pencere içi en kötü etkileşim) | 184 ms (en çok 208) | 136 ms (en çok 152) |
| Kutucuğa dokunuş | 176 ms | 136 ms |
| Etki sürerken tuş (en çok) | 208 ms | 88 ms |
| Uzun görev | 1 (92 ms; en uzun 136) | 0 (en uzun 64) |

INP medyanı "iyi" eşiğinin (200 ms) altında, en kötü koşu 8 ms üstünde; yalnız yeşil seçeneği işaretleyen ziyaretçide,
bir kez. CPU profili: başlangıç maliyetinin büyük kısmı `basla()` içindeki ilk `getBoundingClientRect` çağrısının
zorladığı stil/yerleşim (yeşil sınıfın getirdiği değişikliklerle birlikte; profil ortalaması 39 ms @4×), WAAPI
`animate` 8 ms, öğe üretimi ≈ 10 ms. Gerçek Safari, Mobile Safari (simülatör) ve Firefox'ta kare ölçümleri koşucu
ortamının gürültüsünden ayrıştırılamadı (simülatörde bahar kapalı koşularda da 287–1769 ms'lik kareler var).

**Öneri (isteğe bağlı):** başlangıcı bir boyamadan sonraya almak (`requestAnimationFrame` + `setTimeout(basla, 0)`)
yerelde denendi: dokunuş 176 → 112 ms, ama uzun görev bir sonraki tuşa kaydığı için INP medyanı değişmedi (184 ms).
Kalıcı kazanç için kelebek yolu kare sayısını azaltmak (40 ms yerine ≈ 100 ms + `easing`) ve SVG dizgisini bir kez
üretip klonlamak önerilir; uygulanırsa test2 F8 testleri (anında öğe sayımı) buna göre güncellenmeli.

### QA-YT-3 — `/rehber/15-dakikalik-uzlastirma` kaydırılabilir tablo klavyeyle odaklanamıyor (BİLGİ, main'de de var)

axe `scrollable-region-focusable` (serious), yalnız 390 px'te `.tbl` (600 px içerik, 351 px kap). Main'de aynı (342 px kap).
Asgari düzeltme: `.tbl` kabına `tabindex="0" role="region" aria-label="…"` (TR/EN). Bu yayında yeni değil.

### QA-YT-4 — 404 sayfasında ilk Tab oyun açılış katmanına gidiyor (BİLGİ, main'de de var)

JS açıkken ilk Tab "voltage.com.tr · Rehber · Canlı PTF" giriş bağlantılarına gidiyor, "İçeriğe atla" ilk durak değil.
Main'de birebir aynı. Atla bağlantısı ve `#icerik` sayfada var.

### QA-YT-5 — Önizleme adreslerinde canlı PTF gelmez (BİLGİ, beklenen; sahibin cihaz denetimi için önemli)

`epias-proxy` CORS yanıtı yalnız `https://voltage.com.tr`'ye izin veriyor (`*.pages.dev` için de `access-control-allow-origin:
https://voltage.com.tr`). Önizlemede ana sayfa kartı "—" + "EPİAŞ VERİSİ BEKLENİYOR" gösterir, şerit gizli kalır; bu
dürüst bekleme hâlidir, hata değildir. **Sahip fiziksel iPhone'da önizlemeye baktığında şeridi ve canlı kartı görmez.**
Canlı hâl bu turda iki yolla doğrulandı: aynı kökenden aktarıcı (Safari, Mobile Safari) ve yalnız CORS başlığı eklenmiş
gerçek EPİAŞ yanıtı (WebKit); kodu main'le aynı (`fetchPtfLive` aynı, şerit yalnız fark gösterimi değişti: fark 0 iken
"▲ 0" yazılmıyor, fark tr-TR biçiminde).

### QA-YT-6 — pages.dev'de Cloudflare RUM beacon'ı WebKit'te CORS hatası veriyor (BİLGİ, ortam)

`…/cdn-cgi/rum due to access control checks` — Cloudflare'in kendi eklediği Web Analytics betiği; RC'nin değişikliğiyle
ilgisi yok (üretim HTML'ine de Cloudflare belirteçli beacon ekliyor).

### QA-YT-7 — test2 D11 ve M1 yük altında zamanlamaya duyarlı (BİLGİ, test)

D11 (70 Tab'da odak görünürlüğü) ve M1 (1440 px piksel karşılaştırması) eşzamanlı ağır ölçümler sırasında birer kez kaldı,
öteki koşuda geçti; RC tek başına 377/377, hazırlık sayfası 377/377. Paketin başka yük yokken koşulması önerilir.

### QA-YT-8 — Şeritte eksik saatten sonraki fark bir önceki mevcut saate göre (BİLGİ, main'de de var)

Bir saat eksikse sonraki saatin oku/farkı iki saat öncesine göre hesaplanıyor ve saatlik değişim gibi okunuyor. Sıfır ya da
uydurma değer yok; bu yayında yeni değil. İleride: önceki saat eksikse fark yazılmasın.

## Yöntem ve ortam

- Paketler: RC'nin `git archive` kopyasında (repo köküne bir şey yazılmadı), Playwright Chromium (CI'da Playwright 1.64.1), axe-core
  (`as-axe`), wrangler pages dev (RC, main, bahar çıkarılmış RC, ertelenmiş başlangıçlı RC, aday yazı tipi düzeltmesi
  ayrı portlarda).
- Gerçek tarayıcılar: geçici iş akışı `.github/workflows/gecici-qa-yayin.yml` (5 koşu; `permissions: {}`, kendi dosyasına
  yol filtreli; günlükte yalnız denetim adları ve sayılar; form gönderilmedi). Son koşu `46012753399`. İş akışı `f6bca19`
  ile silindi. Ekran görüntüleri 1 günlük artefaktta (herkese açık sayfalar, kişisel veri yok); bu oturumdan
  indirilemediği için yalnız OCR doğru/yanlış özeti kullanıldı.
- Aktarıcı (yalnız ölçüm için): önizlemeyi 127.0.0.1'den sunar, EPİAŞ çağrısını aynı kökenden aktarır, ilk betik olarak
  hata yakalayıcı ve ölçüm modülü ekler; CSP başlığı bu yolda aktarılmaz. Doğrudan önizleme koşuları gerçek başlıklarla
  yapıldı.
- Sınırlar: fiziksel iPhone yok (simülatör); macOS koşucusunda varsayılan "hareket azaltma" açık (bir koşu kapatılarak
  tekrarlandı); Firefox'ta canlı veri hâli görülemedi; Lighthouse yerel ve CI'da simüle yavaşlatmayla, alan verisi değil.

## Yeniden doğrulama — RC 4bf70d5 (27.11.2026, akşam)

**Aday:** `claude/yayin-yeni-tasarim` 4bf70d5, önizleme `https://4a382727.website-dh5.pages.dev`. 81e4688'e göre fark
bağımsız olarak denetlendi (`git diff 81e4688 4bf70d5`): 25 alt sayfanın her birinde yalnız QA-YT-1'deki üç `@font-face`
ve `--serif` satırı (QA'nın önerdiği değerlerle birebir; başka satır değişmedi); `index.html`'de yalnız bahar anının
`change` işleyicisi (başlangıç `requestAnimationFrame` + `setTimeout 0` ile bir sonraki kareye, kutucuk kaldırılınca
bekleyen başlangıç iptal). Görsel, başlık, içerik, sitemap değişmedi.

### Karar: PASS (4bf70d5)

Engelleyici bulgu kalmadı. Kabul ölçütleri iki ölçüm aracıyla da tutuyor. Bahar anının etkileşim maliyeti artık
ölçülemiyor. Gerçek Safari ve Mobile Safari'de (simülatör) etki görünüyor ve temizleniyor. Açık kalanlar düşük ya da
bilgi düzeyinde, aşağıda.

| # | Denetim | Sonuç | Kanıt |
|---|---|---|---|
| R1 | Masaüstü CLS `/rehber`, 7 koşu (CI, ubuntu, Chromium 1440×900, soğuk önbellek) | GEÇTİ | Playwright medyan **0,0004**, en çok 0,0005 (üretim 0,0169 / 0,0208). Lighthouse 12.6.1 masaüstü medyan **0,0002**, en çok 0,0003 (üretim 0,0190 / 0,0190); skor 98, LCP 954 ms |
| R1 | Masaüstü CLS `/rehber/tekstil-elektrik`, 7 koşu | GEÇTİ | Playwright medyan **0,0009**, en çok 0,0011 (üretim 0,0105 / 0,0110). Lighthouse medyan **0,0105**, en çok 0,0105 (üretim 0,0129 / 0,0129); 81e4688'de 0,048 / 0,123 idi |
| R2 | Masaüstü CLS, 25 alt sayfa + ana sayfa, 3 koşu (Playwright, CI) | GEÇTİ* | 22 alt sayfa ≤ 0,0025 (81e4688'de 0,024–0,031 olan demir-celik, kimya, osb, soguk-zincir, elektrik-tedarikcisi-nasil-secilir: 0,0004–0,0013); 20 sayfa üretimden iyi. Ölçüt üstünde ikisi kaldı: `rehber/sktt` 0,045 (üretim 0,073, üretimden iyi) ve `cerez-politikasi` 0,060 (üretim CI'da 0,002; yerelde üretim 0,077 ↔ RC 0,054) — QA-YT-9. Ana sayfa 0,003 |
| R2 | Yerel karşılaştırma (Chromium, 7 koşu) | GEÇTİ | RC ↔ main: `/rehber` 0,0002 ↔ 0,0130; tekstil 0,0004 ↔ 0,0391; kimya 0,0004 ↔ 0,0186; sktt 0,0004 ↔ 0,0060; elektrik-tedarikcisi 0,0005 ↔ 0,0393; cerez-politikasi 0,054 ↔ 0,077 |
| R3 | Alt sayfa taşma, menü, odak, kontrast, JS kapalı (26 sayfa + 404, 320/360/375/390/414/768/1024/1280/1440) | GEÇTİ | 230/235; 9 genişlikte taşma **0**, axe renk kontrastı ihlali **0** (52 tarama). Kalan 5 madde ilk turdakilerle birebir aynı ve main'de de var (QA-YT-3 tablo kabı, QA-YT-4 404 oyun katmanı ×3, ana sayfa iki sütun odak sırası) |
| R3 | Gerçek Safari 27.2 (macOS, hareket azaltma kapatılarak), aktarıcı üzerinden canlı veriyle | GEÇTİ | **45/45**: 1263 ve 373 px taşma 0, canlı kart (24 sayı, 0 sıfır), şerit 2 sn'de 80 / 71 px akıyor, menü, bahar anı 0 / 26 ms'de başladı (149 / 133 öğe), örtülme 0, kesişim 0, kayma 0, ≈5,8 sn sonra 0 öğe, rehber/sktt, canli-ptf (48 hücre, CANLI), hesaplayıcı 4,71, kurumsal, 404. Önizlemeye doğrudan ikinci Safari oturumu açılamadı ("Server terminated early", koşucu sorunu); doğrudan önizleme 81e4688'de 43/43 geçmişti ve alt sayfaların farkı yalnız yazı tipi satırları |
| R3 | Firefox 157 / WebKit (iPhone 15 öykünmesi) | GEÇTİ | Firefox **45/45**; WebKit 25/26 (tek kalan yine Cloudflare RUM beacon'ı, QA-YT-6); WebKit'te canlı kart ve şerit (71 px) gerçek EPİAŞ yanıtıyla |
| R4 | Bahar anı INP (Chromium, 390×844 @3, 4× CPU, yavaş 4G, 5 koşu; 3a ile aynı betik ve koşullar) | GEÇTİ | **Açık: INP medyan 144 ms, en çok 168** ↔ bahar çıkarılmış kopya 160 / 176. Kutucuğa dokunuş 96 ↔ 128 ms; etki sürerken tuş medyan 80, en çok 104 ↔ 104 / 112 ms; uzun görev medyanı 0 (en uzun 55 ms) ↔ 1 (95). Önceki RC: 184 / 208 ↔ 136 / 152. Fark artık ölçüm gürültüsü içinde (aynı kapalı kopya iki turda 136 ve 160 ölçüldü); 200 ms eşiğinin altında |
| R4 | CLS, temizlik, bellek | GEÇTİ | Etki CLS'si 5/5 koşuda 0; DOM 1095 → 1095; etki sonrası süs öğesi 0; 6 ek tam gösterimden sonra DOM ve animasyon artığı yok (yığın +190 KB, ilk turla aynı). Hareket azaltma: INP 128 ms, uzun görev 0, süs artığı 0 |
| R4 | Etki görünüyor mu (gecikmeli başlangıç) | GEÇTİ | Kutucuktan `.bh-kat`a süre: Firefox 30–37 ms, gerçek Safari 0–26 ms, WebKit (CI, yazılım çizimi) 650 ms. Mobile Safari simülatöründe 4 açık koşunun 4'ünde etki göründü (133 öğe, tek katman) ve temizlendi (0 öğe); başlama süresi 137–771 ms — simülatör VM'i yavaş (bahar kapalıyken de 303–541 ms'lik kareler) |
| R4 | Mobile Safari (iPhone 17, iOS 26.5, simülatör) diğer | GEÇTİ | 12 sayfa içi rapor: taşma 0, JS hatası 0, menü, canlı kart, şerit 71 px, canli-ptf 48 hücre 0 sıfır, hesaplayıcı 4,71; 7 OCR'da hata sayfası yok |

\* Ölçüt üstündeki iki sayfa bu yayının kabul ölçütüne bağlı değildir; biri üretimden iyi, öteki QA-YT-9.

**Bu turda safaridriver iOS simülatörüne ilk kez bağlandı**, ama WebDriver dokunuşları ve tuşları simülatörde sayfaya
ulaşmadı (menü düğmesi, kutucuk, metin alanı, hesaplayıcı: 15/25; metin alanına yazılan karakter de 0). Metin alanına
yazmak sitenin koduna bağlı olmadığı için bu bir otomasyon sınırıdır; aynı işlemler sayfa içi senaryoyla (programatik
`click()` ve girdi olayları) geçti. Gerçek parmak dokunuşu bu ortamda doğrulanamadı; **sahibin fiziksel iPhone denetimi
bu açığı kapatan tek adımdır** (önizlemede canlı PTF görünmez: QA-YT-5).

### Yeni bulgu

**QA-YT-9 — `cerez-politikasi` masaüstü CLS 0,05–0,06 (DÜŞÜK, engellemez).** Kaynak: liste içindeki IBM Plex Mono
`<code>` öğeleri (`voltage-404-progress` vb.) yedek yazı tipinde farklı satır yüksekliği (18 ↔ 20 px) ve bir öğede farklı
kırılma (47 ↔ 20 px). Main'deki `code` ailesi `monospace` olduğu için CI'da üretim bu sayfada düşük çıkıyor; yerel
ölçümde main 0,077, RC 0,054. Değer "iyi" eşiğinin (0,1) altında, tek yasal metin sayfası. İzleyen işte: `code` için
ölçüsü eşitlenmiş yedek (Plex Mono ile Liberation Mono genişliği zaten eşit, 1,000; satır yüksekliği için
`ascent/descent-override`) ya da bu listede `white-space: nowrap`.

### Kapanan bulgular

- QA-YT-1 (masaüstü CLS): **kapandı** — R1/R2.
- QA-YT-2 (bahar anı etkileşim maliyeti): **kapandı** — R4.
- QA-YT-3, -4, -6, -8 açık kalıyor (main'de de var ya da ortamdan); QA-YT-5 sahibe bilgi; QA-YT-7 test2 F8 güncellendi,
  hazırlık 380/380, RC 380/380 (yayın mühendisi; bu tur QA'nın kendi koşusu değil).

### Yöntem (bu tur)

Geçici iş akışı `.github/workflows/gecici-qa-yayin.yml` yalnız bu tur için eklendi (`8935659`; koşu `46025703045`;
günlükte yalnız sayılar), `35d6f3b` ile silindi. Yerel ölçümler RC 4bf70d5'in `git archive` kopyasında, bahar
betiği ve CSS'i çıkarılmış ikinci bir kopyada ve main'de, wrangler pages dev ile. Ölçüm betikleri oturum scratchpad'inde
(repoya girmedi). `gercek.mjs` ve iOS sayfa içi senaryosu gecikmeli başlangıca göre güncellendi: kutucuktan sonra en çok
500 ms beklenir, süre ayrıca kaydedilir.
