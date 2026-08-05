# YATIRIMCI KPI PAKETİ ŞABLONU — 12 Enerji-Yerlisi Gösterge

**Hazırlayan:** Investor Relations Agent · **Tarih:** 2026-08-05
**İlke:** IR ajanı sayı ÜRETMEZ, sunar. Her figürün sahibi sayının tek
kaynağıdır; yayımlanan her sayı sahibinin kaydıyla %100 mutabık olmak
zorundadır. Ölçülemeyen KPI'lar "ölçülemiyor" olarak raporlanır — boş
bırakılır, asla tahminle doldurulmaz.
**Bugünkü veri gerçekliği:** Mevcut olan tek canlı veri: lead KV kaydı +
haftalık funnel raporu (functions/api/lead.js, event.js, report.js) ve PTF
veri hattı. Sözleşme/portföy defteri ve pozisyon defteri **henüz yok**
(Plan 2.5 / 1.7) — 12 KPI'nın çoğu bu iki kayıt sistemini bekliyor.

Durum lejantı: **[MEVCUT]** bugün ölçülebilir · **[KISMEN]** yaklaşık/vekil
veriyle · **[BEKLİYOR: X]** X kurulmadan ölçülemez.

---

## KPI tanımları

### 1. Sözleşme Altındaki MWh (MWh under contract) — [BEKLİYOR: sözleşme defteri]
- **Tanım:** Rapor tarihi itibarıyla imzalı ve yürürlükteki tedarik
  sözleşmelerinin kalan dönem toplam taahhüt hacmi (MWh); ayrıca
  yıllıklandırılmış koşu hızı (MWh/yıl).
- **Pay/Payda/Pencere:** Tek sayı (stok); pencere = rapor tarihi anlık.
- **Kaynak/Sahip:** Analytics (girdi: sözleşme defteri).

### 2. Marj / MWh — [BEKLİYOR: sözleşme defteri + uzlaştırma mutabakatı]
- **Tanım:** (Satış geliri − enerji tedarik maliyeti − dengesizlik maliyeti
  − iletim/dağıtım geçişleri) ÷ teslim edilen MWh.
- **Pencere:** Kapanan takvim ayı (EPİAŞ uzlaştırma kesinleşince).
- **Kaynak/Sahip:** Finance & Risk Executive (billing-analysis mutabakatı,
  Plan 3.6). MRR değil — marj/MWh bu şirketin birim ekonomisidir.

### 3. Enerji-Ağırlıklı Churn — [BEKLİYOR: sözleşme defteri]
- **Tanım:** Dönemde ayrılan müşterilerin yıllık MWh'i ÷ dönem başı toplam
  portföy yıllık MWh'i. Müşteri sayısı churn'ü DEĞİL: 1 büyük sanayi
  müşterisi = yüzlerce mesken.
- **Pencere:** Çeyreklik; yıllıklandırılmış olarak raporlanır.
- **Kaynak/Sahip:** Analytics.

### 4. CAC / MWh — [KISMEN: pay mevcut, payda bekliyor]
- **Tanım:** Dönem satış+pazarlama toplam maliyeti ÷ dönemde YENİ imzalanan
  sözleşmelerin yıllık MWh'i.
- **Pencere:** Çeyreklik.
- **Kaynak/Sahip:** Analytics (maliyet: muhasebe; MWh: sözleşme defteri).
- **Bugün:** Lead maliyeti ve kaynak atıflaması KV+haftalık rapordan
  izlenebilir; imzalı MWh olmadan CAC/MWh hesaplanamaz.

### 5. Hedge Oranı — [BEKLİYOR: pozisyon defteri (Gate 1)]
- **Tanım:** Vadeli/ikili alımlarla kapatılmış MWh ÷ taahhüt edilmiş sabit
  fiyatlı satış MWh'i; M+1..3 ve M+4..6 kovaları ayrı raporlanır (hedefler:
  ≥%80 / ≥%60, Plan 3.1).
- **Pencere:** Aylık, teslim ayı bazında.
- **Kaynak/Sahip:** Market Risk. Sabit fiyat kitabı yokken "n/a — sabit
  taahhüt yok" yazılır; bu iyi bir cevaptır, boşluk değildir.

