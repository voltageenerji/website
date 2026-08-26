# MÜŞTERİ PORTALI — MİMARİ VE KARAR KAYDI

Sahip kararı **2026-08-26**: yönetici paneli tek başına kalmayacak; müşteriler
için de kullanıcı adı/şifre üretilecek, giriş yapınca **faturalarını** görecek
ve **ödenmemiş faturalarda ödeme linki** olacak. Tam entegrasyon ilerleyen
süreçte, birlikte yapılacak.

Bu belge o işin **karar kaydı ve iskeletidir** — kod değil. Amacı, sonradan
geri dönüşü pahalı olan kararları şimdi doğru vermek.

Güncelleyen: Orchestrator. Son güncelleme: 2026-08-26.

---

## 1. Kapsam

**Portal ne yapar:** Müşteri giriş yapar → faturalarını (dönem, tutar, son
ödeme tarihi, durum) görür → PDF/e-Arşiv görüntüsünü indirir → ödenmemiş
faturayı ödeme sağlayıcısına yönlendiren linkle öder → geçmiş tüketimini görür.

**Portal ne YAPMAZ (bilinçli sınırlar):**
- Fatura **üretmez**. Fatura resmî muhasebe/faturalama sisteminde üretilir;
  portal yalnız **aynası**dır. Tek doğruluk kaynağı asla portal olamaz.
- Kart verisi **görmez, taşımaz, saklamaz**. Ödeme lisanslı sağlayıcıda olur.
- Kendi kendine kayıt (self signup) **yoktur**. Hesabı biz açarız; müşteri
  ilişkisi sözleşmeyle başlar.

---

## 2. Ön koşullar — bunlar doğru olmadan portal erken bir yatırımdır

| Koşul | Bugünkü durum |
|---|---|
| Sözleşmeli müşteri var | **Yok** — satış motoru PASİF (karar 2026-08-05) |
| Fatura kaynağı belli | **Bilinmiyor** — hangi ön muhasebe/faturalama yazılımı? |
| Ödeme sağlayıcısı seçili | **Seçilmedi** |
| Hukuki metinler onaylı | **Beklemede** — avukat dönüşü gelmedi |

Dürüst değerlendirme: **portalın kendisi acil değil.** Değeri müşteri sayısıyla
doğar. Ama aşağıdaki kararlar bugün ücretsiz, sonra pahalıdır — bu yüzden
şimdiden yazıyoruz.

---

## 3. Erken verilmesi gereken mimari kararlar

### 3.1 Kimlik: müşteri hesapları yönetici hesabından FARKLI kurgulanmalı

Yönetici paneli tek kişilik, sabit kimlikli ve **durumsuz** (stateless) bir
oturum kullanıyor: çerez kendi kendini doğruluyor, sunucuda oturum kaydı yok.
Bu tek operatör için doğru bir tercih — ama müşteriler için **yetersiz**:

| İhtiyaç | Yönetici (bugün) | Müşteri (gerekli) |
|---|---|---|
| Hesap sayısı | 1, ortam değişkeninde | N, veritabanında |
| Parola sıfırlama | yok (özet yeniden üretilir) | e-posta ile self-servis şart |
| Oturum iptali | yok (anahtar döndürülür) | **şart** — cihaz kaybı, personel ayrılığı |
| Denetim izi | yok | **şart** — kim ne zaman neye baktı |
| Rol/yetki | tek rol | firma başına birden çok kullanıcı olabilir |

**Karar:** `lib/admin-auth.js` içindeki parola özeti (PBKDF2) ve sabit-zamanlı
karşılaştırma **yeniden kullanılır**; oturum katmanı müşteriler için
**sunucu tarafı kayıtlı** (iptal edilebilir) hâle getirilir. Yönetici tarafı
olduğu gibi kalabilir.

### 3.2 Veri deposu: KV bu iş için YANLIŞ araç

Bugün lead'ler Cloudflare KV'de. KV nihai-tutarlı (eventually consistent) bir
anahtar-değer deposu: yazma birkaç saniye sonra her bölgede görünür ve
**işlem (transaction) yoktur**. Fatura ve ödeme durumu için bu kabul edilemez —
"ödendi mi?" sorusunun iki farklı yanıtı olamaz.

**Karar:** Portal verisi (müşteri, kullanıcı, fatura, ödeme olayı) için
**Cloudflare D1** (SQLite) veya dengi ilişkisel bir veritabanı. KV yalnız
lead/oturum gibi tolere edilebilir yerlerde kalır.

### 3.3 Fatura: kaynak sistem belirlenmeli

Türkiye'de elektrik faturası **e-Arşiv/e-Fatura** olarak GİB üzerinden
düzenlenir. Portal bunu üretmez, çeker. Üç olası yol:

1. Faturalama yazılımının **API'si** varsa doğrudan entegrasyon (tercih edilen)
2. e-Arşiv **entegratörü** üzerinden (Foriba, Logo, Uyumsoft vb.)
3. Geçici çözüm: PDF'lerin panele elle yüklenmesi (az müşteride kabul edilebilir)

