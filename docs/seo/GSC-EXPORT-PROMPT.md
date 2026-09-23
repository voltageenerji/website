# GSC veri çekme promptu (Chrome eklentisi için)

Bu ortamda Google Search Console bağlayıcısı yok. Phase 2'nin etkisini ölçmek ve Phase 3'ü gerçek veriyle kurmak için aşağıdaki promptu Chrome eklentisine olduğu gibi verin. İlk okuma için en erken tarih 07.10.2026'dır; değişikliklerin taranıp yansıması için yaklaşık 2 hafta gerekir.

---

**PROMPT:**

Google Search Console'da `sc-domain:voltage.com.tr` mülkünü aç. Hiçbir ayarı değiştirme, hiçbir talep gönderme. Yalnızca ekranda gördüğünü, yorum katmadan aktar.

1. **Performans → Search results, Web.** Tarih: **Last 28 days**, ardından **Compare → previous period**. Dört toplamı (clicks, impressions, CTR, position) her iki dönem için tablo olarak ver.
2. Aynı ekranda **Queries** sekmesi. Satır sayısını **en fazlaya** (500) çıkar. Gösterime göre sırala ve **tüm satırları** aktar: query, clicks, impressions, CTR, position. Compare açıkken iki dönemin değerlerini yan yana ver.
3. **Pages** sekmesi: tüm satırlar, aynı sütunlarla.
4. **Sorgu × sayfa kırılımı:** Aşağıdaki her sayfa için filtre ekle (Page → URL is exactly …). Her birinde Queries sekmesindeki tüm satırları aktar:
   - https://voltage.com.tr/canli-ptf
   - https://voltage.com.tr/rehber/ptf-nedir
   - https://voltage.com.tr/rehber/serbest-tuketici
   - https://voltage.com.tr/rehber/tedarikci-degistirme
   - https://voltage.com.tr/rehber/sktt
   - https://voltage.com.tr/elektrik-faturasi-hesaplama
   - https://voltage.com.tr/rehber/elektrik-faturasi-neden-yuksek
5. Tarihi **Last 3 months** yap. 1–3. adımları bu aralık için tekrarla.
6. **Indexing → Pages.** Indexed / Not indexed sayıları, her "Not indexed" sebebi ve sayfa sayısı. **Not found (404)** ve **Page with redirect** satırlarına tıkla ve örnek URL listesini aynen aktar.
7. **Sitemaps.** sitemap.xml'in durumu, son okuma tarihi ve keşfedilen URL sayısı.
8. **URL Inspection.** Şu üç URL için "URL is on Google" durumunu ve son tarama tarihini ver:
   - https://voltage.com.tr/rehber/sktt
   - https://voltage.com.tr/elektrik-faturasi-hesaplama
   - https://voltage.com.tr/rehber/elektrik-faturasi-neden-yuksek

   Dizinde değilse **yalnızca** "Request indexing" düğmesine bas ve sonucu yaz.

Çıktıyı markdown tablolar hâlinde, başlıklarıyla ver. Görmediğin bir değeri tahmin etme; "ekranda yok" yaz.
