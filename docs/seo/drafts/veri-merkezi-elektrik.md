# /veri-merkezi-elektrik — Veri Merkezleri & Telekom Elektrik Tedariki (Küme A, sektör sayfası)

```
title:       Veri Merkezi Elektrik Tedariki ve Yeşil Enerji | Voltage   (56 karakter)
meta:        7/24 düz yük çeken veri merkezlerinde elektrik tedariki: PTF endeksli ve sabit modeller, PUE bilinci ve YEK-G belgeli yeşil enerji tedariki. (140 karakter)
h1:          Veri Merkezleri ve Telekom Tesislerinde Elektrik Tedariki
breadcrumb:  Veri Merkezi & Telekom
cross-link:  "PTF nasıl oluşur" → /ptf-nedir
cross-link:  "tedarikçi değiştirme süreci" → /tedarikci-degistirme
cross-link:  "serbest tüketici hakkı" → /serbest-tuketici
CTA:         Orta (yeşil enerji bölümü sonrası) + sayfa sonu → /#iletisim "Teklif Talep Edin"
küme/huni:   Küme A (ticari B2B, en düz yük profili) · alt-orta huni · tek iş: veri merkezi işletmecisini/CTO-CFO'yu teklif formuna taşımak
sayfa-içi:   Ana sayfadaki "Veri Merkezleri & Telekom" sektör kartından link (seo-onpage görevi)
açı:         7/24 düz yük + YEK-G/yeşil enerji talebi; "kesintisizlik fiziksel, tedarik ticari" ayrımı
```

---

**Veri merkezi, elektrik piyasasının gözünden bakıldığında sanayinin en okunaklı yüküdür:** sunucu salonları yılın her saati çalışır, soğutma bu yükü gölge gibi izler ve sonuç, günün hiçbir saatinde sıfıra inmeyen, mevsimsel dalgalanması sınırlı, **7/24 düz (flat) bir profildir**. Elektrik aynı zamanda veri merkezinin en büyük işletme maliyeti kalemlerindendir; sunucu başına değil, çekilen her kilovatsaat başına ödenir. Bu iki gerçek birleşince tedarik sözleşmesi, veri merkezi işletmecisi için kira kadar stratejik bir kaleme dönüşür.

Bu sayfa, veri merkezi ve telekom altyapısı işleten ekiplerin enerji ve finans sorumluları için yazıldı: yük gerçeğinden başlayıp yeşil enerji talebine ve sözleşme modeline giden sıra ile.

## 7/24 düz yük tedarik masasında neden değerlidir?

Elektriğin toptan fiyatı ([PTF](/ptf-nedir)) her saat yeniden oluşur; talebin yığıldığı saatler pahalı, gece saatleri görece ucuzdur. Tüketimini gündüz puant saatlere yığan bir tüketici, yıllık ortalamada pahalı saatlerin fiyatını öder. Veri merkezi ise tüketimini günün tamamına eşit yaydığı için ucuz gece saatlerinden de tam pay alır — üstelik bunu hiçbir operasyonel çaba göstermeden, yük profilinin doğası gereği yapar.

İkinci değer öngörülebilirliktir: BT yükü kısa vadede neredeyse sabittir, soğutma yükü ise dış hava sıcaklığıyla mevsimsel olarak salınır ama modellenebilir. Plan-gerçekleşme sapması küçük kalan bir tesiste dengesizlik riski küçülür; bu, fiyatlamaya yansıyan bir disiplindir. Saatlik verisiyle modellenen düz profilli bir teklif, profil hiç sorulmadan verilen tek fiyatlı tekliften her zaman daha isabetli kurulur.

## UPS, jeneratör ve tedarikçi değişimi: fiziksel-ticari ayrımı

Veri merkezi dünyasında "elektrik" kelimesi refleks olarak yedekliliği çağrıştırır: UPS grupları, jeneratörler, çift besleme. Burada net olmak gerekir: **kesintisizlik fiziksel bir konudur ve dağıtım şebekesi ile tesisin kendi altyapısının işidir; tedarikçi değişimi ise tamamen ticari bir işlemdir.** Tedarikçiniz değiştiğinde sayaç, bağlantı, besleme hattı ve yedeklilik mimariniz olduğu gibi kalır; değişen yalnızca enerjinin faturalandığı taraftır. Geçiş anında SLA'nızı ilgilendiren hiçbir fiziksel olay yaşanmaz.

Buna karşılık PUE bilinci tedarik masasına doğrudan taşınır: soğutma ve altyapı yükü, faturanın BT yükünün üzerine binen kısmıdır. Keşif adımında BT yükü ile altyapı yükünün saatlik ayrışması incelenir; soğutma optimizasyonu yapan bir tesisin profildeki iyileşmesi, bir sonraki modelleme döneminde fiyata yansır.

## Yeşil enerji ve YEK-G: müşterinizin sorduğu soru

Veri merkezini diğer sanayi yüklerinden ayıran bir talep daha vardır: müşterileri, kurumsal sürdürülebilirlik raporlamaları için tükettikleri enerjinin kaynağını sorar. Bu talebin serbest piyasadaki karşılığı, yenilenebilir kaynaktan üretildiği belgelenen elektriğin **YEK-G belgesi** ile tedarik edilmesidir. İkili anlaşma, bu talebi taşıyabilen sözleşme biçimidir: tedarik portföyü yenilenebilir üretimle eşleştirilir ve belgelendirme sözleşmede yazılı hâle getirilir.

