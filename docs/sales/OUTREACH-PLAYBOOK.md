# OUTREACH PLAYBOOK — B2B Outbound Sekansları ve Scriptler (Plan Madde 2.1)

**Hazırlayan:** Sales Agent (L3, Revenue) · **Tarih:** 2026-08-05
**Statü:** İç doküman. İlk gönderim öncesi **Legal & Compliance onayı zorunlu**
(bkz. §5 Uyum). Ton: sitenin B2B dili — ölçülü, veri-önce, vaatsiz.

---

## 0. Demir kurallar (her temasta geçerli)

1. **Sayısal fiyat/tasarruf iddiası yok.** Yüzde yok, TL yok, "ortalama %X
   düşer" yok. Çerçeve daima: **"verinizle modelleyelim"**. (Plan kalıcı
   yasak #6; site dipnotuyla tutarlı: "tasarruf yüzdesi ve tutar taahhüdü
   verilmez".)
2. **Sabit fiyat konuşması taahhüde dönüşmez.** Sabit model ancak Pricing
   doğrulaması + Market Risk pozisyon kontrolü (Gate 1) sonrası teklif edilir.
   Sahada cümle: "Sabit dahil üç modelimiz var; hangisinin size uyduğunu
   yük profilinize bakınca söyleyebiliriz."
3. Her e-postada **ret/çıkış imkânı** ve gerçek gönderen kimliği bulunur (§5).
4. Rehber linkleri kredibilite varlığımızdır; her sekans ilgili sektör
   rehberine ve gerekirse `/rehber/ptf-nedir`, `/rehber/serbest-tuketici`,
   `/rehber/tedarikci-degistirme` sayfalarına bağlanır.
5. Süreç anlatımı sitedeki 5 adımla birebir: Keşif → Modelleme → Teklif →
   Onboard → Devreye Alma.

## 1. Üç dokunuşlu e-posta dizisi

Zamanlama: T1 → +4 iş günü → T2 → +5 iş günü → T3. Yanıt gelirse sekans durur,
görüşme planlanır. Ret gelirse İYS'ye 3 iş günü içinde işlenir ve kayıt
kapatılır (§5).

### T1 — Açılış (sektöre özel içgörü + rehber linki)

Konu satırı kalıpları (sektöre göre seçilir):
- Demir-çelik: `Ark ocağı yük profilinde saatlik PTF maruziyeti`
- Kimya: `Proses sürekliliği olan tesislerde dengeleme toleransı`
- Tekstil: `Boyahane/iplik hatlarında vardiya profili ve tedarik modeli`
- Soğuk zincir: `7/24 soğutma yükünde gece-gündüz PTF farkı`
- Veri merkezi: `Kesintisiz yükte tedarik modeli seçimi`
- OSB: `OSB içinden ve dışından tedarik: iki yolun mekaniği`

Gövde şablonu (TR, ~120 kelime; [köşeli] alanlar kişiselleştirilir):

> Sayın [Ad Soyad],
>
> [Firma]’nın [tesis/hat tipi — ör. "ark ocaklı tesisinde"] elektrik,
> maliyet kalemlerinin en oynak olanlarından; çünkü fatura tek bir fiyata
> değil, saatlik PTF dağılımına ve yük profilinize bağlı.
>
> Voltan Elektrik (Voltage Enerji), 2011’den beri EPDK tedarik lisanslı bir
> toptan satış şirketi. [Sektör] tesisleri için tedarik mekaniğini burada
> açık açık yazdık: voltage.com.tr/rehber/[sektor-rehberi]
>
> Size bir tasarruf yüzdesi vaat etmeyeceğim — bunu verinizi görmeden söyleyen
> herkes tahmin ediyordur. Önerim: son 12 aylık tüketim verinizle yük
> profilinizi modelleyelim; sabit, endeksli ve hibrit modelin sizin
> profilinizde nasıl davrandığını rakamlarınızla görün.
>
> Uygun olursanız 20 dakikalık bir ön görüşme öneririm.
>
> [İmza — ad, unvan, telefon]
> [Ret bildirimi satırı — §5.4]

