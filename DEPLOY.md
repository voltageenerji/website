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

## Kontrol listesi (deploy sonrası)

- [ ] https://voltage.com.tr açılıyor, HTTPS yeşil
- [ ] TR/EN switcher çalışıyor
- [ ] Hero'daki PTF rakamı gerçek değer gösteriyor (simüle değil; EPİAŞ'ın o saatki değeri)
- [ ] Üst kayan şeritte 24 saatin gerçek fiyatları var
- [ ] Teklif formu gönderildiğinde nereye düşsün? (form şu an sadece frontend — backend bağlanacaksa ayrıca konuşalım)
- [ ] Mobil'de sorunsuz

---

## Sorun giderme

**Pages deploy "Build failed"** → build command boş, output directory `/` mü? Boş olmalı.

**Domain bağlandı ama "Error 522"** → DNS henüz yayılmamış, 1-15 dakika bekle.

**PTF hala simüle gözüküyor** → Tarayıcı console'unu aç (F12 → Console). `PTF proxy unavailable` hatası varsa Worker'a ulaşamıyor demektir. `curl -H "Origin: https://voltage.com.tr" https://epias-proxy.emirhantan-ku.workers.dev/ptf/today` ile test et.

**Form gönderilemiyor** → form action'ı şu an yok; gerçek e-postaya düşmesi için ayrı bir servis gerekir (Formspree, Web3Forms vb.) — söylersen bağlarım.
