# CANLI SİTE KONTROL LİSTESİ — tarayıcıda 15 dakika

Amaç: Sandbox'ta tarayıcı olmadığı için hiç koşulamayan canlı doğrulamaların
tek seferde kapatılması. Eklentiye verilebilir. Tarih: 2026-08-05.
Sonuçları Orchestrator'a bildirin (geçti/kaldı + ekran görüntüsü).

## A. Ana sayfa (masaüstü)
- [ ] voltage.com.tr açılıyor, konsolda (F12 → Console) kırmızı hata yok
- [ ] Canlı PTF bandı gerçek saatlik değer gösteriyor; damga "SAAT XX:00 · EPİAŞ"
- [ ] DevTools → Network → Offline yapıp yenile: PTF alanı dürüst
      "SON SENKRON/VERİ BEKLENİYOR" durumuna düşüyor (sahte canlı yok) → Online'a geri al
- [ ] TR/EN düğmesi: tüm metinler değişiyor, sekme başlığı da değişiyor;
      sayfa yenilenince tercih hatırlanıyor
- [ ] 8 sektör kartının başlıkları tıklanınca doğru rehbere gidiyor

## B. Mobil görünüm (gerçek telefon veya DevTools cihaz modu)
- [ ] Hamburger menü açılıyor/kapanıyor; Escape kapatıyor; linkler çalışıyor
- [ ] Form telefonda doldurulabilir; KVKK onay kutusuna dokunmak kolay
- [ ] Sekme ikonunda koyu V logosu görünüyor

## C. Form (bir test gönderimi — notuna "test" yazın)
- [ ] KVKK kutusu işaretlenmeden gönderilemiyor
- [ ] Gönderimde "KAYIT ALINDI" paneli çıkıyor (alert penceresi DEĞİL)
- [ ] info@voltage.com.tr'ye "Yeni Teklif Talebi" maili düşüyor, tablo düzgün
- [ ] /kvkk, /cerez-politikasi, /kullanim-kosullari footer'dan açılıyor

## D. Rehber bölümü
- [ ] /rehber 11 kart gösteriyor; 2-3 rastgele rehber açılıyor, tasarım uyumlu
- [ ] Rehber içi çapraz linkler ve "Teklif Talep Edin" butonu ana sayfa formuna götürüyor

## E. Teknik uçlar (adres çubuğuna yazarak)
- [ ] /feed/linkedin → XML akış görünüyor (tanıtım gönderisi içinde)
- [ ] /llms.txt ve /robots.txt açılıyor
- [ ] /docs/OPERASYON-DEFTERI.md → ana sayfaya YÖNLENİYOR (içerik GÖRÜNMEMELİ)
- [ ] /sitemap.xml → 16 URL listeleniyor
- [ ] voltan.com.tr → voltage.com.tr'ye yönleniyor (diğer alan adları da)
- [ ] voltage.com.tr/olmayan-sayfa → tasarımlı 404 sayfası çıkıyor (boş Cloudflare sayfası DEĞİL)

## F. Cloudflare paneli (2 dakika)
- [ ] Workers & Pages → site projesi → Metrics/Web Analytics: **etkin mi?**
      Değilse "Enable Web Analytics" ile aç (çerezsiz; çerez politikamızla uyumlu).
      Bu açık değilse sitenin ziyaretçi ölçümü ŞU AN YOK — en kritik madde bu.

## G. Paylaşım kartı
- [ ] WhatsApp'ta kendine voltage.com.tr linki at: koyu zeminli og-image kartı çıkıyor
