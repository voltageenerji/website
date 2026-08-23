# VOLTAN — OPERASYON DEFTERİ

Tek kaynak: neyin canlı olduğu, neyin zamanlanmış olduğu, neyin kimde
beklediği. Güncelleyen: Orchestrator. Son güncelleme: **2026-08-23**.

## 1. Canlı sistemler

| Sistem | Durum | Notlar |
|---|---|---|
| voltage.com.tr (ana site) | ✅ Canlı | Sahibin editoryal tasarımı (main temelli) + taşınan altyapı. Cloudflare Pages, main dalından otomatik deploy. |
| Teklif formu → KV | ✅ Canlı, test edildi | `/api/lead` → `voltage-leads` KV. Dürüstlük kuralı: kayıt yolu yoksa 503, asla sahte başarı. |
| Anlık lead maili | ✅ Canlı, test edildi | Resend (eu-west-1/İrlanda) → info@voltage.com.tr. Konu: "Yeni Teklif Talebi — {şirket}". |
| Haftalık/aylık lead raporu | ✅ Kurulu | GitHub Actions cron → `/api/report`. Pazartesi 08:30 (haftalık), ayın 1'i 08:45 (aylık) TRT. İlk otomatik: 2026-08-10. |
| Rehber kütüphanesi | ✅ Canlı | 11 sayfa (`/rehber`). Tümü hukuk onaylı, sıfır tasarruf vaadi, FAQPage şemalı. |
| Yapay zekâ görünürlüğü | ✅ Canlı | robots.txt AI-tarayıcı izinleri, `/llms.txt`, FAQ şemaları. Etki tarayıcı ziyaretleriyle birikir. |
| İletişim adresi okunabilirliği | ✅ Düzeltildi 2026-08-23 | Cloudflare "Email Address Obfuscation" AÇIKMIŞ → `info@voltage.com.tr` JS ile gizleniyordu. Kapatıldı; ham kaynakta 7 düz metin geçiş (JSON-LD `ContactPoint` dahil), `data-cfemail`/`email-protection` = 0. GSC'deki 2 adet `/cdn-cgi/l/email-protection` 404'ü kendiliğinden düşecek. |
| LinkedIn otomasyonu | ✅ DEVREDE | Kuyruk (`linkedin-queue.json`) → `/feed/linkedin` → Zapier "Voltage Enerji - RSS to LinkedIn" → sayfa (ID 10004014). İlk gönderi 05.08 yayınlandı, sahip teyitli. |
| Canlı PTF bandı | ✅ Canlı | epias-proxy Worker (`/ptf/today`, `/ptf/stats`). Dürüst durum merdiveni: CANLI / SON SENKRON / VERİ BEKLENİYOR. |
| GSC + Bing | ✅ Doğrulandı (3 mülk, hepsi Domain tipi) | **2026-08-23 ölçümü: 18 sayfa indexed, 0 "crawled – not indexed".** Rehberlerin tamamı dizinde; ana sayfa 22.08'de taranmış. Kalan 9 "not indexed" zararsız artık: 5×404 (eski `/ptf/*` uçları + Cloudflare artefaktı), 2× HTTP→HTTPS, 1× robots (`/api/lead`, doğru), 1× www→non-www canonical. Site haritası 23.08'de yeniden gönderildi (17 URL, Success). **Sorun dizinleme değil, sıralama ve bayat snippet.** |
| Kurumsal kimlik sayfası | ✅ Canlı 2026-08-23 | `/kurumsal` — ticari unvan, EPDK lisansı, sicil no, merkez, faaliyet sınırları ("ne yapıyoruz / ne yapmıyoruz"). Marka aramalarında kimlik çıpası; isim benzerliği olan taahhüt/mühendislik firmalarından ayrışmayı sağlar. Rakip adı geçmez. Marka tescil no 2011/70573 sayfada yayında; ® işareti şimdilik kullanılmıyor (görsel karar sahipte). |
| Saatlik PTF sunucu render'ı | ✅ Canlı 2026-08-23 | `functions/canli-ptf.js` — 24 saatlik tablo ve özet değerler HTML'e gömülür (veri sorgularında rakipler rakamı sunucudan basıyordu). Tazelik merdiveni: canlı > sunucu render'ı > önbellek > dürüst bekleme. QA 3 turda 17 kusur yakaladı, hepsi kapatıldı. |
| 404 deneyimi "Transmission Dash" | ✅ Canlı | İnteraktif 3B mini oyun (Three.js, `/g404/game.js`, 150 KB gz). JS/WebGL yoksa veya hareket azaltma açıksa statik yedek linkler görünür; her koşulda gerçek HTTP 404 döner, noindex. Kaynak: `game404/` (build: `npm run build` + `dist/game.js → g404/`). |
| 404 oyunu lider tablosu | ✅ Canlı | `/api/score` (GET/POST/DELETE). Hesap yok — yalnız takma ad; `voltage-leads` KV'de tek anahtar `lb:board` (en iyi 50, ilk 20 gösterilir; aynı isimde yalnız en iyi skor). KVKK notu: kişisel veri toplanmaz (isim serbest takma ad, IP/UA kaydedilmez). İsim sansürü sunucu tarafında (TR+EN küfür/hakaret, leetspeak katlamalı; sahip kararı 2026-08-09: "bu kadarı yeterli" — bilinen kaçaklar dokümante, güvence sıfırlamadır). **SIFIRLAMA:** GitHub → Actions → `leaderboard-reset` → Run workflow (REPORT_TOKEN ile korunan DELETE atar); Orchestrator da tetikleyebilir. Kalıcı QA testleri: `docs/qa/`. |

