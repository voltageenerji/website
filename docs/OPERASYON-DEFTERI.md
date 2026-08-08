# VOLTAN — OPERASYON DEFTERİ

Tek kaynak: neyin canlı olduğu, neyin zamanlanmış olduğu, neyin kimde
beklediği. Güncelleyen: Orchestrator. Son güncelleme: **2026-08-05**.

## 1. Canlı sistemler

| Sistem | Durum | Notlar |
|---|---|---|
| voltage.com.tr (ana site) | ✅ Canlı | Sahibin editoryal tasarımı (main temelli) + taşınan altyapı. Cloudflare Pages, main dalından otomatik deploy. |
| Teklif formu → KV | ✅ Canlı, test edildi | `/api/lead` → `voltage-leads` KV. Dürüstlük kuralı: kayıt yolu yoksa 503, asla sahte başarı. |
| Anlık lead maili | ✅ Canlı, test edildi | Resend (eu-west-1/İrlanda) → info@voltage.com.tr. Konu: "Yeni Teklif Talebi — {şirket}". |
| Haftalık/aylık lead raporu | ✅ Kurulu | GitHub Actions cron → `/api/report`. Pazartesi 08:30 (haftalık), ayın 1'i 08:45 (aylık) TRT. İlk otomatik: 2026-08-10. |
| Rehber kütüphanesi | ✅ Canlı | 11 sayfa (`/rehber`). Tümü hukuk onaylı, sıfır tasarruf vaadi, FAQPage şemalı. |
| Yapay zekâ görünürlüğü | ✅ Canlı | robots.txt AI-tarayıcı izinleri, `/llms.txt`, FAQ şemaları. Etki tarayıcı ziyaretleriyle birikir. |
| LinkedIn otomasyonu | ✅ DEVREDE | Kuyruk (`linkedin-queue.json`) → `/feed/linkedin` → Zapier "Voltage Enerji - RSS to LinkedIn" → sayfa (ID 10004014). İlk gönderi 05.08 yayınlandı, sahip teyitli. |
| Canlı PTF bandı | ✅ Canlı | epias-proxy Worker (`/ptf/today`, `/ptf/stats`). Dürüst durum merdiveni: CANLI / SON SENKRON / VERİ BEKLENİYOR. |
| GSC + Bing | ✅ Doğrulandı (3 mülk) | Veri birikiyor; ilk anlamlı okuma ~2 hafta. |

## 2. Zamanlanmış olaylar

| Tarih | Olay |
|---|---|
| 2026-08-10 Pzt 08:30 | İlk otomatik haftalık lead raporu (mail) |
| 2026-08-20 | Zapier deneme planı biter → poll 2 dk → ~15 dk olur (gönderiler 10:00–10:25 aralığına kayar) |
| 2026-08-26 Çar ~10:00 | LinkedIn: canlı PTF bandı gönderisi (otomatik) |
| 2026-09-01 Salı 08:45 | İlk otomatik aylık lead raporu |
| 2026-09-09 / 09-23 / 10-07 | LinkedIn: rehber lansmanı / serbest tüketici 2026 / ilke postu (otomatik) |
| 2026-12 (EPDK kurul kararı dönemi) | SEO Faz 3 sezon oyunu: "Serbest Tüketici 2027" güncellemesi — Kasım'da hazırlık |

## 3. Bekleyen girdiler (kimde)

| Girdi | Kimde | Bloke ettiği iş |
|---|---|---|
| Hukuki metin onayları + F1-F6 teyitleri (ana paket) | Avukat | TASLAK şerhlerinin kalkması; rehberdeki RG ihtiyat notu; varlık yayılımı (adres/unvan teyidi) |
| EK-1 (ticari ileti/İYS) cevapları | Avukat | Satış motoru aktivasyonu (motor zaten PASİF — acele yok) |
| DMARC kaydı (`_dmarc` TXT, p=none) | Sahip/eklenti | Mail itibar korumasının tamamlanması (önerildi, acil değil) |
| GSC sitemap yeniden gönderimi (16 URL) | Sahip/eklenti | Yeni sayfaların hızlı taranması |
| Resend API anahtarının domain kısıtı | Sahip (Resend paneli) | Hijyen (düşük öncelik) |
| Kullanılmayan Zapier LinkedIn bağlantısının silinmesi | Sahip | Hijyen (düşük öncelik) |

### İzleme listesi (dış gelişmeler)

| Konu | Tür | Durum |
|---|---|---|
| ChatGPT Ads Türkiye lansmanı | Dış gelişme (izleme) | Pasif — TRde aktif değil (canlı: US/CA/AU/NZ/UK/JP/KR, 2026-08). Şartlar: TR lansmanı + aktif satış kararı + ölçüm temeli. Organik katman (llms.txt/FAQ şema/Bing) zaten kurulu. |

## 4. Karar kayıtları (aktif kısıtlar)

| Karar | Tarih | Kapsam |
|---|---|---|
| Main tasarımı kanonik | 2026-08-04 | Site tasarımına dokunulmaz; içerik sayfaları şablon uyumlu eklenebilir |
| Satış motoru PASİF | 2026-08-05 | Hiçbir soğuk erişim yok; aktivasyon = sahip talimatı + hukuk onayı |
| Sıfır tasarruf vaadi | Yayın ilkesi | Tüm kanallar (site, rehber, LinkedIn, mail) |
| İç dokümanlar servis dışı | 2026-08-05 | `/docs/*`, CLAUDE.md, DEPLOY.md, CHANGELOG.md → 302 |
| Prop trading yasağı / fiyat sabitleme kapısı | 180g planı | Sabit fiyat taahhüdü öncesi pozisyon kontrolü (şirket pasif satışta — uyuyan kural) |

## 5. Erişim haritası (kimlik bilgisi İÇERMEZ)

| Varlık | Nerede | Sahibi |
|---|---|---|
| Cloudflare (Pages, KV, DNS, env) | dash.cloudflare.com | Sahip |
| GitHub voltageenerji/website | Repo + Actions secret REPORT_TOKEN | Sahip; Orchestrator yazma erişimli |
| Resend (RESEND_API_KEY) | Cloudflare env (şifreli) | Sahip |
| Zapier "Voltage Enerji - RSS to LinkedIn" | zapier.com | Sahip |
| LinkedIn sayfası (ID 10004014) | linkedin.com/company/voltage-enerji | Sahip |
| GSC/Bing mülkleri | Google/Bing hesapları | Sahip |
| epias-proxy Worker | Ayrı repo (bu oturumun kapsamı dışında) | Sahip |
