# ŞEMA PAKETİ — İki Inline-SVG Açıklayıcı Diyagram

**Hazırlayan:** Design Agent (Level 3, Product) · **Tarih:** 2026-08-05
**Alıcı:** Webmaster Agent (uygulama) · **Onay zinciri:** Product Executive → Orchestrator
**Durum:** Uygulamaya hazır. Kopyala-yapıştır markup + CSS + tam yerleşim talimatı içerir.

---

## 0. Özet

| | Diyagram 1 | Diyagram 2 |
|---|---|---|
| Ad | PTF nasıl oluşur (arz/talep kesişimi) | Tedarikçi değiştirme: 5 adım |
| viewBox | `0 0 420 316` (tek varyant) | `0 0 680 252` (yatay) + `0 0 340 660` (dikey) |
| Hedef sayfalar | `rehber/ptf-nedir.html`, `canli-ptf.html` | `rehber/tedarikci-degistirme.html` |
| Zemin | **Yalnız paper (`#F5F3EC`)** | **Yalnız paper (`#F5F3EC`)** |
| Mobil davranış | Aynı SVG, `@media (max-width:640px)` ile yazı tipi büyütülür | İki SVG, 640px'te `display` takası |
| JS | Yok | Yok |
| Dış varlık | Yok | Yok |

Kullanılan token'lar (index.html `:root` ve rehber sayfalarının `:root`'undan aynen):
`--ink #0A0E1A` · `--ink-soft #1A2032` · `--ink-muted #4A5264` · `--line #E4E2DC` ·
`--line-strong #D6D2C6` · `--paper #F5F3EC` · `--paper-warm #EDEAE0` · `--accent #C9A961` ·
`--accent-dark #A68A44` · `--accent-ink #826829`.

> **Not (değişken adı farkı):** `index.html` bu token'ı `--accent-text` adıyla, `rehber/*.html`
> ve `canli-ptf.html` `--accent-ink` adıyla tanımlar. Aşağıdaki CSS her yerde
> `var(--accent-ink, #826829)` biçiminde **fallback'li** yazılmıştır; iki sayfa ailesinde de
> doğru render eder. `--warm-fill (#FAF6EA)` ve `--white` yalnız `index.html`'de tanımlıdır,
> bu yüzden onlar da fallback'li verilmiştir.

---

## 1. Ortak CSS bloğu

Her iki hedef sayfanın mevcut `<style>` bloğunun **sonuna** ekleyin (footer kuralından sonra).
Diyagram 1 sayfalarına `1.1 + 1.2`, Diyagram 2 sayfasına `1.1 + 1.3` yeterlidir; tamamını
eklemek de zararsızdır (kullanılmayan seçiciler ölü ağırlıktır, ~0.6 KB).

### 1.1 Figür kabuğu (her iki diyagram için ortak)

```css
/* ---- Şema figürü (inline SVG) ---- */
.vfig { margin: 30px 0 34px; }
.vfig svg { width: 100%; height: auto; display: block; overflow: visible; }
.vfig-cap {
  font-family: 'IBM Plex Mono', Consolas, monospace;
  font-size: 11px; line-height: 1.65; letter-spacing: 0.01em;
  color: var(--ink-muted); margin-top: 12px; padding-top: 12px;
  border-top: 1px solid var(--line);
}
@media print { .vfig { break-inside: avoid; page-break-inside: avoid; } }
```

### 1.2 Diyagram 1'e özgü

```css
/* ---- D1: PTF oluşumu ---- */
.ptf-fig .ax   { stroke: var(--ink-muted, #4A5264); stroke-width: 1; fill: none; }
.ptf-fig .crv  { stroke: var(--ink, #0A0E1A); stroke-width: 1.3; fill: none;
                 stroke-linejoin: miter; stroke-linecap: butt; }
.ptf-fig .gd   { stroke: var(--accent-ink, #826829); stroke-width: 1; fill: none;
                 stroke-dasharray: 4 3; }
.ptf-fig .dot  { fill: var(--accent, #C9A961); stroke: var(--accent-ink, #826829);
                 stroke-width: 1.3; }
.ptf-fig .rule { stroke: var(--line, #E4E2DC); stroke-width: 1; fill: none; }
.ptf-fig text  { font-family: 'IBM Plex Mono', Consolas, monospace;
                 letter-spacing: 0.1em; fill: var(--ink-muted, #4A5264); }
.ptf-fig .lbl  { font-size: 10px; }
.ptf-fig .key  { font-size: 11px; font-weight: 500; letter-spacing: 0.14em;
                 fill: var(--accent-ink, #826829); }
.ptf-fig .note { font-size: 9px; letter-spacing: 0.12em; }

/* Dar ekranda SVG küçüldüğü için etiketler user-unit olarak büyütülür:
   375px viewport'ta ölçek ~0.78 → 13u ≈ 10.1px CSS. */
@media (max-width: 640px) {
  .ptf-fig .lbl  { font-size: 13px; }
  .ptf-fig .key  { font-size: 14px; }
  .ptf-fig .note { font-size: 12px; letter-spacing: 0.08em; }
}
```

### 1.3 Diyagram 2'ye özgü