### T2 — Değer takibi (canlı PTF verisi / rehber içeriği)

+4 iş günü, yanıt yoksa. Konu: `Re: [T1 konusu] — saatlik fiyat verisi`

> Sayın [Ad Soyad],
>
> Kısa bir ek: sitemizde EPİAŞ Şeffaflık verisinden beslenen günlük PTF
> ekranı var (voltage.com.tr). [Sektöre özel tek cümle — ör. "Soğuk depo
> yükü gibi gece de düşmeyen profillerde, saatlik fiyat dağılımı hangi
> sözleşme modelinin mantıklı olduğunu tek başına belirleyebiliyor."]
>
> PTF mekanizmasının fatura satırlarınıza nasıl yansıdığını şurada
> anlattık: voltage.com.tr/rehber/ptf-nedir
>
> Tedarikçi değişiminin sanılandan kısa ve kesintisiz bir süreç olduğunu da
> ekleyeyim: voltage.com.tr/rehber/tedarikci-degistirme
>
> Verinizle 20 dakikalık bir modelleme ön görüşmesi için bu hafta uygun bir
> gününüz var mı?
>
> [İmza] · [Ret satırı]

### T3 — Kapanış (net CTA)

+5 iş günü. Konu: `[Firma] için keşif görüşmesi — son not`

> Sayın [Ad Soyad],
>
> Israr etmemek adına bu son notum. Talebim net: 20 dakikalık bir keşif
> görüşmesi. Getirmeniz gereken tek şey son 12 aylık elektrik faturalarınız
> ya da tüketim dökümünüz; bizim tarafta yük profili analizi ve üç sözleşme
> modelinin (sabit / endeksli / hibrit) profilinize göre karşılaştırması var.
> Görüşme sonunda elinizde, taahhüt içermeyen bir ön değerlendirme olur.
>
> Uygunsa şu iki gün/saatten biri: [seçenek 1] / [seçenek 2].
> Değilse konuyu kapatıyorum; ileride ihtiyaç olursa rehber arşivimiz açık:
> voltage.com.tr/rehber
>
> [İmza] · [Ret satırı]

## 2. Telefon açılış scripti

> "Merhaba, ben [ad], Voltan Elektrik’ten — Voltage Enerji. 2011’den beri
> EPDK lisanslı elektrik tedarikçisiyiz. [Firma]’nın [tesis tipi] tarafında
> enerji maliyetinden sorumlu kişiyle kısa bir konu paylaşmak istiyorum:
> tesisinizin yük profiline göre sabit, endeksli veya hibrit tedarik
> modellerinden hangisinin uygun olduğunu, sizin verinizle, taahhütsüz
> modelleyip gösteriyoruz. Rakam vaat etmiyoruz; hesabı birlikte yapıyoruz.
> Bu, 20 dakikalık bir ön görüşme konusu. Bu haftadan bir gün önerebilir
> miyim?"

**Kural:** Telefonda da fiyat/yüzde verilmez. "Fiyatınız ne?" gelirse §4/İtiraz-3.

## 3. Gatekeeper (santral/asistan) geçişi

> "Enerji maliyetleriyle ilgili teknik bir konu — [enerji müdürü / mali işler /
> fabrika müdürü] ile görüşmem gerekiyor. Satış baskısı yapan bir arama değil;
> tesisin yük profili analiziyle ilgili kısa bir ön bilgilendirme. İsmini
> alıp e-posta ile de gönderebilirim — doğru kişi kim olur?"

- Amaç her koşulda **isim + rol** almak (CRM: karar_verici_rolu alanı).
- Sekreterya e-posta adresi verirse genel kutuya değil, kişiye yazılır.
- İkinci aramada referans: "Geçen hafta [gatekeeper adı] ile görüşmüştük."

## 4. Beş yaygın itiraz ve cevaplar

