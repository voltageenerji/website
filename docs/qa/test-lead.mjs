/**
 * /api/lead teklif formu testleri (sahte KV, ağ yok).
 *   node docs/qa/test-lead.mjs
 * Kapsam: JSON ve multipart gövde, fatura sayı/boyut/imza denetimi, uzantıdan tür,
 * 180 gün fatura TTL'i, IP sayacı (saatte 5, dosyalı 2; kapalı çöker), kayıt
 * hatasında sahipsiz eklerin silinmesi, kWh ayrıştırma (QA B2), Voltan OS anahtar biçimi,
 * `kaynak` (gelinen sayfa) izin listesi ve uzunluk sınırları, bildirim e-postasındaki satırı.
 */
import { onRequestPost } from '../../functions/api/lead.js';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) pass++; else { fail++; console.log(`FAIL ${n} ${extra}`); } };

function sahteKv({ getHata = false, leadPutHata = false } = {}) {
  const m = new Map();
  return {
    m,
    async get(k) { if (getHata) throw new Error('kv down'); const v = m.get(k); return v ? v.value : null; },
    async put(k, value, opts) { if (leadPutHata && k.startsWith('lead:')) throw new Error('put fail'); m.set(k, { value, opts }); },
    async delete(k) { m.delete(k); },
  };
}

let ipSayac = 0;
const yeniIp = () => `198.51.100.${++ipSayac}`;
const alanlar = (over = {}) => ({
  ad: 'QA', soyad: 'Test', sirket: 'QA Test A.Ş.', telefon: '0000000000', eposta: 'qa@example.invalid',
  tuketim: '25000-50000', sektor: 'diger', tarife: 'og-sanayi', tuketim_kwh: '42.500 kWh',
  odeme_tercihi: 'ikisi', mesaj: '', kvkk: true, website: '', lang: 'tr', utm: {}, ...over,
});
const PDF = new TextEncoder().encode('%PDF-1.4\n%QA\n%%EOF\n');
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = new TextEncoder().encode('RIFF\x10\x00\x00\x00WEBPVP8 ');
const HEIC = new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
const HTML = new TextEncoder().encode('<script>alert(1)</script>');

async function jsonGonder(body, { kv = sahteKv(), ip = yeniIp(), env } = {}) {
  const request = new Request('http://localhost/api/lead', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body),
  });
  const r = await onRequestPost({ request, env: env || { LEADS: kv } });
  return { status: r.status, j: await r.json(), kv };
}
async function mpGonder(body, dosyalar, { kv = sahteKv(), ip = yeniIp(), env } = {}) {
  const fd = new FormData();
  fd.append('payload', JSON.stringify(body));
  for (const d of dosyalar) fd.append('fatura', new File([d.bayt], d.ad, d.tur === undefined ? {} : { type: d.tur }));
  const request = new Request('http://localhost/api/lead', { method: 'POST', headers: { 'CF-Connecting-IP': ip }, body: fd });
  const r = await onRequestPost({ request, env: env || { LEADS: kv } });
  return { status: r.status, j: await r.json(), kv };
}
const leadKaydi = (kv) => { for (const [k, v] of kv.m) if (k.startsWith('lead:')) return { k, lead: JSON.parse(v.value) }; return null; };
const faturaAnahtarlari = (kv) => [...kv.m.keys()].filter((k) => k.startsWith('fatura:'));

// ---------------------------------------------------------------------------
// JSON yolu (dosyasız)
// ---------------------------------------------------------------------------
{
  const r = await jsonGonder(alanlar());
  ok('JSON dosyasız → 200', r.status === 200, `-> ${r.status} ${r.j.error}`);
  const l = leadKaydi(r.kv);
  ok('lead anahtarı lead:<ts>:<8hex>', l && /^lead:\d+:[0-9a-f]{8}$/.test(l.k), l && l.k);
  ok('lead kaydında TTL yok', l && !(r.kv.m.get(l.k).opts && r.kv.m.get(l.k).opts.expirationTtl));
  ok('faturalar boş dizi', l && Array.isArray(l.lead.faturalar) && l.lead.faturalar.length === 0);
}
{
  const r = await jsonGonder(alanlar({ faturalar: [{ ad: 'a.pdf', tur: 'application/pdf', veri: Buffer.from(PDF).toString('base64') }] }));
  ok('eski base64 faturalar alanı yok sayılır', r.status === 200 && faturaAnahtarlari(r.kv).length === 0);
}
{
  const r = await jsonGonder(alanlar({ mesaj: 'x'.repeat(70 * 1024) }));
  ok('JSON gövde > 64 KB → 413', r.status === 413, `-> ${r.status}`);
}
ok('kvkk false → 400', (await jsonGonder(alanlar({ kvkk: false }))).j.error === 'kvkk_required');
ok('kvkk "on" → 400', (await jsonGonder(alanlar({ kvkk: 'on' }))).j.error === 'kvkk_required');
ok('eksik ad → 400', (await jsonGonder(alanlar({ ad: '' }))).j.field === 'ad');