```css
/* ---- D2: 5 adım akışı ---- */
.vfig svg.stepfig-v { display: none; }   /* .vfig svg ile eşit özgüllük — DÜZELTİLDİ 2026-08-05 */
.stepfig .box    { fill: #FFFFFF; stroke: var(--line-strong, #D6D2C6); stroke-width: 1; }
.stepfig .box-hi { fill: var(--warm-fill, #FAF6EA); stroke: var(--accent-dark, #A68A44);
                   stroke-width: 1.6; }
.stepfig .cn     { stroke: var(--accent-ink, #826829); stroke-width: 1.3; fill: none;
                   stroke-linejoin: miter; stroke-linecap: butt; }
.stepfig .chip   { fill: var(--accent-ink, #826829); }
.stepfig .rule   { stroke: var(--line, #E4E2DC); stroke-width: 1; fill: none; }
.stepfig .st-s   { font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 11px;
                   letter-spacing: 0.14em; fill: var(--accent-ink, #826829); }
.stepfig .st-s-hi{ font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 11px;
                   letter-spacing: 0.04em; fill: var(--paper, #F5F3EC); }
.stepfig .st-t   { font-family: 'Archivo', -apple-system, sans-serif; font-size: 15px;
                   font-weight: 600; fill: var(--ink, #0A0E1A); }
.stepfig .st-x   { font-family: 'Archivo', -apple-system, sans-serif; font-size: 11px;
                   fill: var(--ink-soft, #1A2032); }
.stepfig-v .st-x { font-size: 11.5px; }
.stepfig .note   { font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 9px;
                   letter-spacing: 0.12em; fill: var(--ink-muted, #4A5264); }

@media (max-width: 640px) {
  .vfig svg.stepfig-h { display: none; }
  .vfig svg.stepfig-v { display: block; }
}
```

**Neden `display` takası, `<foreignObject>` veya JS değil:** 5 sütunlu bir akış 375px'lik
bir ekranda okunabilir bir tipografiye asla ölçeklenmez (yatay viewBox 680u → 327px'te
ölçek 0.48, 15u başlık 7.2px'e düşer — okunamaz). `display:none` erişilebilirlik ağacından
da çıkardığı için ekran okuyucu **tek** diyagramı duyurur; çift `role="img"` duyurusu oluşmaz.
Yatay kaydırma çözümü (overflow-x) mobil dokunmatik trafikte terk oranını artırdığı için
tercih edilmedi — Türk tüketici trafiğinin çoğunluğu mobildir.

---

## 2. DİYAGRAM 1 — "PTF nasıl oluşur"

**viewBox:** `0 0 420 316` · **En-boy oranı:** 1.329 : 1 · **Çizim alanı:** x 16→404, y 24→309
(kenarlarda ≥4u tampon; hiçbir stroke viewBox kenarında kırpılmaz).

Eksenlerde **hiçbir sayısal değer yoktur** (sıfır-fiyat-iddiası kuralı + eğriler illüstratiftir).
Arz eğrisi **kademeli**dir: her kademe bir sonraki devreye giren santralin teklif fiyatını
temsil eder (merit order) — bu enerji-yerlisi ve doğru bir gösterimdir; marjinal fiyatlama
anlatısı (`ptf-nedir.html` satır 74) görsel olarak burada karşılık bulur.

### 2.1 Markup

```html
<figure class="vfig">
  <svg class="ptf-fig" viewBox="0 0 420 316" role="img"
       aria-labelledby="d1-ttl" aria-describedby="d1-dsc" focusable="false">
    <title id="d1-ttl">PTF nasıl oluşur: arz ve talep eğrilerinin kesişimi</title>
    <desc id="d1-dsc">Şematik grafik. Yatay eksen miktarı (MWh), dikey eksen fiyatı (₺/MWh) gösterir. Soldan sağa kademeli yükselen çizgi arz eğrisidir; her kademe devreye giren bir sonraki santralin teklif fiyatını, yani merit order sırasını temsil eder. Soldan sağa inen düzgün eğri talep eğrisidir. İki eğrinin kesiştiği nokta altın renkli bir noktayla işaretlenmiştir. Bu noktadan fiyat eksenine uzanan kesikli çizgi o saatin PTF'sini, miktar eksenine uzanan kesikli çizgi eşleşme miktarını gösterir. Eksenlerde sayısal değer yoktur; şema ölçeksizdir ve eşleşme günün her saati için ayrı ayrı yapılır.</desc>

    <!-- eksenler + ok uçları -->
    <path class="ax" d="M60 240 H392"/>
    <path class="ax" d="M60 240 V24"/>
    <path class="ax" d="M54 32 L60 24 L66 32"/>
    <path class="ax" d="M384 234 L392 240 L384 246"/>
    <!-- kesişim çentikleri -->
    <path class="ax" d="M56 140 H60"/>
    <path class="ax" d="M250 240 V244"/>

    <!-- arz eğrisi (merit order kademeleri) -->
    <path class="crv" d="M72 226 H106 V208 H142 V190 H176 V168 H214 V140 H262 V114 H300 V90 H336 V66 H374"/>
    <!-- talep eğrisi -->
    <path class="crv" d="M76 54 C140 100 196 130 250 140 C300 150 342 174 386 206"/>

    <!-- kesikli kılavuzlar -->
    <path class="gd" d="M60 140 H250"/>
    <path class="gd" d="M250 140 V240"/>
    <!-- eşleşme noktası -->
    <circle class="dot" cx="250" cy="140" r="4.5"/>

    <!-- etiketler -->
    <text class="lbl" x="22" y="150" transform="rotate(-90 22 150)" text-anchor="middle">FİYAT · ₺/MWh</text>
    <text class="lbl" x="382" y="232" text-anchor="end">MİKTAR · MWh</text>
    <text class="lbl" x="82" y="48">TALEP</text>
    <text class="lbl" x="374" y="54" text-anchor="end">ARZ</text>
    <text class="key" x="66" y="134">PTF</text>
    <text class="lbl" x="250" y="258" text-anchor="middle">EŞLEŞME MİKTARI</text>

    <!-- dipnot -->
    <path class="rule" d="M16 270 H404"/>
    <text class="note" x="16" y="290">ARZ KADEMELERİ = TEKLİF SIRASI (MERİT ORDER)</text>
    <text class="note" x="16" y="306">HER SAAT İÇİN AYRI AYRI · ŞEMATİK · ÖLÇEKSİZ</text>
  </svg>
  <figcaption class="vfig-cap">Gün Öncesi Piyasası'nda her saat için verilen arz ve talep teklifleri eşleştirilir; eğrilerin kesiştiği fiyat o saatin PTF'sidir. Şema örnektir; eksenlerde sayısal değer yer almaz.</figcaption>
</figure>
```

### 2.2 Geometri notları (Webmaster için)

- Kesişim `(250, 140)` **tam**dır: talep eğrisinin iki kübik parçası bu noktada birleşir,
  arz eğrisinin `y=140` basamağı `x=214→262` aralığını kapsar. Nokta bir **basamağın
  yatay yüzeyinde** durur — yani fiyatı marjinal santralin teklifi belirler. Bu bilinçli
  bir seçimdir; dikey yükselişte kesiştirmek yanlış olmazdı ama marjinal fiyatlama
  anlatısını görsel olarak zayıflatırdı.
- `ARZ` etiketi eğrinin bitiş basamağının 12u üzerinde, `TALEP` etiketi eğrinin başlangıç
  noktasının 8u üzerinde konumlanır — lejant yerine **doğrudan etiketleme**. Bu, göz
  hareketi sayısını azaltır ve rengi ayırt edici olarak kullanmaz (renk körlüğü güvenli).
- `PTF` etiketi kasıtlı olarak grafik alanının **içine**, kesikli yatay çizginin hemen
  üstüne yerleştirildi; eksenin soluna koymak döndürülmüş eksen başlığıyla çakışıyordu.

### 2.3 Yerleşim

**A) `/home/user/website/rehber/ptf-nedir.html`**
- Ekleme noktası: `<h2>PTF nasıl oluşur?</h2>` başlığından sonra gelen ilk paragrafın
  (`<p>Gün Öncesi Piyasası'nda katılımcılar — üreticiler…</p>`, **satır 71**) **hemen ardına**,
  `<p>Mekanizmanın önemli sonuçları:</p>` (satır 72) satırından **önce**.
