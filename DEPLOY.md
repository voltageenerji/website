# Deploy Rehberi — voltage.com.tr

Toplam süre: **~15-20 dakika**. Cloudflare Pages kullanacağız (ücretsiz, sınırsız bandwidth, otomatik HTTPS, global CDN). Worker'ı zaten Cloudflare'de deploy ettiğin için aynı dashboard'da her şeyi yönetirsin.

---

## 1) GitHub'a push

### İlk kez mi? Git kurulu değilse:
- https://git-scm.com → indir, kur
- Terminalde `git --version` ile doğrula

### Repo oluştur

1. https://github.com/new → repo adı: `voltage-site` (veya `voltage.com.tr`) → **Private** seç → **Create**
2. GitHub sana açılışta komutları gösterir; **"push an existing repository"** bölümündekileri kullan.

### Bu klasörü push et

Bu klasörün içindeyken terminal:

```bash
cd voltage-site
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<kullanici-adin>/voltage-site.git
git push -u origin main
```

Kimlik sorulursa GitHub kullanıcı adın + Personal Access Token (password kabul edilmiyor artık). Token almak için: https://github.com/settings/tokens → Generate new token (classic) → `repo` scope'unu seç.

---

## 2) Cloudflare Pages'te repo'yu bağla

1. https://dash.cloudflare.com → **Workers & Pages** → **Create application** → **Pages** sekmesi → **Connect to Git**
2. **GitHub** seç → yetki ver → `voltage-site` repo'sunu seç → **Begin setup**
3. Ayarlar:
   - **Project name:** `voltage-site`
   - **Production branch:** `main`
   - **Build command:** boş bırak
   - **Build output directory:** `/` (yani kök)
4. **Save and Deploy** → ~30 saniye sonra siten `https://voltage-site.pages.dev`'de yayında.

---

## 3) voltage.com.tr custom domain bağla

### A) Domain Cloudflare'de kayıtlıysa (veya DNS'i Cloudflare'e taşındıysa)

1. Pages projeni aç → **Custom domains** sekmesi → **Set up a custom domain**
2. `voltage.com.tr` yaz → **Continue** → Cloudflare otomatik DNS ekler
3. `www.voltage.com.tr` için aynı işlemi tekrarla (ya da Cloudflare DNS'te `www` → `voltage.com.tr` CNAME'i)

### B) Domain başka bir registrar'da

İki seçenek:

**B1 (önerilen): DNS'i Cloudflare'e taşı** (ücretsiz, 15dk, SSL + hız kazanırsın)
- Cloudflare → **Add a Site** → `voltage.com.tr` → Free plan → Cloudflare sana 2 nameserver verir
- Domain'i aldığın yerden (GoDaddy, Natro, İsimTescil vb.) nameserver'ları değiştir
- ~1-24 saat içinde yayılır → sonra yukarıdaki (A) adımlarını izle

**B2: Sadece CNAME ekle**
- Registrar'ında DNS paneline gir → şu kaydı ekle:
  - Type: `CNAME`, Name: `@` (veya `voltage.com.tr`), Value: `voltage-site.pages.dev`
  - Type: `CNAME`, Name: `www`, Value: `voltage-site.pages.dev`
- Cloudflare Pages → Custom domains → `voltage.com.tr` → doğrulaması yeşile dönünce hazır.

---

## 4) Worker CORS listesini kontrol et

Worker zaten `voltage.com.tr` + `www.voltage.com.tr` için CORS'a izinli ( `worker.js` içindeki `ALLOWED_ORIGINS`). Yani domain yayına girer girmez canlı PTF otomatik çalışır, ekstra bir şey yapmana gerek yok.

---

## 5) Sonraki güncellemeler

Bir değişiklik olduğunda:

```bash
git add .
git commit -m "Açıklama"
git push
```

Cloudflare Pages otomatik yeni build'i deploy eder, ~30sn içinde site güncellenir.

---

## 5.5) Pages Functions — lead formu + olay ölçümü backend'i

Repo'daki `functions/` klasörü Cloudflare Pages tarafından otomatik deploy edilir
(ekstra build ayarı gerekmez):

- `functions/api/lead.js` → `POST /api/lead` — teklif formu kayıtları
- `functions/api/event.js` → `POST /api/event` — çerezsiz funnel olayları
  (mevcut sayfa olay göndermiyor; analitik ihtiyacını Cloudflare Web Analytics
  karşılıyor — endpoint ileride kullanım için hazır bekliyor)

