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
  form ziyaretçiye dürüst bir hata + telefon/e-posta alternatifi gösterir.
  **Veri çöpe giderken asla "talebiniz alındı" denmez.**
- `EVENTS` KV yoksa `/api/event` sessizce 204 döner — analitik durur, site durmaz.

### Lead'leri okuma

Dashboard → KV → `voltage-leads` → anahtarlar `lead:<timestamp>:<random>`
biçimindedir; değer JSON'dur. (CLI: `wrangler kv key list --namespace-id=...`)

---

## 5.6) Cloudflare Web Analytics (çerezsiz, opsiyonel)

1. Dashboard → **Analytics & Logs → Web Analytics** → site ekle → token'ı kopyala.
2. `index.html` `<head>` içindeki yorumlu beacon bloğunu bul
   (`CF_WEB_ANALYTICS_TOKEN_BURAYA`), token'ı yapıştır, yorumdan çıkar.
3. `_headers` CSP'sine `https://static.cloudflareinsights.com` ekle:
   `script-src`'e ve `connect-src`'e. Eklenmezse beacon CSP tarafından bloklanır.
4. Çerezsiz çalıştığı için Çerez Politikası metniyle uyumludur; çerezli bir
   araca geçilirse `cerez-politikasi.html` önce güncellenmelidir.

---

## YAYIN ÖNCESİ DOLDURULMASI ZORUNLU (must-fill) kontrol listesi

Sahibinden alınacak resmî veriler — **uydurma/placeholder değerle yayına çıkılmaz**:

- [ ] **EPDK Tedarik Lisansı No** → `index.html` footer'ında `MUST-FILL` işaretli
      yorum bloğu (arama: `EPDK-LISANS-NO`). Değeri yaz, satırı yorumdan çıkar.
- [ ] **MERSİS No** → aynı yorum bloğu (arama: `MERSIS-NO`).
- [ ] **Ticaret Sicil No** → aynı yorum bloğu (arama: `TICARET-SICIL-NO`).
- [ ] **Hukuk incelemesi**: `kvkk.html`, `cerez-politikasi.html`,
      `kullanim-kosullari.html` dosyaları TASLAK'tır (her birinin başında HTML
      yorumu olarak işaretli) — yayın onayı legal-compliance'tan alınmalı.
- [ ] **KV binding'leri** (`LEADS`, `EVENTS`) bağlandı ve test lead'i KV'de görüldü.
- [ ] Simülatör çarpanları Pricing Agent tarafından doğrulanana kadar
      "örnek senaryo" ibaresi kaldırılamaz (`index.html` içinde `TODO(pricing)`).

---

## Kontrol listesi (deploy sonrası)

- [ ] https://voltage.com.tr açılıyor, HTTPS yeşil
- [ ] TR/EN switcher çalışıyor
- [ ] Hero'daki PTF rakamı gerçek değer gösteriyor (simüle değil; EPİAŞ'ın o saatki değeri)
- [ ] Üst kayan şeritte 24 saatin gerçek fiyatları var
- [ ] Teklif formu gönderimi `/api/lead`'e düşüyor (KV `voltage-leads` içinde yeni kayıt görünüyor; bkz. §5.5)
- [ ] Form KV bağlanmadan denenirse dürüst hata + telefon/e-posta alternatifi gösteriyor (başarı mesajı GÖSTERMİYOR)
- [ ] Mobil'de sorunsuz (hamburger menü açılıyor/kapanıyor, Teklif Al CTA çalışıyor)
- [ ] /kvkk, /cerez-politikasi, /kullanim-kosullari açılıyor

---

## Sorun giderme

**Pages deploy "Build failed"** → build command boş, output directory `/` mü? Boş olmalı.

**Domain bağlandı ama "Error 522"** → DNS henüz yayılmamış, 1-15 dakika bekle.

**PTF hala simüle gözüküyor** → Tarayıcı console'unu aç (F12 → Console). `PTF proxy unavailable` hatası varsa Worker'a ulaşamıyor demektir. `curl -H "Origin: https://voltage.com.tr" https://epias-proxy.emirhantan-ku.workers.dev/ptf/today` ile test et.

**Form gönderilemiyor / hata mesajı görünüyor** → `/api/lead` 503 dönüyorsa `LEADS` KV binding'i veya `LEAD_WEBHOOK_URL` tanımlı değildir (bkz. §5.5). Binding ekledikten sonra projeyi yeniden deploy et. Tarayıcı console'unda `Lead submit failed: ...` satırı hatanın nedenini gösterir.