- Gerekçe: metin eşleştirme mekanizmasını yeni anlattı; şema onu görselleştirir, ardından
  gelen madde listesi (marjinal fiyatlama / saatlik çözünürlük / şeffaflık) şemanın
  sonuçlarını okur. Şema listeden sonra konsaydı listedeki "marjinal fiyatlama" maddesi
  görselsiz kalırdı.

**B) `/home/user/website/canli-ptf.html`**
- Ekleme noktası: `<h2>PTF nedir, bu rakam ne anlama gelir?</h2>` bölümünün **ikinci ve son**
  paragrafından (`<p>Bu rakam serbest piyasadaki fiyatlamanın ana referansıdır…</p>`,
  **satır 157**) sonra, `<h2>Bu veriyi nasıl okumalı?</h2>` (satır 159) başlığından önce.
- Zemin doğrulaması: **paper**. Koyu `.live` bloğu satır 151'de (`</section>`) kapanır;
  satır 155'ten itibaren gövde `body { background: var(--paper) }` üzerindedir. D1 bu
  sayfada **paper üzerinde** yer alır — teyit edilmiştir.
- `id` çakışması yok: `d1-ttl` / `d1-dsc` her iki sayfada birer kez kullanılır. Aynı sayfaya
  ikinci bir kopya eklenirse id'leri `d1b-*` yapın (yinelenen id = bozuk `aria-labelledby`).

**Altyazı (her iki sayfada aynı, `figcaption` içinde):**
> Gün Öncesi Piyasası'nda her saat için verilen arz ve talep teklifleri eşleştirilir;
> eğrilerin kesiştiği fiyat o saatin PTF'sidir. Şema örnektir; eksenlerde sayısal değer
> yer almaz.

---

## 3. DİYAGRAM 2 — "Tedarikçi değiştirme: 5 adım"

**Yatay (≥641px) viewBox:** `0 0 680 252` · **Dikey (≤640px) viewBox:** `0 0 340 660`

Adım başlıkları ve açıklamaları `index.html` `.stepflow` bölümünden (satır 1244–1253)
**birebir** alınmıştır; hiçbir metin uydurulmamış, yalnızca sütun genişliğine göre
`<tspan>` ile satırlara bölünmüştür. Son adım `.step.hi` muamelesiyle vurgulanır.