// ---------------------------------------------------------------------------
// kWh ayrıştırma (QA B2)
// ---------------------------------------------------------------------------
const KWH = [
  ['42.500', 42500], ['42,500', 42500], ['1,234,567', 1234567], ['1.234,56', 1235], ['42,500.75', 42501],
  ['42 500', 42500], ['42.500 kWh', 42500], ['42500', 42500], ['1.234.567', 1234567],
  ['abc', null], ['-500', null], ['0', null], ['', null],
];
for (const [girdi, beklenen] of KWH) {
  const r = await jsonGonder(alanlar({ tuketim_kwh: girdi }));
  const l = leadKaydi(r.kv);
  ok(`kWh "${girdi}" → ${beklenen}`, l && l.lead.tuketimKwh === beklenen, `-> ${l && l.lead.tuketimKwh}`);
}

// ---------------------------------------------------------------------------
// Multipart yolu
// ---------------------------------------------------------------------------
{
  const r = await mpGonder(alanlar(), [{ ad: 'fatura.pdf', tur: 'application/pdf', bayt: PDF }]);
  ok('multipart 1 PDF → 200', r.status === 200, `-> ${r.status} ${r.j.error}`);
  const l = leadKaydi(r.kv);
  const fk = faturaAnahtarlari(r.kv);
  ok('1 fatura anahtarı yazıldı', fk.length === 1);
  ok('fatura anahtarı Voltan OS regex', fk.every((k) => /^fatura:lead:\d+:[a-z0-9-]+:\d$/.test(k)), fk.join());
  ok('fatura anahtarı lead anahtarından türer', l && fk[0] === `fatura:${l.k}:0`);
  const v = r.kv.m.get(fk[0]);
  ok('fatura TTL 180 gün', v && v.opts.expirationTtl === 15552000, v && JSON.stringify(v.opts));
  ok('fatura metadata {ad,tur,boyut}', v && JSON.stringify(Object.keys(v.opts.metadata)) === '["ad","tur","boyut"]' && v.opts.metadata.tur === 'application/pdf' && v.opts.metadata.boyut === PDF.length);
  ok('fatura baytları Uint8Array', v && v.value instanceof Uint8Array && v.value.length === PDF.length);
  ok('lead.faturalar biçimi', l && l.lead.faturalar.length === 1 && l.lead.faturalar[0].anahtar === fk[0] && l.lead.faturalar[0].boyut === PDF.length);
  ok('kWh multipart payload içinden okunur', l && l.lead.tuketimKwh === 42500);
}
{
  const r = await mpGonder(alanlar(), [
    { ad: 'a.pdf', tur: 'application/pdf', bayt: PDF }, { ad: 'b.jpg', tur: 'image/jpeg', bayt: JPG }, { ad: 'c.png', tur: 'image/png', bayt: PNG },
  ]);
  ok('multipart 3 dosya → 200', r.status === 200 && faturaAnahtarlari(r.kv).length === 3, `-> ${r.status} ${r.j.error}`);
}
{
  const r = await mpGonder(alanlar(), [{ ad: 'w.webp', tur: 'image/webp', bayt: WEBP }]);
  ok('WEBP imzası kabul', r.status === 200, `-> ${r.status} ${r.j.error}`);
}
{
  const r = await mpGonder(alanlar(), [{ ad: 'IMG_0001.HEIC', tur: undefined, bayt: HEIC }]);
  ok('türü boş .HEIC → uzantıdan image/heic', r.status === 200, `-> ${r.status} ${r.j.error}`);
  const fk = faturaAnahtarlari(r.kv);
  ok('HEIC metadata tur image/heic', fk.length === 1 && r.kv.m.get(fk[0]).opts.metadata.tur === 'image/heic');
}
{
  const r = await mpGonder(alanlar(), [{ ad: 'x.heif', tur: 'image/heif', bayt: HEIC }]);
  ok('image/heif → image/heic', r.status === 200 && r.kv.m.get(faturaAnahtarlari(r.kv)[0]).opts.metadata.tur === 'image/heic');
}
ok('4 dosya → too_many_files', (await mpGonder(alanlar(), [1, 2, 3, 4].map(() => ({ ad: 'a.pdf', tur: 'application/pdf', bayt: PDF })))).j.error === 'too_many_files');
{
  const buyuk = new Uint8Array(8 * 1024 * 1024 + 1); buyuk.set(PDF);
  const r = await mpGonder(alanlar(), [{ ad: 'b.pdf', tur: 'application/pdf', bayt: buyuk }]);
  ok('8 MB + 1 → file_too_large', r.status === 400 && r.j.error === 'file_too_large', `-> ${r.status} ${r.j.error}`);
  const tam = new Uint8Array(8 * 1024 * 1024); tam.set(PDF);
  ok('tam 8 MB → 200', (await mpGonder(alanlar(), [{ ad: 'b.pdf', tur: 'application/pdf', bayt: tam }])).status === 200);
}
ok('HTML baytları PDF diye → invalid_file', (await mpGonder(alanlar(), [{ ad: 'a.pdf', tur: 'application/pdf', bayt: HTML }])).j.error === 'invalid_file');
ok('PNG baytları JPEG diye → invalid_file', (await mpGonder(alanlar(), [{ ad: 'a.jpg', tur: 'image/jpeg', bayt: PNG }])).j.error === 'invalid_file');
ok('RIFF ama WEBP değil → invalid_file', (await mpGonder(alanlar(), [{ ad: 'a.webp', tur: 'image/webp', bayt: new TextEncoder().encode('RIFF\x10\x00\x00\x00WAVEfmt ') }])).j.error === 'invalid_file');
ok('text/html türü → invalid_file', (await mpGonder(alanlar(), [{ ad: 'a.html', tur: 'text/html', bayt: PDF }])).j.error === 'invalid_file');
ok('türü boş, uzantı .exe → invalid_file', (await mpGonder(alanlar(), [{ ad: 'a.exe', tur: undefined, bayt: PDF }])).j.error === 'invalid_file');
ok('boş dosya → invalid_file', (await mpGonder(alanlar(), [{ ad: 'a.pdf', tur: 'application/pdf', bayt: new Uint8Array(0) }])).j.error === 'invalid_file');
{
  const fd = new FormData(); fd.append('payload', JSON.stringify(alanlar())); fd.append('fatura', 'metin');
  const request = new Request('http://localhost/api/lead', { method: 'POST', headers: { 'CF-Connecting-IP': yeniIp() }, body: fd });
  const r = await onRequestPost({ request, env: { LEADS: sahteKv() } });
  ok('fatura alanı metin → invalid_file', (await r.json()).error === 'invalid_file');
}
{
  const fd = new FormData(); fd.append('payload', '{bozuk');
  const request = new Request('http://localhost/api/lead', { method: 'POST', headers: { 'CF-Connecting-IP': yeniIp() }, body: fd });
  ok('bozuk payload → 400', (await onRequestPost({ request, env: { LEADS: sahteKv() } })).status === 400);
}
ok('multipart kvkk false → 400', (await mpGonder(alanlar({ kvkk: false }), [{ ad: 'a.pdf', tur: 'application/pdf', bayt: PDF }])).j.error === 'kvkk_required');

