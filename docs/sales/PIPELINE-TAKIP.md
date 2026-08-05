# PIPELINE TAKİP — B2B Outbound Hunisi ve Haftalık Rapor Seti (Plan Madde 2.1)

**Hazırlayan:** Sales Agent (L3, Revenue) · **Tarih:** 2026-08-05
**Statü:** İç doküman. Ölçüm tanımları Analytics ile, risk kapıları Market
Risk ile paylaşılır. MWh-ağırlıklı düşünce esastır (marj/MWh > adet).

---

## 1. Huni aşamaları ve çıkış kriterleri

| # | Aşama | Tanım | Çıkış kriteri (bir sonraki aşamaya geçiş) |
|---|---|---|---|
| 1 | **Hedef listede** | Hesap, HEDEF-HESAP-CERCEVESI §5 veri modeliyle kayıtlı; kaynak URL'si var | Karar verici kişi/rolü belirlendi + İYS ret kontrolü "temiz" + ilk dokunuş gönderildi |
| 2 | **Temas** | En az bir dokunuş (e-posta/telefon) ulaştı; sekans işliyor | Karar vericiden olumlu yanıt ve takvimli görüşme; **ya da** sekans bitti/ret → "kapalı-pasif" |
| 3 | **Görüşme** | 20 dk keşif görüşmesi yapıldı (sitedeki S1-Keşif adımı) | Müşteri tüketim verisini paylaşmayı kabul etti + sözleşme bitiş dönemi öğrenildi |
| 4 | **Veri alındı** | 12 aylık fatura/tüketim verisi elimizde; Billing Analysis yük profilini çıkardı (S2-Modelleme) | Pricing doğrulanmış model karşılaştırması üretti; sabit fiyat söz konusuysa **Market Risk Gate 1 kontrolü tamam** |
| 5 | **Teklif** | Pricing-onaylı teklif sunuldu (S3-Teklif); tüm formüller yazılı | Müşteri şartları müzakereye açtı (karşı öneri/şart talebi) |
| 6 | **Müzakere** | Şartlar görüşülüyor; her revize teklif yeniden Pricing onayından geçer, sabit dilim değişirse Market Risk yeniden bakar | Karşılıklı mutabık metin; imza takvimi net |
| 7 | **İmza** | Sözleşme imzalandı; kontrat kaydı sözleşme siciline (plan 2.5 sistemine) girildi | EPİAŞ profil transferi + tedarikçi değişim başvurusu tamamlandı (S4-Onboard) |
| 8 | **Devrede** | Tedarik başladı (S5); ilk fatura kesildi | — (portföy yönetimi ve Lifecycle CRM'e devir) |

**Kapalı statüler:** `kapalı-pasif` (yanıt yok/zamanlama; yeniden temas tarihi
zorunlu), `kapalı-ret` (İYS ret — yeniden temas YASAK), `kapalı-kaybedildi`
(neden kodu zorunlu: fiyat / mevcut tedarikçi / OSB-içi / zamanlama / diğer),
`kapalı-uygunsuz` (serbest tüketici değil / kredi riski / kapsam dışı).

**Geri düşme kuralı:** Aşama atlamak yasaktır; özellikle 4→5 geçişi Pricing
onayı olmadan, sabit fiyatlıysa Gate 1 kontrolü olmadan **sistemsel olarak
imkânsız** olmalıdır (KPI: doğrulanmamış teklif = 0).

## 2. Aşama sahiplik ve SLA

| Geçiş | Sorumlu | SLA |
|---|---|---|
| Listede → temas | Sales | Kayıttan itibaren 5 iş günü içinde ilk dokunuş |
| Görüşme → veri talebi | Sales | Görüşme günü içinde veri talep e-postası |
| Veri alındı → model çıktısı | Billing Analysis + Pricing | 5 iş günü |
| Model → teklif | Sales (Pricing onayıyla) | 2 iş günü (plan 2.2'deki 1 iş günü teklif SLA'sına inbound/broker tarafında uyulur) |
| Ret bildirimi → İYS işleme | Sales ops | **3 iş günü (yasal)** |

## 3. Haftalık gözden geçirme metrik seti

Her pazartesi; rapor Revenue Executive'e, aylık özet KPI paketine (plan 2.9).

**A. MWh-ağırlıklı pipeline (ana gösterge)**
- Aşama başına: hesap sayısı + tahmini MWh/ay toplamı (bant orta değeriyle;
  "keşifte" olanlar ayrı satırda, MWh'siz).
- Ağırlıklı pipeline: aşama olasılık katsayıları ilk 8 hafta veri toplandıktan
  sonra kalibre edilir; o zamana dek katsayısız brüt MWh raporlanır
  (uydurma olasılık yok).
- Gün-180 hedef bağı: teklif+müzakere aşamalarındaki yıllıklandırılmış hacim
  → hedef ≥60 GWh/yıl.

**B. Aşama dönüşümleri (haftalık kohort)**
- temas→görüşme %, görüşme→veri %, veri→teklif %, teklif→imza %.
- Sekans metrikleri: T1/T2/T3 yanıt oranı, telefon bağlanma oranı, ret oranı.
- En yüksek düşüş noktası işaretlenir; sonraki haftanın tek iyileştirme
  aksiyonu oraya yazılır (standart: en yüksek drop-off'a müdahale).

**C. Döngü süresi**
- Aşama başına medyan gün; uçtan uca (listede→imza) medyan.
- "Bekleyen" alarmı: 14 günden uzun hareketsiz kayıt listesi (sözleşme
  dönemi bekleyen `kapalı-pasif` hariç).

**D. Uyum ve risk sayaçları (her hafta, istisnasız)**
- Pricing doğrulaması olmadan çıkan teklif: **0 olmalı** (0 değilse
  Revenue Executive'e derhal eskalasyon).
- Gate 1 kontrolsüz sabit fiyat taahhüdü: **0 olmalı**.
- İYS: 3 iş günü aşılan ret işleme: **0 olmalı**.

## 4. Kayıt disiplini

- Sistem: Faz 1'de kurulan lead altyapısıyla aynı yerde (CF KV lead kaydı +
  CRM tablosu); ayrı gölge listeler (Excel kopyaları) yasak — tek doğruluk
  kaynağı.
- Her aşama değişikliği: tarih + değiştiren + tek satır not.
- Kaybedilen her T1 hesabı için 5 satırlık kayıp analizi (neden, kimde
  kaybedildi, yeniden temas tarihi).

## 5. Inbound tekilleştirme ve devir kuralı (teklif formu / KV sistemi)

Sitenin lead formu artık gerçek backend'e yazıyor (plan 1.1). Çakışma kuralı:

1. **Yeni outbound kaydı açmadan önce** lead-KV kayıtlarında firma adı +
   e-posta alan adı (@firma.com) araması yapılır.
2. **Inbound kaydı varsa:** outbound kaydı açılmaz; mevcut kayda
   `kaynak=inbound` korunarak outbound notu düşülür. Kaynak atfı ilk temas
   kanalında kalır (CAC/MWh ölçümü bozulmaz — plan 1.2 atıf şeması).
3. **Outbound'da olan hesap formdan başvurursa:** kayıt birleştirilir;
   aşama, ikisinden ileri olana ayarlanır; form verisi (tüketim bandı,
   sektör alanı) CRM'deki "keşifte" alanlarını doldurur.
4. Simülatör→form ön doldurma verisi geldiyse görüşme öncesi Billing
   Analysis'e iletilir; görüşme "soğuk keşif" değil "veri ön-inceleme"
   modunda yapılır.
5. Broker/partner kanalı (plan 2.2) devreye girince aynı tekilleştirme
   partner kayıtlarına da uygulanır; komisyon ihtilafını önlemek için ilk
   kayıt zaman damgası esastır.

## 6. Beklenen etki

- Hedef: huninin **tamamının ölçülür** hale gelmesi (denetim bulgusu:
  "nothing is measured"). İlk 4 haftada baz oranlar; 8. haftada kalibre
  katsayılı MWh-ağırlıklı pipeline.
- Plan bağları: Faz 2 çıkışı (≥40 görüşme, ≥60 GWh/yıl teklif aşaması),
  Gün-180 (≥3 imzalı sözleşme, %100 risk-kontrollü sabit teklif).
