# ai-design-skills — Voltage kullanım notu

| | |
|---|---|
| Kaynak | https://github.com/elayadesign/ai-design-skills |
| Kopyalanan sürüm | commit `5e578402da175cdc539c900e4b09ceecfadcb37c` (27.10.2026) |
| Lisans | MIT (`LICENSE`, değiştirilmeden saklandı) |
| İçerik | Yalnızca Markdown talimat dosyaları: `landing-page-design` ve `design-to-motion`. Çalıştırılabilir kod yok. |
| Durum | **Referans kütüphanesi.** `.claude/skills/` altına aktif beceri olarak KURULMADI. |
| Kaydeden | Orkestratör, 27.10.2026 |

Bu klasördeki README, LICENSE ve iki SKILL.md dosyası kaynakla birebir aynıdır. Düzenlemeyin; güncellemek için aşağıdaki "Güncelleme" adımlarına bakın. `/docs/*` yolu sitede yayımlanmaz (`_redirects`).

## Neden aktif beceri olarak kurulmadı?

`landing-page-design` dosyasının açıklaması, "herhangi bir web arayüzü" işinde kullanıcı istemese de kendini devreye sokacak şekilde yazılmış. Ayrıca çakışma durumunda kendi kurallarının geçerli olacağını söylüyor. Kurulursa sitedeki her değişiklikte aşağıdaki çakışmaları dayatır. `design-to-motion` daha dar tetikleniyor, ama web bağlamında her sayfaya bir açılış animasyonu öneriyor; bu da ana sayfa tasarımına onaysız dokunmak demek.

## Bizim kurallarımızla çakışan yerler (uygulanmaz)

| Beceri kuralı | Bizim kuralımız |
|---|---|
| Yalnızca Geist, Manrope veya Poppins; tek yazı tipi; italik yasak | Kanonik tasarım Newsreader (italik dâhil), Archivo ve IBM Plex Mono kullanır. Onaysız değiştirilmez. |
| Tailwind yazı ve boşluk ölçeği, Tailwind köşe yarıçapları | Site Tailwind kullanmıyor; `index.html` içindeki tasarım belirteçleri esastır. |
| Arka planda degrade yasak, kahraman başlığında degrade metin | Kanonik tasarım kararı geçerlidir. |
| Zorunlu "slogan açılış" bölümü, yüzen gezinme çubuğu | Ana sayfa yapısı onaysız değişmez. |
| Örnek içerikte uydurma isimli müşteri yorumları, uydurma marka adları, "yuvarlak olmayan" uydurma rakamlar | **Yasak.** Uydurma yorum, müşteri, logo veya metrik yayımlanmaz (Hukuk). |
| "Somut ol" örneği: süre veya tutar kazancı vaadi | **Yasak.** Tasarruf yüzdesi veya tutarı hiçbir kanalda yayımlanmaz. |
| Risk azaltma: ücretsiz deneme, para iade garantisi, "istediğin zaman iptal" | Elektrik tedarik sözleşmesinde geçerli değil; sözleşme koşulları Hukuk onayı olmadan yazılmaz. |
| Kopyada tire işareti kullanma | Türkçe metinde kanonik üslup geçerlidir. |

## İşimize yarayan kısımlar

**`landing-page-design`:**
- **A1 Ön bilgi listesi:** tek hedef eylem, hedef kitle, itirazlar, trafik kaynağı. Yeni bir kampanya veya iniş sayfası brifinginde kontrol listesi olarak kullanılır.
- **A2 ve A4 yapı ve dönüşüm kuralları:** ekranın üst kısmında tek birincil CTA, kanıtın iddianın yanında durması, SSS'nin itiraz bölümü olarak ele alınması.
- **A7 SEO:** yalnızca reklam için açılan, süreli kampanya sayfalarına `noindex`.
- **B7 hareket kuralları:** yalnızca `transform` ve `opacity` animasyonu, `prefers-reduced-motion` desteği, kaydırma dinleyicisi yerine `IntersectionObserver`.
- **B9 durumlar:** hover, active, odak halkası, yükleme, boş ve hata durumlarının her etkileşimli öğede bulunması.
- **B10 yayın öncesi liste:** yasal bağlantılar, 404, form doğrulama, favicon, OG etiketleri, alt metin, anlamsal HTML, "içeriğe atla" bağlantısı. Yeni sayfa yayımlanmadan önce QA kontrolüne eklenebilir.

**`design-to-motion`:**
- **Sosyal medya için hareketli görsel üretimi.** Canlı PTF kartı, fatura hesaplama aracı veya rehber görselleri gibi statik bir tasarımı LinkedIn ve X için MP4 ve GIF döngüsüne çevirme yöntemi. Showcase bağlamı siteye dokunmaz.
- Figma yerine ekran görüntüsünden yeniden kurma, belirleyici kare yakalama ve ffmpeg dışa aktarım ayarları.
- **Şart:** Showcase'te gösterilen rakamlar gerçek ve tarihli olmalı (dürüstlük kuralı). Örnek veri kullanılacaksa görselde "örnek" diye belirtilir.

## Nasıl kullanılır?

Ajana dosyanın yolunu ve hangi bölümlerin uygulanacağını açıkça verin. Örnek:

```
docs/design/kaynaklar/ai-design-skills/skills/landing-page-design/SKILL.md
dosyasının yalnızca A1, A4, A7, B9 ve B10 bölümlerini kontrol listesi olarak kullan.
Part B'deki yazı tipi, renk, boşluk ve içerik gerçekçiliği kurallarını UYGULAMA;
kanonik tasarım ve Hukuk kuralları geçerlidir.
```

Sosyal medya animasyonu için:

```
docs/design/kaynaklar/ai-design-skills/skills/design-to-motion/SKILL.md
dosyasını showcase bağlamında uygula. Siteye dokunma. Görseldeki tüm rakamlar
gerçek EPİAŞ verisi olsun ve tarihi yazsın.
```

Karar yetkisi Design ajanındadır; çakışmada kanonik tasarım ve Hukuk kuralları her zaman kazanır.

## Güncelleme

1. Kaynak repodaki son commit'i çekin ve bu klasördeki dört dosyayla karşılaştırın.
2. Değişen kuralları yukarıdaki çakışma tablosuna göre gözden geçirin.
3. Dosyaları birebir değiştirin, bu notun başındaki commit ve tarihi güncelleyin.
