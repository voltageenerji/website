# GBP VE DİZİN PAKETİ — Yürütme Talimatı

**Hazırlayan:** seo-local (Seviye 4, SEO birimi)
**Rapor hattı:** SEO Direktörü → Orchestrator
**Tarih:** 2026-08-05 · Sürüm 1.0
**Kapsam:** Google İşletme Profili kurulumu, dizin kayıt/düzeltme listesi,
yapıştır-hazır künye blokları, tutarlılık kuralı ve takip tablosu.
**Site değişikliği:** YOK. Bu belge yalnızca dış yüzeylerde yürütülür.

> **Bu belge nasıl kullanılır:** Her adım tek bir işlemdir; sırayla yürütülür.
> `ALAN → DEĞER` biçimindeki satırlarda sağdaki metin **birebir** (kopyala-yapıştır)
> girilir. Yeniden yazılmaz, kısaltılmaz, "daha iyi" hâle getirilmez. Bir alanın
> değeri `[SAHİP DOLDURACAK: …]` ise o alan boş bırakılır ve adım **BEKLEMEDE**
> işaretlenir — tahmini değer girilmez.

---

## 0. Ön koşullar ve sahibe bağlı blokerler

### 0.1 Kanonik NAP (sahip onaylı, 2026-08-05) — her yüzeyde birebir

| Alan | Değer |
|---|---|
| İşletme adı (marka) | `Voltage Enerji` |
| Tüzel kişilik | `Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.` |
| Adres | `Acıbadem Mah. Elysium Elit Koşuyolu B-18, 34660 Kadıköy / İstanbul / Türkiye` |
| Web | `https://voltage.com.tr` |
| E-posta | `info@voltage.com.tr` |
| LinkedIn | `https://www.linkedin.com/company/voltage-enerji/` |
| EPDK tedarik lisansı | `ETS/3424-8/2074` (19.09.2011) |
| Ticaret sicil no | `786882-0` İstanbul |
| Telefon | `[SAHİP DOLDURACAK: kurumsal telefon]` |

**Adres alan-alan dökümü** (dizinler adresi parçalı ister):

| Alan | Değer |
|---|---|
| Cadde/Sokak/Bina | `Acıbadem Mah. Elysium Elit Koşuyolu B-18` |
| İlçe | `Kadıköy` |
| İl | `İstanbul` |
| Posta kodu | `34660` |
| Ülke | `Türkiye` (ISO: `TR`) |

### 0.2 BLOKER — telefon numarası

Telefon numarası bugün sitede yayınlı değil ve bu belgenin **en kritik eksiğidir**.

- **GBP açısından pratikte zorunludur.** Numara olmadan: (a) telefon/SMS doğrulama
  yöntemi hiç sunulmaz, geriye posta kartı ve video doğrulama kalır — ikisi de
  günler-haftalar sürer; (b) profildeki **"Ara"** düğmesi hiç oluşmaz — bu bizim
  birincil yerel KPI'ımız olan "nitelikli çağrı" metriğini sıfırlar; (c) NAP'ın
  "P"si (Phone) boş kalır, dizinler arası eşleşme zayıflar.
- Ayrıca `Yandex Business` kaydı **SMS doğrulaması** üzerinden ilerler; numarasız
  Yandex kaydı tamamlanamaz.
- **Sahip aksiyonu:** kurumsal sabit hat (tercihen `+90 216 …` — İstanbul Anadolu
  yakası alan kodu, adresle tutarlı) numarasını teyit et. Format her yerde
  uluslararası ve aynı olacak: `+90 216 XXX XX XX`.
- **Not (arşiv bulgusu, doğrulanmamış):** ENTITY-PLAYBOOK 2026-07-27 kaydında
  sitede `+90-216-479-0510` numarası görünüyordu. Bu numara hâlâ geçerliyse
  doğrudan kullanılabilir; **sahip teyit etmeden kullanılmaz.**

### 0.3 BLOKER — adresin "mağaza vitrini" niteliği (Bölüm 1.C kararı için)

Google, adresi herkese açık gösteren işletmeden **kalıcı tabela** ve **o adreste
müşteri kabulü** bekler. Elysium Elit karma kullanımlı bir kompleks; `B-18`
biriminin ticari ofis olarak tabelalı olup olmadığını yalnızca sahip bilir.
Sahip iki soruyu yanıtlamadan Bölüm 1.C uygulanmaz:

1. Binada/katta/kapıda kalıcı **"Voltage Enerji"** tabelası var mı? (E/H)
2. Müşteriler (kurumsal muhataplar) randevuyla bu adreste kabul ediliyor mu? (E/H)

### 0.4 Diğer ön koşullar

- Google hesabı: **`info@voltage.com.tr`** alan adı hesabı ile giriş yapılır.
  Kişisel Gmail ile açılan profil devir sorunu üretir; kurumsal hesap kullanılır.
- Profilin **birincil sahibi (Primary owner)** kurumsal hesap olur; ajans/danışman
  yalnızca "Yönetici (Manager)" seviyesinde eklenir. Sahiplik dışarı verilmez.

---

## 1. Google İşletme Profili (GBP) kurulumu

### 1.A Profili oluştur

1. `https://business.google.com/` → `info@voltage.com.tr` hesabıyla giriş.
2. **Önce ara:** arama kutusuna sırayla `Voltage Enerji`, `Voltan Elektrik`,
   `Voltan Elektrik Toptan Satış` yaz. Google'ın otomatik ürettiği (unclaimed)
   bir kayıt çıkarsa **yeni profil açma** — o kaydı "Bu işletmeyi talep et /
   Sahiplen" ile al. Yeni profil açmak yinelenen kayıt (duplicate) üretir ve
   ikisi birden askıya alınabilir.
3. Kayıt yoksa: **"İşletme ekle" → "İşletmenizin adını girin"**.

```
İşletme adı → Voltage Enerji
```