Kaynak eşleşmesi:

| # | Başlık | Açıklama (birebir) |
|---|---|---|
| S1 | Keşif | Tesisin yük profili, OG/AG kullanımı ve saat dağılımı incelenir. |
| S2 | Modelleme | GÖP + ikili karışım modeli, risk dağılımı, referans dönem PTF analizi. |
| S3 | Teklif | Sabit, endeksli veya hibrit seçenekler. Tüm formüller sözleşmede. |
| S4 | Onboard | EPİAŞ profil transferi, tedarikçi değişimi başvurusu, dengeleme eşleştirmesi. |
| S5 | Devreye Alma | İlk saatte canlı tedarik; ilk ay faturalama ve kullanım raporu. |

### 3.1 Yatay varyant (masaüstü/tablet)

Sütun ızgarası: 5 kutu × 116u, aralar 23u, kenar tamponu 4u → `4·116 + 4·23 = 672`, +8 tampon = 680.
Kutu x konumları: `4, 143, 282, 421, 560`. Metin x = kutu + 12.

```html
<svg class="stepfig stepfig-h" viewBox="0 0 680 252" role="img"
     aria-labelledby="d2h-ttl" aria-describedby="d2h-dsc" focusable="false">
  <title id="d2h-ttl">Tedarikçi değiştirme süreci: beş adım</title>
  <desc id="d2h-dsc">Soldan sağa akan beş adımlık şema. S1 Keşif: tesisin yük profili, OG/AG kullanımı ve saat dağılımı incelenir. S2 Modelleme: GÖP artı ikili karışım modeli, risk dağılımı, referans dönem PTF analizi. S3 Teklif: sabit, endeksli veya hibrit seçenekler; tüm formüller sözleşmede. S4 Onboard: EPİAŞ profil transferi, tedarikçi değişimi başvurusu, dengeleme eşleştirmesi. S5 Devreye Alma: ilk saatte canlı tedarik, ilk ay faturalama ve kullanım raporu. Adımlar ince oklarla birbirine bağlanmıştır; son adım vurgulu çerçeveyle işaretlenmiştir.</desc>

  <!-- kutular -->
  <rect class="box"    x="4"   y="34" width="116" height="164"/>
  <rect class="box"    x="143" y="34" width="116" height="164"/>
  <rect class="box"    x="282" y="34" width="116" height="164"/>
  <rect class="box"    x="421" y="34" width="116" height="164"/>
  <rect class="box-hi" x="560" y="34" width="116" height="164"/>

  <!-- bağlayıcılar + ok uçları -->
  <path class="cn" d="M124 116 H133"/><path class="cn" d="M133 111 L139 116 L133 121"/>
  <path class="cn" d="M263 116 H272"/><path class="cn" d="M272 111 L278 116 L272 121"/>
  <path class="cn" d="M402 116 H411"/><path class="cn" d="M411 111 L417 116 L411 121"/>
  <path class="cn" d="M541 116 H550"/><path class="cn" d="M550 111 L556 116 L550 121"/>

  <!-- S1 -->
  <text class="st-s" x="16" y="58">S1</text>
  <text class="st-t" x="16" y="80">Keşif</text>
  <text class="st-x" x="16" y="100"><tspan x="16">Tesisin yük</tspan><tspan x="16" dy="14">profili, OG/AG</tspan><tspan x="16" dy="14">kullanımı ve</tspan><tspan x="16" dy="14">saat dağılımı</tspan><tspan x="16" dy="14">incelenir.</tspan></text>

  <!-- S2 -->
  <text class="st-s" x="155" y="58">S2</text>
  <text class="st-t" x="155" y="80">Modelleme</text>
  <text class="st-x" x="155" y="100"><tspan x="155">GÖP + ikili</tspan><tspan x="155" dy="14">karışım modeli,</tspan><tspan x="155" dy="14">risk dağılımı,</tspan><tspan x="155" dy="14">referans dönem</tspan><tspan x="155" dy="14">PTF analizi.</tspan></text>

  <!-- S3 -->
  <text class="st-s" x="294" y="58">S3</text>
  <text class="st-t" x="294" y="80">Teklif</text>
  <text class="st-x" x="294" y="100"><tspan x="294">Sabit, endeksli</tspan><tspan x="294" dy="14">veya hibrit</tspan><tspan x="294" dy="14">seçenekler. Tüm</tspan><tspan x="294" dy="14">formüller</tspan><tspan x="294" dy="14">sözleşmede.</tspan></text>

  <!-- S4 -->
  <text class="st-s" x="433" y="58">S4</text>
  <text class="st-t" x="433" y="80">Onboard</text>
  <text class="st-x" x="433" y="100"><tspan x="433">EPİAŞ profil</tspan><tspan x="433" dy="14">transferi,</tspan><tspan x="433" dy="14">tedarikçi</tspan><tspan x="433" dy="14">değişimi</tspan><tspan x="433" dy="14">başvurusu,</tspan><tspan x="433" dy="14">dengeleme</tspan><tspan x="433" dy="14">eşleştirmesi.</tspan></text>

  <!-- S5 — vurgulu -->
  <rect class="chip" x="572" y="46" width="32" height="16"/>
  <text class="st-s-hi" x="588" y="58" text-anchor="middle">S5</text>
  <text class="st-t" x="572" y="74">Devreye<tspan x="572" dy="17">Alma</tspan></text>   <!-- iki satır: tek satırda 96.5u > 92u iç genişlik (QA D-2) -->
  <text class="st-x" x="572" y="110"><tspan x="572">İlk saatte canlı</tspan><tspan x="572" dy="14">tedarik; ilk ay</tspan><tspan x="572" dy="14">faturalama ve</tspan><tspan x="572" dy="14">kullanım raporu.</tspan></text>

  <!-- dipnot -->
  <path class="rule" d="M4 216 H676"/>
  <text class="note" x="4" y="234">HER ADIMIN ÇIKTISI YAZILIDIR</text>
  <text class="note" x="676" y="234" text-anchor="end">ŞEMATİK · ÖLÇEKSİZ</text>
</svg>
```