### KV namespace'leri oluştur ve bağla

1. Dashboard → **Workers & Pages → KV** → **Create namespace**:
   - `voltage-leads`
   - `voltage-events`
   (veya CLI: `wrangler kv namespace create voltage-leads` vb.)
2. Pages projesi → **Settings → Functions → KV namespace bindings** → **Add binding**:
   - Variable name: `LEADS` → namespace: `voltage-leads`
   - Variable name: `EVENTS` → namespace: `voltage-events`
3. Production **ve** Preview ortamları için ayrı ayrı bağla, sonra **yeniden deploy et**
   (binding değişiklikleri yeni deploy ile etkinleşir).

### Opsiyonel: lead webhook (e-posta / Slack / CRM köprüsü)

Pages projesi → **Settings → Environment variables** → `LEAD_WEBHOOK_URL` ekle
(ör. bir Zapier/Make webhook'u veya kendi Worker'ın). Her lead, JSON olarak bu
URL'ye de POST edilir.

### Bağlı değilse davranış (bilinçli tasarım)

- `LEADS` KV **ve** `LEAD_WEBHOOK_URL` ikisi de yoksa `/api/lead` **503** döner;
  form ziyaretçiye dürüst bir hata + e-posta (mailto) alternatifi gösterir.
  **Veri çöpe giderken asla "talebiniz alındı" denmez.**
- `EVENTS` KV yoksa `/api/event` sessizce 204 döner — analitik durur, site durmaz.

### Lead'leri okuma

Dashboard → KV → `voltage-leads` → anahtarlar `lead:<timestamp>:<random>`
biçimindedir; değer JSON'dur. (CLI: `wrangler kv key list --namespace-id=...`)

---

## 5.5.1) Lead bildirimleri ve raporlar

Her başarılı lead kaydından sonra anlık e-posta bildirimi (`functions/api/lead.js`)
ve zamanlanmış haftalık/aylık özet raporu (`functions/api/report.js` +
`.github/workflows/lead-reports.yml`) gönderilir. E-posta altyapısı: Resend.

**Önemli tasarım kuralı:** e-posta hatası lead'i asla düşürmez — KV doğruluk
kaynağıdır. Rapor endpoint'i ise tam tersi: e-posta gönderilemezse 502 döner
(rapor e-postayla var olur, sessiz başarı yok). Sıfır lead de rapordur
("Bu dönemde talep gelmedi" e-postası yine gider).

### Gerekli environment variable'lar (Pages → Settings → Environment variables)

| Değişken | Tür | Açıklama |
|---|---|---|
| `RESEND_API_KEY` | **Secret** | Resend API anahtarı (`re_...`). Dashboard → API Keys |
| `LEAD_NOTIFY_TO` | Plaintext | Bildirim alıcı(ları); virgülle çoklu: `satis@voltage.com.tr,emirhantan.ku@gmail.com` |
| `MAIL_FROM` | Plaintext | Gönderen adres — **Resend'de doğrulanmış domain'de olmalı**, ör. `bildirim@voltage.com.tr` |
| `REPORT_TOKEN` | **Secret** | `/api/report` erişim token'ı (uzun rastgele değer, ör. `openssl rand -hex 32`). **Aynı değer** GitHub repo'sunda Actions secret'ı `REPORT_TOKEN` olarak da tanımlanmalı |

Üç Resend değişkeninden biri eksikse lead bildirimi sessizce atlanır (lead yine
kaydedilir); `/api/report` ise 503 döner. Production **ve** Preview için ayrı
ayrı tanımla, sonra yeniden deploy et.

### Resend domain doğrulama (bir kere)

1. https://resend.com → kayıt ol → **Domains → Add Domain** → `voltage.com.tr`
2. Resend'in verdiği DNS kayıtlarını (SPF için TXT, DKIM için TXT/CNAME, MX
   `send.` alt alanı) Cloudflare → DNS → Records'a birebir ekle
   (proxy KAPALI / "DNS only" olmalı).
3. Resend'de **Verify** → yeşile dönünce `bildirim@voltage.com.tr` gibi
   adreslerden gönderim yapılabilir.
