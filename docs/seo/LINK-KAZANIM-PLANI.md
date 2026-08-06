# Link Kazanım Planı — voltage.com.tr

**Hazırlayan:** Backlink Auditor Agent (Seviye 4, SEO Birimi)
**Rapor edilen:** SEO Direktörü Agent (Seviye 3)
**Tarih:** 2026-08-05
**Durum:** PASİF SATIŞ MODU — bu belge bir **plan**dır. Hiçbir erişim (outreach)
başlatılmamıştır ve sahip talimatı + Legal onayı olmadan başlatılmayacaktır.
**Kapsam:** Site değişikliği yok. Hedeflerin doğrulanması, sıralanması ve
etik sınırların yazılı hale getirilmesi.

---

## 0. Yöntem ve doğrulama seviyesi (dürüstlük notu)

Bu belgedeki **her URL WebSearch ile doğrulanmıştır** — yani arama motoru
sonuçlarında canlı olarak görülmüştür. Uydurulmuş alan adı yoktur.

Ancak iki sınırlama açıkça belirtilmelidir:

1. **Sayfa içi teyit kısıtlı.** İSO ve Enerji Atlası gibi bazı hedeflerin
   iç sayfaları bot korumasıyla (HTTP 403) yanıt verdi; bu hedefler arama
   sonucu düzeyinde doğrulanmış, sayfa içeriği düzeyinde doğrulanmamıştır.
   Tabloda "Doğrulama" sütununda bu ayrım işaretlidir.
2. **Hiçbir üçüncü taraf otorite skoru (DR/DA) kullanılmamıştır.** Elimizde
   tarihli ve araç-etiketli link verisi yok. Sıralama, *hedef kitle
   uygunluğuna* göre yapılmıştır: fabrika müdürü ve enerji sorumlusunun
   okuduğu bir OSB duyuru sayfası, yüksek skorlu alakasız bir bloga baskındır.
   Bu, birimin standardıdır ve skor verisi gelse bile değişmez.
3. **Mevcut link profili ölçülmemiştir.** GSC Links raporu bu oturumda
   sağlanmadı. Bir sonraki döngüde temel çizgi (baseline) alınmalıdır —
   Bölüm 4'e bakınız.

---

## 1. Linkable Asset Analizi — neyimiz link çeker, neden

Voltage link **satın almaz**; link **kazanır**. Kazanmanın tek yolu, birinin
kendi işini yaparken bize atıf vermek zorunda kalmasıdır. Aşağıdaki dört
varlık bu testi geçiyor.

### A1 — Canlı EPİAŞ PTF bandı (ana sayfa) — **BİRİNCİL VARLIK**

- **Ne:** Ana sayfada yayınlanan canlı saatlik PTF bandı. Kaynak: EPİAŞ
  Şeffaflık Platformu. Sentetik değer gösterilmiyor; veri yoksa boş kalıyor.
- **Neden benzersiz:** İzlenen rakiplerin hiçbirinde canlı saatlik PTF
  yayını gözlenmedi (`docs/seo/COMPETITOR-BENCHMARK.md`). Rakipler PTF'yi
  *anlatıyor*; biz *gösteriyoruz*.
- **Kim niye link verir:**
  - **Gazeteci / editör:** "Bugün PTF şu seviyede" cümlesini yazarken
    tıklanabilir, güncel, ücretsiz ve giriş istemeyen bir kaynak arıyor.
    EPİAŞ Şeffaflık arayüzü haber okuruna ağır geliyor; bizim bandımız tek
    ekranda okunuyor. Gazetecinin motivasyonu iyilik değil, **kolaylık**.
  - **Akademisyen / öğrenci:** Enerji ekonomisi dersinde "güncel fiyatı
    buradan izleyin" diyeceği bir bağlantı arıyor. Ders izlence ve kaynak
    sayfaları yıllarca yaşayan linklerdir.
  - **Veri listesi editörü:** Açık veri dizinleri (GitHub `awesome` tarzı
    listeler) "EPİAŞ verisini insan-okur biçimde sunan sayfa" satırını
    doldurmak istiyor.
  - **Analist / danışman:** LinkedIn veya bülteninde hızlı referans veriyor.