**İtiraz 1 — "Mevcut sözleşmem var / dönem sonunda konuşalım."**
> "Doğru zamanlama zaten dönem sonudur; itirazınız değil, takvimimiz olsun.
> Modelleme 20 dakika sürüyor ve bugünden yapılabilir — böylece dönem sonu
> geldiğinde elinizde hazır bir kıyas olur, sıfırdan başlamazsınız. Sözleşme
> bitiş ayınızı alayım; süreci ve geçiş takvimini şurada görebilirsiniz:
> voltage.com.tr/rehber/tedarikci-degistirme"
*(CRM'e sözleşme bitiş ayı işlenir; PIPELINE-TAKIP'te "temas–beklemede".)*

**İtiraz 2 — "Tedarikçi değiştirmek riskli; elektriğimiz kesilir mi?"**
> "Değişim EPİAŞ nezdinde bir kayıt işlemidir; şebekeniz, sayacınız, dağıtım
> şirketiniz aynı kalır — fiziksel hiçbir şey değişmez, kesinti olmaz.
> Adım adım süreç burada: voltage.com.tr/rehber/tedarikci-degistirme.
> Ayrıca hangi tüketiciler seçim hakkına sahip, onu da yazdık:
> voltage.com.tr/rehber/serbest-tuketici"

**İtiraz 3 — "Fiyatınız ne? Yüzde kaç düşersiniz?"**
> "Verinizi görmeden fiyat söyleyen tedarikçiye temkinli yaklaşın — saatlik
> yük profiliniz bilinmeden verilen her rakam ya tahmindir ya pazarlıktır.
> Bizim yöntemimiz: 12 aylık tüketiminizle profili çıkarırız, üç modelin
> (sabit/endeksli/hibrit) sizin profilinizde nasıl çalıştığını gösteririz,
> formüller sözleşmeye yazılır. Fiyatın nasıl oluştuğunu görmek isterseniz:
> voltage.com.tr/rehber/ptf-nedir"
*(İç not: burada dahi örnek rakam verilmez. Pricing'in doğruladığı teklif
dışında hiçbir sayı telaffuz edilmez.)*

**İtiraz 4 — "Elektriği OSB'den alıyorum."**
> "OSB'den tedarik birçok tesis için makul bir varsayılan; ama OSB
> katılımcılarının serbest tüketici olarak kendi tedarikçisini seçme
> seçenekleri ve iki yolun maliyet mekaniği farklı işler. İkisinin nasıl
> karşılaştırılacağını burada tarafsız biçimde yazdık:
> voltage.com.tr/rehber/osb-elektrik-tedariki — verinizle karşılaştırmayı
> yapalım; OSB lehine çıkarsa bunu da açıkça söyleriz."
*(İç not: OSB-içi tedarik koşulları OSB'ye göre değişir; hukuki kapsam
iddiası kurulmaz, Legal & Compliance onaylı çerçevede kalınır.)*

**İtiraz 5 — "Zamanım yok."**
> "O yüzden 20 dakika istiyorum, toplantı serisi değil. Hazırlık da sizde
> değil bizde: faturalarınızı iletmeniz yeterli, analizle biz geliriz.
> Dilerseniz görüşmeden önce iki sayfalık sektör rehberimizi bırakayım:
> voltage.com.tr/rehber/[sektor-rehberi] — uygun bir 20 dakikayı asistanınızla
> da planlayabilirim."

## 5. UYUM (ZORUNLU) — **Legal & Compliance onayı olmadan ilk gönderim yapılmaz**

### 5.1 Ticari elektronik ileti — 6563 sayılı Kanun ve İYS
- Türkiye'de ticari elektronik ileti, 6563 sayılı Elektronik Ticaretin
  Düzenlenmesi Hakkında Kanun ve Ticari İletişim ve Ticari Elektronik
  İletiler Hakkında Yönetmelik'e tabidir; denetim Ticaret Bakanlığı'ndadır.
