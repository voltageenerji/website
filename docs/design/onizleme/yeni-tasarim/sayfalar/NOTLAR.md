# Alt sayfalar yeni tasarım sisteminde — 1. aşama (ortak kabuk + dört örnek sayfa)

**Durum:** hazırlık, yayında değil. Canlı sayfa dosyalarına, `functions/`, `_headers`, `_redirects`, `sitemap.xml`, dondurulmuş rehberlere ve `main`'e dokunulmadı. `/docs/*` sitede sunulmaz. Sahip önizlemeyi görüp onaylayınca kalan sayfalara geçilir; yayın, yeni ana sayfayla birlikte (10 Aralık SEO ölçümünden sonra) QA ve Hukuk kararıyla yapılır.

Örnek sayfalar: `rehber/tekstil-elektrik.html` (rehber), `canli-ptf.html` (sunucu render'lı veri sayfası), `kurumsal.html`, `dengesizlik-maliyeti.html` (sunucu render'lı araç: dönem tablosu, ≤ 640 px dört sütunlu tablo, hesaplayıcı, indirmeler, SSS).

## Dosyalar

| Dosya | Ne |
|---|---|
| `kur-sayfalar.py` | Üretici. Canlı sayfaları **okur** (yazmaz), `cikti/<aynı göreli yol>` üretir. Her kayma noktasında `count == 1` doğrulaması vardır; canlı sayfa ya da ana sayfa kaynağı değişip yapı tutmazsa durur. |
| `kabuk.css` | Alt sayfa kabuğu ve ortak içerik dizgisi (sayfa başı, gövde, başlıklar, listeler, bağlantılar, teklif kutusu, not, alıntı, "bu sayfa hakkında", hareket azaltma). |
| `stil/veri-bandi.css` | Piyasa veri bandı (`.live`), canli-ptf ve dengesizlik ortak. |
| `stil/canli-ptf.css`, `stil/kurumsal.css`, `stil/dengesizlik-maliyeti.css` | Sayfaya özgü stil (seçiciler canlıdakiyle aynı, yalnız yeni belirteçlerle yeniden yazıldı). |
| `cikti/…` | Üretilen dört sayfa. |
| `karsilastir.mjs` | Önce/sonra karşılaştırması → `sonuclar/karsilastirma.txt`. |
| `testleri-kos.sh` | Mevcut QA paketlerini, üretilen sayfalar konmuş geçici depo kopyasında koşar → `sonuclar/test-sonucu.txt`. |
| `denetle.mjs` | Taşma, karşıtlık, odak, JS kapalı, hareket azaltma, mobil menü, üst bant eşliği + önce/sonra ekran görüntüleri → `sonuclar/denetim.txt`. |

Yeniden üretim: `python3 kur-sayfalar.py`, sonra (depo dışındaki bir dizinden) `KOPYA=<geçici> AXE_MODUL=<axe-core node_modules> bash testleri-kos.sh`, `node karsilastir.mjs`, `ONCE=<HEAD kopyası> SONRA=<KOPYA> GORUNTU=<dizin> node denetle.mjs`.

## Neyin nereden geldiği

