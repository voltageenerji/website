# ENTITY PLAYBOOK — Voltan / Voltage Marka-Varlık (Entity) Konsolidasyonu

**Hazırlayan:** seo-brand-entity (Seviye 4, SEO birimi)
**Rapor hattı:** SEO Direktörü → Orchestrator
**Tarih:** 2026-07-27 · Sürüm 1.0 (kurucu playbook)
**Kapsam:** Adlandırma kural seti, yüzey envanteri şablonu, marka-SERP stratejisi,
bilgi paneli hazırlık listesi, seo-schema'ya şema önerileri.

> **Temel ilke (spec gereği):** Sahip (owner) tarafından doğrulanmamış hiçbir
> varlık bilgisi (kuruluş tarihi, lisans no, sicil kaydı, adres) dış yüzeylere
> yayılmaz. Doğrulanmamış iddiaya dayalı entity kampanyası varlık değil,
> due-diligence mayınıdır. Sahibe bağlı her kalem bu belgede **[SAHİP-ONAYI]**
> etiketiyle işaretlidir.

---

## 0. Sorun tanımı ve mevcut durum (as-is)

Tek bir lisanslı tedarikçi, arama motorlarına üç ayrı şey gibi görünüyor:

| Katman | Değer |
|---|---|
| Tüzel kişi | Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş. |
| Marka | Voltage Enerji |
| Alan adı | voltage.com.tr |

Hedef: Google/Bing/Yandex bu üçünü **tek varlık** olarak öğrenir; "voltage
enerji" ve "voltan elektrik" sorgularında aynı bilgi panelini/aynı sonuç
setini gösterir.

### `index.html` mevcut durumu (2026-07-27 itibarıyla okundu)

- **JSON-LD Organization** mevcut: `name: "Voltage Enerji"`,
  `legalName: "Voltan Elektrik Toptan Satış İthalat ve İhracat Anonim Şirketi"`,
  `alternateName: ["Voltan Elektrik", "Voltage"]`, `foundingDate: "2011"`.
- **`sameAs: []` boş** — entity konsolidasyonunun en kritik eksik sinyali.
- **Footer** tam ünvanı doğru yazıyor; lisans satırı MUST-FILL yer tutucuları
  taşıyor: `[EPDK-LISANS-NO]`, `[MERSIS-NO]`, `[TICARET-SICIL-NO]`. Bu
  yer tutucular canlıya bu hâlde çıkmamalı (webmaster/Teknoloji hattına not).
- **Adres (site):** Acıbadem Mah. Elysium Elit Koşuyolu B-18, Kadıköy,
  İstanbul 34660. Tel: +90-216-479-0510. E-posta: info@voltage.com.tr.
- **İç tutarsızlık:** Depo talimat dosyası (CLAUDE.md) tüzel kişiyi
  "Voltan Elektrik Toptan Satış A.Ş." (İthalat/İhracat'sız) yazıyor; site ise
  tam ünvanı kullanıyor. Hangisinin sicildeki güncel ünvan olduğu
  **[SAHİP-ONAYI]** gerektirir (ünvan değişikliği olmuş olabilir).

### Canlı gözlemler (2026-07-27, ABD endeksli arama; kesin envanter değildir)

Aşağıdakiler bugün fiilen gözlemlenmiştir; gözlemlenmeyen her şey
"BİLİNMİYOR"dur, yokluk kanıtı değildir:

1. **voltage.com.tr** marka sorgusunda 1. sonuç olarak çıkıyor (olumlu).
2. **Crunchbase profili mevcut:** crunchbase.com/organization/voltage-enerji —
   içeriği/adı kim kontrol ediyor, doğrulanmalı.
3. **puan5.com listesi mevcut** — başlık: "Voltage Enerji - Voltan Elektrik
   Toptan Satış İthalat İhracat A.ş." ("ve" eksik, "A.ş." hatalı büyük/küçük
   harf). Tutarsız ad örneği; düzeltme hedefi.
4. **elektrikpaketleri.com listesi mevcut** — "Voltan Elektrik Toptan Satış
   İthalat Ve İhracat Anonim Şirketi" ("Ve" hatalı büyük harf).
