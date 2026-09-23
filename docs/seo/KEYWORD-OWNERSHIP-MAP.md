# Keyword Ownership Map

Kural: bir birincil niyet → bir birincil URL. İkincil URL'ler birincile bağlantı verir, onun yerine sıralamaya çalışmaz.

| Keyword Cluster | Primary URL | Secondary URL(s) | Intent | Risk | Action |
|---|---|---|---|---|---|
| elektrik faturası hesaplama, 1 kWh kaç TL, elektrik birim fiyatı, kWh → TL | /elektrik-faturasi-hesaplama | /rehber/elektrik-faturasi-neden-yuksek | Araç / bilgi | Düşük | Programatik "100/200/…/5000 kWh kaç TL" sayfaları açılmadı (§15'e bakın). Araç tüm seviyeleri tek tabloda veriyor. |
| elektrik faturası neden yüksek, faturam neden arttı, fatura itiraz | /rehber/elektrik-faturasi-neden-yuksek | /elektrik-faturasi-hesaplama | Sorun çözme | Düşük | İç bağlantı 2'den 3'e çıktı (sktt'den eklendi). |
| elektrik faturası kalemleri | /elektrik-faturasi-hesaplama (#kalemler) | /rehber/elektrik-faturasi-neden-yuksek | Bilgi | Düşük | Değişiklik yok. |
| elektrik faturası (çıplak), fatura sorgulama, ödeme | — | — | Navigasyonel (dağıtım / görevli şirket) | — | Hedeflenmez. |
| elektrik tedarikçisi, sanayi / işletme tedarikçisi | / (ana sayfa) | /kurumsal, sektör rehberleri | Ticari | Düşük | Ana sayfa kanonik tasarım; değişiklik yok. |
| elektrik tedarikçi(si) değiştirme, nasıl değiştirilir, elektrik şirketi / sağlayıcı değiştirme, epdk tedarikçi değiştirme | /rehber/tedarikci-degistirme | /rehber/serbest-tuketici | Ticari süreç | Düşük | Eş anlamlılar aynı sayfada toplandı; ayrı sayfa açılmadı. |
| serbest tüketici, serbest tüketici limiti, 2026 limiti, nasıl olunur | /rehber/serbest-tuketici | /elektrik-faturasi-hesaplama (#statu), /rehber/sktt | Bilgi → ticari | Orta: sktt sayfası 500 kWh'ten söz ediyor | Phase 1'de serbest-tuketici'deki "SKTT nedir" başlığı yeniden adlandırılmıştı. sktt sayfası 500 kWh'i yalnızca karşılaştırma için anıyor ve serbest-tuketici'ye bağlanıyor. |
| SKTT, SKTT nedir, SKTT limiti, SKTT 2026, son kaynak tedarik tarifesi, SKTT'den çıkış | /rehber/sktt | /rehber/serbest-tuketici, /rehber/tedarikci-degistirme | Bilgi → ticari | Düşük | tedarikci-degistirme'den SKTT köprüsü eklendi. |
| SKTT hesaplama | /rehber/sktt | /elektrik-faturasi-hesaplama (#statu) | Araç | Düşük | Araç durum kontrolü yapar, SKTT fiyatı hesaplamaz. Birincil sayfa rehberdir. |
| ptf (çıplak) | /canli-ptf | /rehber/ptf-nedir | Karışık (veri ağırlıklı) | **Orta:** iki sayfa da gösterim alıyor | Ayrıştırıldı: canli-ptf "günlük veri", ptf-nedir "tanım + SMF". Karşılıklı bağlantılar ve ptf-nedir'de "bugünün PTF'si" yönlendirmesi eklendi. Güncel sorgu×sayfa verisiyle yeniden kontrol edilmeli. |
| ptf fiyatı, günlük ptf fiyatları, saatlik elektrik fiyatları, gün öncesi piyasası elektrik fiyatları, ptf şeffaflık | /canli-ptf | /rehber/ptf-nedir | Veri | Düşük | Başlık, SSR özeti, Şeffaflık bölümü. |
| ptf nedir, piyasa takas fiyatı, ptf nasıl oluşur | /rehber/ptf-nedir | /canli-ptf | Tanım | Orta: canli-ptf'de "PTF nedir, bu rakam ne anlama gelir?" H2'si var | canli-ptf'deki bölüm kısa ve ptf-nedir'e bağlanıyor. Veri sayfasının bağlamı için korundu. |
| ptf smf, ptf smf farkı | /rehber/ptf-nedir | — | Tanım | Düşük | Karşılaştırma tablosu eklendi. Ayrı sayfa Phase 3 adayı: gösterim artarsa açılır. |
| ptf endeksli elektrik | /rehber/ptf-nedir (#ptf-endeksli) | /canli-ptf | Ticari bilgi | Düşük | Çapa bağlantısı canli-ptf'den eklendi. |
| voltan elektrik, voltage enerji, voltage elektrik, voltan | / | /kurumsal | Marka | Düşük | Koru. |