## 2. Zamanlanmış olaylar

| Tarih | Olay |
|---|---|
| 2026-08-10 Pzt 08:30 | İlk otomatik haftalık lead raporu (mail) |
| 2026-08-20 | Zapier deneme planı biter → poll 2 dk → ~15 dk olur (gönderiler 10:00–10:25 aralığına kayar) |
| 2026-08-26 Çar ~10:00 | LinkedIn: canlı PTF bandı gönderisi (otomatik) |
| 2026-08-29 Cmt 09:00–10:00 UTC | Cloudflare bakım penceresi — zone yapılandırma değişiklikleri başarısız olabilir. **O saatlerde Cloudflare ayarı değiştirmeyin.** |
| 2026-09-01 Salı 08:45 | İlk otomatik aylık lead raporu |
| 2026-09-09 / 09-23 / 10-07 | LinkedIn: rehber lansmanı / serbest tüketici 2026 / ilke postu (otomatik) |
| 2031-03 (en geç 06.09.2031) | **Marka yenileme: 2011/70573.** Koruma 06.09.2031'de biter; yenileme penceresi 6 ay önce açılır. Kayıtlı vekil olmadığı için hatırlatma tebligatı doğrudan şirkete gelir — adres güncel olmalı. |
| 2026-12 (EPDK kurul kararı dönemi) | SEO Faz 3 sezon oyunu: "Serbest Tüketici 2027" güncellemesi — Kasım'da hazırlık |

## 3. Bekleyen girdiler (kimde)

| Girdi | Kimde | Bloke ettiği iş |
|---|---|---|
| **Crunchbase "VERIFY NOW" doğrulaması** (şirket e-postasıyla sahiplik teyidi) | Sahip | 17 alanın 14'ü kilitli: Website (`www.` fazlalığı), LinkedIn (`tr.` → `www.`), açıklamalar, kuruluş yılı, e-posta düzeltilemiyor. Adres 2026-08-23'te eklendi (bölüm boştu). |
| **ACİL: +90 216 479 0510 numarasının Crunchbase'den SİLİNMESİ** | Sahip (VERIFY NOW gerekli) | Sahip 2026-08-23'te teyit etti: **bu numara şirkete ait DEĞİL**. Adımıza kayıtlı yanlış numara kamuya açık — yayılmadan kaldırılmalı. Alan kilitli, önce Crunchbase doğrulaması şart. Numara başka dizinlerde de aranmalı. |
| Kanonik kurumsal telefon numarası (varsa) | Sahip | GBP telefonsuz da kurulabilir (web sitesi yeterli). Yeni/doğru numara verilirse NAP paketine ve siteye eklenir. **Teyit edilmemiş hiçbir numara hiçbir kanalda yayınlanmaz.** |
| **Facebook sayfası kurulumu** (facebook.com/voltageenerji) | Sahip (Meta kişisel hesap gerekli) | Kimlik/NAP varlığı. Görseller hazır: `docs/brand/fb-profile.png`, `fb-cover.png`. Kurallar: telefon YAZILMAZ (doğru numara yok), Messenger KAPALI (KVKK aydınlatma metni bu kanalı kapsamıyor — avukat dönüşüne kadar), sıfır tasarruf vaadi. Sayfa canlıya girince URL bana bildirilecek → `sameAs` (index.html JSON-LD) ve `llms.txt`'e eklenecek. |
| **Marka: vekile sorulacak 4 soru** (sınıf içerikleri 2026-08-23 teyit edildi) | Sahip → marka vekili | Tescil bizde ve geçerli. **Kapsanan:** Sınıf 39 içinde "Elektrik dağıtım hizmetleri", Sınıf 40 içinde "Enerji üretimi hizmetleri". **Kapsanmayan:** Sınıf 35 (satış/ticaret hizmetleri — asıl faaliyetimiz "toptan satış") ve Sınıf 4 (mal olarak elektrik enerjisi). SORULAR: (1) EPDK mevzuatında "dağıtım" şebeke işletmeciliği, bizim işimiz "tedarik/satış" — 39/40 tescili fiilî faaliyetimizi koruyor mu, 35 ve/veya 4 için ek başvuru gerekir mi? (2) Tescilli olduğumuz sınıflarda (şebeke dağıtımı, enerji üretimi) fiilen faaliyet göstermiyoruz — **SMK m.9 kullanmama nedeniyle iptal** riski var mı? (3) Kayıtta vekil yok; TÜRKPATENT tebligat adresi güncel mi (yanlış Bağcılar adresi riski)? (4) Tescilli logo eski yeşil-mavi tasarım; mevcut görsel kimlik için ayrı başvuru gerekir mi? |
| Yanlış "Bağcılar / Mimar Sinan Cad." adresinin kaynağı | Sahip/eklenti (araştırma) | Crunchbase'de DEĞİLMİŞ (orası boştu, düzeltildi). elektrikpaketleri.com ve puan5.com açılmıyor. Kaynak henüz bulunamadı — yapay zekâ yanıtlarında görülmeye devam ederse yeniden aranacak. |
| Hukuki metin onayları + F1-F6 teyitleri (ana paket) | Avukat | TASLAK şerhlerinin kalkması; rehberdeki RG ihtiyat notu; varlık yayılımı (adres/unvan teyidi) |
| EK-1 (ticari ileti/İYS) cevapları | Avukat | Satış motoru aktivasyonu (motor zaten PASİF — acele yok) |
| DMARC kaydı (`_dmarc` TXT, p=none) | Sahip/eklenti | Mail itibar korumasının tamamlanması (önerildi, acil değil) |
| Resend API anahtarının domain kısıtı | Sahip (Resend paneli) | Hijyen (düşük öncelik) |
| Kullanılmayan Zapier LinkedIn bağlantısının silinmesi | Sahip | Hijyen (düşük öncelik) |
| voltan.com.tr → voltage.com.tr sunucu tarafı 301 (Cloudflare zone Redirect Rule) | Sahip/eklenti | GSC "Alternate page with proper canonical" bulgusunun kapanması. Repo `_redirects` kuralları mevcut ama alan adı Pages projesine bağlı olmadığı için çalışmıyor; zone seviyesinde kural gerekli. Sonrasında GSC'de "Validate fix". SEO değeri kaybı YOK (canonical konsolidasyonu çalışıyor) — hijyen işi. |