5. **Adres çelişkisi:** Üçüncü taraf veride Bağcılar (Mimar Sinan Cad. No:35
   K:21 D:264) adresi görünüyor; site Kadıköy/Acıbadem yazıyor. Hangisi güncel
   merkez? **[SAHİP-ONAYI]** — NAP tutarlılığının ön şartı. (Eski adres ise
   dizinlerde güncellenmeli; taşınma tarihi data-room'a girmeli.)
6. **EPDK lisans sorgu sayfasına** bu ortamdan erişilemedi (proxy 403);
   lisans kaydı buradan makine-doğrulanamadı. Kayıt çıktısı sahip/hukuk
   hattından gelmeli. **[SAHİP-ONAYI]**
7. LinkedIn şirket sayfası ve Şikayetvar marka sayfası aramada **bulunamadı**
   (kesin değil; TR endeksinden yerel kontrol gerekir → durum: BİLİNMİYOR).

---

## 1. Kanonik adlandırma kural seti

**Tek kural, her yerde:** Marka önde, tüzel kişi parantezde/altta, alan adı
her profile eklenir. Aşağıdaki dizgiler karakteri karakterine kullanılır.

### 1.1 Kanonik dizgiler

| Anahtar | Tam dizgi |
|---|---|
| **MARKA** | `Voltage Enerji` |
| **TÜZEL-KISA** | `Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.` |
| **TÜZEL-UZUN** | `Voltan Elektrik Toptan Satış İthalat ve İhracat Anonim Şirketi` |
| **BİRLEŞİK** | `Voltage Enerji (Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.)` |
| **ALAN ADI** | `voltage.com.tr` — her zaman `https://voltage.com.tr/` |
| **KISA-ANMA** | `Voltan Elektrik A.Ş.` (yalnızca metin içi ikinci anma) |

### 1.2 Yüzey tipine göre kullanım

| Yüzey tipi | Kullanılacak dizgi | Not |
|---|---|---|
| Site gövde metni (ilk anma) | BİRLEŞİK | Sayfa başına bir kez tam hâli; sonrası MARKA veya KISA-ANMA |
| Site footer / © satırı | TÜZEL-KISA | Mevcut footer doğru; lisans satırı MUST-FILL sonrası tamamlanır |
| `<title>` / meta | `Voltage Enerji — … | Voltan Elektrik A.Ş.` | Mevcut kalıp korunur |
| Schema `name` | MARKA | |
| Schema `legalName` | TÜZEL-UZUN | "Anonim Şirketi" açık yazılır; kısaltma legalName'e girmez |
| Schema `alternateName` | `["Voltan Elektrik", "Voltan Elektrik A.Ş.", "Voltage"]` | Bkz. Bölüm 4 |
| Dizinler (sektörel/ticari) | Ad alanı: BİRLEŞİK; kısa ad alanı varsa MARKA | + ALAN ADI + kanonik NAP |
| Google Business Profile | İşletme adı: MARKA; "kayıtlı ünvan" alanı varsa TÜZEL-KISA | Uygulama: seo-local |
| LinkedIn | Sayfa adı: `Voltage Enerji`; "Legal name" alanı: TÜZEL-KISA | Açıklamanın ilk cümlesinde BİRLEŞİK |
| X / Instagram / YouTube | Görünen ad: `Voltage Enerji`; bio ilk satırı: TÜZEL-KISA | Önerilen kullanıcı adı: `voltageenerji` — müsaitlik doğrulanmalı **[SAHİP-ONAYI]** |
| Basın bülteni / PR | İlk anma BİRLEŞİK, sonrası MARKA | Alıntı imzaları: Ad Soyad, Ünvan, Voltage Enerji |
| Resmî/İdari evrak, EPDK-EPİAŞ | Yalnızca TÜZEL-KISA / TÜZEL-UZUN | Marka resmî evrağa girmez |
| Fatura/sözleşme dipnotu | TÜZEL-KISA + MERSİS + sicil no | MUST-FILL sonrası |

### 1.3 Yazım yasakları (her yüzeyde geçerli)

- **"Voltage Enerji A.Ş." asla yazılmaz** — marka ile tüzel ek karıştırılmaz;
  bu, tam da çözmeye çalıştığımız "üç ayrı şirket" algısını üretir.
- **"Voltan Enerji" asla yazılmaz** (marka ile tüzel adın melezlenmesi).
- "ve" daima küçük harf: `İthalat ve İhracat` (❌ "Ve", ❌ "VE" — düz metinde).
- `A.Ş.` daima noktalı ve büyük (❌ "A.ş.", ❌ "AŞ" — resmî kısaltma gereken
  yerler hariç).
- `İthalat`, `İhracat` Türkçe İ ile; ASCII zorunlu sistemlerde
  `Ithalat ve Ihracat` kabul edilir ama ilk tercih değildir.
- İngilizce metinde tüzel ünvan **çevrilmez**: "Voltan Elektrik Toptan Satış
  İthalat ve İhracat A.Ş." aynen kalır; açıklama olarak "(a licensed
  electricity supply company in Türkiye)" eklenebilir.
- Alan adı hiçbir yerde `voltageenerji.com`, `voltan.com.tr` vb. yazılmaz;
  tek kanonik: `voltage.com.tr`.

### 1.4 Kanonik NAP (Name–Address–Phone)

> **BLOKE:** Kanonik adres **[SAHİP-ONAYI]** beklemektedir (Kadıköy/Acıbadem
> ↔ Bağcılar çelişkisi, Bölüm 0/5. madde). Onay gelene dek dizinlere yeni NAP
> yayılımı YAPILMAZ; yanlış adresin 30 dizine kopyalanması geri alınması en
> pahalı hatadır.

Onay sonrası şablon (tek satır, her dizinde aynı):
`Voltage Enerji (Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.) ·
[ONAYLI ADRES] · +90 216 479 05 10 · https://voltage.com.tr/`

---

## 2. Yüzey / profil envanteri şablonu

Durum sözlüğü: `BİLİNMİYOR` (varsayılan) · `VAR-KONTROLDE` (bizim yönettiğimiz)
· `VAR-KONTROLSÜZ` (üçüncü taraf, düzeltme gerekir) · `YOK-AÇILACAK` ·
`YOK-UYGUN-DEĞİL`. Aşağıda yalnızca 2026-07-27 gözlemleri işlenmiştir;
kalanını ilgili birim/sahip doldurur. **Statü uydurulmaz.**

| # | Yüzey | Sınıf | Durum (2026-07-27) | Kullanılacak dizgi | Düzeltme sahibi |
|---|---|---|---|---|---|
| 1 | voltage.com.tr (site + JSON-LD) | Sahipli | VAR-KONTROLDE — `sameAs` boş, footer MUST-FILL bekliyor | Bölüm 1.2 | webmaster + seo-schema |
| 2 | EPDK Lisans Sorgu (lisans.epdk.gov.tr) | Resmî sicil (otoriter teyit) | BİLİNMİYOR — bu ortamdan 403, doğrulanamadı | TÜZEL-UZUN (kayıt neyse o) | Sahip/Hukuk → legal-compliance **[SAHİP-ONAYI]** |
| 3 | EPİAŞ piyasa katılımcıları listesi (Şeffaflık) | Resmî sicil (otoriter teyit) | BİLİNMİYOR | Kayıtlı katılımcı ünvanı | Sahip/energy-market **[SAHİP-ONAYI]** |
| 4 | MERSİS / Ticaret Sicil Gazetesi kaydı | Resmî sicil | BİLİNMİYOR — MERSİS no MUST-FILL | TÜZEL-UZUN | Sahip/Hukuk **[SAHİP-ONAYI]** |
| 5 | İstanbul Ticaret Odası (İTO) kaydı | Oda kaydı | BİLİNMİYOR | TÜZEL-KISA | Sahip **[SAHİP-ONAYI]** |
| 6 | Google Business Profile / Maps | Harita | BİLİNMİYOR | MARKA + kanonik NAP (Bölüm 1.4 onayı sonrası) | seo-local |
| 7 | Yandex Maps / Yandex Business | Harita (TR'de kritik) | BİLİNMİYOR | MARKA + kanonik NAP | seo-local |
| 8 | Apple Maps / Bing Places | Harita | BİLİNMİYOR | MARKA + kanonik NAP | seo-local |
| 9 | LinkedIn şirket sayfası | Sosyal (B2B birincil) | BİLİNMİYOR — aramada bulunamadı, yerel teyit gerekli | Bölüm 1.2 LinkedIn satırı | Sahip açar, marketing yönetir |
| 10 | X / Instagram / YouTube | Sosyal | BİLİNMİYOR | `Voltage Enerji` / @voltageenerji (müsaitlik?) | marketing **[SAHİP-ONAYI: hesap açılışı]** |
| 11 | Crunchbase (crunchbase.com/organization/voltage-enerji) | Veri sağlayıcı | VAR — sahiplik/doğruluk BİLİNMİYOR | BİRLEŞİK | investor-relations sahiplenir |
| 12 | puan5.com listesi | Dizin (kontrolsüz) | VAR-KONTROLSÜZ — ad hatalı ("İthalat İhracat A.ş.", "ve" eksik) | BİRLEŞİK ile düzeltme talebi | seo-local |
| 13 | elektrikpaketleri.com listesi | Sektörel dizin | VAR-KONTROLSÜZ — "Ve" hatalı büyük harf | TÜZEL-UZUN düzeltmesi | seo-local |
| 14 | Enerji sektör dizinleri (enerjiatlasi, enerjigunlugu vb. şirket rehberleri) | Sektörel dizin | BİLİNMİYOR | BİRLEŞİK | seo-local + marketing |
| 15 | Şikayetvar / eksisozluk / forum yüzeyleri | İtibar | BİLİNMİYOR — aramada marka sayfası çıkmadı; TR'den periyodik kontrol | — (asla astroturf yok) | İzleme: seo-brand-entity; bulgu → Support |
| 16 | Wikipedia (TR) | Ansiklopedik | YOK-UYGUN-DEĞİL (bugün) — gerçekçilik notu aşağıda | — | — |
| 17 | Wikidata öğesi | Yapısal veri | BİLİNMİYOR (büyük olasılıkla yok) | Etiket: MARKA; resmî ad: TÜZEL-UZUN | seo-brand-entity, MUST-FILL sonrası |
| 18 | Google Knowledge Panel | SERP varlığı | BİLİNMİYOR — TR SERP'ten teyit gerekli | — | seo-brand-entity izler |

**Wikipedia gerçekçilik notu:** TR Wikipedia kayda değerlik eşiği, hakkında
bağımsız ikincil kaynak (basın, akademik, sektör raporu) ister. Bugün bu
kaynak stoku yoktur; şirketin kendi sitesi ve dizin kayıtları yeterli
değildir. **Madde açmaya çalışmak erken ve risklidir** (silinme + kalıcı kötü
sicil). Doğru sıra: önce basında geçen gerçek varlıklar (PTF verisi/analiz
yayını, lisanslı tedarikçi görünürlüğü), sonra Wikidata (eşiği düşüktür ve
resmî sicil referanslarıyla açılabilir), Wikipedia en son.

---

## 3. Marka-SERP stratejisi

### 3.1 Sorgu seti

| Küme | Sorgular |
|---|---|
| Çekirdek | `voltage enerji`, `voltan elektrik` |
| Tüzel | `voltan elektrik toptan satış`, `voltan elektrik a.ş.` |
| Yazım varyantı / hata | `voltaj enerji`, `voltage enerjı`, `woltage enerji`, `volatge enerji`, `voltan enerji`, `voltage elektrik`, `voltage energy turkey` |
| Navigasyonel | `voltage.com.tr`, `voltage enerji iletişim`, `voltage enerji ptf` |

### 3.2 Hedef durum (1. sayfa sahipliği)

Çekirdek sorgularda 1. sayfanın hedef dizilimi:

1. **voltage.com.tr** — sitelink'lerle (Hizmetler, PTF, İletişim, Hakkımızda)
2. **LinkedIn şirket sayfası** (açıldığında)
3. **Google Business Profile / harita paketi** (NAP onayı sonrası)
4. **EPDK/EPİAŞ resmî kayıt görünümü** — otoriter üçüncü taraf teyidi
5. **Doğru adlandırılmış sektör dizinleri** (13–14. satırlar düzeltilmiş hâli)
6. **Crunchbase** (investor-relations sahiplenmiş hâli)

Başarı ölçütü (KPI eşlemesi): çekirdek + tüzel sorgularda ilk 10 sonucun
tamamı "kontrollü veya doğru" yüzey; çelişkili ad taşıyan sonuç sayısı = 0.
Ölçüm: seo-search-console (marka sorgu CTR'ı) + aylık manuel TR-SERP denetimi.

- `voltan elektrik` sorgusu bugün riskli küme: "Volt", "Volta", "Volt Grup",
  "Voltaj" adlı ilgisiz şirketler SERP'e sızıyor (2026-07-27 gözlem).
  Panzehir: tüzel adı taşıyan tutarlı yüzey sayısını artırmak; sitede
  "Voltan Elektrik" geçişlerinin BİRLEŞİK kalıpla korunması.
- Yazım hatası varyantları için ayrı sayfa AÇILMAZ (doorway riski); varyant
  yakalama işi schema `alternateName` + tutarlı dış profiller üzerinden olur.
- İtibar yüzeyi kuralı: marka SERP'ine şikayet platformu girerse yanıt
  "gömme" değil, kök sorunun çözümüdür → bulgu SEO Direktörü üzerinden
  Support'a rotalanır. Sahte yorum/astroturf kesin yasak.

### 3.3 PTF ticker'ı atıf varlığı olarak

Sitedeki canlı PTF verisi, "voltage enerji ptf" tipi navigasyonel sorguları ve
sektör içi atıfları (link) çekebilecek tek mevcut veri varlığıdır. Öneri:
PTF bölümüne sabit çapa (`/#ptf`), sayfa başlığında geçen açık etiket ve
"kaynak: EPİAŞ Şeffaflık" ibaresinin korunması. (Uygulama: webmaster;
genişletme kararı SEO Direktörü'ne.)

---

## 4. seo-schema'ya şema önerileri (yalnız spesifikasyon — dosya düzenlenmedi)

Mevcut JSON-LD sağlam bir taban; istenen delta:

1. **`sameAs` doldurulsun** — yalnızca doğrulanmış, bizim veya resmî kontrolde
   profiller girer. Aday sıra (her biri var/doğru teyidi sonrası eklenir):
   - LinkedIn şirket sayfası URL'i *(açıldığında — bloke: sahip)*
   - X / Instagram / YouTube profil URL'leri *(açıldığında)*
   - `https://www.crunchbase.com/organization/voltage-enerji` *(içerik
     investor-relations tarafından doğrulandıktan sonra)*
   - Wikidata öğe URL'i *(oluşturulduğunda)*
   - EPDK lisans kaydı / EPİAŞ katılımcı sayfası **stabil ve kamuya açık URL
     veriyorsa** — otoriter teyit olarak en değerli `sameAs` adayı
     *(bloke: [SAHİP-ONAYI] kayıt çıktısı)*
   - Kural: şikayet platformları, haber sayfaları, geçici URL'ler `sameAs`'e
     girmez.
2. **`alternateName` genişletilsin:**
   `["Voltan Elektrik", "Voltan Elektrik A.Ş.", "Voltage"]`
   ("Voltan Elektrik A.Ş." eklenir; "Voltan Enerji" ve "Voltage Enerji A.Ş."
   kasıtlı olarak eklenmez — melez adları şemayla meşrulaştırmayız.)
3. **`identifier` alanları (MUST-FILL sonrası):** MERSİS no ve EPDK lisans no
   `PropertyValue` olarak (`propertyID: "MERSIS"`, `propertyID:
   "EPDK Tedarik Lisansı"`). Bilgi paneli hakkı iddiasının en güçlü yapısal
   sinyali. *(Bloke: [SAHİP-ONAYI])*
4. **`foundingDate`:** "2011" sitede yayında; belge dayanağı (sicil gazetesi)
   data-room'a girene kadar **daha spesifik hâle getirilmesin** (tam tarih
   uydurulmaz). Belge gelirse `YYYY-MM-DD`'ye yükseltilir.
5. **`address`:** NAP kararı (Bölüm 1.4) çözülene kadar değiştirilmesin;
   çözülünce şema, footer ve tüm dizinler aynı gün eşitlenir.
6. `logo.url` (`https://voltage.com.tr/logo.png`) gerçekten 200 dönüyor mu —
   seo-schema doğrulasın; kırıksa bilgi paneli logo kaynağı kaybolur.

---

## 5. Bilgi paneli (Knowledge Panel) hazırlık kontrol listesi

Sıralı ve kapılıdır; bir madde tamamlanmadan sonrakine geçilmez.

| # | Adım | Kapı (gate) | Durum |
|---|---|---|---|
| 1 | Tüzel ünvanın sicildeki güncel hâlinin teyidi (İthalat/İhracat dahil mi?) | **[SAHİP-ONAYI]** — sicil/MERSİS çıktısı | BEKLİYOR |
| 2 | Kanonik NAP kararı (Kadıköy ↔ Bağcılar) | **[SAHİP-ONAYI]** | BEKLİYOR |
| 3 | EPDK lisans no + lisans kaydı çıktısı; EPİAŞ katılımcı kaydı teyidi | **[SAHİP-ONAYI]** — MUST-FILL akışı | BEKLİYOR |
| 4 | Kuruluş (2011) belge dayanağı: Ticaret Sicil Gazetesi ilanı data-room'a | **[SAHİP-ONAYI]** | BEKLİYOR |
| 5 | Footer MUST-FILL yer tutucularının gerçek değerlerle değişimi | 1–3 tamam | BEKLİYOR |
| 6 | Şema deltası (Bölüm 4: identifier, alternateName) uygulanır | 5 tamam; uygulayıcı: seo-schema | BEKLİYOR |
| 7 | LinkedIn şirket sayfası + sosyal hesaplar açılır (kanonik dizgilerle) | **[SAHİP-ONAYI: hesap açılışı]**; yürütme: marketing | BEKLİYOR |
| 8 | GBP + Yandex Business doğrulaması | 2 tamam; uygulayıcı: seo-local | BEKLİYOR |
| 9 | Kontrolsüz dizin kayıtları (puan5, elektrikpaketleri, Crunchbase) düzeltilir | 1–2 tamam | BEKLİYOR |
| 10 | `sameAs` dizisi doğrulanmış profillerle doldurulur | 7–9'dan gelenler | BEKLİYOR |
| 11 | Wikidata öğesi resmî sicil referanslarıyla oluşturulur | 3–4 tamam | BEKLİYOR |
| 12 | Bilgi paneli çıkarsa "Bu işletmenin sahibiyim" talebi + panel yönetimi | Panel gözlemlenince | — |
| 13 | Aylık TR-SERP marka denetimi + seo-search-console marka CTR takibi | Sürekli | BAŞLATILACAK |

**Dürüst beklenti:** 1–11 tamamlansa bile panel garantisi yoktur; Google
paneli, tutarlı sinyaller yeterli yoğunluğa ulaştığında kendisi üretir.
Bizim işimiz sinyal tutarlılığını %100'e çekmek ve süreci ölçmektir.

---

## 6. Sahibe bağlı blokerler (özet)

1. **Tüzel ünvan teyidi** — sicildeki güncel ünvan (CLAUDE.md ↔ site çelişkisi).
2. **Kanonik adres kararı** — Kadıköy/Acıbadem mi, Bağcılar mı; taşınma
   geçmişi.
3. **EPDK tedarik lisansı no + kayıt çıktısı** (bu ortamdan sorgulanamadı).
4. **MERSİS no ve Ticaret Sicil no** (footer MUST-FILL).
5. **2011 kuruluş belgesi** (Ticaret Sicil Gazetesi ilanı) — data-room.
6. **EPİAŞ katılımcı kaydı** teyidi (kayıtlı ünvan hangisi?).
7. **Sosyal hesap açılışları** (LinkedIn öncelikli) ve `voltageenerji`
   kullanıcı adı müsaitliği.
8. **Crunchbase profili sahipliği** — mevcut kaydı kim açtı, içerik doğru mu.

Bloklar çözülmeden: dizinlere NAP yayılımı yok, `sameAs`/`identifier`
değişikliği yok, Wikidata yok. Yayılabilir tek şey bu playbook'taki
adlandırma kurallarının **sahipli yüzeylerde** (site metni) uygulanmasıdır.

---

*Dağıtım: SEO Direktörü (onay), seo-schema (Bölüm 4), seo-local (Bölüm 1.4,*
*2, 5/8–9), marketing (sosyal), investor-relations (Crunchbase, data-room),*
*legal-compliance (sicil/lisans teyitleri), Support (itibar bulgu rotası).*