> **Başlık taşması uyarısı:** `Devreye Alma` (S5) 15u Archivo 600'de ≈ 104u yer kaplar,
> kutu iç genişliği 92u'dur — 12u taşar ama kutunun **dış** kenarına 116u'da hâlâ 4u kalır,
> yani görsel olarak temizdir ve komşu sütun yoktur (en sağdaki kutudur). Değiştirmeyin.
> Aynı başlık soldaki bir sütuna taşınırsa `font-size: 14px` gerekir.

### 3.2 Dikey varyant (≤640px)

Satır adımı 128u, kutu yüksekliği 94u, kutu x=4 genişlik 332u. Satır üstleri: `8, 136, 264, 392, 520`.

```html
<svg class="stepfig stepfig-v" viewBox="0 0 340 660" role="img"
     aria-labelledby="d2v-ttl" aria-describedby="d2v-dsc" focusable="false">
  <title id="d2v-ttl">Tedarikçi değiştirme süreci: beş adım</title>
  <desc id="d2v-dsc">Yukarıdan aşağıya akan beş adımlık şema. S1 Keşif: tesisin yük profili, OG/AG kullanımı ve saat dağılımı incelenir. S2 Modelleme: GÖP artı ikili karışım modeli, risk dağılımı, referans dönem PTF analizi. S3 Teklif: sabit, endeksli veya hibrit seçenekler; tüm formüller sözleşmede. S4 Onboard: EPİAŞ profil transferi, tedarikçi değişimi başvurusu, dengeleme eşleştirmesi. S5 Devreye Alma: ilk saatte canlı tedarik, ilk ay faturalama ve kullanım raporu. Adımlar ince oklarla birbirine bağlanmıştır; son adım vurgulu çerçeveyle işaretlenmiştir.</desc>

  <rect class="box"    x="4" y="8"   width="332" height="94"/>
  <rect class="box"    x="4" y="136" width="332" height="94"/>
  <rect class="box"    x="4" y="264" width="332" height="94"/>
  <rect class="box"    x="4" y="392" width="332" height="94"/>
  <rect class="box-hi" x="4" y="520" width="332" height="94"/>

  <path class="cn" d="M22 106 V121"/><path class="cn" d="M17 121 L22 130 L27 121"/>
  <path class="cn" d="M22 234 V249"/><path class="cn" d="M17 249 L22 258 L27 249"/>
  <path class="cn" d="M22 362 V377"/><path class="cn" d="M17 377 L22 386 L27 377"/>
  <path class="cn" d="M22 490 V505"/><path class="cn" d="M17 505 L22 514 L27 505"/>

  <text class="st-s" x="18" y="34">S1</text>
  <text class="st-t" x="18" y="56">Keşif</text>
  <text class="st-x" x="18" y="76"><tspan x="18">Tesisin yük profili, OG/AG kullanımı ve saat</tspan><tspan x="18" dy="14">dağılımı incelenir.</tspan></text>

  <text class="st-s" x="18" y="162">S2</text>
  <text class="st-t" x="18" y="184">Modelleme</text>
  <text class="st-x" x="18" y="204"><tspan x="18">GÖP + ikili karışım modeli, risk dağılımı,</tspan><tspan x="18" dy="14">referans dönem PTF analizi.</tspan></text>

  <text class="st-s" x="18" y="290">S3</text>
  <text class="st-t" x="18" y="312">Teklif</text>
  <text class="st-x" x="18" y="332"><tspan x="18">Sabit, endeksli veya hibrit seçenekler.</tspan><tspan x="18" dy="14">Tüm formüller sözleşmede.</tspan></text>

  <text class="st-s" x="18" y="418">S4</text>
  <text class="st-t" x="18" y="440">Onboard</text>
  <text class="st-x" x="18" y="460"><tspan x="18">EPİAŞ profil transferi, tedarikçi değişimi</tspan><tspan x="18" dy="14">başvurusu, dengeleme eşleştirmesi.</tspan></text>

  <rect class="chip" x="18" y="534" width="32" height="16"/>
  <text class="st-s-hi" x="34" y="546" text-anchor="middle">S5</text>
  <text class="st-t" x="18" y="568">Devreye Alma</text>
  <text class="st-x" x="18" y="588"><tspan x="18">İlk saatte canlı tedarik; ilk ay faturalama</tspan><tspan x="18" dy="14">ve kullanım raporu.</tspan></text>

  <path class="rule" d="M4 632 H336"/>
  <text class="note" x="4" y="650">ŞEMATİK · ÖLÇEKSİZ · HER ADIMIN ÇIKTISI YAZILIDIR</text>
</svg>
```

