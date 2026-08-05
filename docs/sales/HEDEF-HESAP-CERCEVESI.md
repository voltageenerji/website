# HEDEF HESAP ÇERÇEVESİ — B2B Outbound Motoru (Plan Madde 2.1)

**Hazırlayan:** Sales Agent (L3, Revenue) · **Tarih:** 2026-08-05
**Statü:** İç doküman — siteye yansımaz. Revenue Executive onayına sunulur.
**Bağlı kurallar:** Hiçbir sayısal fiyat/tasarruf iddiası kullanılamaz (Pricing
doğrulaması olmadan); sabit fiyat / büyük hacim taahhüdü öncesi Market Risk
pozisyon kontrolü zorunludur (180 günlük plan, kalıcı yasaklar #2 ve #6).

---

## 1. Katmanlama (Tier) — MWh değerine göre

Katman ölçütü tekil ciro değil, **aylık MWh** ve **portföy marjı potansiyeli**dir
(enerji-native ilke: MWh başına marj > MRR düşüncesi).

| Tier | Tanım | Tahmini hacim | Tipik profil | Yaklaşım |
|---|---|---|---|---|
| **T1** | Tekil büyük sanayi | **> 1 GWh/ay** | Ark ocaklı çelik, petrokimya, cam fırını, büyük iplik/boyahane, hyperscale veri merkezi | Hesap-bazlı (ABM): tekil araştırma, kişiye özel açılış, yönetici düzeyi temas. Sabit fiyat isteği gelirse **önce Market Risk pozisyon kontrolü** |
| **T2** | Orta sanayi | **200–1.000 MWh/ay** | OSB katılımcısı üreticiler, orta ölçekli kimya/tekstil/gıda-soğutma, bölgesel veri merkezi | Sektör dikeyi bazlı sekans (OUTREACH-PLAYBOOK), rehber içerikleriyle |
| **T3** | Çok lokasyonlu zincirler | Lokasyon başına düşük, **toplamda yüksek** | Perakende/market zinciri, soğuk depo ağı, lojistik ağı, telekom baz/santral portföyü | Merkezi enerji/satınalma birimi hedeflenir; tek sözleşme–çok sayaç modeli anlatılır |

**Not:** T3'te tekil sayaçlar serbest tüketici limitinin altında kalabilir;
2026 limiti Madde 1.8 doğrulamasına tabidir — Energy Market teyidi alınmadan
uygunluk iddia edilmez.

## 2. Sektör önceliği (site + rehber güçlerimizin aynası)

Sıralama: (elektrik yoğunluğu × rehber/kredibilite varlığımız × ulaşılabilirlik).

1. **Demir-Çelik & Döküm** — rehber: `/rehber/demir-celik-elektrik` (T1 ağırlıklı)
2. **Kimya & Petrokimya** — rehber: `/rehber/kimya-elektrik` (T1–T2)
3. **OSB katılımcıları** — rehber: `/rehber/osb-elektrik-tedariki` (T2; yatay dikey)
4. **Tekstil & Kompozit** — rehber: `/rehber/tekstil-elektrik` (T1–T2)
5. **Cam & Seramik** — rehber: `/rehber/cam-seramik-elektrik` (T1–T2)
6. **Soğuk Zincir & Lojistik** — rehber: `/rehber/soguk-zincir-elektrik` (T2–T3)
7. **Veri Merkezi & Telekom** — rehber: `/rehber/veri-merkezi-elektrik` (T1–T3)
8. **Çok lokasyonlu perakende** (rehberi yok; OSB/soğuk zincir rehberleriyle köprü kurulur — T3)

Coğrafi öncelik: **İstanbul – Kocaeli/Gebze – Bursa – Tekirdağ/Çerkezköy
koridoru** (plan 2.2 broker pilotuyla aynı koridor; saha verimliliği).

## 3. Liste kaynak yöntemi (kamuya açık, doğrulanmış kaynaklar)

Liste satın alınmaz; aşağıdaki açık kaynaklardan **kendi listemiz** inşa edilir.
Her kaynaktan çekilen firma, §5'teki veri modeliyle kayda geçirilir.

### 3.1 OSB ve bölge kaynakları
| Kaynak | URL | Not |
|---|---|---|
| OSBÜK OSB listesi | https://osbuk.org/view/osb/osbliste.php (PDF: https://osbuk.org/wp-content/uploads/2021/05/351-OSB.pdf) | Türkiye'deki tüm OSB'lerin künyesi; OSB yönetimleri üzerinden katılımcı listelerine gidilir |
| Çerkezköy OSB katılımcıları | https://cosb.org.tr/companies/ | Tekirdağ koridoru T2 kaynağı |
| Veliköy OSB üye firmalar | https://www.vosb.org.tr/uye-firmalarimiz | Çerkezköy |
| Gebze Plastikçiler OSB katılımcıları | https://geposb.com.tr/tr/katilimcilar | Kocaeli/kimya-plastik |
| Bursa OSB üye firmalar | https://www.bosb.org.tr/bosb-firma-0-uye_firmalar.html | Bursa tekstil/otomotiv yoğun |
| TOSB (Otomotiv İhtisas OSB, Çayırova) | osbuk.org listesi üzerinden künye doğrulandı | Kocaeli |

### 3.2 Oda rehberleri
| Kaynak | URL | Not |
|---|---|---|
| İstanbul Sanayi Odası üye arama | https://eoda.iso.org.tr/UyeArama/UyeAramaIcerik | 55 sektörde üye künyesi; İSO 500 yayını ayrıca satın alınabilir (https://www.iso.org.tr/) |
| Kocaeli Sanayi Odası (E-Oda) | https://kosano.org.tr/e-oda/ | Kocaeli sanayi üyeleri |
| Çerkezköy TSO firma rehberi | https://www.cerkezkoytso.org.tr/firmalar.html | Tekirdağ |
| Bursa TSO (BTSO) firma rehberi | btso.org.tr — *URL bu turda doğrulanmadı; Analytics tarafından teyit edilecek* | Bursa |

### 3.3 Sektör dernekleri
| Kaynak | URL | Not |
|---|---|---|
| TÇÜD üye üreticiler + çelik haritası | https://celik.org.tr/tr/uyeler · https://celik.org.tr/tr/uyeler/celik-haritasi | Ark ocaklı (EAO) tesisler T1 çekirdeği; arama teyidi: TR'de ~27 EAO tesis |
| TKSD üye listesi | https://tksd.org.tr/tr-TR/uye-listesi | Kimya T1–T2 |
| TGSD üyeler | https://tgsd.org.tr/uyelerimiz/ | Hazır giyim/tekstil (~400 üye) |
| İTHİB (tekstil ihracatçıları) | ithib.org.tr — *üye listesinin kamuya açıklığı doğrulanmadı; teyit gerekli* | Tekstil |
| SOSİAD | https://sosiad.org.tr/ | **Dikkat:** üyeler ağırlıkla soğutma **ekipmancıları**dır, son kullanıcı değil; soğuk depo **operatörleri** için lojistik sıralamaları ve depo haritaları kullanılır |
| Veri merkezi envanteri | https://www.datacentermap.com/turkey/istanbul/ · https://baxtel.com/data-center/turkey | İstanbul'da ~32 tesis / ~39 operatör |

### 3.4 Yöntem (haftalık rutin)
1. Kaynaktan firma çek → §5 veri modeline işle (kaynak URL'si zorunlu alan).
2. MWh bandını tahmin et: sektör tipi + tesis ölçeği (çalışan, m², fırın/hat
   sayısı) üzerinden **bant** olarak; nokta tahmini yazılmaz. Billing Analysis
   şüpheli bantları işaretler.
3. Tier ata, koridor içi/dışı işaretle, karar verici rolünü araştır (LinkedIn,
   firma sitesi "yönetim" sayfası).
4. Inbound tekilleştirme: kayıt açmadan önce site lead-KV kaydına bak
   (PIPELINE-TAKIP §5).

**Kural: Uydurma yok.** Doğrulanamayan firma listeye "aday/doğrulanmamış"
statüsünde bile girmez; kaynağı olmayan satır silinir.

## 4. Doğrulanmış örnek hesaplar (33 adet — hepsi "kaynaktan doğrulandı")

Aşağıdakiler **örnek çekirdek listedir**; tam 100'lük liste §3 yöntemiyle
tamamlanır. Kaynak = arama sonucunda adın geçtiği/teyit edildiği yer.

### T1 — Tekil büyük sanayi (>1 GWh/ay beklenir)
| # | Firma | Sektör | Bölge | Kaynak |
|---|---|---|---|---|
| 1 | İçdaş | Demir-çelik (EAO) | Çanakkale/İstanbul | TÇÜD üyeler — celik.org.tr/tr/uyeler |
| 2 | Çolakoğlu Metalurji | Demir-çelik (EAO) | Kocaeli/Dilovası | TÇÜD üyeler — celik.org.tr |
| 3 | Habaş | Demir-çelik (EAO) | İzmir/Aliağa | TÇÜD üyeler — celik.org.tr |
| 4 | Diler Demir Çelik | Demir-çelik (EAO) | Kocaeli/Dilovası | TÇÜD üyeler — celik.org.tr |
| 5 | Tosçelik | Demir-çelik (EAO) | Osmaniye/Hatay | TÇÜD çelik haritası araması |
| 6 | MMK Metalurji | Demir-çelik (EAO) | Hatay/Kocaeli | TÇÜD çelik haritası araması |
| 7 | Kaptan Demir Çelik | Demir-çelik (EAO) | Tekirdağ | TÇÜD çelik haritası araması |
| 8 | Petkim | Petrokimya | İzmir/Aliağa | petkim.com.tr |
| 9 | Şişecam | Cam | Çok tesisli (TR geneli) | sisecam.com/en/our-companies |
| 10 | Trakya Cam (Şişecam) | Düzcam | Trakya | Şişecam kurumsal — sisecam.com |
| 11 | Korteks (Zorlu) | Tekstil/polyester iplik | Bursa | korteks.com.tr |
| 12 | Türk Telekom (Esenyurt VM) | Veri merkezi | İstanbul | datacentermap.com/turkey/istanbul/ |

### T2 — Orta sanayi (200–1.000 MWh/ay beklenir)
| # | Firma | Sektör | Bölge | Kaynak |
|---|---|---|---|---|
| 13 | Akkim | Kimya | Yalova/Çerkezköy | TKSD üye listesi araması; akkim.com.tr |
| 14 | Belgin (Lubex) | Kimya/madeni yağ | Kocaeli | TKSD üye listesi araması |
| 15 | Belkim | Kimya/deterjan | — (keşifte) | TKSD üye listesi araması |
| 16 | Kaleseramik | Seramik | Çanakkale/Çan | Sektör araması (romaseramik.com listesi) |
| 17 | Eczacıbaşı Yapı Ürünleri (VitrA) | Seramik/vitrifiye | Bilecik/Bozüyük | Sektör araması |
| 18 | Kipaş Mensucat | Tekstil | Kahramanmaraş | Tekstil büyükleri araması |
| 19 | Sanko Tekstil | Tekstil | Gaziantep | Tekstil büyükleri araması |
| 20 | Zorlu Tekstil (TAÇ) | Ev tekstili | Bursa/Denizli | zorlu.com.tr |
| 21 | EMD Frigo Lojistik | Soğuk depo | İstanbul çevresi | emdfrigolojistik.com.tr |
| 22 | B2 Cargo | Isı kontrollü depo/dağıtım | — (keşifte) | b2cargo.com |
| 23 | Frigo Sky | Soğuk zincir | — (keşifte) | frigosky.com |
| 24 | Tarım Kredi Lojistik | Soğuk zincir taşıma | TR geneli | tklojistik.com.tr |
| 25 | Equinix İstanbul | Veri merkezi (colo) | İstanbul | datacentermap.com; baxtel.com |

### T3 — Çok lokasyonlu zincirler/ağlar
| # | Firma | Sektör | Ölçek | Kaynak |
|---|---|---|---|---|
| 26 | A101 | Market zinciri | ~13.000+ mağaza | Perakende sıralaması araması (2026) |
| 27 | BİM | Market zinciri | ~11.500 mağaza | Perakende sıralaması araması |
| 28 | Şok Marketler | Market zinciri | ~10.900 mağaza | Perakende sıralaması araması |
| 29 | Migros | Market zinciri (soğuk yoğun) | ~3.400 mağaza | Perakende sıralaması araması |
| 30 | Netlog | Lojistik/soğuk zincir ağı | ~2M m² depo | Lojistik sıralaması araması |
| 31 | Ekol Lojistik | Lojistik ağı | TR geneli | Lojistik sıralaması araması |
| 32 | Turkcell (VM portföyü) | Veri merkezi/telekom | Çok tesisli | datacentermap.com; baxtel.com |
| 33 | Vodafone Türkiye (VM) | Veri merkezi/telekom | Çok tesisli | datacentermap.com; baxtel.com |

**Uyarılar:** (a) MWh bantları tahmindir, teklif dilinde asla kullanılmaz;
teklif ancak müşterinin kendi tüketim verisiyle (Billing Analysis) modellenir.
(b) T1 çelik/petrokimya hesaplarının bir kısmının kendi toptan/tedarik
iştiraki olabilir (ör. büyük gruplar) — keşif aşamasında "mevcut tedarik türü"
alanı bunu yakalar; iştiraki olan hesap düşürülmez, dengeleme/portföy hizmeti
açısıyla yaklaşılır. (c) Erdemir/Kardemir gibi entegre (BOF) tesisler EAO'ya
göre farklı profildedir; ayrı değerlendirilir, bu listeye bilinçli alınmadı.

## 5. Hesap yeterlilik veri modeli (CRM alanları)

Zorunlu alanlar (her kayıtta):

| Alan | Tip | Değerler |
|---|---|---|
| firma_adi | metin | resmi unvan |
| kaynak_url | metin | §3 kaynağı — **boşsa kayıt geçersiz** |
| sektor | seçim | demir-celik / kimya / tekstil / cam-seramik / soguk-zincir / veri-merkezi / osb-diger / perakende-zincir |
| tier | seçim | T1 / T2 / T3 |
| tahmini_mwh_bandi | seçim | <200 / 200–500 / 500–1.000 / 1.000–5.000 / >5.000 MWh/ay / **keşifte** |
| bolge | seçim | İstanbul / Kocaeli / Bursa / Tekirdağ / koridor-dışı |
| osb_uyeligi | seçim | evet (OSB adı) / hayır / keşifte |
| mevcut_tedarik | seçim | görevli tedarik / ikili anlaşma / OSB üzerinden / grup içi iştirak / **keşifte** |
| karar_verici_rolu | seçim | enerji müdürü / CFO–mali işler / fabrika müdürü / satınalma / genel müdür / keşifte |
| karar_verici_kisi | metin | ad + LinkedIn/kaynak (KVKK: OUTREACH-PLAYBOOK §Uyum'a tabi) |
| iys_ret_kontrol | seçim | yapıldı-temiz / yapıldı-ret-var / yapılmadı — **yapılmadan e-posta çıkmaz** |
| funnel_asamasi | seçim | PIPELINE-TAKIP §1 aşamaları |
| sabit_fiyat_ilgisi | seçim | evet / hayır / bilinmiyor — **evet ise Market Risk bayrağı otomatik** |

Bilinmeyen her alan **"keşifte"** yazılır; boş bırakılmaz, tahmin uydurulmaz.

## 6. Beklenen etki ve KPI bağlantısı

- Hedeflenen funnel aşaması: **hedef listede → temas** (funnel'ın en üstü;
  bugünkü durum: sıfır outbound kapasitesi — denetim bulgusu "near-zero").
- Katkı: Plan Faz 2 çıkış ölçütü "≥40 nitelikli B2B görüşme" ve Gün-180
  hedefi "≥60 GWh/yıl teklif aşaması"nın birincil besleyicisi.
- Ölçüm: MWh-ağırlıklı pipeline (PIPELINE-TAKIP §3); 100 hesaplık listenin
  MWh bandı toplamı iki haftada bir raporlanır.
