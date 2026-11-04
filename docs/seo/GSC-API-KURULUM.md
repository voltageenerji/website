# Search Console API kurulumu (bir kerelik, yaklaşık 10 dakika)

Amaç: Claude oturumlarının Search Console verisini resmî Google API'siyle kendisi çekmesi. Böylece Chrome eklentisine ekran okutmaya gerek kalmaz. Veri üçüncü bir şirkete açılmaz.

Araç: `tools/gsc-export.mjs`. Test: `node docs/qa/test-gsc-export.mjs`.

## Neye erişir, neye erişmez?

- **Salt okunur.** Kapsam `webmasters.readonly`. Araç Search Console'da hiçbir ayarı değiştiremez, dizin talebi gönderemez, site haritası silemez.
- **Yalnızca eklediğiniz mülk.** Servis hesabını hangi mülke kullanıcı olarak eklerseniz yalnızca onu görür.
- **Anahtar sohbete gelmez.** Anahtar bulut ortamının ayarlarına girilir; Claude onu ekrana veya dosyaya yazmaz. Repodaki koruma kancası, anahtar biçimindeki bir değerin repoya yazılmasını engeller.
- **Çıktı repoya girmez.** Repo herkese açık. Veriler git'e girmeyen `gsc-data/` klasörüne yazılır.

## 1. Google Cloud projesi ve API

1. https://console.cloud.google.com adresine şirket Google hesabıyla girin.
2. Üstteki proje seçiciden **New Project** oluşturun. Ad örneği: `voltage-search-console`.
3. **APIs & Services → Library** bölümünde "Google Search Console API" aratın ve **Enable** deyin.

## 2. Servis hesabı ve anahtar

1. **IAM & Admin → Service Accounts → Create service account.** Ad örneği: `gsc-okuyucu`. Rol vermeyin; rol gerekmez.
2. Oluşan hesaba tıklayın, **Keys → Add key → Create new key → JSON**. Bir `.json` dosyası iner.
3. Hesabın e-posta adresini kopyalayın. `...@voltage-search-console.iam.gserviceaccount.com` biçimindedir.

## 3. Search Console'da yetki

1. https://search.google.com/search-console adresinde `voltage.com.tr` mülkünü açın.
2. **Ayarlar → Kullanıcılar ve izinler → Kullanıcı ekle.**
3. Servis hesabının e-postasını girin, izin olarak **Kısıtlı (Restricted)** seçin. Arama performansı için yeterlidir. URL denetimi 403 verirse izni **Tam (Full)** yapın.

## 4. Anahtarı bulut ortamına girin

1. İnen JSON dosyasını tek satır base64'e çevirin:
   - macOS / Linux terminal: `base64 -i dosya.json | tr -d '\n' | pbcopy` (Linux'ta `pbcopy` yerine `xclip -selection clipboard`)
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("dosya.json")) | Set-Clipboard`
2. Claude oturumunun başlık çubuğundaki ortam menüsünden **Edit** deyin. **Environment variables** bölümüne şunu ekleyin:
   - Ad: `GSC_SA_KEY_B64`
   - Değer: panodaki base64 metni
3. Kaydedin. **Yeni açılan oturumlar** değişkeni görür; açık oturum görmez.
4. İndirdiğiniz `.json` dosyasını bilgisayarınızdan silin ve çöp kutusunu boşaltın.

**Anahtarı sohbete yapıştırmayın.** Yapıştırılırsa Google Cloud'da o anahtarı silip yenisini oluşturun.

## 5. Kullanım (Claude oturumunda)

```bash
node tools/gsc-export.mjs            # son 28 gün, önceki 28 gün, 90 gün
node tools/gsc-export.mjs --inspect  # + site haritasındaki URL'lerin dizin durumu
```

Çıktı `gsc-data/` klasörüne gider:

| Dosya | İçerik |
|---|---|
| `OZET.md` | Toplamlar, ilk 20 sorgu, 8–20 bandı, sayfalar |
| `*_28d.csv` | Bu dönemin sorgu, sayfa, sorgu×sayfa, cihaz ve ülke kırılımları |
| `*_prev28d.csv` | Önceki 28 günün kırılımları |
| `*_90d.csv` | 90 günlük kırılımlar |
| `band_8_20.csv` | 8–20 bandındaki sorgu×sayfa satırları |
| `sitemaps.json` | Site haritası durumu |
| `url_inspection.csv` | Yalnızca `--inspect` ile: URL'lerin dizin durumu |

Veri 2–3 gün geriden gelir; araç dönem sonunu 3 gün geri alır ve tarih aralığını her çıktıya yazar.

## Sık görülen hatalar

| Mesaj | Çözüm |
|---|---|
| `GSC_SA_KEY_B64 tanımlı değil` | Adım 4; ardından yeni oturum açın |
| `Erişim reddedildi (403)` | Adım 3 (mülke kullanıcı ekleme) veya adım 1.3 (API etkin değil) |
| `Google erişim belirteci alınamadı` | Anahtar silinmiş olabilir; adım 2'den yeni anahtar |
| `Repo herkese açık … CI` | Araç bilerek GitHub Actions içinde çalışmaz; Claude oturumunda çalıştırın |

## Anahtarı iptal etmek

Google Cloud → IAM & Admin → Service Accounts → `gsc-okuyucu` → Keys → anahtarı silin. Search Console → Kullanıcılar ve izinler → servis hesabını kaldırın. Bulut ortamından `GSC_SA_KEY_B64` değişkenini silin.
