// Yerel workerd ölçümü (wrangler dev, yerel KV, --test-scheduled). Ağa çıkmaz: EPİAŞ yerine bu süreçteki
// sahte HTTP sunucusu (127.0.0.1) kullanılır. Çıktı (yapılandırma, KV kalıcılığı, sonuç) --calisma dizinine
// yazılır; depo içine HİÇBİR ŞEY yazılmaz.
//
// Çalıştırma:
//   node docs/epias-proxy/piyasa-modulu/olcum/workerd-olc.mjs --wrangler <wrangler yolu> --calisma <boş dizin>
//
// Ölçülenler:
//   1. Mevcut uçlar: kancasız host / kancalı + PIYASA_ETKIN yok / kancalı + açık → durum, başlıklar, gövde özeti aynı mı
//   2. /piyasa/* kapalıyken 404; kapalıyken zamanlanmış tur EPİAŞ'a gitmiyor
//   3. Soğuk KV: 100 eşzamanlı karışık ziyaretçi isteği → EPİAŞ giriş/rapor sayısı
//   4. Zamanlanmış turlarla doldurma (gece penceresi 0–24'e açılır) → tur sayısı, rapor sayısı
//   5. Sıcak KV: 100 eşzamanlı → EPİAŞ istek sayısı; wrangler yeniden başlatılınca (yeni süreç) yine
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sahteGun, gunEkle, ANAHTAR_1, SAHTE_ENV } from '../test-verisi.mjs';

const arg = (ad) => { const i = process.argv.indexOf(ad); return i > 0 ? process.argv[i + 1] : null; };
const WRANGLER = arg('--wrangler') || process.env.WRANGLER;
const CALISMA = arg('--calisma');
const GECIKME_MS = +(arg('--gecikme') || 150);
// Zamanlanmış turlar arası (ms). Gerçekte 10 dk; burada dakikalık bütçeye (10 rapor) sığacak kadar sıkıştırılır:
// tur başına en çok 2 rapor (dün+bugün + bir bakım dilimi) → 13 sn aralık ≈ dakikada 9 rapor.
const TUR_ARALIGI_MS = +(arg('--tur-araligi') || 13000);
if (!WRANGLER || !CALISMA) { console.error('kullanım: --wrangler <yol> --calisma <dizin>'); process.exit(2); }
const BURASI = path.dirname(fileURLToPath(import.meta.url));
const DEPO_KOKU = path.resolve(BURASI, '../../../..');
if (path.resolve(CALISMA).startsWith(DEPO_KOKU + path.sep)) { console.error('--calisma depo dışında olmalı'); process.exit(2); }
mkdirSync(CALISMA, { recursive: true });

// ------------------------------------------------------------------ sahte EPİAŞ
const sayac = { giris: 0, rapor: 0, eszamanliEnCok: 0 };
let aktif = 0;
const sunucu = http.createServer((req, res) => {
  let govde = '';
  req.on('data', (p) => { govde += p; });
  req.on('end', async () => {
    if (req.method === 'POST' && req.url === '/cas/v1/tickets') {
      sayac.giris++;
      res.writeHead(201, { 'Content-Type': 'text/plain' });
      return res.end(`TGT-${100000 + sayac.giris}-yerelSahteBilet-cas`);
    }
    if (req.method === 'POST' && req.url === '/reporting-service/v1/data/ptf-smf-sdf') {
      sayac.rapor++; aktif++; sayac.eszamanliEnCok = Math.max(sayac.eszamanliEnCok, aktif);
      await new Promise((r) => setTimeout(r, GECIKME_MS));
      aktif--;
      if (!/^TGT-/.test(req.headers.tgt || '')) { res.writeHead(401); return res.end(); }
      let g;
      try { g = JSON.parse(govde); } catch (e) { res.writeHead(400); return res.end(); }
      const bas = g.startDate.slice(0, 10), bit = g.endDate.slice(0, 10);
      let items = [];
      for (let d = bas; d <= bit; d = gunEkle(d, 1)) items = items.concat(sahteGun(d));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ items, page: null }));
    }
    res.writeHead(404); res.end();
  });
});
await new Promise((r) => sunucu.listen(0, '127.0.0.1', r));
const SAHTE_URL = `http://127.0.0.1:${sunucu.address().port}`;
const sayacSifirla = () => { sayac.giris = 0; sayac.rapor = 0; sayac.eszamanliEnCok = 0; };

