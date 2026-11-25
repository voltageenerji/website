# QA test paketi

Yayın öncesi koşulan testler. Hepsi **başarısızlıkta çıkış kodu 1** döner —
CI'da sessizce yeşil görünmezler.

## Bağımlılıksız (yalnız Node)

| Test | Kapsam |
|---|---|
| `node docs/qa/test-score.mjs` | `/api/score` lider tablosu: doğrulama, sansür, yetki, KV hata yolları, 50 kayıt sınırı |
| `node docs/qa/test-ssr-ptf.mjs` | `/canli-ptf` sunucu render'ı: biçimlendirme, eksik saat dürüstlüğü, `onRequestGet` dayanıklılık matrisi |
| `node docs/qa/test-admin.mjs` | **Panel kimlik doğrulama:** PBKDF2, oturum imzası/süresi, kurcalama, kaba kuvvet, veri ucu yetkilendirme ve sayfalama |
| `node docs/qa/test-report-windows.mjs` | Rapor dönemleri (haftalık/aylık/3-6 aylık/yıllık) — bitişiklik: ne boşluk ne çakışma |
| `node docs/qa/test-dengesizlik.mjs` | **`/dengesizlik-maliyeti`:** kural tablosu, doğrulama durumu (`birincil`/`bekliyor`) ve birim fiyat formülü (föydeki altı örnek, sınırlar, dönem başına bir tarih), `piyasa/v1` sözleşmesinin yeniden doğrulanması (sürüm, zorunlu alanlar, bas/dk, null asla 0, çelişen kopya → "—", 96 dönem), **proxy istemcisi** (servis bağlaması / HTTPS + belirteç, bağlantı yok, 401 engeli, 404, 503 `butce`/`veri-yok` + Retry-After, zaman aşımı, bozuk JSON, kısmi gün, proxy `bayat`, tek uçuş, 100 eşzamanlı ziyaretçi → sınırlı çağrı, dakikalık bütçe, büyüyen bekleme, önbellekten HEAD, toplam süre sınırı, aralık tek istek), **sitede EPİAŞ kimlik yolu yok** taraması, belirtecin hiçbir yanıtta/günlükte/önbellekte olmadığı, önizleme hostlarında `noindex, nofollow`, XLSX yazıcı, veri ucu, sayfa kabuğu, çapalar, JSON-LD, sunucu render'ı, "Kendi senaryom" teslim günü kuralı, kabul betiğinin sahte ortamda koşusu. Sahte proxy ile çalışır; ağ gerekmez. XLSX denetimi için `python3` gerekir |
| `KABUL_TABAN=<adres> [KABUL_PROXY_URL=… KABUL_PROXY_ANAHTAR=…] node docs/qa/kabul-dengesizlik.mjs [--yerel]` | **`/dengesizlik-maliyeti` gerçek veri kabul denetimi (13 madde)**; çıktı yalnız geçti/kaldı ve toplamlar (CI günlüğü için güvenli), kesin değerli insan denetimi listesi yalnız `--yerel` ile. Belirteç yalnız ortam değişkeninden okunur, hiçbir çıktıya girmez |

## Tarayıcı gerektirenler (Playwright)

Kurulum (repoya bağımlılık eklenmez, geçici dizinde kurulur):

```sh
npm install --no-save playwright
export CHROMIUM_PATH=/opt/pw-browsers/chromium   # yoksa: npx playwright install chromium
```

