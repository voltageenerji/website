#!/usr/bin/env bash
# Mevcut QA paketlerini üretilen sayfalarla koşar. Depoya dokunmaz: HEAD'in temiz bir kopyası geçici dizine açılır,
# cikti/ altındaki bütün sayfalar (29) canlı dosyaların yerine konur, testler o kopyada koşulur.
# Çıktı: sonuclar/test-sonucu.txt (TABAN=1 ile canlı sayfalarla taban koşusu: sonuclar/test-sonucu-taban.txt)
#   KOPYA=<geçici dizin>  AXE_MODUL=<axe-core içeren node_modules>  [TARAYICILAR="chromium firefox webkit"]  [TABAN=1]
# 404 için: docs/qa/smoke.mjs (oyun akışı) ve smoke2.mjs (hareket azaltma yedeği, mobil dokunuş, sekme gizlenince duraklama)
# kopyada koşulur (sunucu kökü kopyaya çevrilir; test dosyaları değiştirilmez) ve çıktıları beklenen değerlerle denetlenir.
set -u
BURASI="$(cd "$(dirname "$0")" && pwd)"
KOK=/home/user/website
KOPYA="${KOPYA:?KOPYA=<geçici dizin> verin (depo dışında)}"
case "$KOPYA" in "$KOK"*) echo "KOPYA depo içinde olamaz"; exit 2;; esac
if [ "${TABAN:-}" = 1 ]; then SONUC="$BURASI/sonuclar/test-sonucu-taban.txt"; else SONUC="$BURASI/sonuclar/test-sonucu.txt"; fi
rm -rf "$KOPYA" && mkdir -p "$KOPYA"
git -C "$KOK" archive HEAD | tar -x -C "$KOPYA"
SAYFALAR=$(cd "$BURASI/cikti" && find . -name '*.html' | sed 's|^\./||' | sort)
if [ "${TABAN:-}" != 1 ]; then
  # Bu klasör henüz işlenmemiş olabilir: güncel çıktılar kopyaya ayrıca alınır
  for s in $SAYFALAR; do cp "$BURASI/cikti/$s" "$KOPYA/$s"; done