### 6. Açık Pozisyon (MWh) — [BEKLİYOR: pozisyon defteri (Gate 1)]
- **Tanım:** Ay bazında |taahhüt edilen satış MWh − kontrata bağlanmış
  tedarik MWh|; limit dokümanındaki tavana karşı (%'si ile) raporlanır.
- **Pencere:** Aylık, ileriye dönük 12 ay.
- **Kaynak/Sahip:** Market Risk. Burn rate değil — bu şirketin asıl risk
  göstergesi budur.

### 7. Teminat Headroom — [BEKLİYOR: 13-haftalık projeksiyon (Plan 2.8)]
- **Tanım:** (Kullanılabilir nakit + serbest teminat kapasitesi) −
  (EPİAŞ/Takasbank cari teminat yükümlülüğü + 13 hafta içindeki öngörülen
  artış). TL ve "kaç haftalık büyümeye yeter" cinsinden.
- **Pencere:** Haftalık; pakete ay sonu değeri girer.
- **Kaynak/Sahip:** Treasury & Capital. Büyüme temposu bu sayıyla sınırlıdır
  (Plan 2.8) — yatırımcıya da böyle anlatılır.

### 8. DSO (Alacak Tahsilat Süresi) — [BEKLİYOR: alacak yaşlandırma]
- **Tanım:** (Dönem sonu ticari alacaklar ÷ dönem satış geliri) × dönem gün
  sayısı.
- **Pencere:** Aylık.
- **Kaynak/Sahip:** Treasury & Capital (girdi: muhasebe).

### 9. Cost-to-Serve — [KISMEN]
- **Tanım:** Dönem toplam operasyon gideri (personel + araçlar + AI-operasyon
  altyapısı) ÷ hizmet verilen MWh. AI operasyon sisteminin yatırımcı tezi bu
  eğrinin düz kalmasıdır: MWh büyürken pay büyümemeli.
- **Pencere:** Aylık; trend grafiğiyle.
- **Kaynak/Sahip:** Analytics (girdi: muhasebe + sözleşme defteri).
- **Bugün:** Gider tarafı muhasebeden derlenebilir; MWh paydası bekliyor.
  Vekil metrikler (teklif dönüş süresi, otomatik işlenen lead oranı) bugünden
  haftalık rapordan izlenebilir.

### 10. Dengesizlik Oranı (%) — [BEKLİYOR: uzlaştırma mutabakatı (Plan 3.6)]
- **Tanım:** Dengesizlik hacmi (MWh) ÷ toplam tedarik hacmi (MWh); ayrıca
  dengesizlik maliyeti TL/MWh olarak. EPİAŞ uzlaştırma bildirimi ile iç kayıt
  ±%0,5 içinde mutabık olmalı.
- **Pencere:** Aylık (uzlaştırma dönemi).
- **Kaynak/Sahip:** Finance & Risk Executive (billing-analysis).

### 11. Aktif Müşteri Sayısı — [BEKLİYOR: sözleşme defteri]
- **Tanım:** Rapor tarihinde yürürlükte sözleşmesi olan tekil tüzel/gerçek
  kişi sayısı; segment kırılımıyla (endüstriyel ikili / diğer).
- **Pencere:** Anlık stok, ay sonu.
- **Kaynak/Sahip:** Analytics.
- **Bugün ölçülebilen komşu metrik [MEVCUT]:** lead sayısı, kaynak dağılımı,
  funnel dönüşümü — haftalık rapordan.

### 12. Net MWh Eklemesi — [BEKLİYOR: sözleşme defteri]
- **Tanım:** Dönemde yeni imzalanan yıllık MWh − churn olan yıllık MWh.
  Portföyün büyüme yönünün tek net göstergesi.
- **Pencere:** Aylık; çeyreklik toplamla.
- **Kaynak/Sahip:** Analytics.

---

## Doldurulabilir aylık paket tablosu

Dönem: `____ / 20__` · Yayım tarihi: `__.__.____` · Hazırlayan: IR ·
Mutabakat onayı: her satırda sahip ajan paraf alanı.

| # | KPI | Birim | Bu ay | Geçen ay | ÇBŞ* | Kaynak/Sahip | Durum |
|---|---|---|---|---|---|---|---|
| 1 | Sözleşme altındaki MWh | MWh/yıl | — | — | — | Analytics | BEKLİYOR |
| 2 | Marj / MWh | TL/MWh | — | — | — | Fin&Risk | BEKLİYOR |
| 3 | Enerji-ağırlıklı churn | %/yıl | — | — | — | Analytics | BEKLİYOR |
| 4 | CAC / MWh | TL/MWh | — | — | — | Analytics | KISMEN |
| 5 | Hedge oranı M+1..3 / M+4..6 | % / % | — | — | — | Market Risk | BEKLİYOR |
| 6 | Açık pozisyon (maks. ay) | MWh, % limit | — | — | — | Market Risk | BEKLİYOR |
| 7 | Teminat headroom | TL, hafta | — | — | — | Treasury | BEKLİYOR |
| 8 | DSO | gün | — | — | — | Treasury | BEKLİYOR |
| 9 | Cost-to-serve | TL/MWh | — | — | — | Analytics | KISMEN |
| 10 | Dengesizlik oranı | %, TL/MWh | — | — | — | Fin&Risk | BEKLİYOR |
| 11 | Aktif müşteri | adet | — | — | — | Analytics | BEKLİYOR |
| 12 | Net MWh eklemesi | MWh/yıl | — | — | — | Analytics | BEKLİYOR |

\* ÇBŞ = çeyrek başından bu yana.

**Köprü bölümü (paket yayımlanana kadar her ay doldurulur) — bugün gerçekten
ölçülebilenler [MEVCUT]:** haftalık lead sayısı ve kaynakları · funnel
olayları (sim_start → form_submit) · teklif dönüş süresi · site/rehber
performansı. Kaynak: lead KV + haftalık rapor (functions/api/report.js).

## Önkoşul haritası (dürüst özet)

| Önkoşul | Açtığı KPI'lar | Plan referansı | Sahip |
|---|---|---|---|
| Sözleşme/portföy defteri | 1, 3, 4, 9, 11, 12 | 2.5 | Analytics + sahip belgeleri |
| Pozisyon defteri + limit dokümanı (Gate 1) | 5, 6 | 1.7 | Market Risk |
| 13-haftalık nakit+teminat projeksiyonu | 7 | 2.8 | Treasury & Capital |
| Alacak yaşlandırma (muhasebe akışı) | 8 | 2.5/2.8 | Treasury & Capital |
| EPİAŞ uzlaştırma mutabakatı | 2, 10 | 3.6 | Billing-Analysis |

12 KPI'dan bugün tam ölçülebilen: **0** · Kısmen: **2** (CAC pay tarafı,
cost-to-serve gider tarafı + vekiller) · Kayıt sistemi bekleyen: **10**.
Bu tablo utanılacak bir şey değil, yol haritasıdır; ilk paket "çoğu satır
n/a" olarak yayımlanır ve her ay dolan satır sayısı ilerlemenin kanıtıdır.