// ---------------------------------------------------------------------------
// L3: talep kaydı yazılamazsa ekler silinir
// ---------------------------------------------------------------------------
{
  const kv = sahteKv({ leadPutHata: true });
  const r = await mpGonder(alanlar(), [{ ad: 'a.pdf', tur: 'application/pdf', bayt: PDF }, { ad: 'b.pdf', tur: 'application/pdf', bayt: PDF }], { kv });
  ok('kayıt hatası → 503 no_persistence', r.status === 503 && r.j.error === 'no_persistence', `-> ${r.status} ${r.j.error}`);
  ok('kayıt hatasında sahipsiz ek kalmaz', faturaAnahtarlari(kv).length === 0, faturaAnahtarlari(kv).join());
}

// ---------------------------------------------------------------------------
// M2: IP sayacı
// ---------------------------------------------------------------------------
{
  const kv = sahteKv(); const ip = '203.0.113.7';
  const durumlar = [];
  for (let i = 0; i < 6; i++) durumlar.push((await jsonGonder(alanlar(), { kv, ip })).status);
  ok('saatte 5 gönderim, 6. → 429', durumlar.join() === '200,200,200,200,200,429', durumlar.join());
  const rl = [...kv.m.keys()].filter((k) => k.startsWith('rl:lead:'));
  ok('tek sayaç anahtarı rl:lead:<özet>', rl.length === 1 && /^rl:lead:[0-9a-f]{32}$/.test(rl[0]), rl.join());
  ok('sayaç anahtarında ham IP yok', !rl[0].includes(ip) && !kv.m.get(rl[0]).value.includes(ip));
  const ttl = kv.m.get(rl[0]).opts.expirationTtl;
  ok('sayaç TTL 60..3600 sn', ttl >= 60 && ttl <= 3600, `-> ${ttl}`);
  ok('sayaç lead: önekiyle başlamaz (Voltan OS listesine girmez)', !rl[0].startsWith('lead:'));
  ok('başka IP etkilenmez', (await jsonGonder(alanlar(), { kv })).status === 200);
}
{
  const kv = sahteKv(); const ip = '203.0.113.8';
  const d = () => [{ ad: 'a.pdf', tur: 'application/pdf', bayt: PDF }];
  const s = [];
  for (let i = 0; i < 3; i++) s.push((await mpGonder(alanlar(), d(), { kv, ip })).status);
  ok('dosyalı en fazla 2, 3. → 429', s.join() === '200,200,429', s.join());
  ok('dosyalı sınır sonrası dosyasız hâlâ geçer', (await jsonGonder(alanlar(), { kv, ip })).status === 200);
}
{
  const kv = sahteKv(); const ip = '203.0.113.9';
  for (let i = 0; i < 5; i++) await jsonGonder(alanlar({ website: 'bot' }), { kv, ip });
  ok('honeypot denemeleri de sayılır', (await jsonGonder(alanlar(), { kv, ip })).status === 429);
}
{
  const kv = sahteKv(); const ip = '203.0.113.10';
  const eski = { n: 5, nf: 2, first: Date.now() - 3601 * 1000 };
  const { createHash } = await import('node:crypto');
  kv.m.set('rl:tuz', { value: 'ab'.repeat(32), opts: {} });
  const anahtar = `rl:lead:${createHash('sha256').update(`${'ab'.repeat(32)}:${ip}`).digest('hex').slice(0, 32)}`;
  kv.m.set(anahtar, { value: JSON.stringify(eski), opts: {} });
  ok('pencere dolunca sayaç sıfırlanır', (await jsonGonder(alanlar(), { kv, ip })).status === 200);
  ok('sıfırlanan sayaç aynı (tuzlu) anahtara yazılır', JSON.parse(kv.m.get(anahtar).value).n === 1);
  // Dolu pencere aynı anahtarla 429 verir (anahtar tuzlu özetle eşleşiyor)
  kv.m.set(anahtar, { value: JSON.stringify({ n: 5, nf: 0, first: Date.now() }), opts: {} });
  ok('tuzlu anahtarla dolu pencere → 429', (await jsonGonder(alanlar(), { kv, ip })).status === 429);
  // Bozuk sayaç JSON'u IP'yi kilitlemez
  kv.m.set(anahtar, { value: '{bozuk', opts: {} });
  ok('bozuk sayaç → yeni pencere (200)', (await jsonGonder(alanlar(), { kv, ip })).status === 200);
  // Tuzsuz SHA-256 anahtarı kullanılmaz (IPv4 uzayı taranarak geri çözülemesin)
  ok('IP özeti tuzsuz değil', !kv.m.has(`rl:lead:${createHash('sha256').update(ip).digest('hex').slice(0, 32)}`));
}
{
  // İlk istekte gizli tuz üretilir ve KV'de saklanır
  const kv = sahteKv();
  await jsonGonder(alanlar(), { kv });
  ok('tuz KV içinde (64 hex)', /^[0-9a-f]{64}$/.test(kv.m.get('rl:tuz')?.value ?? ''));
}
{
  // Toplam 10 MB sınırı: 2 × 6 MB (her biri 8 MB altında) reddedilir
  const buyuk = () => { const b = new Uint8Array(6 * 1024 * 1024); b.set(PDF); return b; };
  const r = await mpGonder(alanlar(), [{ ad: 'a.pdf', tur: 'application/pdf', bayt: buyuk() }, { ad: 'b.pdf', tur: 'application/pdf', bayt: buyuk() }]);
  ok('toplam 10 MB üstü → 400 file_too_large', r.status === 400 && r.j.error === 'file_too_large', `-> ${r.status} ${r.j.error}`);
}
{
  const r = await jsonGonder(alanlar(), { env: {} });
  ok('KV yok → 503 rate_limit_unavailable (kapalı çöker)', r.status === 503 && r.j.error === 'rate_limit_unavailable', `-> ${r.status} ${r.j.error}`);
  const r2 = await jsonGonder(alanlar(), { kv: sahteKv({ getHata: true }) });
  ok('sayaç okunamıyor → 503 (kapalı çöker)', r2.status === 503 && r2.j.error === 'rate_limit_unavailable');
}