**Bu seçim, işin süresini en çok belirleyen kalemdir.**

### 3.4 Ödeme: kart verisi bize ASLA gelmez

**Karar:** Ödeme, lisanslı bir ödeme kuruluşunun **kendi sayfasında** (hosted
checkout) yapılır. Müşteri portalden linke tıklar, sağlayıcının sayfasına
gider, orada öder; bize yalnız sonuç bildirimi (webhook) döner.

Gerekçe: kart verisine dokunduğumuz an PCI-DSS yükümlülüğü doğar — bu, bir
elektrik tedarikçisinin taşımak isteyeceği bir yük değildir. Hosted checkout
ile bu yük tamamen sağlayıcıdadır.

Türkiye'de değerlendirilecek sağlayıcılar: **iyzico, PayTR, Param, Craftgate**
(hepsi BDDK lisanslı, hepsinde hosted checkout + webhook var). Seçim kriterleri:
komisyon oranı, kurumsal/B2B desteği, mutabakat (reconciliation) raporlaması,
API kalitesi.

**Kritik teknik kural:** Ödeme durumunu **asla** tarayıcıdan gelen "başarılı"
mesajına bakarak güncellemeyiz. Tek geçerli kaynak, sağlayıcıdan gelen
imzalı **webhook**'tur. (Aksi hâlde kullanıcı sahte bir başarı yanıtı üreterek
faturasını ödenmiş gösterebilir.)

### 3.5 Dürüstlük merdiveni buraya da uygulanır

Sitenin her yerinde geçerli olan kural portalde de geçerlidir: **veri yoksa
uydurulmaz.** Faturalama sistemine ulaşılamıyorsa portal "fatura yok" demez —
"şu an listeye ulaşılamıyor, son güncelleme: …" der. Ödeme durumu belirsizse
"ödendi" yazılmaz.

---

## 4. KVKK — bu bir seviye atlamadır

Bugün işlediğimiz veri: teklif formundan gelen ad/telefon/e-posta. Portalla
birlikte **fatura ve tüketim verisi** eklenir; bu, müşterinin ticari
faaliyetine dair düzenli ve ayrıntılı bir profil demektir.

Tasarımdan **önce** netleşmesi gerekenler (Hukuk & Uyum ile):
- Ayrı bir **aydınlatma metni** (portal için) ve gerekirse açık rıza
- **Saklama süreleri** (fatura verisi ne kadar tutulur, sonra ne olur)
- **Erişim kaydı**: hangi kullanıcı hangi faturayı ne zaman görüntüledi
- **Veri işleyen** listesi: ödeme sağlayıcısı, e-Arşiv entegratörü, barındırma
- **İhlal prosedürü** — bugün yaşadığımız CI günlüğü olayı bunun neden gerekli
  olduğunun somut kanıtıdır

---

## 5. Aşamalar (her aşama tek başına değer üretir)

| # | Aşama | Tetik | Çıktı |
|---|---|---|---|
| 0 | **Bu karar kaydı** | ✅ tamam | Mimari çerçeve |
| 1 | Veri modeli + D1 şeması | Sözleşmeli ilk müşteri | müşteri / kullanıcı / fatura / ödeme tabloları |
| 2 | Müşteri kimlik katmanı | Aşama 1 | Hesap açma (biz), parola sıfırlama, iptal edilebilir oturum, denetim izi |
| 3 | Fatura görüntüleme | Faturalama kaynağı belli | Liste + PDF görüntüleme, "ödenmedi" durumu |
| 4 | Ödeme linki | Sağlayıcı seçili + hukuk onayı | Hosted checkout + imzalı webhook + mutabakat |
| 5 | Tüketim grafikleri | Veri akışı kurulu | Aylık/saatlik tüketim, PTF karşılaştırması |
| 6 | Mobil uygulama | Portal talebi (mevcut kapılı karar) | — |

---

## 6. Sizden gereken girdiler (bunlar gelmeden Aşama 1 başlamaz)

1. **Faturalama sistemi hangisi?** Ön muhasebe/ERP adı ve API'si var mı?
2. **Ödeme sağlayıcısı tercihiniz var mı?** Yoksa dördünü komisyon ve B2B
   desteği açısından karşılaştırıp öneri sunarım.
3. **Bir firmada kaç kullanıcı olacak?** Tek yetkili mi, yoksa muhasebe +
   satın alma gibi birden çok kişi mi girecek?
4. **Fatura dışında portalde ne olsun?** (sözleşme örneği, tüketim raporu,
   talep açma, tedarik modeli bilgisi…)

---

## 7. Bugün yapılan hazırlık

- Yönetici panelinin parola/oturum çekirdeği (`lib/admin-auth.js`) portalde
  **yeniden kullanılabilir** biçimde ayrı bir modül olarak yazıldı; müşteri
  tarafı için yalnız oturum katmanı değişecek.
- Panelin tüm güvenlik testleri (`docs/qa/test-admin.mjs`) portal kimlik
  katmanının temel regresyon paketi olarak devralınacak.
- Kararlar bu belgede; operasyon defterinde kapılı plan buna bağlandı.