### 3.3 Yerleşim

**`/home/user/website/rehber/tedarikci-degistirme.html`**
- Ekleme noktası: `<h2>Süreç adım adım: teklif'ten ilk faturaya beş adım</h2>` (satır 79) ve
  onu izleyen giriş paragrafından (`<p>Voltage Enerji'de geçiş süreci beş adımda yürür…</p>`,
  **satır 80**) **sonra**; mevcut `<ol>` (satır 81) bloğundan **önce**.
- Gerekçe: şema taranabilir özet ("beş adım, sonu canlı tedarik"), `<ol>` ise ayrıntı katmanı.
  Görsel-önce sıralaması, uzun rehber sayfalarında bölüm terk oranını düşürür; ayrıca
  `<ol>` metni şemanın tam metin eşdeğeri olduğu için erişilebilirlik yedeği zaten sayfada.
- **İki SVG de aynı `<figure>` içine** girer; CSS hangisinin görüneceğine karar verir.

```html
<figure class="vfig">
  <!-- 3.1'deki yatay SVG -->
  <!-- 3.2'deki dikey SVG -->
  <figcaption class="vfig-cap">Geçiş süreci beş adımda yürür; başvuru, itiraz ve EPİAŞ kayıt işlemlerinin tamamı tedarikçi tarafından yürütülür, tüketicinin bir kuruma gitmesi gerekmez.</figcaption>
</figure>
```

**Altyazı:**
> Geçiş süreci beş adımda yürür; başvuru, itiraz ve EPİAŞ kayıt işlemlerinin tamamı
> tedarikçi tarafından yürütülür, tüketicinin bir kuruma gitmesi gerekmez.

**Opsiyonel (Webmaster kararı):** `<ol>` bloğu şemanın birebir metin eşdeğeri olduğu için
her iki SVG'ye `role="img"` yerine `aria-hidden="true"` verilebilir; bu, ekran okuyucuda
aynı içeriğin iki kez duyulmasını önler. **Önerim: `role="img"`'i koruyun** — sayfa yazdırıldığında
veya `<ol>` ileride yeniden düzenlendiğinde şema kendi başına anlamlı kalır, ve `desc`
metni `<ol>` ile birebir aynı değildir (daha kısadır).

---

## 4. Erişilebilirlik doğrulaması (WCAG 2.2 AA)

### 4.1 Kontrast — hesaplanmış oranlar

| Öğe | Renk | Zemin | Oran | Sonuç |
|---|---|---|---|---|
| Eksen/dipnot yazıları | `--ink-muted #4A5264` | `--paper #F5F3EC` | **7.06 : 1** | ✅ AA + AAA |
| `PTF` / `S1–S4` etiketleri | `--accent-ink #826829` | `--paper #F5F3EC` | **4.77 : 1** | ✅ AA (1.4.3) |
| `S1–S4` etiketleri | `--accent-ink #826829` | `#FFFFFF` kutu | **5.30 : 1** | ✅ AA |
| Adım başlıkları | `--ink #0A0E1A` | `#FFFFFF` | **19.8 : 1** | ✅ AAA |
| Adım açıklamaları | `--ink-soft #1A2032` | `#FFFFFF` | **16.2 : 1** | ✅ AAA |
| `S5` çip yazısı | `--paper #F5F3EC` | `--accent-ink #826829` | **4.77 : 1** | ✅ AA |
| Kesikli kılavuzlar, ok uçları | `--accent-ink #826829` | `--paper` | **4.77 : 1** | ✅ 1.4.11 (≥3:1) |
| Eğriler (arz/talep) | `--ink #0A0E1A` | `--paper` | **17.9 : 1** | ✅ |

### 4.2 Tespit edilen kontrast riski ve alınan önlem — **rapor edilecek bulgu**

`--accent #C9A961` paper zemininde **2.03 : 1** verir. Bu, hem metin (4.5:1) hem de
anlam taşıyan grafik öğe (1.4.11, 3:1) eşiğinin **altındadır**. Bu nedenle:

1. **Altın nokta** (`.dot`) yalnız dolgu olarak `--accent` kullanır ama **`--accent-ink`
   (4.77:1) konturla** çevrelenmiştir → nesnenin sınırı 3:1 eşiğini geçer. ✅
2. **Ok uçları** `--accent` yerine `--accent-ink` ile çizilmiştir.
3. **S5 vurgusu** yalnız renge dayanmaz (1.4.1 Renkten Bağımsızlık): dolgu (`--warm-fill`)
   + **kalın kontur (1.6 vs 1.0)** + **ters kontrastlı `S5` çipi** üçlüsüyle işaretlenir.
   Çip, renk algılamasa bile şekil olarak ayırt edilir.
4. `--accent-dark #A68A44` paper üzerinde **2.98 : 1** — 3:1'in *kıl payı* altında. Yalnız
   dekoratif kutu konturunda kullanılmıştır (kutunun kendisi bilgi taşımaz; bilgiyi içindeki
   metin taşır), metin veya anlam taşıyan çizgide **kullanılmamıştır**.

