# LINKEDIN GÖNDERİ OTOMASYONU — Drip-Feed Rayı

**Sahibi:** Automation Engineer (Technology) · **Tarih:** 05.08.2026
**İçerik kaynağı:** `docs/marketing/LINKEDIN-KIT.md` (Marketing Agent, 5 onaylı gönderi)
**Hedef sayfa:** https://www.linkedin.com/company/voltage-enerji/

## Nasıl Çalışır

Repo kökündeki `linkedin-queue.json` dosyası, planlanmış LinkedIn
gönderilerinin kuyruğudur (`id`, `publishAt`, `title`, `text`, `link`).
`/feed/linkedin` adresindeki Pages Function bu kuyruğu okur ve **yalnızca
yayın zamanı (`publishAt`, Europe/Istanbul, +03:00) geçmiş öğeleri** geçerli
bir RSS 2.0 beslemesi olarak sunar. Dış köprü (Zapier veya Buffer — tek
seferlik sahip kurulumu) beslemeyi periyodik yoklar; beslemede yeni bir öğe
belirdiğinde onu LinkedIn şirket sayfasına otomatik gönderir. Sonuç: kuyruk
bir kez commit edilir, gönderiler planlanan Çarşamba 10:00'larda kendiliğinden
yayınlanır — süreklilik gerektiren manuel adım sıfırdır.

**Mevcut takvim:** 5 onaylı gönderi, iki haftada bir Çarşamba 10:00 (+03):
12.08 tanıtım → 26.08 canlı PTF → 09.09 rehber lansmanı → 23.09 serbest
tüketici 2026 → 07.10 ilke postu.

## Tek Seferlik Köprü Kurulumu — Zapier (önerilen)

1. Zapier'de **New Zap** oluşturun.
2. **Trigger:** "RSS by Zapier" → event: **New Item in Feed**.
3. **Feed URL:** `https://voltage.com.tr/feed/linkedin`
   (`https://voltage.com.tr/feed/linkedin.xml` de çalışır, 301 ile aynı yere gider).
4. **Action:** "LinkedIn" → event: **Create Company Update**.
5. LinkedIn hesabını bağlayın; şirket sayfası olarak **voltage-enerji**'yi seçin.
6. Alan eşlemesi: gönderi metni = RSS **Description** (asıl gönderi içeriği
   burada; hashtag'ler ve link dahil), yorum/başlık gerekiyorsa **Title**,
   link alanı = RSS **Link**.
7. **Test** çalıştırın (beslemede vadesi gelmiş öğe yoksa test örneği boş
   olabilir — normaldir), sonra Zap'i **ON** yapın.

**Buffer alternatifi:** Buffer'ın "RSS Feeds" özelliğine aynı besleme URL'si
eklenir; yeni öğeler Buffer kuyruğuna düşer. Not: Buffer varsayılanı öğeyi
kuyruğa **öneri** olarak ekler (tek tık onay) — tam otomatik yayın için
Zapier tercih edilir.

## İşletme Kuralları

- **Kuyruğa ekleme Orchestrator hattından geçer:** Marketing yazar → Legal &
  Compliance onaylar → onaylı metin `linkedin-queue.json`'a commit edilir.
  Kuyruğa Legal onayı olmayan metin girmez (LINKEDIN-KIT.md §3.2 kuralları
  kuyruk için de geçerlidir).
- Besleme **yalnızca vadesi gelen öğeleri** gösterir; gelecek tarihli öğeler
  dışarıdan görünmez ama dosya herkese açıktır — kuyruğa asla sır, taslak
  dışı veya onaysız içerik konmaz (zaten yayınlanacak metinlerdir).
- **İptal:** Bir öğeyi yayın tarihinden ÖNCE kuyruktan silmek (commit + deploy)
  yayını iptal eder. Tarihi geçmiş bir öğeyi silmek geri çekmez — köprü onu
  büyük olasılıkla çoktan gönderdi; LinkedIn tarafında elle silinir.
- **Değişiklik:** Yayınlanmamış öğenin metni/tarihi düzenlenebilir; `id`
  değiştirilmez (köprüler `guid` ile tekilleştirir — `id` değişirse aynı
  gönderi ikinci kez atılabilir).
- Kit'teki etkileşim kuralları geçerli: yorumlara kısa kurumsal yanıt,
  fiyat/teklif soruları info@voltage.com.tr'ye yönlendirilir.

## Sorun Giderme

- **Besleme boş görünüyor:** Normal olabilir — vadesi gelen öğe yoksa kanal
  dürüstçe boştur. `https://voltage.com.tr/feed/linkedin` adresini tarayıcıda
  açıp `lastBuildDate`'i kontrol edin; 200 dönüyorsa ray çalışıyordur.
- **500 hatası:** `linkedin-queue.json` bozuk (JSON parse) veya erişilemez
  demektir — son commit'i kontrol edin. Ray sessizce bozulmaz, açık hata verir.
- **Gönderi saatinde çıkmadı:** Zapier ücretsiz/düşük planlarda beslemeyi
  ~15 dakikada bir yoklar; buna besleme cache'i (max-age=300) eklenir.
  10:00 planı için 10:00–10:25 arası yayın **normaldir**, gecikme değildir.
- **Aynı gönderi iki kez atıldı:** Kuyrukta `id` değişmiş veya iki köprü
  (Zapier + Buffer) aynı anda açık olabilir — tek köprü çalıştırın.
- **Feed URL testi:** `curl -s https://voltage.com.tr/feed/linkedin | head`
  geçerli `<?xml ... <rss version="2.0">` çıktısı vermelidir; POST isteği
  405 döner (tasarım gereği).


## Kurulum testi hakkında önemli not (2026-08-05)

Akış zaman kilitlidir; kurulum yapılabilsin diye tanıtım gönderisi 05.08.2026
itibarıyla yayına açılmıştır ve akışta görünür. Kurulum sırasında:
1. "Test trigger" örnek olarak tanıtım gönderisini çekecektir.
2. "Test step" (LinkedIn aksiyonu) çalıştırıldığında tanıtım gönderisi
   GERÇEKTEN yayınlanır — bu istenen davranıştır (lansman gönderisidir).
   Testi ATLAMAYIN: Zap açılırken akışta mevcut öğeler "görülmüş" sayılır;
   test ile yayınlamazsanız tanıtım postu hiçbir zaman otomatik atılmaz.
3. Test sonrası Zap'i On yapın — sıradaki gönderiler (26.08, 09.09, 23.09,
   07.10) tarihlerinde otomatik yayınlanır.

**Operasyon kaydı (05.08.2026):** Kurulumda aksiyon testi atlandığı için
tanıtım öğesi Zap baseline'ına takıldı; guid `li-2026-08-05-tanitim-v2`
olarak yenilenip yeniden tetiklendi. Kural notu: "id değiştirilmez" kuralı
yayın SONRASI öğeler içindir — baseline'a takılan yayınlanmamış bir öğeyi
yeniden tetiklemenin yolu tam olarak guid yenilemektir (dedupe=Different Guid).