- Mevzuattaki genel kural **önceden onay**dır. **Tacir ve esnaf istisnası:**
  alıcı tacir/esnaf ise önceden onay alınmadan ileti gönderilebilir; ancak
  (a) her iletide **ret (çıkış) imkânı** bulunmak zorundadır, (b) ret
  kullanıldıysa bir daha gönderilemez ve ret bildirimi **3 iş günü içinde
  İYS'ye** işlenir, (c) gönderim öncesi **İYS üzerinden ret kontrolü**
  yapılır (CRM alanı `iys_ret_kontrol` bu yüzden zorunludur).
- **Legal & Compliance'ın ilk gönderim ÖNCESİ teyit etmesi gerekenler:**
  1. İYS yükümlülüğünün **B2B kurumsal e-posta adreslerine** (ör.
     ad.soyad@firma.com — gerçek kişiye ait kurumsal adres) uygulanma
     kapsamı ve tacir/esnaf istisnasının bizim hedef listemizdeki alıcı
     tipleri için tam sınırı;
  2. Voltan'ın İYS'ye **hizmet sağlayıcı kaydının** mevcut/güncel olduğu;
  3. Şablonlardaki gönderen kimliği ve ret metninin yönetmelik şekil
     şartlarını karşıladığı;
  4. Telefonla arama tarafında ticari ileti sayılma sınırı.
- Bu teyitler alınana kadar sekans **taslak** statüsündedir. Bu ihtiyatlı
  duruş bilinçlidir: istisnanın kapsamı yoruma açık noktalar içerir ve
  yanlış yorum idari para cezası riskidir.

### 5.2 KVKK — irtibat kişisi verisi
- Karar verici ad/rol/kurumsal e-posta bilgisi **kişisel veri**dir. İşleme
  dayanağı olarak KVKK m.5/2(f) **meşru menfaat** değerlendirmesi Legal &
  Compliance tarafından yazılı yapılır ve dosyalanır; aydınlatma
  yükümlülüğünün ilk temasta nasıl karşılanacağı (e-posta altı kısa
  aydınlatma + sitedeki kvkk.html linki) onaylanır.
- Veri yalnız kamuya açık kurumsal kaynaklardan (firma sitesi, oda/dernek
  rehberi, LinkedIn) toplanır; kaynak CRM'de tutulur. Amaç dışı kullanım ve
  liste satın alma yasaktır.

### 5.3 İçerik kuralları (tekrar)
- Sayısal fiyat/tasarruf iddiası yasak (Pricing doğrulaması olmadan hiçbir
  sayı; plan yasak #6). Sabit fiyat teklifi ancak Pricing + Market Risk
  Gate 1 kontrolü sonrası (yasak #2).
- Reklam Kurulu/EPDK optiği: karşılaştırmalı üstünlük iddiası ("en ucuz",
  "kesin tasarruf") hiçbir şablona giremez.

### 5.4 Zorunlu ret satırı (her e-postanın altına)
> "Bu iletiyi almak istemiyorsanız bu e-postayı 'RET' konusuyla yanıtlamanız
> yeterlidir; talebiniz 3 iş günü içinde işlenir ve tarafınıza bir daha
> ticari ileti gönderilmez. Kişisel verilerinize ilişkin aydınlatma metni:
> voltage.com.tr/kvkk"
*(Nihai metin Legal & Compliance onayına tabidir.)*

## 6. Beklenen etki

- Hedef funnel aşamaları: **temas → görüşme** (T1/T2/T3 e-postaları, telefon)
  ve **görüşme → veri alındı** (itiraz cevapları, "verinizle modelleyelim"
  çerçevesi veriyi görüşmenin doğal çıktısı yapar).
- Plan bağlantısı: Faz 2 çıkışı "≥40 nitelikli görüşme"nin ana motoru.
- Ölçüm: sekans başına yanıt oranı, görüşme dönüşümü, ret oranı —
  PIPELINE-TAKIP §3 haftalık setinde.