// ------------------------------------------------------------------ wrangler
const SABIT_AN = '2026-11-24T11:30:00Z';
const ortak = { ORNEK_SABIT_AN: SABIT_AN };
const acik = {
  ...ortak, ...SAHTE_ENV, PIYASA_ETKIN: '1', PIYASA_OKUMA_ANAHTARI: ANAHTAR_1, SAHTE_EPIAS_URL: SAHTE_URL,
  PIYASA_GECE: '0-24', PIYASA_CRON_ASGARI_SN: '0',
};
const tomlYaz = (ad, giris, vars) => {
  const dizin = path.join(CALISMA, ad);
  mkdirSync(dizin, { recursive: true });
  const satirlar = [
    `name = "piyasa-olcum-${ad}"`, `main = ${JSON.stringify(path.join(BURASI, giris))}`, 'compatibility_date = "2026-11-01"',
    '[[kv_namespaces]]', 'binding = "PIYASA_KV"', 'id = "yerel-piyasa-kv"', '[triggers]', 'crons = ["*/10 * * * *"]', '[vars]',
    ...Object.entries(vars).map(([k, v]) => `${k} = ${JSON.stringify(v)}`),
  ];
  writeFileSync(path.join(dizin, 'wrangler.toml'), satirlar.join('\n') + '\n');
  return dizin;
};
async function baslat(ad, giris, vars, port) {
  const dizin = tomlYaz(ad, giris, vars);
  const log = [];
  const p = spawn(WRANGLER, ['dev', '--config', path.join(dizin, 'wrangler.toml'), '--port', String(port), '--ip', '127.0.0.1', '--inspector-port', String(port + 1000),
    '--persist-to', path.join(dizin, 'kalici'), '--test-scheduled', '--show-interactive-dev-session=false', '--log-level', 'warn'],
  { cwd: dizin, env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1', NO_COLOR: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  p.stdout.on('data', (d) => log.push(String(d))); p.stderr.on('data', (d) => log.push(String(d)));
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 120; i++) {
    try { const r = await fetch(url + '/health'); if (r.status === 200) return { p, url, log, dizin }; } catch (e) { /* bekle */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  p.kill('SIGTERM');
  throw new Error(`${ad} başlamadı:\n${log.join('').slice(-2000)}`);
}
const durdur = async (w) => { w.p.kill('SIGTERM'); await new Promise((r) => { w.p.on('exit', r); setTimeout(r, 5000); }); };

const sonuc = { tarih: new Date().toISOString(), wrangler: null, sahteGecikmeMs: GECIKME_MS, turAraligiMs: TUR_ARALIGI_MS };
const ver = spawn(WRANGLER, ['--version']); let vm = ''; ver.stdout.on('data', (d) => { vm += d; }); await new Promise((r) => ver.on('exit', r));
sonuc.wrangler = vm.trim().split('\n').pop();

const yalin = await baslat('yalin', 'yalin.js', ortak, 8911);
const kapali = await baslat('kapali', 'kancali.js', { ...ortak, SAHTE_EPIAS_URL: SAHTE_URL }, 8912);
let acikW = await baslat('acik', 'kancali.js', acik, 8913);
try {
  // ---------------------------------------------------------------- 1. mevcut uçlar
  const istekler = [
    ['GET', '/health', {}], ['GET', '/ptf/today', { Origin: 'https://voltage.com.tr' }], ['GET', '/ptf/today', { Origin: 'https://kotu.ornek' }], ['GET', '/ptf/today', {}],
    ['GET', '/ptf/stats', { Origin: 'https://voltage.com.tr' }], ['GET', '/ptf/range?from=2026-11-01&to=2026-11-03', {}], ['GET', '/ptf/range?from=x', {}],
    ['GET', '/yok', {}], ['GET', '/piyasax', {}], ['GET', '/ptf/today?piyasa=1', {}],
    ['OPTIONS', '/ptf/today', { Origin: 'https://voltage.com.tr', 'Access-Control-Request-Method': 'GET' }], ['POST', '/ptf/today', {}, 'govde'], ['HEAD', '/health', {}],
    ['GET', '/ptf/stats', { Authorization: 'Bearer ' + ANAHTAR_1 }],
  ];
  const ozet = async (url, [m, y, h, b]) => {
    const r = await fetch(url + y, { method: m, headers: h, body: b, redirect: 'manual' });
    const govde = Buffer.from(await r.arrayBuffer());
    const basliklar = [...r.headers].filter(([k]) => k !== 'date').sort().map((x) => x.join(': '));
    return { durum: r.status, basliklar, govdeSha: createHash('sha256').update(govde).digest('hex').slice(0, 16), govdeBayt: govde.length };
  };
  sonuc.mevcutUclar = [];
  for (const ist of istekler) {
    const [a, b, c] = [await ozet(yalin.url, ist), await ozet(kapali.url, ist), await ozet(acikW.url, ist)];
    const ayni = JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) === JSON.stringify(c);
    sonuc.mevcutUclar.push({ istek: `${ist[0]} ${ist[1]}`, durum: a.durum, govdeSha: a.govdeSha, govdeBayt: a.govdeBayt, baslikSayisi: a.basliklar.length, ucuAyni: ayni });
  }
  sonuc.dateDisiBasliklarKarsilastirildi = true;
  // ---------------------------------------------------------------- 2. kapalı
  sayacSifirla();
  const k1 = await fetch(kapali.url + '/piyasa/v1/dengesizlik?tarih=2026-11-23', { headers: { Authorization: 'Bearer ' + ANAHTAR_1 } });
  const k2 = await fetch(kapali.url + '/piyasa/v1/durum', { method: 'OPTIONS' });
  await fetch(kapali.url + '/__scheduled?cron=' + encodeURIComponent('*/10 * * * *'));
  await new Promise((r) => setTimeout(r, 1000));
  sonuc.kapali = { piyasaDurum: k1.status, optionsDurum: k2.status, zamanliSonrasiEpiasGiris: sayac.giris, zamanliSonrasiEpiasRapor: sayac.rapor };

  // ---------------------------------------------------------------- yük yardımcıları
  const istIso = (ms) => new Date(ms + 3 * 3600e3).toISOString().slice(0, 10);
  const BUGUN = istIso(Date.now()), DUN = gunEkle(BUGUN, -1);
  const gunler = []; for (let g = '2026-01-01'; g <= BUGUN; g = gunEkle(g, 1)) gunler.push(g);
  const karisik = (i) => {
    if (i % 7 === 0) return `tarih=${BUGUN}`;
    if (i % 7 === 1) return `tarih=${DUN}`;
    const g = gunler[(i * 37) % (gunler.length - 2)];
    if (i % 5 === 0) { const b = gunEkle(g, -10) < '2026-01-01' ? '2026-01-01' : gunEkle(g, -10); return `bas=${b}&bit=${g}`; }
    return `tarih=${g}`;
  };
  const yuk = async (url, n) => {
    const t0 = Date.now();
    const r = await Promise.all(Array.from({ length: n }, (_, i) => fetch(`${url}/piyasa/v1/dengesizlik?${karisik(i)}`, { headers: { Authorization: 'Bearer ' + ANAHTAR_1 } })
      .then(async (x) => { const j = await x.json().catch(() => null); return { s: x.status, kod: j && j.hata ? j.hata.kod : null, bayat: j && j.gunler ? j.gunler.some((g) => g.bayat) : null, ra: x.headers.get('retry-after') }; })));
    const say = {};
    for (const x of r) { const k = x.s === 200 ? '200' : `${x.s} ${x.kod}`; say[k] = (say[k] || 0) + 1; }
    return { sureMs: Date.now() - t0, yanitlar: say, bayatYanit: r.filter((x) => x.bayat).length, retryAfterEksik: r.filter((x) => x.s === 503 && !x.ra).length, epiasGiris: sayac.giris, epiasRapor: sayac.rapor, epiasEszamanliEnCok: sayac.eszamanliEnCok };
  };
  const durumAl = async (url) => (await fetch(url + '/piyasa/v1/durum', { headers: { Authorization: 'Bearer ' + ANAHTAR_1 } })).json();

  // ---------------------------------------------------------------- 3. soğuk
  sayacSifirla();
  sonuc.sogukYuk = await yuk(acikW.url, 100);
  // ---------------------------------------------------------------- 4. zamanlanmış doldurma
  sayacSifirla();
  let tur = 0, enCokAltIstek = 0, d = await durumAl(acikW.url), tamamlanmayan = 0;
  const bakimlar = {};
  while (tur < 120) {
    const onceki = d.zamanli.son;
    await new Promise((x) => setTimeout(x, TUR_ARALIGI_MS));
    const r = await fetch(acikW.url + '/__scheduled?cron=' + encodeURIComponent('*/10 * * * *'));
    await r.text();
    tur++;
    let bitti = false;
    for (let i = 0; i < 100 && !bitti; i++) { d = await durumAl(acikW.url); bitti = d.zamanli.son !== onceki; if (!bitti) await new Promise((x) => setTimeout(x, 100)); }
    if (!bitti) tamamlanmayan++;
    enCokAltIstek = Math.max(enCokAltIstek, d.zamanli.altIstek || 0);
    const b = d.zamanli.bakim || '-'; bakimlar[b] = (bakimlar[b] || 0) + 1;
    const sn = d.zamanli.sonuc || '-'; bakimlar['son2:' + sn] = (bakimlar['son2:' + sn] || 0) + 1;
    if (d.kv.eksikGun === 0 && d.kv.gunSayisi >= gunler.length) break;
  }
  sonuc.doldurma = { tur, tamamlanmayanTur: tamamlanmayan, epiasGiris: sayac.giris, epiasRapor: sayac.rapor, enCokAltIstekTur: enCokAltIstek, bakimTurleri: bakimlar, kvGun: d.kv.gunSayisi, eksikGun: d.kv.eksikGun, sonuc: d.zamanli.sonuc, kvYazmaSurec: d.surec.sayac.kvYazma, dilimGun: d.kv.dilimGun };
  // ---------------------------------------------------------------- 5. sıcak (aynı süreç, sonra yeni süreç)
  sayacSifirla();
  sonuc.sicakYuk = await yuk(acikW.url, 100);
  await durdur(acikW);
  acikW = await baslat('acik', 'kancali.js', acik, 8913);
  sayacSifirla();
  sonuc.yenidenBaslatildiSicakKv = await yuk(acikW.url, 100);
  const ds = await durumAl(acikW.url);
  sonuc.yenidenBaslatildiSurecSayac = { kvOkuma: ds.surec.sayac.kvOkuma, kvYazma: ds.surec.sayac.kvYazma, ustAkis: ds.surec.sayac.ustAkis, giris: ds.surec.sayac.giris };
  // aynı yeni süreçte ikinci dalga (bellek sıcak)
  sayacSifirla();
  sonuc.yenidenBaslatildiIkinciDalga = await yuk(acikW.url, 100);
} finally {
  await durdur(yalin); await durdur(kapali); await durdur(acikW);
  sunucu.close();
}
writeFileSync(path.join(CALISMA, 'sonuc.json'), JSON.stringify(sonuc, null, 2));
console.log(JSON.stringify(sonuc, null, 2));
