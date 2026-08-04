# Voltage Enerji — voltage.com.tr

Voltan Elektrik Toptan Satış A.Ş. kurumsal web sitesi.

## Yapı

- `index.html` — tek dosyalık statik site (TR/EN, canlı EPİAŞ PTF verisi, sözleşme modelleri tablosu)
- `_headers` — Cloudflare Pages için güvenlik ve cache başlıkları
- `_redirects` — Cloudflare Pages yönlendirme kuralları
- `robots.txt` — arama motorları için
- `DEPLOY.md` — adım adım deploy rehberi

## Canlı PTF

Site, `https://epias-proxy.emirhantan-ku.workers.dev/ptf/today` adresinden EPİAŞ Şeffaflık PTF verisini çeker. Proxy ayrı bir Cloudflare Worker olarak çalışır (repo: `epias-proxy`).

## Deploy

`DEPLOY.md` dosyasını takip et. Özet:

1. GitHub'a push
2. Cloudflare Pages'te repo'yu bağla
3. `voltage.com.tr` custom domain'i ekle

## Lokal önizleme

```bash
# Python varsa
python3 -m http.server 5173

# Node varsa
npx serve -p 5173
```

Sonra tarayıcıda `http://localhost:5173`.