// ---------------------------------------------------------------------------
// Köken
// ---------------------------------------------------------------------------
{
  const request = new Request('http://localhost/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' }, body: JSON.stringify(alanlar()) });
  ok('yabancı köken → 403', (await onRequestPost({ request, env: { LEADS: sahteKv() } })).status === 403);
}

// Mesken: sektör ve ödeme tercihi sorulmaz; sunucu sektörü 'mesken' yapar, tercihi boşaltır
{
  const kv = sahteKv();
  const r = await jsonGonder(alanlar({ tarife: 'mesken', sektor: '', odeme_tercihi: 'onodemeli', tuketim: '150-250', tuketim_kwh: '230' }), { kv });
  ok('mesken sektörsüz → 200', r.status === 200, `-> ${r.status} ${JSON.stringify(r.j)}`);
  const l = leadKaydi(kv);
  ok('mesken: sektör mesken, ödeme tercihi boş, kWh 230', l && l.lead.sektor === 'mesken' && l.lead.odemeTercihi === '' && l.lead.tuketimKwh === 230, JSON.stringify(l && l.lead));
  const r3 = await jsonGonder(alanlar({ tarife: 'mesken', sektor: '', sirket: '', tuketim: '300-500' }), { kv: sahteKv() });
  ok('mesken şirketsiz → 200, şirket = ad soyad', r3.status === 200);
  const kv3 = sahteKv();
  await jsonGonder(alanlar({ tarife: 'mesken', sektor: '', sirket: '', tuketim: '300-500' }), { kv: kv3 });
  ok('mesken şirket alanı ad soyad', leadKaydi(kv3)?.lead.sirket === 'QA Test');
  const r4 = await jsonGonder(alanlar({ tarife: 'og-sanayi', sirket: '' }));
  ok('mesken değilse şirket zorunlu → 400', r4.status === 400 && r4.j.field === 'sirket');
  const r2 = await jsonGonder(alanlar({ tarife: 'og-sanayi', sektor: '' }));
  ok('mesken değilse sektör zorunlu → 400', r2.status === 400 && r2.j.field === 'sektor');
}