4. **API Keys** → yeni key oluştur → `RESEND_API_KEY` olarak Pages'e ekle.

### GitHub Actions zamanlayıcısı

`.github/workflows/lead-reports.yml`:

- Pazartesi 05:30 UTC (08:30 İstanbul) → haftalık rapor (son 7 tam gün)
- Ayın 1'i 05:45 UTC (08:45 İstanbul) → aylık rapor (önceki takvim ayı)
- `curl -fsS` kullanır: endpoint 2xx dışı dönerse job **fail** olur — kırık
  pipeline Actions sekmesinde kırmızı görünür, sessiz kalmaz.

Kurulum: GitHub repo → **Settings → Secrets and variables → Actions →
New repository secret** → Name: `REPORT_TOKEN`, Value: Pages'teki değerin aynısı.

### Test

Manuel workflow: GitHub → **Actions → Lead Reports → Run workflow** →
period seç (`weekly`/`monthly`) → çalıştır → job yeşilse e-posta gelmiş olmalı.

Doğrudan curl (token'ı kendi değerinle değiştir):

```bash
curl -fsS -H "Authorization: Bearer $REPORT_TOKEN" \
  "https://voltage.com.tr/api/report?period=weekly"
```

Dönen JSON PII içermez (sayımlar + şirket adları) — loglanabilir. Lead
bildirimi testi: siteden bir test teklif formu gönder; `LEAD_NOTIFY_TO`
adresine "Yeni Teklif Talebi — {şirket}" konulu e-posta düşmeli ve KV'de
kayıt görünmeli (e-posta gelmese bile kayıt esastır).

---

## 5.5.2) Yönetim paneli (/panel) — KURULUM

Panel gelen tüm teklif taleplerini kullanıcı adı + parola ile gösterir.
**Gerçek kişisel veri gösterir**; aşağıdaki üç değişken tanımlanmadan panel
açılmaz (503 `not_configured` döner — yarı çalışan bir kapı bırakmıyoruz).

### Adım 1 — parola özetini üret (parola hiçbir yere gönderilmez)

Kendi bilgisayarınızda, repo kökünde:

```sh
node tools/admin-hash.mjs
```

Parolayı iki kez sorar (en az 12 karakter), sonra Cloudflare'a yapıştırılacak
satırları basar. **Parolanın kendisi hiçbir yerde saklanmaz** — unutursanız
aracı yeniden çalıştırıp yeni bir özet üretirsiniz.

### Adım 2 — Cloudflare ortam değişkenleri

Workers & Pages → proje → Settings → Environment variables → **Production**:

| Değişken | Değer | Şifreli? |
|---|---|---|
| `ADMIN_USER` | seçtiğiniz kullanıcı adı (örn. `emirhan`) | hayır |
| `ADMIN_PASS_HASH` | `admin-hash.mjs` çıktısındaki `pbkdf2$...` satırı | **evet (Encrypt)** |
| `ADMIN_SESSION_SECRET` | aracın ürettiği rastgele dize | **evet (Encrypt)** |

Kaydettikten sonra **yeni bir deployment** gerekir (Deployments → Retry deployment).

### Adım 3 — doğrulama

`https://voltage.com.tr/panel` → giriş ekranı gelmeli, doğru bilgiyle talep
listesi açılmalı. Yanlış parolada "Kullanıcı adı veya parola hatalı" görünür;
15 dakikada 8 hatalı denemeden sonra IP geçici olarak kilitlenir.

### Güvenlik ve KVKK notları

- Oturum çerezi HttpOnly + Secure + SameSite=Strict; **8 saat** sonra kendiliğinden düşer.
- Parola PBKDF2-SHA256 (210.000 tur) ile saklanır; düz metin hiçbir yerde yok.
- Kaba kuvvet sayacında **IP ham tutulmaz** (SHA-256 özeti, 15 dk TTL).
- `/panel` ve `/api/admin/*`: `no-store`, `noindex`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`. robots.txt'te de kapalı.
- Panel verisi CSV olarak indirilebilir — indirilen dosya kişisel veri içerir,
  paylaşımına dikkat edin.
- Parolayı değiştirmek: Adım 1'i tekrarlayın, `ADMIN_PASS_HASH` değerini
  güncelleyin. `ADMIN_SESSION_SECRET` değerini değiştirmek **tüm açık
  oturumları anında düşürür** (cihaz kaybı durumunda bunu yapın).

### Rapor dönemleri

`/api/report?period=` → `weekly` | `monthly` | `quarterly` | `semiannual` | `yearly`.
Zamanlama `.github/workflows/lead-reports.yml` içindedir (haftalık Pazartesi,
aylık ayın 1'i, 3 aylık Oca/Nis/Tem/Eki, 6 aylık Oca/Tem, yıllık 1 Ocak).
Elle tetikleme: Actions → Lead Reports → Run workflow → dönem seç.


## 5.6) Cloudflare Web Analytics (çerezsiz, opsiyonel)

1. Dashboard → **Analytics & Logs → Web Analytics** → site ekle → token'ı kopyala.
2. `index.html` içinde `</body>` hemen öncesindeki yorumlu beacon bloğunu bul
   (`CF_WEB_ANALYTICS_TOKEN_BURAYA`), token'ı yapıştır, yorumdan çıkar.
3. `_headers` CSP'si `https://static.cloudflareinsights.com`'u `script-src` ve
   `connect-src`'te zaten içeriyor — ekstra CSP değişikliği gerekmez.
4. Çerezsiz çalıştığı için Çerez Politikası metniyle uyumludur; çerezli bir
   araca geçilirse `cerez-politikasi.html` önce güncellenmelidir.

---

## YAYIN ÖNCESİ kontrol listesi (must-do)

Resmî veriler sitede yayında: EPDK lisansı `ETS/3424-8/2074` ve Ticaret Sicil
`786882-0 · İstanbul` (Exhibit A, İletişim ve footer'da). Kalanlar:

- [ ] **Hukuk incelemesi**: `kvkk.html`, `cerez-politikasi.html`,
      `kullanim-kosullari.html` dosyaları TASLAK'tır (her birinin başında HTML
      yorumu olarak işaretli) — yayın onayı legal-compliance'tan alınmalı.
      Not: KVKK metni ve Kullanım Koşulları'ndaki "tasarruf simülatörü"
      ibareleri güncel sitede karşılıksız — incelemede çıkarılmalı.
- [ ] **KV binding'i** `LEADS` bağlandı ve test lead'i KV'de görüldü
      (`EVENTS` opsiyonel; sayfa şu an olay göndermiyor). Binding yoksa
      `/api/lead` 503 döner, form dürüst hata + e-posta alternatifi gösterir.

---

## Kontrol listesi (deploy sonrası)

- [ ] https://voltage.com.tr açılıyor, HTTPS yeşil
- [ ] TR/EN switcher çalışıyor
- [ ] Hero'daki PTF rakamı gerçek değer gösteriyor (simüle değil; EPİAŞ'ın o saatki değeri)
- [ ] Üst kayan şeritte 24 saatin gerçek fiyatları var
- [ ] Teklif formu gönderimi `/api/lead`'e düşüyor (KV `voltage-leads` içinde yeni kayıt görünüyor; bkz. §5.5)
- [ ] Form KV bağlanmadan denenirse dürüst hata + e-posta (mailto) alternatifi gösteriyor (başarı mesajı GÖSTERMİYOR)
- [ ] Mobil'de sorunsuz (hamburger menü açılıyor/kapanıyor, Teklif Al CTA çalışıyor)
- [ ] /kvkk, /cerez-politikasi, /kullanim-kosullari açılıyor

---

## Sorun giderme

**Pages deploy "Build failed"** → build command boş, output directory `/` mü? Boş olmalı.

**Domain bağlandı ama "Error 522"** → DNS henüz yayılmamış, 1-15 dakika bekle.

**PTF hala simüle gözüküyor** → Tarayıcı console'unu aç (F12 → Console). `PTF proxy unavailable` hatası varsa Worker'a ulaşamıyor demektir. `curl -H "Origin: https://voltage.com.tr" https://epias-proxy.emirhantan-ku.workers.dev/ptf/today` ile test et.

**Form gönderilemiyor / hata mesajı görünüyor** → `/api/lead` 503 dönüyorsa `LEADS` KV binding'i veya `LEAD_WEBHOOK_URL` tanımlı değildir (bkz. §5.5). Binding ekledikten sonra projeyi yeniden deploy et. Tarayıcı console'unda `Lead submit failed: ...` satırı hatanın nedenini gösterir.