fi
ln -sfn /opt/node-tools/node_modules "$KOPYA/node_modules"
cd "$KOPYA"
# 404 duman testleri: aynı dosya, yalnız sunucunun kök dizini kopyadır
for t in smoke smoke2; do sed "s|cwd: '/home/user/website'|cwd: '$KOPYA'|" "docs/qa/$t.mjs" > "docs/qa/$t-kopya.mjs"; done
{
  echo "# Alt sayfalar (1. + 2. aşama) — mevcut QA paketleri, $([ "${TABAN:-}" = 1 ] && echo 'TABAN: canlı sayfalarla' || echo 'üretilen sayfalar yerine konmuş kopyada')"
  echo "# tarih: $(date -u +%Y-%m-%dT%H:%MZ) · depo HEAD: $(git -C "$KOK" rev-parse --short HEAD) · node $(node -v)"
  echo "# sayfa sayısı: $(echo "$SAYFALAR" | wc -l) · dosya özetleri (sha256, ilk 12):"
  for s in $SAYFALAR; do echo "#   $s $(sha256sum "$s" | cut -c1-12)"; done
  kos() { echo; echo "## $*"; "$@" > "$KOPYA/.test.log" 2>&1; k=$?; grep -E "FAIL|passed|failed|Error|not\b" "$KOPYA/.test.log" | grep -v "^  ok" | tail -40; echo "çıkış kodu: $k"; }
  kos node docs/qa/test-ssr-ptf.mjs
  kos node docs/qa/test-dengesizlik.mjs
  kos node docs/qa/test-dengesizlik-ssr-kanit.mjs
  for t in ${TARAYICILAR:-chromium}; do
    kos env TARAYICI="$t" node docs/qa/test-dengesizlik-tarayici.mjs
    kos env TARAYICI="$t" AXE_MODUL="${AXE_MODUL:?}" node docs/qa/test-dengesizlik-erisilebilirlik.mjs
  done
  kos node docs/qa/test-ssr-hydration.mjs
  echo; echo "## python3 -I docs/qa/test-guard.py (koruma kancası; sayfa değişikliğinden bağımsız, yayın günü cp ile index.html yerleştirme 'ask' ister)"
  python3 -I docs/qa/test-guard.py > "$KOPYA/.test.log" 2>&1; k=$?; tail -3 "$KOPYA/.test.log"; echo "çıkış kodu: $k"
  # smoke*.mjs denetim yapmaz, durum yazar: beklenen satırlar burada aranır
  bekle() { if grep -qF -- "$1" "$KOPYA/.test.log"; then echo "  GEÇTİ  $2"; else echo "  KALDI  $2 (beklenen: $1)"; KALAN=$((KALAN+1)); fi; }
  echo; echo "## node docs/qa/smoke.mjs (404 oyun akışı: açılış → oyun → duraklat → çarpışma → skor → tekrar)"
  KALAN=0; node docs/qa/smoke-kopya.mjs > "$KOPYA/.test.log" 2>&1; echo "çıkış kodu: $?"
  sed -n '1,12p' "$KOPYA/.test.log" | cut -c1-220 | sed 's/^/    /'
  bekle 'BOOT: {"gOn":true,"fallbackVisible":false,"hasGame":true,"webgl":true}' 'oyun açıldı, yedek gizli'
  bekle 'PAUSE overlay worked: true' 'Esc ile duraklatma paneli'
  bekle 'DIED: true' 'çarpışma ve oyun sonu'
  bekle 'OVER panel: true' 'skor paneli'
  bekle 'RESTART: {"state":' 'tekrar oyna'
  # Statik sunucuda /api/score (lider tablosu Pages Function'ı) yok: oyun sonu panelinin GET isteği 404 alır. Taban koşusunda
  # (canlı 404.html) da aynı tek satır çıkar; başka her konsol hatası KALDI sayılır.
  if grep -qxF 'CONSOLE ERRORS: none' "$KOPYA/.test.log" || grep -qxF 'CONSOLE ERRORS: Failed to load resource: the server responded with a status of 404 (File not found)' "$KOPYA/.test.log"; then
    echo "  GEÇTİ  konsol hatası yok (bilinen tek ortam satırı hariç: statik sunucuda /api/score 404)"; else echo "  KALDI  konsol hatası"; KALAN=$((KALAN+1)); fi
  echo "smoke kalan: $KALAN"
  echo; echo "## node docs/qa/smoke2.mjs (404: hareket azaltmada yedek, mobil dokunuşla oyun, sekme gizlenince duraklama)"
  KALAN=0; node docs/qa/smoke2-kopya.mjs > "$KOPYA/.test.log" 2>&1; echo "çıkış kodu: $?"
  sed -n '1,8p' "$KOPYA/.test.log" | cut -c1-260 | sed 's/^/    /'
  bekle 'REDUCED-MOTION: {"gOn":false,"fallback":true,' 'hareket azaltmada oyun açılmaz, yedek görünür'
  bekle '"links":["/","/rehber","/canli-ptf","/?kaynak=404#leadForm"' 'yedekteki dört bağlantı aynı sırada'
  bekle 'MOBILE boot: {"gOn":true' 'mobilde oyun açıldı'
  bekle 'AUTO-PAUSE on hidden: true' 'sekme gizlenince duraklama'
  bekle 'MOBILE errors: none' 'mobilde hata yok'
  echo "smoke2 kalan: $KALAN"
} | tee "$SONUC"
rm -f "$KOPYA/.test.log" docs/qa/smoke-kopya.mjs docs/qa/smoke2-kopya.mjs "$KOPYA"/shot-*.png
