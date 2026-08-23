# QA test paketi

Yayın öncesi koşulan testler. Hepsi **başarısızlıkta çıkış kodu 1** döner —
CI'da sessizce yeşil görünmezler.

## Bağımlılıksız (yalnız Node)

| Test | Kapsam |
|---|---|
| `node docs/qa/test-score.mjs` | `/api/score` lider tablosu: doğrulama, sansür, yetki, KV hata yolları, 50 kayıt sınırı |
| `node docs/qa/test-ssr-ptf.mjs` | `/canli-ptf` sunucu render'ı: biçimlendirme, eksik saat dürüstlüğü, `onRequestGet` dayanıklılık matrisi |

## Tarayıcı gerektirenler (Playwright)

Kurulum (repoya bağımlılık eklenmez, geçici dizinde kurulur):

```sh
npm install --no-save playwright
export CHROMIUM_PATH=/opt/pw-browsers/chromium   # yoksa: npx playwright install chromium
```

| Test | Kapsam |
|---|---|
| `node docs/qa/test-ssr-hydration.mjs` | **Kritik.** Sunucu render'ı istemci hidrasyonundan sağ çıkıyor mu (QA DEF-1/DEF-13). S1 boş önbellek, S2 dünkü önbellek, S3 canlı proxy |
| `node docs/qa/smoke.mjs` | 404 oyunu: açılış → oyun → skor → tekrar |
| `node docs/qa/smoke2.mjs` | 404 yedek içerik: hareket azaltma ve JS kapalı yolları |
| `node docs/qa/smoke3.mjs` | Lider tablosu uçtan uca (route ile taklit edilen API) |
| `node docs/qa/smoke4.mjs` | Sansürlü isim reddedildiğinde arayüz davranışı |
| `node docs/qa/qa-lb-submit.mjs` | Çift gönderim koruması, yeniden başlatma, düşük skor senaryosu |
| `node docs/qa/censor-probe.mjs` | İsim sansürünün bilinen kaçakları ve yanlış pozitifleri |

## Değişmez kurallar (her testin koruduğu)

1. **Dürüstlük merdiveni:** veri yoksa sahte rakam yok. `null`/`''`/`[]` asla `0` olmaz.
   Eksik saat `—` kalır; taşıma/interpolasyon yapılmaz.
2. **Tazelik merdiveni:** canlı veri > sunucunun bu istekte çektiği veri >
   önbellek > dürüst bekleme. Üstteki alttakini yener; eski veri yeniyi ezemez.
3. **Atıfsız rakam yayınlanmaz:** dönem etiketi çözülemiyorsa ortalama da basılmaz
   (hem sunucu hem istemci).
4. **Sayfa asla kırılmaz:** sunucu render'ında ne olursa olsun statik kabuk servis edilir.
5. **Kalıcılık yoksa sahte başarı yok:** `/api/*` uçları 503 döner.