> **YASAK:** `Voltage Enerji Elektrik Tedarikçisi`, `Voltage Enerji İstanbul`,
> `Voltage Enerji A.Ş.`, `Voltan Enerji` — hiçbiri yazılmaz. İşletme adı alanına
> anahtar kelime/lokasyon eklemek Google'ın adlandırma kuralının açık ihlalidir
> ve lisanslı bir tedarikçide askıya alma (suspension) sebebidir. Ad alanına
> **yalnızca marka** girer.

### 1.B Kategori seçimi

Kategori adları Google tarafındaki canlı listeden gelir; **açılır menüde ne
yazıyorsa o seçilir**. Kategori kutusuna `elektrik` ve ardından `enerji` yazıp
çıkan seçenekleri oku, aşağıdaki öncelik sırasına göre seç:

| Sıra | Aday birincil kategori (TR arayüz) | İngilizce karşılığı | Güven |
|---|---|---|---|
| 1 | `Elektrik hizmeti sağlayıcısı` | Electric utility company | Yüksek — GBP kategori listelerinde `Electric utility company` doğrulandı |
| 2 | `Enerji şirketi` / `Enerji ekipmanları ve çözümleri` | Energy company / Energy equipment and solutions | Orta — TR arayüzde varlığı teyit edilemedi |
| 3 | `Elektrik tedarikçisi` | Electricity supplier | Düşük — ayrı bir kategori olarak listelerde görülmedi; menüde çıkarsa 1. tercihtir |

**Birincil kategori kararı:** Menüde `Elektrik tedarikçisi` çıkarsa onu seç;
çıkmazsa `Elektrik hizmeti sağlayıcısı`. İkisi de yoksa `Enerji şirketi`.

**Ek kategoriler (en fazla 9, yalnızca gerçekten yapılan iş):**
- `Enerji danışmanı` / `Enerji danışmanlığı` (menüde hangisi varsa)
- `Toptancı` veya `Elektrik ekipmanı toptancısı` — **yalnızca** menüde daha
  spesifik bir toptan-enerji kategorisi varsa; yoksa eklenmez.

> **YASAK kategoriler:** `Elektrikçi`, `Elektrik tesisatı hizmeti`,
> `Elektrik tamiri` — bunlar tesisatçı/tamirci niyetidir. Seçilirse profil,
> "elektrikçi arıyorum" sorgularına düşer; B2B nitelikli çağrı oranı çöker ve
> kategori-faaliyet uyumsuzluğu kalite incelemesi tetikler.

> **Uyarı:** Birincil kategori değişikliği Google'da yeniden doğrulama
> tetikleyebilir. Kategoriyi ilk seferde doğru seç, sonra oynama.

### 1.C Adres mi, hizmet alanı mı (KARAR ADIMI)

Bölüm 0.3'teki iki soruyu yanıtla, sonucu uygula:

**Senaryo 1 — İkisi de EVET (tabela var + müşteri kabul ediliyor):**
→ **Hibrit yapılandırma.** Adres herkese açık gösterilir **ve** hizmet bölgesi
eklenir. Tercih edilen senaryodur: görünen adres, sitedeki JSON-LD `address`
ve tüm dizin kayıtlarıyla birebir eşleşerek varlık (entity) konsolidasyonunu
en güçlü şekilde besler; harita paketinde İstanbul sorgularında yer verir.

```
"Müşteriler işletmenizin adresini ziyaret edebilir mi?" → Evet
Adres → Acıbadem Mah. Elysium Elit Koşuyolu B-18
İlçe/İl → Kadıköy, İstanbul
Posta kodu → 34660
Ülke → Türkiye
"Ayrıca müşterilere onların konumunda hizmet veriyor musunuz?" → Evet
Hizmet bölgesi → Türkiye
```

**Senaryo 2 — Herhangi biri HAYIR:**
→ **Hizmet alanı işletmesi (SAB).** Adres doğrulama için girilir ama
**gizlenir**; yalnızca hizmet bölgesi gösterilir.

```
"Müşteriler işletmenizin adresini ziyaret edebilir mi?" → Hayır
Adres (yalnızca doğrulama için, gizli) → Acıbadem Mah. Elysium Elit Koşuyolu B-18, 34660 Kadıköy, İstanbul
Hizmet bölgesi → Türkiye
```

> **Neden bu kadar önemli:** Müşteri kabul etmeyen bir adresi herkese açık
> göstermek, Google'ın en sık uyguladığı askıya alma gerekçelerinden biridir.
> Lisanslı bir tedarikçi markasında askıya alınmış profil, kazanılan görünürlükten
> daha pahalıya mal olur. Şüphe varsa **Senaryo 2 seçilir** — güvenli taraf odur.

**Hizmet bölgesi neden "Türkiye"?** Voltage, EPDK tedarik lisansıyla ülke
genelinde serbest tüketiciye tedarik edebilir; hizmet coğrafyası gerçekten
Türkiye'dir. Öncelikli koridorlar (İstanbul, Kocaeli, Bursa, Trakya, Marmara
OSB'leri) **ayrı şube kaydıyla değil**, sitedeki bölge/sektör içeriğiyle
yakalanır. Sahte şube açılmaz — bkz. Bölüm 4.2.

### 1.D Doğrulama

Google, hesaba ve işletmeye göre farklı yöntemler sunar; **sunulanlar arasından**
şu sırayla seç:

| Öncelik | Yöntem | Süre | Not |
|---|---|---|---|
| 1 | E-posta (`@voltage.com.tr`) | dakikalar | Alan adı e-postası varsa sunulabilir; en hızlısı |
| 2 | Telefon / SMS | dakikalar | **Bloke:** 0.2'deki numara gelmeden kullanılamaz |
| 3 | Video kaydı | 1–5 gün | SAB ve yeni kayıtlar için en yaygın yöntem; aşağıdaki çekim listesi |
| 4 | Posta kartı | 5–14 iş günü | Adres gösterilen (Senaryo 1) kurulumda standart; kart `Voltage Enerji` adına gelir, tesliminde kaybolmaması için resepsiyon/posta kutusu uyarılır |

