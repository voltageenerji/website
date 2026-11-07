# Search Console API kurulumu (bir kerelik, yaklaşık 10 dakika)

Amaç: Claude oturumlarının Search Console verisini resmî Google API'siyle kendisi çekmesi. Böylece Chrome eklentisine ekran okutmaya gerek kalmaz. Veri yalnızca Google ile Claude oturumu arasında taşınır; ayrıca bir SEO aracına veya tarayıcı eklentisine verilmez.

Araç: `tools/gsc-export.mjs`. Test: `node docs/qa/test-gsc-export.mjs`.

## Neye erişir, neye erişmez?

- **Salt okunur.** Kapsam `webmasters.readonly`. Araç Search Console'da hiçbir ayarı değiştiremez, dizin talebi gönderemez, site haritası silemez.
- **Yalnızca eklediğiniz mülk.** Servis hesabını hangi mülke kullanıcı olarak eklerseniz yalnızca onu görür.
- **Anahtar sohbete gelmez.** Anahtar bulut ortamının ayarlarına girilir; Claude onu ekrana veya dosyaya yazmaz. Repodaki koruma kancası, anahtar biçimindeki bir değerin repoya yazılmasını engeller.
- **Çıktı site reposuna girmez.** Site reposu herkese açık. Elle çalıştırmada veriler git'e girmeyen `gsc-data/` klasörüne, haftalık otomatik çekimde yalnızca gizli `voltageenerji/seo-veri` reposuna yazılır.

## 1. Google Cloud projesi ve API

1. https://console.cloud.google.com adresine şirket Google hesabıyla girin.
2. Üstteki proje seçiciden **New Project** oluşturun. Ad örneği: `voltage-search-console`.
3. **APIs & Services → Library** bölümünde "Google Search Console API" aratın ve **Enable**'a tıklayın.

## 2. Servis hesabı ve anahtar

1. **IAM & Admin → Service Accounts → Create service account.** Ad örneği: `gsc-okuyucu`. Rol vermeyin; rol gerekmez.
2. Oluşan hesaba tıklayın, **Keys → Add key → Create new key → JSON**. Bir `.json` dosyası iner.
3. Hesabın e-posta adresini kopyalayın. `...@<proje-kimliği>.iam.gserviceaccount.com` biçimindedir. Proje kimliği, proje adından farklı olabilir.

## 3. Search Console'da yetki

1. https://search.google.com/search-console adresinde `voltage.com.tr` mülkünü açın.
2. **Ayarlar → Kullanıcılar ve izinler → Kullanıcı ekle.**
3. Servis hesabının e-postasını girin, izin olarak **Kısıtlı (Restricted)** seçin. Arama performansı için yeterlidir. URL denetimi 403 verirse izni **Tam (Full)** yapın.

## 4. Anahtarı bulut ortamına girin