### İzleme listesi (dış gelişmeler)

| Konu | Tür | Durum |
|---|---|---|
| Müşteri portalı → mobil uygulama | Kapılı plan (sahip kararı 2026-08-08) | Sıra: (1) veri altyapısı [tetik: aktif satış] → (2) web portalı [tetik: ~10 sözleşmeli müşteri] → (3) mobil uygulama [tetik: portal talebi VEYA agregatör DR bildirimleri]. Öncesinde uygulama yapılmaz. |
| ChatGPT Ads Türkiye lansmanı | Dış gelişme (izleme) | Pasif — TRde aktif değil (canlı: US/CA/AU/NZ/UK/JP/KR, 2026-08). Şartlar: TR lansmanı + aktif satış kararı + ölçüm temeli. Organik katman (llms.txt/FAQ şema/Bing) zaten kurulu. |

## 4. Karar kayıtları (aktif kısıtlar)

| Karar | Tarih | Kapsam |
|---|---|---|
| Main tasarımı kanonik | 2026-08-04 | Site tasarımına dokunulmaz; içerik sayfaları şablon uyumlu eklenebilir |
| Satış motoru PASİF | 2026-08-05 | Hiçbir soğuk erişim yok; aktivasyon = sahip talimatı + hukuk onayı |
| Sıfır tasarruf vaadi | Yayın ilkesi | Tüm kanallar (site, rehber, LinkedIn, mail) |
| İç dokümanlar servis dışı | 2026-08-05 | `/docs/*`, CLAUDE.md, DEPLOY.md, CHANGELOG.md → 302 |
| Prop trading yasağı / fiyat sabitleme kapısı | 180g planı | Sabit fiyat taahhüdü öncesi pozisyon kontrolü (şirket pasif satışta — uyuyan kural) |
| Marka tescili DOĞRULANDI: "voltage enerji" 2011/70573 | 2026-08-23 | TÜRKPATENT kaydı: başvuru 06.09.2011, tescil 23.11.2012, sahibi Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş. (5318978), Nice 39/40, hizmet markası. Koruma dönemi 06.09.2021'de yenilendi. **Sonraki yenileme: 06.09.2031** (6 ay önce başlanmalı). Numara sitede, schema'da ve llms.txt'te yayında. |
| voltan.com.tr AYRI SİTE DEĞİL, takma ad (alias) | 2026-08-09 | Tek kanonik alan: voltage.com.tr. voltan.* türevleri yalnızca 301 ile yönlenir; ayrı içerik/canonical/sitemap asla kurulmaz. |

## 5. Erişim haritası (kimlik bilgisi İÇERMEZ)

| Varlık | Nerede | Sahibi |
|---|---|---|
| Cloudflare (Pages, KV, DNS, env) | dash.cloudflare.com | Sahip |
| GitHub voltageenerji/website | Repo + Actions secret REPORT_TOKEN | Sahip; Orchestrator yazma erişimli |
| Resend (RESEND_API_KEY) | Cloudflare env (şifreli) | Sahip |
| Zapier "Voltage Enerji - RSS to LinkedIn" | zapier.com | Sahip |
| LinkedIn sayfası (ID 10004014) | linkedin.com/company/voltage-enerji | Sahip |
| GSC/Bing mülkleri | Google/Bing hesapları | Sahip |
| epias-proxy Worker | Ayrı repo (bu oturumun kapsamı dışında) | Sahip |