// ---------------------------------------------------------------------------
// kaynak: talebin geldiği sayfa (isteğe bağlı; geçersizse sessizce '' — talep reddedilmez)
// ---------------------------------------------------------------------------
{
  const KAYNAK = [
    ['/rehber/tedarikci-degistirme', '/rehber/tedarikci-degistirme', 'site içi yol'],
    ['rehber-sktt', 'rehber-sktt', 'CTA etiketi'],
    ['elektrik-faturasi-hesaplama-sonuc', 'elektrik-faturasi-hesaplama-sonuc', 'hesaplama CTA etiketi'],
    ['www.google.com', 'www.google.com', 'dış alan adı'],
    ['chatgpt.com', 'chatgpt.com', 'dış alan adı (tek nokta)'],
    ['dogrudan', 'dogrudan', 'doğrudan giriş'],
    ['/' + 'a'.repeat(119), '/' + 'a'.repeat(119), 'yol tam 120'],
    ['/' + 'a'.repeat(120), '', 'yol 121 → atılır'],
    ['a'.repeat(76) + '.com', 'a'.repeat(76) + '.com', 'alan adı tam 80'],
    ['a'.repeat(77) + '.com', '', 'alan adı 81 (nokta var, yol değil) → atılır'],
    ['/rehber/sktt?utm_source=x', '', 'sorgu dizgesi → atılır'],
    ['/Rehber/SKTT', '', 'büyük harf → atılır'],
    ['<script>alert(1)</script>', '', 'işaretleme → atılır'],
    ['/rehber/sktt\nBcc: x@y', '', 'satır sonu → atılır'],
    ['https://www.google.com/', '', 'tam URL → atılır'],
    ['/rehber/ışık', '', 'ASCII dışı → atılır'],
    ['', '', 'boş dizgi'],
    [42, '', 'sayı → atılır'],
    [{ a: 1 }, '', 'nesne → atılır'],
    [['/x'], '', 'dizi → atılır'],
  ];
  for (const [girdi, beklenen, ad] of KAYNAK) {
    const r = await jsonGonder(alanlar({ kaynak: girdi }));
    const l = leadKaydi(r.kv);
    ok(`kaynak ${ad} → ${JSON.stringify(beklenen).slice(0, 40)}`, r.status === 200 && l && l.lead.kaynak === beklenen, `-> ${r.status} ${l && JSON.stringify(l.lead.kaynak)}`);
  }
  const yok = { ...alanlar() }; delete yok.kaynak;
  const r = await jsonGonder(yok);
  const l = leadKaydi(r.kv);
  ok('kaynak alanı yok → 200, kaynak ""', r.status === 200 && l && l.lead.kaynak === '');
  ok('kaynak eklendi, eski alanlar korunur (source, utm)', l && l.lead.source === 'voltage.com.tr/teklif-formu' && typeof l.lead.utm === 'object');
  const m = await mpGonder(alanlar({ kaynak: '/sanayi-elektrik-tedariki' }), [{ ad: 'a.pdf', tur: 'application/pdf', bayt: PDF }]);
  ok('multipart payload içinden kaynak okunur', m.status === 200 && leadKaydi(m.kv)?.lead.kaynak === '/sanayi-elektrik-tedariki');
}
{
  // Bildirim e-postasında "Gelinen sayfa" satırı (Resend isteği taklit edilir; ağ yok)
  const gercekFetch = globalThis.fetch;
  const gonderilen = [];
  globalThis.fetch = async (url, init) => { gonderilen.push({ url: String(url), body: JSON.parse(init.body) }); return new Response('{}', { status: 200 }); };
  try {
    const env = { LEADS: sahteKv(), RESEND_API_KEY: 'test-placeholder', LEAD_NOTIFY_TO: 'qa@example.invalid', MAIL_FROM: 'qa@example.invalid' };
    await jsonGonder(alanlar({ kaynak: 'rehber-sktt' }), { env });
    const e = gonderilen.find((g) => g.url.includes('resend'));
    ok('e-posta metninde Gelinen sayfa: rehber-sktt', e && e.body.text.includes('Gelinen sayfa: rehber-sktt'), e && e.body.text);
    ok('e-posta HTML tablosunda Gelinen sayfa', e && e.body.html.includes('Gelinen sayfa') && e.body.html.includes('rehber-sktt'));
    gonderilen.length = 0;
    await jsonGonder(alanlar({ kaynak: '<b>x</b>' }), { env: { ...env, LEADS: sahteKv() } });
    const e2 = gonderilen.find((g) => g.url.includes('resend'));
    ok('geçersiz kaynak e-postada — olarak görünür', e2 && e2.body.text.includes('Gelinen sayfa: —') && !e2.body.html.includes('<b>x</b>'));
  } finally {
    globalThis.fetch = gercekFetch;
  }
}

console.log(`\ntest-lead: ${pass} geçti, ${fail} kaldı`);
if (fail) process.exit(1);
