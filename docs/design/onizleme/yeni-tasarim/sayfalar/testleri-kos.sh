#!/usr/bin/env bash
# Mevcut QA paketlerini üretilen sayfalarla koşar. Depoya dokunmaz: HEAD'in temiz bir kopyası geçici dizine açılır,
# cikti/ altındaki dört sayfa canlı dosyaların yerine konur, testler o kopyada koşulur. Çıktı: sonuclar/test-sonucu.txt
#   KOPYA=<geçici dizin>  AXE_MODUL=<axe-core içeren node_modules>  [TARAYICILAR="chromium firefox webkit"]
set -u
BURASI="$(cd "$(dirname "$0")" && pwd)"
KOK=/home/user/website
KOPYA="${KOPYA:?KOPYA=<geçici dizin> verin (depo dışında)}"
case "$KOPYA" in "$KOK"*) echo "KOPYA depo içinde olamaz"; exit 2;; esac
SONUC="$BURASI/sonuclar/test-sonucu.txt"
rm -rf "$KOPYA" && mkdir -p "$KOPYA"
git -C "$KOK" archive HEAD | tar -x -C "$KOPYA"
# Bu klasör henüz işlenmemiş olabilir: güncel üretici ve çıktılar kopyaya ayrıca alınır
for s in rehber/tekstil-elektrik.html canli-ptf.html kurumsal.html dengesizlik-maliyeti.html; do
  cp "$BURASI/cikti/$s" "$KOPYA/$s"
done
ln -sfn /opt/node-tools/node_modules "$KOPYA/node_modules"
cd "$KOPYA"
{
  echo "# Alt sayfa 1. aşama — mevcut QA paketleri, üretilen sayfalar yerine konmuş kopyada"
  echo "# tarih: $(date -u +%Y-%m-%dT%H:%MZ) · depo HEAD: $(git -C "$KOK" rev-parse --short HEAD) · node $(node -v)"
  echo "# dosya özetleri (sha256, ilk 12):"
  for s in rehber/tekstil-elektrik.html canli-ptf.html kurumsal.html dengesizlik-maliyeti.html; do
    echo "#   $s $(sha256sum "$s" | cut -c1-12)"
  done
  kos() { echo; echo "## $*"; "$@" > "$KOPYA/.test.log" 2>&1; k=$?; grep -E "FAIL|passed|failed|Error|not\b" "$KOPYA/.test.log" | grep -v "^  ok" | tail -40; echo "çıkış kodu: $k"; }
  kos node docs/qa/test-ssr-ptf.mjs
  kos node docs/qa/test-dengesizlik.mjs
  kos node docs/qa/test-dengesizlik-ssr-kanit.mjs
  for t in ${TARAYICILAR:-chromium}; do
    kos env TARAYICI="$t" node docs/qa/test-dengesizlik-tarayici.mjs
    kos env TARAYICI="$t" AXE_MODUL="${AXE_MODUL:?}" node docs/qa/test-dengesizlik-erisilebilirlik.mjs
  done
  kos node docs/qa/test-ssr-hydration.mjs
} | tee "$SONUC"
rm -f "$KOPYA/.test.log"