**Video doğrulama çekim listesi (tek kesintisiz çekim, telefon kamerası):**
1. Bina dış cephesi ve sokak/kapı numarası
2. Bina girişi → kat → kapıdaki `Voltage Enerji` tabelası/levhası
3. Ofis içi: çalışan masaları, ekranlar, faaliyetin gerçek olduğunu gösteren ortam
4. İşletme adına düzenlenmiş bir belge: kira sözleşmesi, kurumsal fatura veya
   **EPDK lisans belgesi** (`ETS/3424-8/2074`) — lisans belgesi en güçlü kanıttır
5. Yönetim erişimi: bilgisayarda GBP paneline giriş

> Video kurgulanmaz, kesilmez, stok görüntü eklenmez. Tek çekim.

### 1.E İletişim ve web bilgileri

```
Telefon (birincil) → [SAHİP DOLDURACAK: kurumsal telefon, +90 216 XXX XX XX]
Web sitesi        → https://voltage.com.tr/?utm_source=gbp&utm_medium=organic&utm_campaign=isletme_profili
Randevu/teklif linki (varsa alan) → https://voltage.com.tr/?utm_source=gbp&utm_medium=organic&utm_campaign=isletme_profili#iletisim
```

- UTM'li link **yalnızca GBP'ye** girer; sitede, dizinlerde, LinkedIn'de UTM'siz
  kanonik `https://voltage.com.tr` kullanılır. Aksi hâlde analitikte kanal
  kirliliği ve dizinlerde tutarsız URL oluşur.