1. İnen JSON dosyasını tek satır base64'e çevirin:
   - macOS / Linux terminal: `base64 -i dosya.json | tr -d '\n' | pbcopy` (Linux'ta `pbcopy` yerine `xclip -selection clipboard`)
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("dosya.json")) | Set-Clipboard`
2. Claude oturumunun başlık çubuğundaki ortam menüsünden **Edit**'e tıklayın. **Environment variables** bölümüne şunu ekleyin (Network secrets bölümüne değil: araç anahtarla kendisi imza attığı için anahtarı okuyabilmesi gerekir):
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
| `meta.json`, `totals.json` | Tarih aralıkları ve toplamlar |
| `*_28d.csv` | Bu dönemin sorgu, sayfa, sorgu×sayfa, cihaz ve ülke kırılımları |
| `*_prev28d.csv` | Önceki 28 günün kırılımları |
| `*_90d.csv` | 90 günlük kırılımlar |
| `band_8_20.csv` | 8–20 bandındaki sorgu×sayfa satırları |
| `sitemaps.json` | Site haritası durumu |
| `url_inspection.csv` | Yalnızca `--inspect` ile: URL'lerin dizin durumu |

Veri 2–3 gün geriden gelir; araç dönem sonunu 3 gün geri alır. Tarih aralıkları `OZET.md` ve `meta.json` içinde yazar.

URL denetimi bir URL'de hata verirse performans verisi yine de yazılır; o URL `url_inspection.csv` içinde `ERROR` olarak görünür.

## Anahtarsız yol (2026-11-07'den beri kullanılan)

voltan.com.tr kuruluşunda servis hesabı anahtarı oluşturmak kuruluş politikasıyla kapalı (`iam.disableServiceAccountKeyCreation`). Politika yürürlükte kalıyor; anahtar yerine şu yol kullanılıyor:

- **Kimlik:** Sahip, Claude oturumunda bir kez Google'a giriş yapar. Claude `gcloud auth login --no-launch-browser` çalıştırır, sahip verilen bağlantıyı telefonda açar ve çıkan tek kullanımlık kodu sohbete yapıştırır. Kod PKCE ile o oturumdaki bekleyen girişe bağlıdır, birkaç dakikada geçersiz olur.
  - **Hesap:** Girişte projenin bulunduğu **@voltan.com.tr** hesabı seçilmelidir. Kişisel gmail hesabının projeye erişimi yoktur.
  - **Yer tutucu değişken:** Claude bulut oturumlarında `CLOUDSDK_AUTH_ACCESS_TOKEN` vekil sunucu için bir yer tutucudur ve gcloud girişinin önüne geçer. Elle çalıştırılan gcloud komutlarının başına `env -u CLOUDSDK_AUTH_ACCESS_TOKEN` eklenir. Araç bunu kendisi yapar.
  - **Günlük dosyası:** gcloud, ekrana yazdırdığı erişim belirtecini ve girişte aldığı yenileme belirtecini `~/.config/gcloud/logs/` altına düz metin olarak kaydeder. Elle çalıştırılan her gcloud komutu `env -u CLOUDSDK_AUTH_ACCESS_TOKEN CLOUDSDK_CORE_DISABLE_FILE_LOGGING=1 gcloud …` biçiminde çalıştırılır. Araç bunu kendisi yapar.
- **Belirteç:** Araç, sahibin kimliğiyle `gsc-okuyucu` adına 1 saatlik, salt okunur (`webmasters.readonly`) bir belirteç alır.
  ```bash
  GSC_IMPERSONATE=gsc-okuyucu@voltage-search-console.iam.gserviceaccount.com node tools/gsc-export.mjs --inspect
  ```
- **Bir kerelik ön koşullar:** Bunlar 2026-11-07'de yapıldı.
  - Projede **IAM Service Account Credentials API** açık.
  - Sahibin hesabının `gsc-okuyucu` üzerinde **Service Account Token Creator** rolü var.
  - `gsc-okuyucu`, Search Console'da Kısıtlı kullanıcı.
- **İş bitince:** `gcloud auth revoke --all` çalıştırılır, ardından `rm -rf ~/.config/gcloud/logs ~/.config/gcloud/credentials.db ~/.config/gcloud/access_tokens.db` ile günlük ve kimlik kalıntısı silinir.
- **Bedeli:** Her yeni oturumda giriş tekrarlanır. Haftalık otomatik çekim için anahtar gerekmez; bkz. "Otomatik yol".

## Otomatik yol (haftalık; 2026-11-07'de kuruldu)

Search Console verisi her pazartesi 07:17'de (TR) kendiliğinden çekilir ve gizli `voltageenerji/seo-veri` reposuna işlenir. Saklanan anahtar, şifre veya belirteç yoktur.

- **Nasıl çalışır:** `seo-veri` reposundaki `.github/workflows/gsc-haftalik.yml`, GitHub'ın kimlik belirteciyle (OIDC) Google'a bağlanır. Google bu kimliği Workload Identity Federation ile doğrular ve `gsc-okuyucu` adına kısa ömürlü, salt okunur (`webmasters.readonly`) bir erişim belirteci verir. İş akışı belirteci `GSC_ACCESS_TOKEN` değişkeniyle araca geçirir. Bu değişken tanımlıysa araç diğer kimlik yollarına bakmaz.
- **Google kime belirteç verir:** Havuz `github`, sağlayıcı `seo-veri`. Sağlayıcının öznitelik koşulu (attribute condition) yalnızca GitHub hesap kimliği `277330074` olan hesabın `voltageenerji/seo-veri` reposunu ve yalnızca `main` dalını kabul eder. `gsc-okuyucu` üzerindeki Workload Identity User rolü yalnızca bu repoya verilidir. Herkese açık site reposunun iş akışları, fork'lar, başka hesaplardaki aynı adlı repolar ve diğer dallar belirteç alamaz.
- **Araçtaki ikinci kilit:** GitHub Actions içinde `GITHUB_REPOSITORY` tam olarak `voltageenerji/seo-veri` değilse araç çalışmayı reddeder. Bu kilit kazara kullanımı önler; asıl kilit Google tarafındaki koşuldur.
- **Günlük:** Araç `--quiet` ile çalışır. İş akışı günlüğüne yalnızca dosya sayısı ve URL denetimi toplamı yazılır; sorgu, sayfa veya URL yazılmaz. Belirteci GitHub maskeler; araç onu hiçbir yere yazmaz.
- **Veri nerede:** `seo-veri` reposunda `data/son/` (en son çekim) ve `data/YYYY-AA-GG/` (haftalık arşiv). Dosyalar elle çalıştırmadakiyle aynıdır (bkz. adım 5). Repo gizli kalır; veri site reposuna, bir artefakta veya herkese açık bir yere kopyalanmaz. `docs/seo/` raporları yalnızca toplamları ve karar için gereken sorguları, tarih aralığıyla aktarır.
- **Güven sınırı:** İş akışı aracı her çalıştırmada site reposunun `main` dalından alır. `main`'e giren her değişiklik bir sonraki pazartesi gerçek belirteçle çalışır. Bu yüzden `tools/gsc-export.mjs` değişikliklerinin QA kararı `node docs/qa/test-gsc-export.mjs` sonucunu içerir.
- **Elle çalıştırma:** `seo-veri` → Actions → "GSC haftalık" → Run workflow (dal: `main`). İş akışı dosyası `main`'de her değiştiğinde de çalışır.

## Sık görülen hatalar

| Mesaj | Çözüm |
|---|---|
| `GSC_SA_KEY_B64 tanımlı değil` | Adım 4; ardından yeni oturum açın |
| `Erişim reddedildi (403)` | Adım 3 (mülke kullanıcı ekleme) veya adım 1.3 (API etkin değil) |
| `Google erişim belirteci alınamadı` | Anahtar silinmiş olabilir; adım 2'den yeni anahtar |
| `Repo herkese açık … CI` | Araç GitHub Actions içinde yalnızca gizli `voltageenerji/seo-veri` reposunda çalışır; başka her repoda (site reposu dahil) bilerek reddeder. Elle çekim için Claude oturumunda çalıştırın |
| `GSC_ACCESS_TOKEN boş veya biçimi bozuk` | Otomatik yol: iş akışındaki "Google kimliği" adımı belirteç üretmedi, o adımın günlüğüne bakın. Elle çalıştırmada bu değişkeni tanımlamayın |
| İş akışında `unauthorized_client` veya "rejected by the attribute condition" | Google bu çalıştırmaya güvenmedi: iş akışı `main` dalında mı, repo adı ve `seo-veri` sağlayıcısının koşulu doğru mu? |
| İş akışında `iam.serviceAccounts.getAccessToken` izni reddedildi | `gsc-okuyucu` üzerindeki Workload Identity User bağlaması eksik veya repo adı farklı |
| `Çıktı klasörü repo içinde` | `gsc-data/` (varsayılan) veya repo dışı bir klasör kullanın |
| `gcloud oturumu yok` | Anahtarsız yol: önce `gcloud auth login --no-launch-browser` |
| `Servis hesabı adına belirteç alınamadı (HTTP 403)` | Anahtarsız yol ön koşulları: Token Creator rolü ve IAM Credentials API |
| Anahtar oluştururken "Service account key creation is disabled" | Kuruluş politikası `iam.disableServiceAccountKeyCreation` açık (yeni Google Cloud kuruluşlarında varsayılan). IAM & Admin → Organization Policies → "Disable service account key creation" → bu proje için **Not enforced** (Organization Policy Administrator yetkisi gerekir). |

## Anahtarı iptal etmek

Google Cloud → IAM & Admin → Service Accounts → `gsc-okuyucu` → Keys → anahtarı silin. Search Console → Kullanıcılar ve izinler → servis hesabını kaldırın. Bulut ortamından `GSC_SA_KEY_B64` değişkenini silin.

**Otomatik yolu durdurmak:** Geçici olarak `seo-veri` → Actions → "GSC haftalık" → Disable workflow. Kalıcı olarak sağlayıcıyı kapatın: `env -u CLOUDSDK_AUTH_ACCESS_TOKEN CLOUDSDK_CORE_DISABLE_FILE_LOGGING=1 gcloud iam workload-identity-pools providers update-oidc seo-veri --location=global --workload-identity-pool=github --project=voltage-search-console --disabled`