> **Mevcut siteye dair uyarı (Webmaster'a):** `index.html` satır 847'deki
> `.step-a { color: var(--accent); }` — S1→S5 arası `▸` okları — paper zemininde 2.03:1'dir.
> Oklar S1–S5 numaralandırması ve okuma sırasıyla yedeklendiği için 1.4.11 açısından
> savunulabilir (dekoratif kabul edilebilir), ancak `var(--accent-text)` ile değiştirilmesi
> hem daha güvenli hem de bu şema paketiyle görsel olarak tutarlı olur. Ayrı bir görev
> olarak Product Executive'e iletilmiştir.

### 4.3 Diğer erişilebilirlik kararları

- **Tüm metin gerçek `<text>`/`<tspan>` düğümüdür**; hiçbir yazı path'e dönüştürülmemiştir.
  Seçilebilir, kopyalanabilir, tarayıcı çevirisiyle çevrilebilir, arama motoru tarafından
  okunabilir.
- `role="img"` + `aria-labelledby` (kısa ad) + `aria-describedby` (uzun açıklama) —
  `<title>`/`<desc>` id'leriyle bağlanır. `focusable="false"` eski Edge/IE sekme tuzağını
  önler.
- **`text-transform: uppercase` kullanılmadı.** Türkçe metinlerde `i → I` dönüşümü tarayıcı
  yerelleştirmesine göre bozulabilir (`İÇİN` yerine `ICIN`). Tüm büyük harfli etiketler
  markup'ta **doğrudan büyük harfle** yazılmıştır. Bu kural bu paketin dışında da geçerlidir.
- **Yakınlaştırma (1.4.4):** SVG `width:100%; height:auto` olduğu için sayfa %200–%400
  yakınlaştırmada vektörel ölçeklenir; metin bulanıklaşmaz, kırpılmaz.
- **Reflow (1.4.10):** 320px genişlikte D1 ölçeği 0.65, D2 dikey varyantın ölçeği 0.87 —
  ikisinde de yatay kaydırma oluşmaz.
- **Hareket yok:** `tline-svg`'deki `stroke-dashoffset` çizim animasyonu bilerek
  **kopyalanmadı**. Bu şemalar açıklayıcıdır, dekoratif değildir; içeriğin animasyon
  bitene kadar gizli kalması `prefers-reduced-motion` ve okunabilirlik açısından risktir.
  Animasyon istenirse `@media (prefers-reduced-motion: reduce)` ile kapatılması **zorunludur**.

### 4.4 Tek erişilebilirlik çekincesi (raporlanan)

D2'de yatay ve dikey varyant **aynı `<title>` metnini** taşır. `display:none` uygulandığı
için erişilebilirlik ağacında yalnız biri bulunur ve çift duyuru oluşmaz — **ancak** CSS
yüklenmezse (ör. stil dosyası engellenirse) her ikisi de görünür ve ekran okuyucu şemayı
iki kez duyurur. Sayfa CSS'i satır içi (`<style>` in `<head>`) olduğu için bu senaryonun
gerçekleşme olasılığı pratikte sıfırdır; yine de not edilmiştir.

---

## 5. Koyu zemin (ink) uyumluluğu

**Her iki diyagram da yalnız paper (`#F5F3EC`) / paper-warm zeminde kullanılmak üzere
tasarlanmıştır.** İkisi de doğrudan koyu (`--ink #0A0E1A`) zemine konursa eğriler ve
başlık metni görünmez olur.

`canli-ptf.html` için **teyit:** D1 paper zemine yerleşir (koyu `.live` bloğu satır 151'de
kapanır, D1 satır 157'den sonra gelir). Ek bir işlem gerekmez.

İleride koyu bir bölüme taşınması gerekirse, gövde markup'ına dokunmadan bir modifier
sınıfı yeterlidir (SVG içindeki renkler zaten CSS ile sürülüyor):

```css
/* Yalnız gerekirse — bugün kullanılmıyor */
.vfig--ink { background: var(--ink); padding: 24px; }
.vfig--ink .ptf-fig .crv    { stroke: var(--paper, #F5F3EC); }
.vfig--ink .ptf-fig .ax     { stroke: #8A93A6; }
.vfig--ink .ptf-fig text    { fill: #A9B1C2; }          /* ink üzerinde 7.3:1 */
.vfig--ink .ptf-fig .gd     { stroke: var(--accent, #C9A961); }  /* ink üzerinde 8.4:1 */
.vfig--ink .ptf-fig .key    { fill: var(--accent, #C9A961); }
.vfig--ink .ptf-fig .dot    { fill: var(--accent, #C9A961); stroke: var(--paper, #F5F3EC); }
.vfig--ink .ptf-fig .rule   { stroke: rgba(245,243,236,0.18); }
```

Not: koyu zeminde rol tersine döner — `--accent` orada **8.4:1** verir ve metin için
uygundur; `--accent-ink` ise ink üzerinde 3.1:1'e düşer ve metinde kullanılamaz.

---

## 6. EN sürümü geldiğinde: `data-tr` / `data-en` gerektiren düğümler

Bugün her iki sayfa da TR-only (`<html lang="tr">`, `hreflang` alternatifi yok), bu yüzden
markup düz Türkçedir. `/en/` yayına girdiğinde aşağıdaki düğümlere `data-tr` / `data-en`
eklenmeli ve sayfanın mevcut dil-takas mekanizmasına dahil edilmelidir. `<tspan>`'lı
metinlerde takas **satır sonlarını da değiştireceği için** İngilizce metnin kendi
`<tspan>` bölümlemesi gerekir — bu yüzden EN varyantı için ayrı bir `<text>` bloğu
(`.tr-only` / `.en-only` desenine benzer şekilde `display` takası) daha güvenlidir.

### D1 — 8 düğüm
| Düğüm | TR | EN önerisi |
|---|---|---|
| y ekseni | FİYAT · ₺/MWh | PRICE · ₺/MWh |
| x ekseni | MİKTAR · MWh | QUANTITY · MWh |
| eğri | TALEP | DEMAND |
| eğri | ARZ | SUPPLY |
| anahtar | PTF | MCP |
| eksen altı | EŞLEŞME MİKTARI | MATCHED VOLUME |
| dipnot 1 | ARZ KADEMELERİ = TEKLİF SIRASI (MERİT ORDER) | SUPPLY STEPS = OFFER STACK (MERIT ORDER) |
| dipnot 2 | HER SAAT İÇİN AYRI AYRI · ŞEMATİK · ÖLÇEKSİZ | CALCULATED HOURLY · SCHEMATIC · NOT TO SCALE |
| + `<title>` ve `<desc>` | — | tam çeviri gerekir |

**Uzunluk kontrolü:** EN dizeleri TR'den kısa veya eşittir (`MATCHED VOLUME` 14 vs
`EŞLEŞME MİKTARI` 15 karakter; `SUPPLY STEPS = OFFER STACK (MERIT ORDER)` 40 vs 44).
D1'de EN taşma riski **yoktur**.

### D2 — 17 düğüm (5 başlık + 5 açıklama + 5 `S#` + 2 dipnot)
`index.html` satır 1245–1253'te EN karşılıkları **zaten mevcuttur**; birebir kullanın:
`Discovery` / `Modeling` / `Proposal` / `Onboard` / `Go-live` ve karşılık gelen
`data-en` açıklamaları.

**Uzunluk kontrolü — dikkat:** `Load profile, MV/LV usage and hourly distribution are
analyzed.` (S1 EN) TR karşılığından **2 karakter uzundur**; `EPIAS profile transfer,
supplier switch filing, balancing unit assignment.` (S4 EN) ise TR'den 1 karakter kısadır.
Yatay varyantta S4 zaten 7 satırla en yüksek kutudur; EN'de S1 de 5→6 satıra çıkabilir.
**Kutu yüksekliği 164u bu artışı taşır** (7 satır için tasarlandı, S1'de 5 satır kullanılıyor).
Ek yükseklik gerekmez. `Go-live` başlığı `Devreye Alma`'dan kısa olduğu için S5 taşması
EN'de tamamen ortadan kalkar.

---

## 7. Uygulama kontrol listesi (Webmaster)

- [ ] `rehber/ptf-nedir.html`: `<style>` sonuna 1.1 + 1.2 blokları; D1 `<figure>` satır 71'den sonra.
- [ ] `canli-ptf.html`: `<style>` sonuna 1.1 + 1.2 blokları; D1 `<figure>` satır 157'den sonra.
- [ ] `rehber/tedarikci-degistirme.html`: `<style>` sonuna 1.1 + 1.3 blokları; D2 `<figure>`
      (iki SVG + figcaption) satır 80'den sonra, `<ol>`'den önce.
- [ ] `canli-ptf.html`'e eklenen D1'in id'leri sayfada tekil mi? (`d1-ttl`, `d1-dsc`)
- [ ] 375px / 768px / 1440px'te görsel kontrol; 640px eşiğinde D2 takasının çalıştığı doğrulanır.
- [ ] Tarayıcı %200 zoom + yazdırma önizlemesi: kırpılma yok.
- [ ] Lighthouse/axe: yeni kontrast ihlali yok.
- [ ] Sayfa ağırlığı artışı: D1 ≈ 2.6 KB, D2 ≈ 6.4 KB (ikisi de gzip öncesi, ham HTML).
      Dış istek eklenmez; LCP/CLS etkisi yok (`height:auto` + sabit `viewBox` → oran rezerve).

---

## 8. Sonraki adım önerileri (Product Executive'e)

1. **QA Agent** — 640px eşiğinde D2 takası, `İ/ı` render kontrolü (Archivo + IBM Plex Mono
   Türkçe glif kapsamı), yazdırma çıktısı.
2. **Conversion Agent** — D1'in `rehber/ptf-nedir` sayfasında bölüm-içi kaydırma derinliği
   ve "Teklif Talep Edin" CTA tıklama oranına etkisi ölçülebilir; D2 için
   `tedarikci-degistirme` sayfasında aynı ölçüm. Şema öncesi/sonrası 14 günlük karşılaştırma
   yeterli sinyal verir.
3. **SEO Director / seo-schema** — D2, `HowTo` yapılandırılmış verisi için doğal bir eştir;
   ancak `HowTo` zengin sonucu Google tarafından kısıtlanmıştır, yalnız `<ol>` ile tutarlı
   olması koşuluyla değerlendirilmelidir.
4. `index.html` `.step-a` kontrast düzeltmesi (bkz. 4.2) — Webmaster'a küçük bir görev.