| Test | Kapsam |
|---|---|
| `node docs/qa/test-ssr-hydration.mjs` | **Kritik.** Sunucu render'ı istemci hidrasyonundan sağ çıkıyor mu (QA DEF-1/DEF-13). S1 boş önbellek, S2 dünkü önbellek, S3 canlı proxy |
| `node docs/qa/test-dengesizlik-tarayici.mjs` | **`/dengesizlik-maliyeti` uçtan uca:** gerçek fonksiyon modülleri + sahte EPİAŞ, sitenin gerçek CSP'si altında (wrangler gerekmez). Hesaplayıcının iki modu klavyeyle, sayı okuma (ondalık yalnız virgül; belirsiz noktada tahmin yok), istemci formülü = kütüphane, indirme bağlantıları (bekleme hâlinde pasif), aralık formu (fetch, satır içi hata), 320/390/768/1440'ta yatay taşma, tablo kaydırma kabı, kontrast, konsol hataları, dürüst bekleme, tazelik merdiveni, istemci çizimi = sunucu çizimi, zehirli önbellek kaydı, JS'siz kullanım, 31/12/2026 sonrası kapanış. Playwright `/opt/node-tools/node_modules/` altından yüklenir |
| `node docs/qa/smoke.mjs` | 404 oyunu: açılış → oyun → skor → tekrar |
| `node docs/qa/smoke2.mjs` | 404 yedek içerik: hareket azaltma ve JS kapalı yolları |
| `node docs/qa/smoke3.mjs` | Lider tablosu uçtan uca (route ile taklit edilen API) |
| `node docs/qa/smoke4.mjs` | Sansürlü isim reddedildiğinde arayüz davranışı |
| `node docs/qa/qa-lb-submit.mjs` | Çift gönderim koruması, yeniden başlatma, düşük skor senaryosu |
| `node docs/qa/censor-probe.mjs` | İsim sansürünün bilinen kaçakları ve yanlış pozitifleri |
| `node docs/qa/test-panel.mjs` | **Panel uçtan uca:** gerçek fonksiyon modülleri + gerçek arayüz — giriş, yanlış parola, listeleme, arama, sayfalama, CSV, çıkış, XSS kaçışı |

Yardımcı dosyalar (test değildir, tek başına çalıştırılmaz): `dengesizlik-test-verisi.mjs`
(UYDURMA fiyat üreten sahte EPİAŞ, sahte Cache API ve KV) ve `dengesizlik-test-sunucu.mjs`
(fonksiyon modüllerini sahte EPİAŞ'la sunan küçük http sunucusu). Buradaki rakamlar gerçek
piyasa verisi değildir; sayfada ya da herhangi bir yayında kullanılmaz.

## Değişmez kurallar (her testin koruduğu)

1. **Dürüstlük merdiveni:** veri yoksa sahte rakam yok. `null`/`''`/`[]` asla `0` olmaz.
   Eksik saat `—` kalır; taşıma/interpolasyon yapılmaz.
2. **Tazelik merdiveni:** canlı veri > sunucunun bu istekte çektiği veri >
   önbellek > dürüst bekleme. Üstteki alttakini yener; eski veri yeniyi ezemez.
3. **Atıfsız rakam yayınlanmaz:** dönem etiketi çözülemiyorsa ortalama da basılmaz
   (hem sunucu hem istemci).
4. **Sayfa asla kırılmaz:** sunucu render'ında ne olursa olsun statik kabuk servis edilir.
5. **Kalıcılık yoksa sahte başarı yok:** `/api/*` uçları 503 döner.
6. **Panel kapısı:** yapılandırma eksikse panel açılmaz (503); yanlış kullanıcı
   ile yanlış parola AYNI yanıtı verir; oturumsuz veri ucu 401.
7. **Doğrulanmamış kural uygulanmaz:** dengesizlik formülü yalnız kural tablosundaki
   tarihlerde çalışır (`kuralBul` → 31/12/2026 sonrası `null`); sistem yönü EPİAŞ'tan
   gelir, PTF–SMF kıyasından çıkarılmaz; yayımlanmamış dönem için rakam üretilmez.
8. **EPİAŞ hesabı korunur:** anonim ziyaretçi sınırsız giriş ya da rapor isteği
   tetikleyemez (tek-uçuş giriş, paylaşılan giriş engeli, dakikalık bütçe); bilet
   önbellekte düz metin durmaz; HEAD istekleri üst-akışa gitmez.