- **Zayıflık (dürüstçe):** Band ana sayfada; **kendi kalıcı URL'i yok.**
  Bir gazeteci "PTF bandı"na link verirken ana sayfaya link verir — bu iyi,
  ama alıntılanabilirliği düşürür. **Öneri (Webmaster'a, Direktör onayıyla):
  `/canli-ptf` gibi kalıcı, tek-amaçlı, alıntılanabilir bir sayfa.** Bu tek
  değişiklik, bu belgedeki hedeflerin yarısının dönüşüm ihtimalini yükseltir.

### A2 — Serbest tüketici / limit rehberi — **YILLIK GÜNCELLENEN REFERANS**

- **Ne:** `/rehber/serbest-tuketici` — serbest tüketici limiti (2026: 500 kWh)
  ve EPDK kararına dayalı açıklama.
- **Neden link çeker:** Limit **her yıl değişir**. Değiştiği hafta yüzlerce
  kişi "bu yılki limit ne?" diye arar; mali müşavir bültenleri, sanayi odası
  duyuruları ve haber siteleri o hafta bir kaynağa link verir. Bu, takvime
  bağlı, tekrarlayan bir link fırsatıdır — "evergreen" değil, **"her yıl
  yeniden taze"**dir ki bu daha değerlidir.
- **Kim niye link verir:** Mali müşavir / SMMM bülteni (müşterisine
  anlatmak zorunda), oda duyuru editörü (üyesini bilgilendiriyor), haber
  sitesi (mevzuat haberi yazıyor).
- **Koşul:** Limit değiştiği gün sayfanın güncellenmiş ve **tarih damgalı**
  olması. Güncel olmayan bir referans sayfası link kazanmaz, kaybettirir.

### A3 — Sektör rehberleri (7 dikey) — **NİŞ OTORİTE**

- **Ne:** Tekstil, demir-çelik, kimya, veri merkezi, soğuk zincir,
  cam-seramik, yenilenebilir üreticiler.
- **Neden link çeker:** Genel "elektrik tedarikçisi" içeriği bol; "ark ocağı
  yük profiline göre tedarik modeli" içeriği yok denecek kadar az. Sektör
  dernekleri ve OSB bültenleri **kendi üyelerine özel** içerik arar; jenerik
  içeriğe link vermezler, dikeye verirler.
- **Kim niye link verir:** Sektör derneği bülteni, OSB katılımcı duyurusu,
  sektörel dergi (yayın kurulu "üyelerimize faydalı" diye ekler).
- **Not:** Bunlar tek başına link mıknatısı değil; **A1 ile birlikte**
  sunulduğunda güç kazanır ("canlı fiyat + sizin sektörünüzde ne anlama
  geliyor").

### A4 — PTF açıklayıcı (`/rehber/ptf-nedir`) — **KAVRAM SAYFASI**

- **Ne:** PTF'nin GÖP'te nasıl oluştuğunun açıklaması + canlı saatlik fiyat.
- **Neden link çeker:** "PTF nedir" bir **tanım sorgusu**dur. Blog yazarları,
  öğrenciler ve şirket içi eğitim materyalleri tanımı yeniden yazmak yerine
  link verir. Wikipedia Türkçe'de bu konuda güçlü bir madde gözlenmedi —
  boşluk var.
- **Kim niye link verir:** Mühendislik/enerji blogu yazarı (kavramı
  açıklamak zorunda ama odağı başka), eğitim içeriği hazırlayan, forum/QA
  cevabı yazan.
- **Kritik avantaj:** Açıklama + **canlı veri** aynı sayfada. Rakip
  açıklayıcılar statik.

### Varlık boşluğu — gelecek dönem için (Direktör kararı)

| Boşluk | Neden link çeker | Efor |
|---|---|---|
| `/canli-ptf` kalıcı sayfası | A1'i alıntılanabilir kılar — en yüksek kaldıraç | Düşük |
| PTF aylık/yıllık arşiv grafiği | Araştırmacı "geçmiş seri" arar; şu an kimse vermiyor | Orta |
| Serbest tüketici limiti tarihçesi (yıl-yıl tablo) | Mevzuat yazarlarının aradığı tek tablo | Düşük |

---

## 2. Hedef Listesi — 20 hedef, sıralı

**Sütun açıklamaları**
- **Link türü:** kaynak gösterme / haber / üyelik profili / veri referansı /
  yayın katkısı
- **Zorluk:** Düşük (yapısal olarak dış kaynak listeler) · Orta (editör kararı)
  · Yüksek (kurumsal onay veya üyelik gerekir)
- **Doğrulama:** `arama` = arama sonucunda canlı görüldü · `arama+` = birden
  fazla bağımsız sonuçta teyit edildi
- **İlk adım:** PASİF modda **yalnızca hazırlık**; hiçbiri temas değildir.

### Katman 1 — Veri referansı (en yüksek ihtimal, ticari olmayan)

Bu katman en üstte çünkü: (a) satış temsili içermez, (b) editörün *işine
yarar*, (c) A1 varlığımız burada tartışmasız benzersizdir.

| # | Hedef | URL | Link türü | Yaklaşım açısı | Zorluk | Öncelik | İlk adım (pasif) |
|---|---|---|---|---|---|---|---|
| 1 | **kaymal/acik-veri** — Türkiye açık veri kaynakları derlemesi | https://github.com/kaymal/acik-veri | veri referansı | "Enerji" başlığı altında EPİAŞ PTF'sini insan-okur canlı biçimde sunan sayfa satırı. Ticari değil, kaynak katkısı. | Düşük | **P0** | Deponun katkı (contribution) kurallarını oku; `/canli-ptf` sayfası hazır olduğunda PR taslağı hazırla. Şu an gönderim yok. |
| 2 | **yagiz-dev/open-data-turkey** + Türkiye Açık Veri Dizini | https://github.com/yagiz-dev/open-data-turkey · https://acikveri.yagiz.dev/ | veri referansı | Aynı gerekçe; ayrıca dizinin kendi web arayüzü var (çift kazanım). | Düşük | **P0** | Kategori yapısını incele, hangi başlığa girdiğimizi belirle. |
| 3 | **ozancanozdemir/Türkiye'deki Açık Veri Portalları** | https://github.com/ozancanozdemir/Turkiye-deki-Acik-Veri-Portallari-Open-Data-Portals-in-Turkey- | veri referansı | Akademik eğilimli liste; araştırmacı trafiği. | Düşük | **P1** | Liste kriterlerini oku (bazıları yalnızca kamu portalı kabul eder — uygun değilsek zorlamayacağız). |
| 4 | **nurisensoy/seffaflik** — EPİAŞ Python kütüphanesi | https://github.com/nurisensoy/seffaflik | veri referansı | README'de "veriyi görselleştiren canlı örnek" bağlantısı. Geliştirici kitlesi = analist kitlesi. | Orta | **P1** | Depo aktifliğini ve README yapısını kontrol et. Kod katkısı sunulabilir mi değerlendir. |
| 5 | **İstanbul Üniversitesi — Enerji Ekonomisi ders izlencesi (EBS)** | https://ebs.istanbul.edu.tr/home/izlence/?id=658603&bid=1119 | kaynak gösterme | Ders kaynak listesine "güncel PTF izleme" bağlantısı. Üniversite linkleri uzun ömürlüdür. | Yüksek | **P1** | Dersin öğretim üyesini ve iletişim kanalını belirle. **Temas Legal onayına bağlı** (Bölüm 3). |

### Katman 2 — Sektör basını (haber / kaynak gösterme)

| # | Hedef | URL | Link türü | Yaklaşım açısı | Zorluk | Öncelik | İlk adım (pasif) |
|---|---|---|---|---|---|---|---|
| 6 | **Enerji Günlüğü** — 2012'den beri, sektörün en yerleşik haber sitesi | https://www.enerjigunlugu.net/ | haber / kaynak gösterme | PTF hareketi haberlerinde canlı band kaynak gösterimi. Kurucu: Mehmet Kara (1990'dan beri gazeteci) — kurumsal, PR'a değil habere duyarlı. | Orta | **P0** | Son 3 ayda PTF/fiyat haberlerinde hangi kaynakları gösterdiklerini derle. Editöryal ritmi öğren. |
| 7 | **Enerji Atlası** — santral ve üretim veri portalı | https://www.enerjiatlasi.com/ · https://www.enerjiatlasi.com/hesaplamalar | veri referansı | "Hesaplamalar" bölümü var; fiyat tarafında canlı PTF boşluğu. Veri-veriye atıf, en doğal link biçimi. | Orta | **P0** | `/hesaplamalar` sayfasının kapsamını manuel incele (bot koruması nedeniyle otomatik okunamadı). |
| 8 | **Enerji Portalı** | https://enerjiportali.com.tr/ (ikincil: https://www.enerjiportali.com/) | haber / kaynak gösterme | Sektör etkinlik takvimi ve haber üretimi güçlü; GES odaklı — A3'ten `yenilenebilir-ureticiler` rehberi doğal eşleşme. | Orta | **P1** | **Alan adı belirsizliği var** (`.com.tr` ve `.com` ikisi de canlı görüldü) — hangisinin birincil olduğu teyit edilmeli. |
| 9 | **Elektrikport** — mühendislik portalı, teknik kütüphane | https://www.elektrikport.com/ · https://www.elektrikport.com/hakkimizda | yayın katkısı | Portal açıkça yazar/editör arıyor ve üniversite-sanayi işbirliğini misyon edinmiş. Teknik makale katkısı → yazar künyesinde link. **Bu bir link değişimi değil; içerik katkısıdır.** | Orta | **P0** | Yazar katkı koşullarını ve künye politikasını incele; ücret/karşılık talebi varsa **derhal reddet ve Direktöre bildir** (ödeme = satın alma). |
| 10 | **Enerji Gündemi** | https://enerjigundemi.com/ | haber | Genel enerji haberciliği; PTF/piyasa haberlerinde kaynak. | Orta | **P2** | Yayın sıklığı ve kaynak gösterme alışkanlığını gözle. |
| 11 | **Enerji Haber** | https://enerjihaber.com/ | haber | Elektrik tedarik haberleri düzenli. | Orta | **P2** | Aynı. |
| 12 | **PetroTurk — Elektrik Haberleri** | https://www.petroturk.com/kategori/elektrik-haberleri | haber | Elektrik kategorisi ayrı; dernek/sektör haberlerini takip ediyor (ETD haberini yayımladıkları görüldü). | Orta | **P2** | Aynı. |
| 13 | **Enerji Gazetesi** | https://www.enerjigazetesi.ist/ | haber | TR+EN yayın; kurumsal kitle. | Orta | **P3** | Aynı. |

### Katman 3 — Dernek ve meslek kuruluşları (üyelik profili / yayın)

| # | Hedef | URL | Link türü | Yaklaşım açısı | Zorluk | Öncelik | İlk adım (pasif) |
|---|---|---|---|---|---|---|---|
| 14 | **ETD — Enerji Ticareti Derneği** | https://etd.org.tr/ · https://etd.org.tr/hakkimizda | üyelik profili | 2010'da **tedarik lisanslı şirketlerce** kuruldu — Voltan'ın tam profili. Üye listesinde kurumsal link. En meşru, en dayanıklı link türü. | Yüksek | **P0** | Üyelik kriterlerini, aidatı ve başvuru sürecini çıkar. **Bu ticari bir üyelik kararıdır → Direktör üzerinden Orkestratör onayı gerekir.** SEO gerekçesiyle üyelik önerilmez; üyelik sektörel gerekçeyle alınır, link yan faydadır. |
| 15 | **Enerji Uzmanları Derneği — Uzman Gözüyle Enerji Dergisi** | https://www.enerjiuzmanlari.org.tr/uzman-gozuyle-enerji-dergisi/ | yayın katkısı | Dergi dış yazar makalesi yayımlıyor (PTF oluşumu üzerine makale mevcut). Uzman makalesi → yazar künyesi linki. | Orta | **P1** | Makale gönderim koşullarını ve künye politikasını incele. Ücretli yayın ise **reddet**. |
| 16 | **EMO — Elektrik Mühendisleri Odası** | https://www.emo.org.tr/ | kaynak gösterme | 42.000+ üye; enerji raporları ve dergi üretiyor. Rapor kaynakçasında veri atfı. | Yüksek | **P2** | Yayın kaynakça alışkanlığını incele. Ticari yaklaşıma **kapalı** bir kurum — yalnızca veri/kaynak açısı geçerli. |
| 17 | **EÜD — Elektrik Üreticileri Derneği** | https://www.eud.org.tr/ | kaynak gösterme | Üretici tarafı; A3'ten `yenilenebilir-ureticiler` (portföy/dengesizlik) rehberi doğrudan üye ihtiyacı. | Yüksek | **P3** | Üye bülteni yapısını gözle. |

### Katman 4 — Sanayi altyapısı: OSB ve odalar (en yüksek kitle uygunluğu)

Bu katman **skor olarak düşük, kitle olarak en değerlidir**. Bir OSB duyuru
sayfasını okuyan kişi tam olarak bizim müşterimizdir.

| # | Hedef | URL | Link türü | Yaklaşım açısı | Zorluk | Öncelik | İlk adım (pasif) |
|---|---|---|---|---|---|---|---|
| 18 | **İSO — Enerji İhtisas Kurulu / Yayınlar** | https://www.iso.org.tr/projeler/cevre-ve-enerji/enerji-ihtisas-kurulu/ · https://www.iso.org.tr/yayinlarimiz/ | yayın katkısı / kaynak gösterme | İSO'nun enerji ihtisas yapısı ve aylık "Sanayi" dergisi var. Sanayicinin elektrik maliyeti = derginin doğal konusu. | Yüksek | **P1** | Kurulun katılım koşullarını manuel incele (sayfa bot korumalı, HTTP 403). Voltan'ın İSO üyeliği var mı — **Orkestratör'e sorulmalı**. |
| 19 | **OSBÜK — OSB Üst Kuruluşu** | https://osbuk.org/ (ayrıca https://osbuk.org.tr/) | haber / kaynak gösterme | Tüm OSB'lerin çatısı. Tek bir OSBÜK bağlantısı, onlarca OSB'ye erişim demek. Sanayi ve Teknoloji Bakanlığı + TOBB ile ortak program yürütüyor. | Yüksek | **P1** | Duyuru/haber sayfalarının dış kaynak gösterip göstermediğini gözle. **Ticari yaklaşım Growth Agent kanalına aittir** — hiyerarşi üzerinden koordine et. |
| 20 | **İkitelli OSB (İOSB)** — işletme sayısı bakımından İstanbul'un en büyüğü | https://iosb.org.tr/category/duyurular/ | haber / kaynak gösterme | Katılımcı duyuruları elektrik konularını içeriyor (OSOS sayaç okuma vb.). `/rehber/osb-elektrik-tedariki` doğrudan katılımcı sorusunu yanıtlıyor. | Yüksek | **P1** | Duyuru akışını (RSS mevcut) izlemeye al. **Dikkat: OSB'nin kendi dağıtım lisansı var — çıkar çatışması riski Direktöre bildirilmeli.** |
| 21 | **Dudullu OSB** | https://www.dudulluosb.org.tr/elektrik/ · https://www.dudulluosb.org.tr/category/duyurular/ | haber / kaynak gösterme | 49 yıllık OSB elektrik dağıtım lisansı; ayrı "Elektrik" bölümü var. | Yüksek | **P2** | Aynı; çıkar çatışması notu geçerli. |
| 22 | **İTO — Yayınlar** | https://www.ito.org.tr/tr/yayinlar/istanbul-ticaret-odasi-yayinlari | yayın katkısı | Sektör araştırma raporları yayımlıyor; enerji maliyeti bölümlerinde veri atfı. | Yüksek | **P3** | Rapor ihale/şartname süreçlerini gözle. |
| 23 | **ICCI — 30. Uluslararası Enerji ve Çevre Fuarı (16-18 Eylül 2026, İstanbul)** | https://icci.com.tr/ | etkinlik / profil | Katılımcı veya konuşmacı profilinde kurumsal link. Tarih yakın — takvim kritik. | Yüksek | **P2** | Katılım/konuşmacı çağrısı takvimini çıkar. **Ticari karar → Orkestratör.** |

**Toplam: 23 hedef · 31 doğrulanmış URL** (bazı hedefler birincil + ikincil
URL içerir; hepsi arama sonucunda canlı görülmüştür).

---

## 3. Etik Sınırlar — pazarlık konusu olmayan kurallar

Voltan **EPDK lisanslı** bir tedarikçidir. Güvene dayalı ve düzenlenmiş bir
markanın ceza riski taşıması kabul edilemez. Bir link ne kadar değerli
olursa olsun, lisanslı bir markanın itibarından daha değerli değildir.

### 3.1 Kesinlikle yapılmayacaklar

| Yasak | Neden |
|---|---|
| **Link satın alma** — para, indirim, bedelsiz hizmet veya ürün karşılığı link | Google link şeması ihlali. Manuel işlem riski. **İstisnasız.** |
| **PBN / özel blog ağı** — kendi kontrolümüzdeki sahte site ağı | Doğrudan ihlal; keşfedildiğinde tüm profil zehirlenir. |
| **Link takası** — "sen bana ver ben sana vereyim", ortaklık kılıfına sokulmuş karşılıklı link | Kılıfın adı değişse de şema aynı. **Ortaklık = ticari ilişki; ticari ilişki Growth Agent'ın alanıdır ve link pazarlığı içeremez.** |
| **Sahte profil / kimlik** | Blog yorumu, forum, dizin veya sosyal medyada gerçek olmayan kimlik. Marka güvenliği ve KVKK riski. |
| **Otomatik yorum / forum spam'i** | Ölçeklenmiş içerik kötüye kullanımı. |
| **Spam e-posta / toplu soğuk gönderim** | Hem SEO hem **ticari elektronik ileti mevzuatı (İYS)** riski. |
| **Ücretli "sponsorlu haber" ile organik link karıştırma** | Sponsorlu içerik meşrudur — ama linki `rel="sponsored"` olmalıdır. Etiketsiz ücretli link = satın alınmış link. |
| **Dizin bombardımanı** | Alakasız toplu dizin kaydı; değer üretmez, risk üretir. |

**Gri alan kuralı:** Bu belgedeki hiçbir hedefte gri alan bir teklif kabul
edilmez. Bir editör veya portal karşılığında **ücret, reklam alımı veya
karşılıklı link** talep ederse: temas orada durur, durum riskiyle birlikte
Direktöre yükseltilir. Karar SEO biriminde alınmaz.

### 3.2 Erişim izni kuralı — **ŞU AN ERİŞİM YOKTUR**

> **Kural: Erişim = Legal & Compliance onayı + sahip talimatı.**
> Satış motoru **PASİF** olduğu için, herhangi bir soğuk erişim (cold
> outreach) şu an **yasaktır**. Bu belge yalnızca hazırlık listesidir.

Bu belgedeki "İlk adım" sütunundaki her madde **temas içermeyen hazırlık**
işidir: sayfa inceleme, koşul okuma, takvim çıkarma, izleme kurma.

### 3.3 Legal & Compliance'a iletilecek AÇIK SORU

**Soru:** Ticari teklif içermeyen, yalnızca **kaynak/veri paylaşımı**
niteliğindeki bir temas (örneğin bir gazeteciye "EPİAŞ PTF verisini canlı
yayınlıyoruz, haberlerinizde kullanabilirsiniz" bildirimi veya bir açık
veri deposuna kod katkısı), 6563 sayılı Kanun ve İYS düzenlemeleri
kapsamında **ticari elektronik ileti sayılır mı**?

**Neden önemli:** Sayılmıyorsa, Katman 1 ve Katman 2'nin bir bölümü satış
motoru pasifken de yürütülebilir. Sayılıyorsa, tüm liste sahip talimatına
kadar tamamen bekler.

**Alt sorular:**
1. Alıcı **tüzel kişi** (yayın kuruluşu editörü) olduğunda değerlendirme
   değişir mi?
2. Kurumun **kendi yayımladığı** editör/haber e-posta adresine gönderim,
   "alıcının kendi açtığı kanal" sayılır mı?
3. GitHub pull request gibi **kamuya açık platform katkısı** ileti kapsamı
   dışında mı?
4. Mesajda şirket adı ve lisans bilgisi geçiyor ama **hiçbir ürün/fiyat
   teklifi yoksa**, ticari nitelik doğar mı?

**Bu soru yanıtlanana kadar Katman 1-4'ün hiçbir maddesinde temas
başlatılmayacaktır.** — *Backlink Auditor Agent, 2026-08-05*

### 3.4 Çıkar çatışması bayrağı (Direktöre)

İOSB ve Dudullu OSB gibi **kendi elektrik dağıtım lisansına sahip** OSB'ler
aynı anda hem link hedefi hem potansiyel rakip/karşı taraftır. Bu
hedeflerde temas, **Growth Agent'ın ortaklık kanalıyla çakışmamalıdır**.
Sıra: önce Growth Agent'ın o bölgedeki ticari durumu netleşir, sonra link
açısı değerlendirilir. Tersi olursa ticari ilişki zarar görür.

---

## 4. Ölçüm

### 4.1 Temel çizgi (ÖNCE bu yapılmalı)

**Bugün itibarıyla elimizde link verisi yoktur.** Hedef koymadan önce:

1. **Google Search Console → Bağlantılar (Links) raporu** — "En çok
   bağlantı veren siteler" listesini tarih damgalı olarak dışa aktar.
2. Çıktıyı `docs/seo/` altına tarihli olarak kaydet (örn.
   `link-baseline-2026-08.csv`) — kaynak: GSC, tarih: alındığı gün.
3. Her yönlendiren alan adını sınıflandır:
   `enerji-sektörü` / `sanayi-B2B` / `bölgesel-sanayi` / `akademik` /
   `genel` / `alakasız-veya-şüpheli`.

**KPI'ımız toplam link sayısı değil, "ilgili" kategorilerdeki yönlendiren
alan adı sayısıdır.** Bu ayrım baştan yapılmazsa büyüme ölçülemez.

### 4.2 90 günlük hedef (2026-08-05 → 2026-11-03)

Temel çizgi bilinmediği ve **erişim henüz yasak olduğu** için taahhüt değil,
**koşullu aralık** veriyorum:

| Senaryo | Koşul | 90 günde beklenen yeni **ilgili** yönlendiren alan adı |
|---|---|---|
| **A — Erişim kapalı kalırsa** | Legal onayı gelmez, pasif mod sürer | **0-2.** Yalnızca kendiliğinden gelen atıflar. Bu bir başarısızlık değil; politikanın sonucudur. |
| **B — Yalnızca Katman 1 açılırsa** | Legal "veri paylaşımı ticari ileti değildir" derse | **2-5.** Ağırlıkla açık veri listeleri ve depo katkıları. |
| **C — Tam erişim + `/canli-ptf` yayında** | Sahip talimatı + Legal onayı + kalıcı PTF sayfası | **5-12.** Sektör basını dönüşümü burada başlar. |

**Bu sayılar tahmindir, vaat değildir.** Editör kararı bizim kontrolümüzde
değildir. Hiçbir senaryoda hedefe ulaşmak için 3. Bölüm'deki bir kural
esnetilmez — **eksik link, kirli link'ten iyidir.**

### 4.3 Takip ritmi

| Sıklık | İş | Çıktı |
|---|---|---|
| Aylık | GSC Links raporu dışa aktarımı + sınıflandırma | Tarihli CSV, `docs/seo/` |
| Aylık | Yeni yönlendiren alan adı incelemesi | Şüpheli olan var mı? |
| 90 günde bir | Bu belgenin gözden geçirilmesi | Dönüşmeyen hedefler düşürülür, yenileri eklenir |
| Olay bazlı | Serbest tüketici limiti değişimi | A2 güncellenir; o hafta link fırsatı zirvededir |

### 4.4 İzlenen KPI'lar

1. **İlgili yönlendiren alan adı sayısı** (birincil).
2. **Link şeması ihlali: 0** — pazarlık edilemez.
3. **Manuel işlem (manual action): 0** — pazarlık edilemez.
4. **Dönüşüm oranı:** döngü içinde gerçekten link veren hedef / temas edilen
   hedef. (Erişim açılana kadar ölçülemez.)

### 4.5 Disavow duruşu

**Şu anda disavow önerisi YOKTUR** ve tavsiye edilmez. Disavow son çaredir;
kanıtsız kullanımı zarar verir. Yalnızca şu üçü birlikte doğrulanırsa
gündeme gelir: (a) belirgin spam/negatif-SEO deseni, (b) tarihli kanıt,
(c) Direktör onayı. Bu koşullar sağlanmadan disavow dosyası oluşturulmaz.

---

## 5. Direktöre özet ve bekleyen kararlar

**Bekleyen kararlar (SEO birimi tek başına alamaz):**

| # | Karar | Merci |
|---|---|---|
| 1 | Legal sorusu (Bölüm 3.3) — kaynak paylaşımı ticari ileti mi? | Legal & Compliance |
| 2 | `/canli-ptf` kalıcı sayfası açılsın mı? (en yüksek kaldıraçlı iş) | Direktör → Webmaster |
| 3 | ETD üyeliği (Hedef 14) — sektörel gerekçeyle değerlendirilmeli | Direktör → Orkestratör |
| 4 | ICCI 2026 katılımı (Hedef 23) — takvim 16-18 Eylül, karar penceresi dar | Direktör → Orkestratör |
| 5 | OSB çıkar çatışması sıralaması (Bölüm 3.4) | Direktör → Growth Agent |
| 6 | GSC Links raporu erişimi — temel çizgi için gerekli | Direktör / sahip |

**Bir sonraki döngü çıktısı:** temel çizgi alındıktan sonra ilk *ölçülmüş*
link profili denetimi.