- GBP'de e-posta alanı yoktur; `info@voltage.com.tr` **işletme açıklamasının**
  son cümlesinde geçer (Bölüm 3'teki bloklarda hazır).

### 1.F Açılış saatleri

```
Pazartesi–Cuma → 09:00 – 18:00
Cumartesi      → Kapalı
Pazar          → Kapalı
```

- Sahip farklı çalışıyorsa gerçek saatler girilir. **Enerji masasının piyasa
  takibi 7/24 diye "24 saat açık" yazılmaz** — telefonun gerçekten açılmadığı
  saat profilde açık görünürse, cevapsız çağrı hem müşteri hem sıralama
  kaybıdır ve Google "yanlış saat" düzeltme önerisi üretir.
- **Özel günler:** resmî tatiller (Ramazan/Kurban Bayramı, 29 Ekim vb.) için
  "Özel saatler" bölümünden kapalı işaretlenir. Yılda bir kez, Aralık ayında
  gelecek yılın tatilleri toplu girilir.

### 1.G Hizmetler listesi (site `#hizmetler` bölümüyle birebir)

"Hizmetler" sekmesinde **özel hizmet** olarak sırayla ekle. Ad + açıklama
birebir aşağıdaki gibidir (site metniyle aynı; sapma yok):

| # | Hizmet adı | Açıklama (GBP hizmet açıklaması) |
|---|---|---|
| 01 | `Endüstriyel Elektrik Tedariki` | `Yüksek tüketimli tesisler için ikili anlaşma bazlı sabit fiyat veya endeksli model ile uzun vadeli elektrik tedariki.` |
| 02 | `GÖP ve GİP Operasyonu` | `EPİAŞ piyasasında aktif katılım; Gün Öncesi ve Gün İçi piyasalarında disiplinli pozisyon yönetimi ve dengeleme.` |
| 03 | `Portföy Yönetimi` | `Fiyat risklerine karşı hedging stratejileri, tüketim profili analizi ve müşteriye özel enerji bütçeleme.` |
| 04 | `Yenilenebilir Enerji Tedariki (YEK-G)` | `YEK-G belgeli yeşil enerji tedariği ile kurumsal sürdürülebilirlik hedeflerini doğrulanabilir şekilde karşılama.` |
| 05 | `Enerji Danışmanlığı` | `Fatura analizi, sözleşme yapılandırması ve piyasa geçişleri için uçtan uca stratejik danışmanlık.` |
| 06 | `Serbest Tüketici Geçiş Desteği` | `Serbest tüketici statüsündeki işletmeler için tedarikçi değişim sürecinin uçtan uca yürütülmesi.` |
| 07 | `OSB Katılımcısı Elektrik Tedariki` | `OSB katılımcısı tesisler için OSB tarifesi ile ikili anlaşma karşılaştırması ve tedarik kurgusu.` |
| 08 | `Yenilenebilir Üretici Portföy Hizmetleri` | `GES ve RES üreticileri için üretim tahmini, dengesizlik yönetimi ve YEK-G belgelendirme desteği.` |

> 06–08 sitede rehber sayfası olarak zaten yayında olan gerçek hizmetlerdir
> (`/rehber/serbest-tuketici`, `/rehber/osb-elektrik-tedariki`,
> `/rehber/yenilenebilir-ureticiler`). Yayında karşılığı olmayan hiçbir hizmet
> eklenmez.

### 1.H İşletme açıklaması (750 karakter, yapıştır-hazır)

"İşletmeden" (From the business) alanına **birebir** yapıştır — Bölüm 3.3'teki
UZUN blok ile aynı metindir, tek kaynaktan yönetilir.

> **Kural:** Metinde tasarruf yüzdesi/tutarı, "en ucuz", "%X indirim" gibi hiçbir
> vaat yoktur ve eklenmez. Fiyatlandırma sözleşme bazlıdır; kamuya açık tasarruf
> vaadi Pricing + Legal & Compliance onayı olmadan hiçbir yüzeye çıkmaz.

### 1.I Fotoğraf ve logo

| Slot | Kaynak | Not |
|---|---|---|
| Logo | `/home/user/website/logo.png` (512×512) | GBP min. 250×250; hazır, doğrudan yüklenir |
| Kapak | `/home/user/website/og-image.jpg` | GBP min. 480×270, 16:9 tercih; yükleme sonrası kırpma önizlemesinde marka adının kesilmediği doğrulanır |
| Dış cephe | **[SAHİP ÇEKECEK]** | Bina girişi + tabela. Adres gösterilen kurulumda (Senaryo 1) haritada bulunabilirlik için kritik |
| İç mekân | **[SAHİP ÇEKECEK]** | Ofis/çalışma alanı, 2–3 kare |
| Ekip | **[SAHİP ÇEKECEK]** | 1–2 kare, opsiyonel |

> **YASAK:** İnternetten alınmış iletim hattı/trafo/rüzgâr türbini stok
> görselleri "tesisimiz" gibi yüklenmez. Voltage üretim veya dağıtım varlığı
> işletmiyor; sahip olmadığımız altyapının fotoğrafı yanlış sinyaldir ve
> kullanıcı bildirimiyle kaldırılır.

### 1.J Kurulum sonrası — ilk 30 gün

1. **Yorum politikası:** Yorum yalnızca gerçek müşteriden, gerçek hizmet
   sonrasında istenir. Talep akışı **Lifecycle CRM** üzerinden (SEO Direktörü
   rotasıyla) kurulur; toplu/ücretli/karşılıklı yorum kesin yasaktır. Gelen her
   yorum 48 saat içinde, tekil ve şablonsuz yanıtlanır. Olumsuz yorum silinmeye
   çalışılmaz — kök sorun Support'a rotalanır.
2. **Soru-Cevap:** Profilin S-C bölümüne sahip hesabıyla 5 gerçek soru sorulup
   yanıtlanır (Google'ın izin verdiği ve önerdiği kullanım):
   - `Serbest tüketici miyim, tedarikçimi seçebilir miyim?`
   - `Tedarikçi değiştirirken elektriğim kesilir mi, sayacım değişir mi?`
   - `OSB katılımcısıyım, tedarikçimi seçebilir miyim?`
   - `Fiyatlandırma nasıl belirleniyor?` → yanıt: sözleşme bazlı, formül
     sözleşmede yazılı; **rakam verilmez**
   - `YEK-G belgeli yeşil enerji tedarik ediyor musunuz?`
   Yanıtlar ilgili rehber sayfasına link verir.
3. **İzleme:** Bölüm 5'teki metrikler 30. günde ilk kez raporlanır.

---

## 2. Dizin kayıt / düzeltme listesi

**URL doğrulama notu:** Bu ortamdan doğrudan sayfa çekimi (403) engellendi;
aşağıdaki URL'ler **canlı arama sonuçlarında 2026-08-05 itibarıyla görülerek**
doğrulanmıştır. `[D]` = doğrulandı, `[T]` = kök alan adı biliniyor ama kayıt
akışı sahip girişinde teyit edilecek. Sahip, açılmayan bir URL'de tahminde
bulunmaz; satırı "ERİŞİLEMEDİ" işaretleyip geçer.

### 2.1 Harita ve arama platformları (öncelik: kritik)

| # | Platform | URL | İşlem | Süre | Öncelik | Not |
|---|---|---|---|---|---|---|
| 1 | Google İşletme Profili | `https://business.google.com/` `[D]` | Yeni kayıt veya mevcut kaydı sahiplenme | 45 dk + doğrulama | **P0** | Bölüm 1'in tamamı. Telefona bloke değil ama telefon gelmeden "Ara" aksiyonu yok |
| 2 | Yandex Business (Yandex Haritalar) | `https://yandex.com.tr/business/` `[D]` | Yeni kayıt | 30 dk | **P0** | TR'de Google'dan sonraki ikinci harita yüzeyi. **SMS doğrulaması zorunlu → telefona bloke** |
| 3 | Apple Business (eski adıyla Business Connect) | `https://businessconnect.apple.com/` `[D]` | Yeni kayıt | 30 dk | **P1** | Apple, Nisan 2026'da Business Connect/Business Manager'ı tek platformda birleştirdi; 200+ ülke kapsamında. iPhone kullanan kurumsal alıcı için Apple Maps görünürlüğü |
| 4 | Bing Places for Business | `https://www.bingplaces.com/` `[D]` | Yeni kayıt (GBP'den içe aktarma seçeneğiyle) | 15 dk | **P1** | GBP tamamlandıktan **sonra** yapılır; Bing, GBP kaydını içe aktarabilir. Bazı ülkelerde özellik kısıtı olabilir — açılışta teyit et |

### 2.2 Resmî / oda kayıtları (öncelik: otoriter teyit)

| # | Platform | URL | İşlem | Süre | Öncelik | Not |
|---|---|---|---|---|---|---|
| 5 | İstanbul Ticaret Odası (İTO) | `https://www.ito.org.tr/` `[D]` · sorgu: `https://www.ticaretsicil.gov.tr/view/hizlierisim/unvansorgulama.php` `[D]` | Üye kaydındaki ünvan/adres/NACE bilgisinin **güncelliğini teyit et**, sapma varsa oda üzerinden düzelt | 30 dk + oda süreci | **P0** | Ticaret sicil `786882-0` ile sorgula. Buradaki ünvan tüm dizinlerde referanstır; buradan sapan hiçbir yazım kullanılmaz |
| 6 | EPDK Lisans Sorgu | `https://www.epdk.gov.tr/Detay/Icerik/3-0-0-140/elektrik-lisanslar` `[D]` | Kayıt değil — `ETS/3424-8/2074` kaydının **kamuya açık kalıcı URL'i** var mı, çıktısını al | 20 dk | **P0** | Kalıcı URL varsa `sameAs` adayı olarak seo-schema'ya rotalanır (varlık teyidinin en güçlü kaynağı) |
| 7 | EPİAŞ piyasa katılımcıları listesi | `https://seffaflik.epias.com.tr/` `[T]` | Kayıtlı katılımcı ünvanını teyit et | 20 dk | **P1** | EPİAŞ'ta kayıtlı ünvan ile sicildeki ünvan farklıysa **bu bir tutarlılık bulgusudur** → SEO Direktörü'ne raporla |

### 2.3 Sektör ve B2B dizinleri (öncelik: kayıt/genişleme)

| # | Platform | URL | İşlem | Süre | Öncelik | Not |
|---|---|---|---|---|---|---|
| 8 | Enerji Atlası — Elektrik Tedarik Şirketleri | `https://www.enerjiatlasi.com/elektrik-tedarik-sirketleri` `[D]` | Listede `Voltan`/`Voltage` var mı kontrol et → yoksa ekleme talebi, varsa ünvan düzeltme | 20 dk | **P1** | TR enerji sektörünün en çok atıf alan dizinlerinden. Lisanslı tedarikçi listesinde yer almak kategori teyididir |
| 9 | Elektrikport Sektör Rehberi | `https://www.elektrikport.com/sektor-rehberi/firma-listesi` `[D]` | Firma kaydı | 25 dk | **P2** | Mühendislik/sektör portalı; B2B okur kitlesi |
| 10 | Enerji Ajansı Firma Rehberi | `https://firma.enerjiajansi.com.tr/firma-listesi/` `[D]` | Firma kaydı | 20 dk | **P2** | Sektörel dizin |
| 11 | Kompass Türkiye | `https://tr.kompass.com/registerNewCompany/identity/` `[D]` | Ücretsiz firma kaydı | 30 dk | **P2** | 70+ ülke B2B veritabanı; ücretsiz planda tek dil (TR) profil. Ücretli pakete geçilmez |
| 12 | Europages (TR) | `https://promote-your-business.europages.com/TR/inscription-gratuite.html` `[D]` | Ücretsiz B2B kaydı | 30 dk | **P2** | Yalnız B2B firma kabul eder — Voltage uygundur. Ücretsiz planda logo + profil |
| 13 | Encazip — Elektrik Tedarikçileri | `https://www.encazip.com/elektrik-tedarikcileri` `[D]` | Listede var mı kontrol et → yoksa tedarikçi ekleme talebi | 20 dk | **P1** | TR'de tedarikçi karşılaştırma trafiğinin ana yüzeyi; nitelikli B2B/serbest tüketici niyeti taşır |

### 2.4 Mevcut kayıtların düzeltilmesi (öncelik: tutarsızlık temizliği)

| # | Platform | URL | İşlem | Süre | Öncelik | Not |
|---|---|---|---|---|---|---|
| 14 | Crunchbase | `https://www.crunchbase.com/organization/voltage-enerji` `[D]` | **Kaydı sahiplen + düzelt** | 45 dk | **P1** | Playbook'ta tutarsız ad tespiti var. Profili kim açtı bilinmiyor. Adım: "Claim this profile" → doğrulama → `Legal name` = TÜZEL-KISA, `Name` = `Voltage Enerji`, adres/web/kuruluş 2011 düzeltilir. Sahipliği **investor-relations** üstlenir; NAP dizgileri buradan verilir |
| 15 | puan5.com | `https://www.puan5.com/` `[T]` — kayıt sayfası arama ile bulunur | **Ad düzeltme talebi** | 20 dk | **P2** | Mevcut başlık hatalı: `"…İthalat İhracat A.ş."` — "ve" eksik, `A.ş.` yanlış. Doğrusu Bölüm 3.1 BİRLEŞİK bloğu. İletişim/düzeltme formundan talep gönder |
| 16 | elektrikpaketleri.com | `https://www.elektrikpaketleri.com/` `[D]` | **Ad düzeltme talebi** | 20 dk | **P2** | Mevcut kayıtta `"Ve"` hatalı büyük harf. Doğrusu: `Voltan Elektrik Toptan Satış İthalat ve İhracat Anonim Şirketi` |
| 17 | LinkedIn şirket sayfası | `https://www.linkedin.com/company/voltage-enerji/` `[D]` | **Mevcut sayfanın NAP alanlarını hizala** | 30 dk | **P1** | Sayfa açık ve teyitli. `Sayfa adı` = `Voltage Enerji`, `Legal name` = TÜZEL-KISA, `Website` = `https://voltage.com.tr`, `Merkez` = kanonik adres, `Sektör` = `Elektrik, Petrol ve Gaz` (veya menüdeki en yakın enerji sektörü), `Kuruluş yılı` = `2011`, `Hakkında` ilk cümlesi = BİRLEŞİK. Sayfa sahipliği **marketing**'te; bu satır spesifikasyondur, uygulayan marketing |
| 18 | Şikayetvar | `https://www.sikayetvar.com/` `[T]` | **Savunma amaçlı marka hesabı** — açılış kararı | 30 dk | **P3** | Marka sayfası bugün gözlemlenmedi. Karar sahibindir: hesap açmak, şikayet gelirse yanıt hakkını önceden almak demektir. Yorum silme/gömme aracı olarak kullanılmaz. **Support ile birlikte kararlaştırılır** |

### 2.5 Değerlendirilen, bugün YAPILMAYACAK olanlar (gerekçeli)

| Platform | Karar | Gerekçe |
|---|---|---|
| **Wikidata** (`https://www.wikidata.org/`) | **Ertelendi** | Wikidata eşiği Wikipedia'dan düşüktür ama sıfır değildir: öğe, güvenilir yayınlanmış kaynaklara veya "structural need"e dayanmalıdır. Bugün elde EPDK lisans kaydı ve ticaret sicil no var — bu iki resmî sicil referansı **öğe açmaya yeter olabilir**, ancak marka öğeleri rutin olarak siliniyor ve silinen öğe kalıcı kötü sicildir. **Doğru sıra:** önce 2.2'deki EPDK/EPİAŞ kalıcı URL'leri elde edilir, sonra Wikidata öğesi **yalnızca bu resmî referanslarla** açılır. Sahip/seo-brand-entity kararı; bu paketin kapsamı dışında |
| **Wikipedia (TR)** | **Yapılmayacak** | Bağımsız ikincil kaynak stoku yok. Madde açma denemesi silinme + kalıcı sicil riskidir (ENTITY-PLAYBOOK Bölüm 2 notu) |
| **TOBB Sanayi Veri Tabanı** (`https://sanayi.tobb.org.tr/`) | **Uygun değil** | Veritabanı **kapasite raporu** olan üretici firmalardan oluşur. Voltage üretim tesisi işletmeyen bir tedarik/toptan satış şirketidir; kapasite raporu yoktur. Uygun olmadığımız bir sicile kayıt zorlamak yanlış sinyaldir |
| **Yerel "şube" GBP kayıtları** (Kocaeli, Bursa, Trakya) | **Yasak** | Bu illerde fiziksel ofis ve orada çalışan personel yok. Sahte şube = sahte sinyal = askıya alma. Bölgesel talep, hizmet bölgesi + site içeriğiyle karşılanır (Bölüm 4.2) |
| **Google Haritalar'a ikinci/yinelenen kayıt** | **Yasak** | Yinelenen kayıt her iki profili de riske atar; mevcut kayıt varsa sahiplenilir, açılmaz |

**Toplam:** 18 hedef satır (13 kayıt/hizalama + 5 düzeltme/karar) + 5 gerekçeli
"yapılmayacak" kararı.

---

## 3. Yapıştır-hazır künye blokları

Bu bölüm **tek doğruluk kaynağıdır**. Bir platformda alan sınırı ne ise ona en
yakın blok seçilir; blok **kısaltılmaz, yeniden yazılmaz**. Yeni bir metin
gerekiyorsa önce bu belge güncellenir, sonra platforma girilir.

### 3.1 Ad blokları

```
MARKA
Voltage Enerji
```

```
TÜZEL-KISA
Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.
```

```
TÜZEL-UZUN
Voltan Elektrik Toptan Satış İthalat ve İhracat Anonim Şirketi
```

```
BİRLEŞİK  (dizinlerin "firma adı" alanı için varsayılan)
Voltage Enerji (Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.)
```

**Yazım yasakları (her yüzeyde):** `Voltage Enerji A.Ş.` ❌ · `Voltan Enerji` ❌ ·
`Ve`/`VE` büyük harfle ❌ (doğrusu `ve`) · `A.ş.` / `AŞ` ❌ (doğrusu `A.Ş.`) ·
`voltageenerji.com`, `voltan.com.tr` ❌ (tek kanonik: `voltage.com.tr`).

### 3.2 Tek satır künye (imza / dipnot alanları)

```
Voltage Enerji (Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.) · Acıbadem Mah. Elysium Elit Koşuyolu B-18, 34660 Kadıköy / İstanbul / Türkiye · [SAHİP DOLDURACAK: kurumsal telefon] · https://voltage.com.tr · info@voltage.com.tr
```

### 3.3 Açıklama blokları

**KISA — 150 karakter sınırı için (Twitter/X bio, dizin özet alanı):**

```
2011'den bu yana EPDK lisanslı elektrik tedarikçisi. Kurumsal ve endüstriyel tesislere GÖP, GİP ve ikili anlaşma üzerinden elektrik tedariki.
```
*(141 karakter)*

**ORTA — 300 karakter sınırı için (LinkedIn tagline, B2B dizin özeti):**

```
Voltage Enerji (Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.), 2011'den bu yana EPDK tedarik lisanslı elektrik tedarik şirketidir. Kurumsal ve endüstriyel tesislere Gün Öncesi (GÖP), Gün İçi (GİP) ve ikili anlaşmalar üzerinden elektrik tedarik eder; portföy ve fiyat riski yönetimi sunar.
```
*(296 karakter)*

**UZUN — 750 karakter sınırı için (GBP işletme açıklaması, Kompass/Europages
"hakkında", Crunchbase description):**

```
Voltage Enerji (Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.), 2011'den bu yana EPDK tedarik lisansıyla çalışan bir elektrik tedarik şirketidir. Serbest tüketici statüsündeki kurumsal ve endüstriyel işletmelere Gün Öncesi (GÖP), Gün İçi (GİP) ve ikili anlaşmalar üzerinden elektrik tedarik ediyoruz.

Hizmetlerimiz: endüstriyel elektrik tedariki, GÖP ve GİP operasyonu, portföy ve fiyat riski yönetimi, YEK-G belgeli yenilenebilir enerji tedariki ve enerji danışmanlığı. Tekstil, demir-çelik, kimya, cam-seramik, veri merkezi, soğuk zincir ve OSB tesislerinin yük profiline göre sabit, PTF endeksli veya hibrit modeller kuruyoruz.

Merkez: Kadıköy, İstanbul. Hizmet bölgesi: Türkiye geneli. Teklif için: info@voltage.com.tr
```
*(731 karakter — GBP 750 sınırının altında)*

> Üç blokta da tasarruf yüzdesi/tutarı, "en ucuz", "garanti" ifadesi **yoktur**.
> Böyle bir ifade eklenmesi gerekirse önce Pricing doğrulaması + Legal &
> Compliance onayı alınır (SEO Direktörü rotası).

**İngilizce karşılık (yalnızca EN alan zorunluysa; tüzel ünvan çevrilmez):**

```
Voltage Enerji (Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.) is an EPDK-licensed Turkish electricity supplier operating since 2011. We supply corporate and industrial consumers via the day-ahead market (GÖP), intraday market (GİP) and bilateral contracts, and provide portfolio and price-risk management, YEK-G certified renewable supply, invoice analysis and energy advisory. Headquarters: Kadıköy, İstanbul. Service area: Türkiye. Contact: info@voltage.com.tr
```

### 3.4 Anahtar kelime listesi (dizinlerin "etiket/anahtar kelime" alanları için)

Yalnızca **ayrı etiket alanı olan** platformlarda kullanılır. Açıklama metnine
veya işletme adına doldurulmaz.

**Birincil (her platformda ilk 5):**
`elektrik tedarikçisi` · `kurumsal elektrik tedariki` · `endüstriyel elektrik`
· `serbest tüketici` · `elektrik tedarik şirketi`

**İkincil:**
`ikili anlaşma elektrik` · `GÖP` · `GİP` · `EPİAŞ` · `PTF` · `portföy yönetimi`
· `enerji danışmanlığı` · `YEK-G` · `yeşil enerji tedariki` · `OSB elektrik
tedariki` · `tedarikçi değiştirme` · `elektrik toptan satış`

**Sektörel (uzun kuyruk, alan izin veriyorsa):**
`tekstil elektrik` · `demir çelik elektrik` · `kimya tesisi elektrik` · `veri
merkezi elektrik` · `soğuk zincir elektrik` · `cam seramik elektrik`

**Bölgesel:** `elektrik tedarikçisi istanbul` · `elektrik tedarikçisi kocaeli` ·
`elektrik tedarikçisi bursa` — **yalnızca etiket alanına**; işletme adına,
başlığa veya adres alanına **asla** girmez.

### 3.5 Kategori eşlemeleri (platform bazında)

| Platform | Girilecek kategori | Yedek |
|---|---|---|
| Google İşletme Profili | `Elektrik tedarikçisi` → yoksa `Elektrik hizmeti sağlayıcısı` | `Enerji şirketi` |
| Yandex Business | `Elektrik tedarik şirketi` / `Enerji şirketi` (menüde olan) | `Toptan ticaret` |
| Apple Business | `Business Services` → `Utilities` / `Energy` | `Professional Services` |
| Bing Places | GBP'den içe aktarıldıysa otomatik; değilse `Utilities` → `Electric Company` | `Business Services` |
| LinkedIn | Sektör: `Elektrik, Petrol ve Gaz` (Utilities / Oil & Gas) | `Enerji Hizmetleri` |
| Crunchbase | `Energy`, `Electric Utilities`, `Commodity Trading` | `Renewable Energy` |
| Kompass / Europages | NACE ile eşleşen: **elektrik ticareti / elektrik toptan satışı** | `Energy — Electricity trading` |
| Enerji Atlası / Elektrikport / Enerji Ajansı | `Elektrik Tedarik Şirketi` | `Enerji Ticareti` |

> Kategori menüsünde bu adların hiçbiri yoksa: **en yakın üst kategori** seçilir,
> uydurma kategori yazılmaz ve satır takip tablosunda not edilir.

---

## 4. Tutarlılık kuralı ve takip

### 4.1 Kural: **Aynı künye her yerde, sapma yok**

1. Bölüm 0.1 ve 3'teki dizgiler **tek doğruluk kaynağıdır**. Bir platformun
   alanına sığmayan metin **kısaltılmaz**; bir alt blok (UZUN → ORTA → KISA)
   seçilir.
2. Adres yazımı hiçbir yerde değişmez: `Acıbadem Mah.` (`Mahallesi` değil),
   `B-18` (`B18`, `B/18` değil), `34660` her zaman yazılır, `Kadıköy` ve
   `İstanbul` Türkçe karakterle. ASCII zorunlu sistemlerde `Kadikoy / Istanbul`
   kabul edilir ve o satır takip tablosunda **not edilir**.
3. Telefon her yerde tek formatta: `+90 216 XXX XX XX`. Farklı numara,
   yönlendirme numarası veya çağrı takip (call tracking) numarası **kullanılmaz**
   — NAP eşleşmesini bozar.
4. Web adresi dizinlerde daima UTM'siz: `https://voltage.com.tr`. UTM'li sürüm
   **yalnızca GBP** web alanındadır.
5. **Değişiklik protokolü:** NAP'ın herhangi bir parçası değişirse (taşınma,
   numara değişimi, ünvan değişikliği) önce bu belge güncellenir, sonra
   **aynı gün içinde** takip tablosundaki tüm satırlar tek tek güncellenir.
   Kısmi güncelleme, hiç güncellememekten daha zararlıdır — çelişkili sinyal üretir.
6. **Yasak sinyaller (istisnasız):** sahte şube · işletme adında anahtar kelime
   veya şehir · satın alınmış/takas edilmiş yorum · çalışan/tanıdık yorumu ·
   sahibi olmadığımız tesis fotoğrafı · gerçek olmayan çalışma saati ·
   sanal ofis adresi.

### 4.2 Bölgesel görünürlük — nasıl yapılır, nasıl yapılmaz

| Yanlış (yapılmayacak) | Doğru (yapılacak) |
|---|---|
| Kocaeli/Bursa/Çorlu için ayrı GBP kaydı | Tek GBP + hizmet bölgesi `Türkiye` |
| `voltage.com.tr/kocaeli-elektrik-tedarikcisi` tipi şehir başına ince sayfa | Bölge/koridor talebi **keyword map + roadmap** üzerinden değerlendirilir; içerik ancak gerçek, farklılaşmış bilgi taşıyorsa üretilir (OSB rehberi buna örnektir) |
| Dizinlerde şehir adı eklenmiş işletme adı | İşletme adı sabit; şehir yalnızca adres/etiket alanında |

Öncelikli koridorlar (İstanbul, Kocaeli, Bursa, Trakya, Marmara OSB'leri) için
içerik talebi bu belgeden değil, **SEO Direktörü → seo-keyword-research →
roadmap** hattından açılır. Doorway sayfa üretilmez.

### 4.3 Takip tablosu (yürütme sırasında doldurulur)

`Durum` sözlüğü: `YAPILACAK` · `DEVAM` · `BEKLEMEDE (telefon)` ·
`BEKLEMEDE (sahip kararı)` · `TAMAM` · `ERİŞİLEMEDİ` · `UYGUN DEĞİL`

| # | Platform | Durum | Kayıt/düzeltme tarihi | Canlı profil URL'i | Kullanılan ad bloğu | Not |
|---|---|---|---|---|---|---|
| 1 | Google İşletme Profili | | | | MARKA | |
| 2 | Yandex Business | | | | MARKA | |
| 3 | Apple Business | | | | MARKA | |
| 4 | Bing Places | | | | MARKA | |
| 5 | İTO / Ticaret Sicil teyidi | | | | TÜZEL-UZUN | |
| 6 | EPDK lisans kaydı URL'i | | | | TÜZEL-UZUN | |
| 7 | EPİAŞ katılımcı kaydı | | | | TÜZEL-UZUN | |
| 8 | Enerji Atlası | | | | BİRLEŞİK | |
| 9 | Elektrikport | | | | BİRLEŞİK | |
| 10 | Enerji Ajansı | | | | BİRLEŞİK | |
| 11 | Kompass TR | | | | BİRLEŞİK | |
| 12 | Europages | | | | BİRLEŞİK | |
| 13 | Encazip | | | | BİRLEŞİK | |
| 14 | Crunchbase (düzeltme) | | | | BİRLEŞİK | |
| 15 | puan5.com (düzeltme) | | | | BİRLEŞİK | |
| 16 | elektrikpaketleri.com (düzeltme) | | | | TÜZEL-UZUN | |
| 17 | LinkedIn (hizalama) | | | | MARKA + TÜZEL-KISA | |
| 18 | Şikayetvar (karar) | | | | MARKA | |

**Tamamlanma tanımı (her satır için):** kayıt canlı **ve** ad, adres, telefon,
web adresi Bölüm 0.1 ile karakteri karakterine aynı **ve** canlı profil URL'i
tabloya yazılmış. Üçü birden sağlanmadan satır `TAMAM` işaretlenmez.

**Tamamlanan satırların sonraki adımı:** canlı profil URL'leri toplanıp
**seo-schema**'ya rotalanır → JSON-LD `sameAs` dizisine yalnızca doğrulanmış
profiller eklenir (şikayet platformları ve geçici URL'ler `sameAs`'e girmez).

---

## 5. Ölçüm — neyi raporlayacağız

B2B tedarikçide "ziyaretçi trafiği" bir metrik değildir. GBP Performans
panelinden aylık şu kalemler raporlanır:

| Metrik | Kaynak | Neden |
|---|---|---|
| Telefon araması (çağrı) sayısı | GBP → Performans → Aramalar | Birincil nitelikli aksiyon. **Telefon girilene kadar ölçülemez** |
| Web sitesi tıklaması | GBP + GA (`utm_source=gbp`) | Teklif niyeti; UTM sayesinde kanal ayrıştırılabilir |
| Yol tarifi isteği | GBP → Performans | B2B'de düşük hacim beklenir; ziyaret randevusunun göstergesi |
| Profil görüntüleme (arama vs. harita) | GBP → Performans | Marka sorgusu mu, kategori sorgusu mu ayrımı |
| Profili bulduran sorgular | GBP → "İşletmenizi bulmak için kullanılan aramalar" | Kategori eşleşmesi doğru mu; "elektrikçi" tipi alakasız sorgu geliyorsa kategori yanlış |
| Yorum sayısı ve ortalaması | GBP | **Yalnızca organik.** Ani sıçrama incelemeye davettir |
| Tutarlı kayıt oranı | Bölüm 4.3 tablosu | `TAMAM` satır / toplam satır |
| Sahte sinyal ihlali | Denetim | Hedef: **0**, istisnasız |

İlk rapor kurulumdan **30 gün** sonra; sonrası aylık. Bölgesel SERP okuması
(İstanbul/Kocaeli/Bursa'da `elektrik tedarikçisi`, `kurumsal elektrik`) aylık
manuel olarak yapılır ve SEO Direktörü'ne rotalanır.

---

## 6. Yürütme sırası (özet)

1. **[SAHİP]** Telefon numarasını teyit et → 0.2 blokerini kaldır.
2. **[SAHİP]** Tabela + müşteri kabulü sorularını yanıtla → 0.3, Bölüm 1.C kararı.
3. GBP: ara → sahiplen veya oluştur → kategori → adres/hizmet bölgesi →
   doğrulama başlat (Bölüm 1.A–1.D).
4. Doğrulama beklenirken: İTO/ticaret sicil teyidi + EPDK lisans URL'i (2.2) —
   bunlar telefona bloke değildir.
5. GBP canlıya geçince: hizmetler, açıklama, saatler, fotoğraflar (1.E–1.I).
6. Yandex Business (telefon geldikten sonra) → Apple Business → Bing Places.
7. Düzeltmeler: Crunchbase → LinkedIn hizalama → puan5 → elektrikpaketleri.
8. Sektör/B2B dizinleri: Enerji Atlası → Encazip → Elektrikport → Enerji Ajansı
   → Kompass → Europages.
9. Takip tablosunu doldur → canlı URL listesini **seo-schema**'ya rotala.
10. 30. gün: ilk ölçüm raporu → SEO Direktörü.

---

**Kaynaklar / doğrulama notu:** GBP kategori adları, doğrulama yöntemleri,
hizmet-alanı kuralları ve platform URL'leri 2026-08-05 tarihli canlı arama
sonuçlarıyla doğrulandı (Google İşletme Profili Yardım, Bing Places, Apple
Business Connect, Yandex Business, İTO/Ticaret Sicil, Wikidata:Notability ve
ilgili sektör dizinleri). Sayfa içeriklerinin doğrudan çekimi bu ortamda
engellendi (HTTP 403); bu nedenle her satır sahip tarafından girişte teyit
edilir ve açılmayan satır `ERİŞİLEMEDİ` işaretlenir — tahmin yürütülmez.

*Dağıtım: SEO Direktörü (onay) · Sahip (yürütme: 0.2, 0.3, 1.A–1.J, Bölüm 2)*
*· seo-schema (Bölüm 4.3 `sameAs` çıktısı) · marketing (satır 17 LinkedIn)*
*· investor-relations (satır 14 Crunchbase) · Lifecycle CRM (1.J yorum akışı)*
*· Support (satır 18 Şikayetvar kararı) · seo-brand-entity (Wikidata, 2.5)*