Burada da ilkemiz aynıdır: "yüzde yüz yeşil" sloganı değil, belgesi sözleşmede tanımlı tedarik. Hangi dönem için hangi belgelendirmenin sağlanacağı, diğer her formül gibi sözleşme metnine yazılır.

*[CTA — Teklif Talep Edin → /#iletisim]*

## Sabit mi, endeksli mi, hibrit mi?

Veri merkezinde model seçimi, yük esnekliğinden çok **gelir modelinin yapısına** bağlıdır:

- **Sabit fiyat** — kolokasyon ve kapasite sözleşmelerini uzun vadeli sabit fiyatla satan, müşterisine öngörülebilir birim maliyet taahhüt eden işletmeler için doğal seçimdir.
- **PTF endeksli** — düz profil, endeksli modelde yıllık ortalamanın okunaklı olmasını sağlar; enerji maliyetini müşterisine yansıtma mekanizması olan işletmeler için tutarlıdır.
- **Hibrit** — BT baz yükünü sabitleyip mevsimsel soğutma bileşenini endeksli bırakan ara model; riskin formülle paylaşıldığı yapıdır.

Hiçbir modelde tasarruf yüzdesi veya tutar taahhüdü vermeyiz; her formül sözleşme metninde yazılıdır ve karşılaştırma tesisin kendi 12 aylık saatlik verisiyle yapılır.

## Süreç ve serbest tüketici hakkı

[Tedarikçi değiştirme rehberimizde](/tedarikci-degistirme) anlattığımız beş adım burada da aynıdır: keşif (saatlik yük verisi, BT/altyapı ayrışması, büyüme planı), modelleme (GÖP + ikili karışım, referans dönem PTF analizi), teklif (formüller ve varsa YEK-G belgelendirmesi sözleşmede), onboard (EPİAŞ işlemleri tarafımızca) ve devreye alma (ilk saatte canlı tedarik, ilk ay kullanım raporu). Kapasite artışları — yeni salon, yeni hat — sözleşme döneminde miktar toleranslarıyla yönetilir; büyüyen tesis modeli yeniden kurdurur, cezaya yürümez.

2026 serbest tüketici limiti yıllık 500 kWh olduğundan (EPDK Kurul Kararı 14039, Resmî Gazete 23.12.2025) en küçük uç (edge) sahadan hiperölçekli kampüse kadar her tesis [serbest tüketici](/serbest-tuketici) kapsamındadır; tedarikçisini seçme hakkı ölçek koşuluna takılmaz.

## Neden Voltage Enerji?

Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş. (Voltage Enerji), ETS/3424-8/2074 numaralı EPDK tedarik lisansıyla 19 Eylül 2011'den bu yana serbest piyasada faaliyet göstermektedir; bugün GÖP ile GİP'in aktif katılımcısıdır. Veri merkezleri ve telekom altyapısı, ana sayfamızda sahiplendiğimiz sektörlerdendir. Formüllerimiz yazılıdır, verimiz EPİAŞ Şeffaflık kaynaklıdır ve modelin sonucunu — lehinize ya da aleyhinize — olduğu gibi raporlarız.

## Sık sorulan sorular

**Tedarikçi değişimi kesinti veya SLA riski doğurur mu?**
Hayır. Değişim fiziksel değil ticari bir kayıt işlemidir: enerji aynı şebekeden, aynı bağlantı ve aynı sayaç üzerinden akmaya devam eder. UPS, jeneratör ve çift besleme mimariniz tedarikçiden bağımsızdır ve geçişten etkilenmez.

**YEK-G belgeli tedarik fiyatı nasıl etkiler?**
Belgelendirme, sözleşmede ayrı ve yazılı bir bileşen olarak tanımlanır; etkisi tesisin tüketim profiline ve talep edilen kapsam dönemine göre modellemede ortaya çıkar. Sloganla değil, formülle fiyatlanır — teklif aşamasında belgeli ve belgesiz seçenekleri yan yana görürsünüz.

**Jeneratör testleri ve UPS şarj yükleri modeli bozar mı?**
Hayır; periyodik jeneratör testleri ve UPS şarj çevrimleri toplam profil içinde küçük ve planlı yüklerdir. Keşif adımında test takvimi tüketim planına işlenir ve miktar toleransları buna göre kurulur.

*[CTA — Teklif Talep Edin → /#iletisim]*

---

**Bu yazı hakkında:** Yayın/güncelleme tarihi: 05.08.2026. Kaynaklar: EPDK Kurul Kararı 14039 (Resmî Gazete 23.12.2025, sayı 33116); EPİAŞ Gün Öncesi Piyasası işleyişi (Şeffaflık Platformu). Yük karakterlerine ilişkin tespitler genel mühendislik bilgisi ve 2011'den bu yana yürütülen tedarik operasyonu deneyimidir; tesise özgü değerlendirme saatlik tüketim verisiyle yapılır.