- **`<head>`:** canlı sayfadan bayt bayt; tek fark `<style>` bloğu (title, description, canonical, alternate bağlantıları, robots, OG, Twitter, JSON-LD, dengesizlikteki `dm-js` satır içi betiği aynen).
- **İçerik:** canlı `<div class="page">` içi, eski alt satır (`<footer>`) hariç, bayt bayt aynı: içerik izi, H1, güncelleme satırı, metinler, tablolar, formlar, SSS, "Bu sayfa hakkında". Yalnız sarmalayıcılar değişti. Dengesizlik sayfasının kendi `<main>`/`</main>` satırları kabuğun yalın `<main>` öğesine taşındı (aynı yer: H1'den "Bu sayfa hakkında"ya).
- **Sayfa betikleri:** bayt bayt, aynı sırada ve aynı yerde (alt bilginin ardında). Eklenen tek betik ana sayfanın mobil menü betiği (canlı `index.html`'den bayt bayt).
- **Kabuk işaretlemesi:** yeni ana sayfanın gövdesinden (`../yapi/govde.html`) okunup dönüştürülür; elle yazılmış menü/alt bilgi yok. Ana sayfa menüsü değişirse yeniden üretim alt sayfalara da taşır.
- **Kabuk stili:** yeni ana sayfa stilinden (`../yapi/stil.css`) seçiciye göre süzülür (üst bant, mobil menü, düğme, alt bilgi, belirteçler, sıfırlama; bildirimler aynen), ardından `kabuk.css`, ardından sayfa stili.

## Kabuk kararları

1. **Üst bant** = ana sayfanın kaydırılmış hâli: koyu zemin, 68 px (1039 px ve altında 64 px), aynı logo hizası, aynı menü etiketleri, sarı "Teklif Al" (denetim: `sonuclar/denetim.txt`, "Üst bant" bölümü; 1440 ve 390 px'te yükseklik, zemin, düğme rengi, logo konumu, etiketler eşit).
   - **Yapışkan değil, sayfa akışında.** Ana sayfada bant sabittir (kapak fotoğrafının üstünde durur); alt sayfalarda uzun okuma ve veri sayfaları vardır. Sabit bant (a) dengesizlik tablosunun yapışkan başlık satırıyla çakışıyordu (başlık satırı bandın altına giriyordu), (b) klavye odağını örtme riski taşıyordu (WCAG 2.4.11), (c) telefonda ilk ekranda tabloya yer bırakmıyordu. Menü açıkken bant ekrana sabitlenir.
   - **Yumuşak kaydırma kapalı** (`scroll-behavior: auto`). Ana sayfadan gelen `smooth`, Tab ile gezerken odaklanan öğenin geç görünmesine yol açıyordu (erişilebilirlik testi E2 bunu yakaladı).
   - **Dil seçici yok.** Alt sayfaların hiçbirinde İngilizce içerik yok (31 sayfanın hiçbirinde `data-tr` yok). Yalnız menüyü çeviren bir düğme yanıltıcı olurdu. Kabuk metinleri ana sayfanın Türkçe metinleridir; `data-tr/data-en` öznitelikleri kaldırıldı (üretici, görünen metnin `data-tr` ile aynı olduğunu doğrular). Alt sayfaların İngilizcesi ayrı bir içerik işidir.
   - **Logo:** yalnız satır içi çizim (ana sayfadaki `<img src="/voltage-enerji-logo.svg">` alt sayfaya alınmadı: ek istek olmasın; dengesizlik testi sayfada `<img>` istemez). Görünüm aynı.
   - **"Teklif Al":** sayfanın kendi teklif düğmeleriyle aynı adres ve kaynak etiketi (`/?kaynak=rehber-tekstil-elektrik#leadForm`, `kaynak=canli-ptf`, `kaynak=kurumsal`); yeni kaynak etiketi yok. **Dengesizlik sayfasında üst bantta teklif düğmesi yok** (sayfada ticari düğme yok kararı; test "teklif al" ifadesini yasaklar).
   - Bölüm bağlantıları `/#hakkimizda`, `/#hizmetler`, `/#yaklasim`, `/#iletisim` (dört çapa canlı ve yeni ana sayfada var; üretici denetler). Geçerli sayfa: Canlı PTF'de menüde `aria-current="page"`, rehberde "Rehber"de `aria-current="true"`, kurumsalda alt bilgideki "Kurumsal"da `aria-current="page"`. Dengesizlik menüde yok.
   - Betik kapalıyken mobil menü düğmesi gizlenir (`@media (scripting: none)`); gezinme alt bilgide.
2. **Yapı:** atlama bağlantısı → üst bant → mobil menü → koyu içerik izi şeridi (`<main>` dışında) → `<main>` [koyu sayfa başı: H1 + güncelleme satırı / giriş paragrafı (`id="icerik"`, atlama hedefi) → beyaz gövde] → `<footer>`. İçerik izi ile sayfa başı tek koyu yüzey gibi görünür. `<main>` ve `<footer>` yalın etiket; alt bilginin görünüm sınıfı içteki kapta (`<footer><div class="footer on-dark">`), çünkü dengesizlik testi R6 D-A2 yalın etiketleri arar.
3. **Dizgi:** serif yalnız H1'de (ana sayfadaki kapak başlığıyla aynı aile ve ağırlık). H2/H3 Archivo 600 (ana sayfa bölüm başlıkları gibi). Monospace yalnız piyasa verisinde (PTF/SMF hücreleri, durum ve damga, saat eksenleri) ve teknik kimliklerde (lisans, sicil, marka tescil no, formül, `code`). Eski sayfalardaki monospace büyük harf etiketler (içerik izi, güncelleme satırı, tablo başlıkları, kimlik tablosu etiketleri, araç etiketleri) düz yazıya döndü. Gövde 17 px / 1,7 (telefonda 16,5 px).
4. **Zemin ritmi:** koyu üst bant + koyu sayfa başı → beyaz gövde → krem vurgu (teklif kutusu, araç çubukları, hesaplayıcı) → koyu alt bilgi. Teklif kutusu ana sayfadaki ana hizmet bandının dili (krem, üstte 2 px koyu çizgi, sarı düğme). Kart gölgesi, ızgara deseni, yuvarlak kart yok.
5. **Sütun:** sola hizalı (ana sayfa ızgarasının sol kenarı); en çok 760 px (rehber), 860 px (kurumsal), 880 px (canlı PTF), 1080 px (dengesizlik; metin satırları yine en çok 44 em). Geniş ekranda sağda boşluk kalır (bilinçli: okuma ölçüsü).
6. **Renk:** ana sayfa belirteçleri (`--ink`, `--paper`, `--night`, `--cta #F5B41C`, `--green-bright` …). Veri bandı ana sayfadaki PTF kartının yüzeyi (#0B1226) ve grafik renkleri (yeşil çizgi). İçinde bulunulan saat/dönem: ana sayfadaki saatlik tablonun sarı zemini (#FBEFC9). **Bilinçli korunan iki eski renk:** dengesizlik tablosunda maliyet sütunlarının zemini #F3EBD3 ve başlığı #E9DEBF (`test-dengesizlik-tarayici.mjs` R9 bu değerleri bekler; palete uyuyor).

### Stil: satır içi mi, ayrı dosya mı? → **satır içi** (bu aşama)

- CSP `style-src 'self' 'unsafe-inline'` ikisine de izin verir. Ana sayfa da satır içidir.
- Alt sayfa trafiği çoğunlukla aramadan tek sayfa girişidir (GSC: rehberler, canlı PTF). Satır içi stil ek, işlemeyi engelleyen bir istek doğurmaz; ayrı dosya ilk girişte bir istek ekler ve önbellekten ancak ikinci sayfada yararlanılır. Kabuk stili sıkıştırılmış ≈ 14 KB (gzip ≈ 4,3 KB) — sayfa başına küçük bir maliyet.
- Önizleme dağıtımı, testlerin yerel sunucuları ve SSR fonksiyonları tek HTML dosyasıyla çalışır; `_headers` değişikliği gerekmez.
- Bedeli: kabuk stili her sayfada tekrar eder. Kabuk değişikliği tek kaynaktan (`kabuk.css` + ana sayfa stili) üreticiyle bütün sayfalara yayılır; elle değiştirilmez.
- **Ayrı dosyaya geçilirse (yayın kararı) plan:** `/assets/kabuk-<yyyymmdd>.css` (sürümlü ad), sayfalarda `<link rel="stylesheet" href="/assets/kabuk-….css">`; `_headers`'a `/assets/*` için `Cache-Control: public, max-age=31536000, immutable`; dosya adı değişince bütün sayfalar yeniden üretilir. `_headers` bu aşamada değiştirilmedi. Ek not: dengesizlik testlerinin birkaçı (`hareket azaltma + görünür odak`, R6 D-A1/D-M1, R9, R10) kuralları sayfa HTML'inde metin olarak arar; ayrı dosyada o kurallar sayfa stilinde kalmalı ya da testler güncellenmeli.
- Kabuk stili sıkıştırılır; sayfaya özgü stil okunur biçimde bırakıldı (yukarıdaki testler kuralları bu biçimde arar; tek sayfalık düzeltme elle yapılabilir).

## SSR çapaları ve dürüstlük merdiveni

- `functions/canli-ptf.js` ve `functions/dengesizlik-maliyeti.js` HTML'de birebir metin arar. Kabuk bu metinlere dokunmaz: içerik bölgesi bayt bayt aynıdır, `<body>` yalın kalır (iki fonksiyon da ilk `<body>`'yi değiştirir; ondan önce başka `<body>` metni yok), H1 tek satırda, `<tbody id="pTable">`, `<tbody id="dTablo">…</tbody>` aynen.
- Karşılaştırma iki şey yapar: (1) canli-ptf.js'deki 12 `swap` çapası ve dengesizlik `CAPA` nesnesindeki 40 çapanın her birinin yeni kabukta tam bir kez geçtiğini sayar; (2) iki fonksiyonu **eski ve yeni kabukla gerçekten çalıştırır** (canli: `inject()`; dengesizlik: `onRequestGet` + QA'nın sahte proxy'si; bugün 11/24 dönem, geçmiş gün, veri yok) ve üretilen içerik bölgesinin, baş bölümünün (stil hariç) ve `<body …>` özniteliklerinin bayt bayt aynı olduğunu doğrular.
- Betiklerin yazdığı sınıflar (`live-mode`/`live-stamp` + `stale`/`waiting`, `dm-js`, `satir-ac`, `simdi`, `detay`, `sonuc-kutu` …) stilde karşılanır. Merdiven aynı: canlı → sunucu render'ı → önbellek ("SON SENKRON") → dürüst bekleme; eksik saat/dönem "—". Telefon tablosunun kırılma noktası betikle aynı (640 px).

## Doğrulama (özet; ayrıntı `sonuclar/`)

- `karsilastirma.txt`: **hepsi geçti** — baş (stil hariç) bayt bayt, içerik bayt bayt, betikler bayt bayt, id/bağlantı/form denetimleri kayıpsız, kabuk metinlerinin hepsi yeni ana sayfada var, SSR çapaları ve SSR çıktıları eşit.
- `test-sonucu.txt` (Chromium): test-ssr-ptf 69/69 · test-dengesizlik **1099/1100** · test-dengesizlik-ssr-kanit 31/31 · test-dengesizlik-tarayici 286/286 · test-dengesizlik-erisilebilirlik 109/109 (axe-core 4.10.2) · test-ssr-hydration 25/25. Taban (canlı sayfalarla): 69, 1100, 31, 286, 109.
  - **Kalan 1 denetim:** `R6 D-A2: diger sayfalara dokunulmadi (canli-ptf main yok)` — dengesizlik işinin kapsam bekçisi ("canli-ptf.html'de `<main>` olmamalı"). Yeni kabuk her alt sayfaya bilerek tek `<main>` ekler (erişilebilirlik: ana içerik bölgesi). Davranış değil kapsam denetimi; bugün değiştirilirse canlı canli-ptf.html ile kırılır. **Test değiştirilmedi.** Yayın günü QA'ya öneri: bu satır "canli-ptf.html'de tek `<main>` var" olarak çevrilsin.
  - **Metin sabitleyen testler (değiştirilmedi, karşılandı):** `kabuk hareket azaltma + gorunur odak`, R6 D-A1, R6 D-M1, R9 (maliyet sütunu renkleri), R10 (dm-js, 44 px) ve R6 D-A2 (yalın `<main>`/`<footer>`) CSS'i ya da işaretlemeyi metin olarak arar. Kurallar korunan davranışla aynı anlamda ve aynı metinle yazıldı; bu yüzden sayfa stili sıkıştırılmadı ve alt bilgi iç kapla sarıldı.
  - Firefox ve WebKit koşulamadı (Playwright tarayıcıları bu ortama indirilemedi).
- `denetim.txt`: 4 sayfa (canli-ptf ve dengesizlik ikişer hâlde) × 320/390/768/1440: yatay taşma yok, karşıtlık ≥ 4,5:1 (SVG metinleri dahil), sayfa/konsol hatası yok; 390 ve 1440'ta Tab ile bütün duraklarda görünür odak, odaklanan öğe görünür ve örtülmüyor; mobil menü açılır/Esc ile kapanır; JS kapalıyken içerik okunur, taşma yok; hareket azaltmada geçiş 0 sn, animasyon yok; üst bant ana sayfayla eş. **Hepsi geçti.**
- Sayfa boyu artar (1440 px'te +8–18 %, 390 px'te +9–13 %): gövde yazısı 15,5 → 17 px, koyu sayfa başı ve tam alt bilgi. Ayrıntı `denetim.txt`.
- HTML boyu (gzip): tekstil 5,7 → 10,4 KB, canli-ptf ≈ 18,2 KB, kurumsal ≈ 10,9 KB, dengesizlik ≈ 31,1 KB.

## Hukuk için: yeni metin

- **Sayfa içeriğinde yeni metin yok** (bayt bayt karşılaştırma).
- Kabuk metinlerinin hepsi yeni ana sayfada var (karşılaştırma "T" satırı). Canlı ana sayfada **olmayan** iki tanesi, ana sayfa hazırlığının Hukuk bekleyen listesinde zaten duruyor: "İçeriğe atla" (atlama bağlantısı) ve menüdeki "Canlı PTF".
- Kaldırılan: her sayfadaki eski alt satır ("© 2026 Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş. · Ana sayfa · …"). Yerine ana sayfanın alt bilgisi geldi (şirket, merkez, iletişim, sicil, "Est. 2011 · EPİAŞ Üyesi", hukuki bağlantılar); eski satırdaki her bağlantı hedefi kabukta var.
- Alt sayfalar ilk kez tam alt bilgi gösterir: ticaret sicil no, adres, lisans no ve "EPİAŞ Üyesi" artık her sayfada. Hepsi canlı ana sayfada yayımlı; yeni iddia değil, ama görünürlük arttı.
- Devralınan küçük tutarsızlık (değiştirilmedi): menü düğmesinin erişilebilir adı İngilizce "Menu" (ana sayfada da öyle).
- Yasaklı numara yok; tasarruf ifadesi yok.

## Bilinen açıklar

- Firefox, WebKit/Safari, iOS ve gerçek cihaz denetlenmedi; gerçek PTF proxy'si bu ortamdan erişilemedi (canli-ptf bekleme ve sahte SSR verisiyle görüldü).
- `wrangler pages dev` ile temiz adres / `_redirects` sınanmadı (statik sunucu + QA'nın fonksiyon sunucusu kullanıldı).
- Lighthouse ölçülmedi.
- Telefonda canli-ptf gün grafiğinin saat etiketleri büyütüldü (22 kullanıcı birimi); "18:00" ile "24:00" birbirine yakın duruyor.
- En düşük/en yüksek saat hücresi veri yokken sarı "—" gösterir (betiğin `resetFigures` davranışı; canlıda da aynı).
- Ana sayfa yayına girmeden alt sayfalar yayına alınırsa ziyaretçi bu kez ters yönde fark görür: ikisi birlikte yayımlanmalı.

## Kalan sayfalar için (2. aşama)

Üretici sayfa listesine eklemekle büyür; her sayfa için gereken:

1. **Aynı kalıptaki içerik sayfaları** (`<div class="page">` + içerik izi + H1 + güncelleme satırı + `.cta` + `.about` + eski alt satır): kalan 18 rehber (dondurulmuş üçü dahil: ptf-nedir, serbest-tuketici, tedarikci-degistirme — onlarda yalnız stil ve kabuk değişir, metin değişmez; Hukuk/SEO ile 10.12 sonrası zamanlaması konuşulmalı), `sanayi-elektrik-tedariki`, `kvkk`, `cerez-politikasi`, `kullanim-kosullari`. Önce her sayfanın sınıf envanteri çıkarılır (`grep -o 'class="[^"]*"'`); kabukta karşılığı olmayan bileşenler (ör. rehberlerdeki şema figürleri, karşılaştırma tabloları, `.ornek`, TASLAK şerhleri) için `stil/` altına sayfa ya da bileşen dosyası yazılır. Hukuki metinlerde "taslak" notları olduğu gibi kalır.
2. **`rehber.html` (dizin):** liste/kart düzeni ana sayfadaki sektör ve hizmet dizgisine göre yeniden kurulmalı (kart kutusu yok, üst çizgili liste); dizin içeriği aynen.
3. **`elektrik-faturasi-hesaplama.html`:** iki betikli araç; formlar ve sonuç kutuları için dengesizlik hesaplayıcısının dili kullanılır; "tahminidir / teklif veya taahhüt değildir" metinleri ve eşik mantığı aynen; kendi tarayıcı testi yok — QA'dan form ve sonuç için kısa bir test istenmeli.
4. **`404.html`:** oyun sayfası tam ekran ve kendi tasarımında; yalnız yedek içeriğe (JS/WebGL yok) kabuk (üst bant + alt bilgi) ve yeni belirteçler. Gerçek 404 durumu ve `noindex` korunur; `smoke2.mjs` ile denetlenir.
5. `panel.html` kapsam dışı (iç araç, `noindex`).
6. Her sayfa için: `karsilastir.mjs` listesine ekleme (baş/içerik/betik eşliği), `denetle.mjs` listesine ekleme (taşma, karşıtlık, odak, JS kapalı), önce/sonra görüntüleri; `sitemap.xml` `<lastmod>` yalnız içerik değişirse (bu iş stil değişikliği; içerik tarihi değişmez — SEO ile teyit).
7. Yayın günü: `R6 D-A2 canli-ptf main yok` test satırının güncellenmesi (yukarıda), `.claude/rules/content-pages.md`'ye kabuk kuralı ("alt sayfalar üreticiyle; kabuk elle değiştirilmez") eklenmesi, `CHANGELOG.md` ve defter kaydı.
