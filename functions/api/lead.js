/**
 * POST /api/lead — Teklif (lead) formu backend'i.
 * Cloudflare Pages Function (plain JS, zero dependencies).
 *
 * Persistence: KV binding `LEADS` ZORUNLU (sayaç da burada; yoksa 503 döner, frontend asla
 * sahte "başarılı" göstermez). `LEAD_WEBHOOK_URL` isteğe bağlı ek kopyadır:
 *   - KV binding `LEADS`  → key: lead:<timestamp>:<random>
 *     (fatura ekleri: fatura:lead:<timestamp>:<random>:<n>, 180 gün TTL)
 *   - env `LEAD_WEBHOOK_URL` → lead JSON'u POST ile iletilir
 *
 * Gövde: dosyasız talep `application/json`; dosyalı talep `multipart/form-data`
 * (`payload` = JSON metni, her dosya `fatura` alanı). IP başına sayaç `LEADS`
 * KV'sinde tutulur; KV yoksa uç kapalı çöker (503 rate_limit_unavailable).
 *
 * Bildirim (opsiyonel): RESEND_API_KEY + LEAD_NOTIFY_TO + MAIL_FROM üçü de
 * tanımlıysa her başarılı KV kaydından sonra Resend üzerinden e-posta gönderilir.
 * E-posta hatası lead'i ASLA düşürmez — KV doğruluk kaynağıdır (source of truth).
 *
 * Kurulum: bkz. DEPLOY.md "Pages Functions" ve "Lead bildirimleri ve raporlar".
 */

const REQUIRED_FIELDS = ['ad', 'soyad', 'sirket', 'telefon', 'eposta', 'tuketim', 'sektor'];
const ODEME_TERCIHLERI = ['onodemeli', 'vadeli', 'ikisi'];
const ODEME_ADI = { onodemeli: 'Ön ödemeli', vadeli: 'Faturadan sonra (vadeli)', ikisi: 'İkisini de görmek istiyor' };
/**
 * Aylık kWh: "42.500 kWh", "42,500", "1,234,567", "1.234,56", "42,500.75", "42 500" → tam sayı.
 * Üç haneli grup ayırıcıları (. veya ,) atılır, kalan virgül ondalık sayılır. Makul değilse null.
 */
function kwhSayi(v) {
  let t = String(v || '').replace(/kwh/i, '').replace(/\s/g, '');
  t = t.replace(/[.,](?=\d{3}(?:[.,]|$))/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Math.round(Number(t));
  return n > 0 && n < 100000000 ? n : null;
}
const TARIFELER = ['og-sanayi', 'ag-sanayi', 'og-ticarethane', 'ag-ticarethane', 'mesken', 'tarimsal', 'bilmiyorum'];
// Fatura ekleri: KV'de `fatura:<lead anahtarı>:<sıra>` (ikili, metadata: ad/tür/boyut). Kişisel veri: loglara yazılmaz.
// multipart/form-data ile gelir (alan `fatura`, en fazla 3); talebin geri kalanı `payload` alanında JSON.
const FATURA_TURLER = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const FATURA_EN_FAZLA = 3;
const FATURA_BOYUT = 8 * 1024 * 1024;
// KVKK saklama süresi: fatura dosyaları 180 gün sonra KV'den kendiliğinden silinir (kvkk.html §6).
const FATURA_TTL_SN = 15552000;
// Gövde üst sınırları: ayrıştırmadan önce reddedilir (Workers CPU/bellek koruması).
const JSON_GOVDE_EN_FAZLA = 64 * 1024;
/** İstemci toplamı 10 MB'la sınırlar; sunucu aynı sınırı uygular (+ form alanları payı). */
const FATURA_TOPLAM_EN_FAZLA = 10 * 1024 * 1024;
const MULTIPART_GOVDE_EN_FAZLA = FATURA_TOPLAM_EN_FAZLA + 256 * 1024;
// Kötüye kullanım sınırı: IP başına saatte 5 gönderim, bunların en fazla 2'si dosyalı.
// IP ham saklanmaz (SHA-256 özeti); sayaç anahtarı `lead:` ile BAŞLAMAZ (Voltan OS `lead:` önekini okur).
const RL_PENCERE_SN = 3600;
const RL_EN_FAZLA = 5;
const RL_DOSYALI_EN_FAZLA = 2;

const UZANTI_TUR = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heic' };

/** Bildirilen tür boşsa / genelse dosya adının uzantısından çıkarır; image/heif → image/heic. */
function faturaTuru(tur, ad) {
  const t = String(tur || '').toLowerCase();
  if (t === 'image/heif') return 'image/heic';
  if (FATURA_TURLER.includes(t)) return t;
  if (t === '' || t === 'application/octet-stream') {
    const m = /\.([a-z0-9]+)$/i.exec(String(ad || ''));
    return (m && UZANTI_TUR[m[1].toLowerCase()]) || '';
  }
  return '';
}

/** Dosyanın ilk baytları bildirilen türle uyuşuyor mu (PDF, JPEG, PNG, WEBP, HEIC). */
function imzaUyar(tur, b) {
  const esit = (ofs, dizi) => b.length >= ofs + dizi.length && dizi.every((x, i) => b[ofs + i] === x);
  const asc = (s) => Array.from(s, (c) => c.charCodeAt(0));
  switch (tur) {
    case 'application/pdf': return esit(0, asc('%PDF'));
    case 'image/jpeg': return esit(0, [0xff, 0xd8, 0xff]);
    case 'image/png': return esit(0, [0x89, 0x50, 0x4e, 0x47]);
    case 'image/webp': return esit(0, asc('RIFF')) && esit(8, asc('WEBP'));
    case 'image/heic': return esit(4, asc('ftyp'));
    default: return false;
  }
}

async function sha256Hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * IP başına sayaç (KV, expirationTtl ile). KAPALI ÇÖKER: KV yoksa ya da sayaç okunamazsa
 * gönderim reddedilir (functions-and-data.md). Sayaç yazımı başarısızsa (ör. KV'nin aynı
 * anahtara saniyede 1 yazım sınırı) karar okunan değere göre verilmiş olur; gönderim sürer.
 * Dönüş: null (geçebilir) ya da hata yanıtı.
 */
/**
 * IP özeti için gizli tuz: ilk kullanımda rastgele üretilir ve `LEADS` KV'de (`rl:tuz`) saklanır; repo ya da logda yok.
 * Tuzsuz SHA-256 IPv4 uzayı (2^32) taranarak geri çözülebilirdi; KV erişimi olmadan bu özet geri çevrilemez.
 */
const tuzOnbellek = new WeakMap();
async function sayacTuzu(kv) {
  if (tuzOnbellek.has(kv)) return tuzOnbellek.get(kv);
  let t = await kv.get('rl:tuz');
  if (!t) {
    const b = new Uint8Array(32);
    crypto.getRandomValues(b);
    t = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    await kv.put('rl:tuz', t);
  }
  tuzOnbellek.set(kv, t);
  return t;
}

async function sinirDenetle(request, kv, dosyali, nowMs = Date.now()) {
  if (!kv) return json({ ok: false, error: 'rate_limit_unavailable' }, 503);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  let raw;
  let key;
  try {
    key = `rl:lead:${(await sha256Hex(`${await sayacTuzu(kv)}:${ip}`)).slice(0, 32)}`;
    raw = await kv.get(key);
  } catch (e) {
    return json({ ok: false, error: 'rate_limit_unavailable' }, 503);
  }
  let rec;
  try {
    rec = raw ? JSON.parse(raw) : null;
  } catch (e) {
    rec = null; // bozuk sayaç: yeni pencere
  }
  if (!rec || typeof rec.first !== 'number' || nowMs - rec.first > RL_PENCERE_SN * 1000) rec = { n: 0, nf: 0, first: nowMs };
  if (rec.n >= RL_EN_FAZLA) return json({ ok: false, error: 'rate_limited' }, 429);
  if (dosyali && rec.nf >= RL_DOSYALI_EN_FAZLA) return json({ ok: false, error: 'rate_limited_files' }, 429);
  const next = { n: rec.n + 1, nf: (rec.nf || 0) + (dosyali ? 1 : 0), first: rec.first };
  const kalanSn = Math.ceil((rec.first + RL_PENCERE_SN * 1000 - nowMs) / 1000);
  try {
    await kv.put(key, JSON.stringify(next), { expirationTtl: Math.max(60, kalanSn) });
  } catch (e) { /* IP ya da istek gövdesi loglanmaz */ }
  return null;
}

const MAX_LEN = 1000;

/**
 * Talebin geldiği sayfa (`kaynak`, isteğe bağlı): site içi yol ya da CTA etiketi ([a-z0-9/-], en fazla 120),
 * dış sitenin alan adı ([a-z0-9.-], en fazla 80) ya da "dogrudan". Başka her şey sessizce atılır ('' saklanır);
 * talep reddedilmez. İstemci (index.html kaynakBul) aynı kuralı uygular.
 */
function kaynakTemiz(v) {
  if (typeof v !== 'string') return '';
  if (v.length <= 120 && /^[a-z0-9/-]+$/.test(v)) return v;
  if (v.length <= 80 && /^[a-z0-9.-]+$/.test(v)) return v;
  return '';
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function clean(v, max = MAX_LEN) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

// ---------------------------------------------------------------------------
// E-posta bildirimi (Resend) — yardımcılar
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** İstanbul saatiyle okunur tarih (Türkiye kalıcı UTC+3, DST yok). */
function istanbulDate(iso) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso)) + ' (İstanbul)';
  } catch (e) {
    return iso;
  }
}

/** Lead bildirimi için konu + HTML + düz metin gövde üretir. */
function buildLeadEmail(lead, kvKey) {
  const utmStr = Object.keys(lead.utm || {}).length
    ? Object.entries(lead.utm).map(([k, v]) => `${k}=${v}`).join(' · ')
    : '—';
  const rows = [
    ['Ad Soyad', `${lead.ad} ${lead.soyad}`],
    ['Şirket', lead.sirket],
    ['Telefon', lead.telefon],
    ['E-posta', lead.eposta],
    ['Aylık Tüketim', lead.tuketim],
    ['Sektör', lead.sektor],
    ['Tam aylık tüketim', lead.tuketimKwh ? `${lead.tuketimKwh.toLocaleString('tr-TR')} kWh` : '—'],
    ['Ödeme tercihi', ODEME_ADI[lead.odemeTercihi] || '—'],
    ['Yeşil enerji', lead.yesil ? 'Evet, yeşil enerji teklifi istiyor' : '—'],
    ['Tarife', lead.tarife || '—'],
    ['Fatura eki', lead.faturalar && lead.faturalar.length ? `${lead.faturalar.length} dosya (Voltan OS pipeline'da)` : '—'],
    ['Not', lead.mesaj || '—'],
    ['Dil', lead.lang === 'en' ? 'İngilizce' : 'Türkçe'],
    ['Kaynak/UTM', utmStr],
    ['Gelinen sayfa', lead.kaynak || '—'],
    ['Tarih', istanbulDate(lead.receivedAt)],
  ];

  const text = [
    'Yeni teklif talebi — voltage.com.tr',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    `Referans no: ${kvKey}`,
  ].join('\n');

  const trs = rows.map(([k, v]) => `
      <tr>
        <td style="padding:8px 14px 8px 0;color:#4A5264;font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #EDEAE0;">${escapeHtml(k)}</td>
        <td style="padding:8px 0;color:#0A0E1A;font-size:14px;border-bottom:1px solid #EDEAE0;">${escapeHtml(v)}</td>
      </tr>`).join('');

  const html = `<!doctype html>
<div style="background:#F5F3EC;padding:32px 16px;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #EDEAE0;border-top:3px solid #C9A961;padding:28px 32px;">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#826829;font-family:Consolas,monospace;margin-bottom:6px;">Voltage Enerji · voltage.com.tr</div>
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:400;color:#0A0E1A;">Yeni Teklif Talebi — ${escapeHtml(lead.sirket)}</h1>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${trs}
    </table>
    <div style="margin-top:20px;font-family:Consolas,monospace;font-size:11px;color:#4A5264;">ref: ${escapeHtml(kvKey)}</div>
  </div>
</div>`;

  // Konu satırı: kontrol karakterleri temizlenir (QA D2), uzunluk sınırlı.
  const subjectSirket = String(lead.sirket).replace(/[\x00-\x1F\x7F]+/g, ' ').trim().slice(0, 120);
  return { subject: `Yeni Teklif Talebi — ${subjectSirket}`, html, text };
}

/**
 * Resend REST API ile e-posta gönderir. Hata fırlatmaz sayılmaz: çağıran
 * try/catch ile sarmalıdır. LEAD_NOTIFY_TO virgülle ayrılmış çoklu alıcı
 * destekler. 8 sn timeout — yanıtı geciktirmemek için waitUntil ile çağrılır.
 */
async function sendResendEmail(env, { subject, html, text }) {
  const to = env.LEAD_NOTIFY_TO.split(',').map((s) => s.trim()).filter(Boolean);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.MAIL_FROM, to, subject, html, text }),
    signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
  });
  if (!r.ok) {
    throw new Error(`resend_http_${r.status}`);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS: same-origin only. Cross-origin tarayıcı istekleri reddedilir;
  // CORS header'ı hiç dönülmediği için yabancı origin'ler yanıtı okuyamaz.
  const origin = request.headers.get('Origin');
  if (origin) {
    let originHost = null;
    try { originHost = new URL(origin).host; } catch (e) { /* malformed */ }
    if (originHost !== new URL(request.url).host) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }
  }

  // Dosyalı talep multipart/form-data (alanlar `payload` JSON + `fatura` dosyaları); dosyasız talep JSON.
  const ctype = (request.headers.get('Content-Type') || '').toLowerCase();
  const multipart = ctype.startsWith('multipart/form-data');
  const uzunluk = Number(request.headers.get('Content-Length') || 0);
  // Not: HTTP/2'de Content-Length gelmeyebilir; o durumda dosya başına (8 MB) ve toplam (10 MB) denetim ayrıştırmadan sonra yapılır
  if (uzunluk > (multipart ? MULTIPART_GOVDE_EN_FAZLA : JSON_GOVDE_EN_FAZLA)) {
    return json({ ok: false, error: multipart ? 'file_too_large' : 'payload_too_large' }, 413);
  }

  // Kötüye kullanım sınırı: gövde ayrıştırılmadan önce (CPU koruması)
  const sinir = await sinirDenetle(request, env.LEADS, multipart);
  if (sinir) return sinir;

  let body;
  let gelenDosyalar = [];
  try {
    if (multipart) {
      const form = await request.formData();
      const p = form.get('payload');
      if (typeof p !== 'string' || p.length > JSON_GOVDE_EN_FAZLA) return json({ ok: false, error: 'invalid_payload' }, 400);
      body = JSON.parse(p);
      gelenDosyalar = form.getAll('fatura');
    } else {
      const metin = await request.text();
      if (metin.length > JSON_GOVDE_EN_FAZLA) return json({ ok: false, error: 'payload_too_large' }, 413);
      body = JSON.parse(metin);
    }
  } catch (e) {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  if (!body || typeof body !== 'object') {
    return json({ ok: false, error: 'invalid_payload' }, 400);
  }

  // Honeypot: insan kullanıcılar bu alanı görmez; doluysa bot'tur.
  // Sessizce "ok" dönüp veriyi atıyoruz ki bot filtrelendiğini anlamasın.
  if (clean(body.website)) {
    return json({ ok: true });
  }

  // Server-side validation
  // Mesken: sektör sorulmaz (formda gizli), ödeme tercihi yok (mesken hep faturadan sonra öder)
  const meskenTalep = clean(body.tarife, 40) === 'mesken';
  if (meskenTalep) {
    body.sektor = 'mesken';
    // Mesken formunda şirket adı sorulmaz: kayıtta ad soyad kullanılır
    if (!clean(body.sirket)) body.sirket = `${clean(body.ad, 100)} ${clean(body.soyad, 100)}`.trim();
    body.odeme_tercihi = '';
  }
  for (const f of REQUIRED_FIELDS) {
    if (!clean(body[f])) return json({ ok: false, error: 'missing_field', field: f }, 400);
  }
  // Fatura ekleri (opsiyonel, yalnız multipart): sayı, tür, boyut ve dosya imzası sunucuda yeniden denetlenir.
  // JSON gövdedeki eski base64 `faturalar` alanı artık okunmaz.
  if (gelenDosyalar.length > FATURA_EN_FAZLA) return json({ ok: false, error: 'too_many_files' }, 400);
  const faturaBaytlari = [];
  let toplamBoyut = 0;
  for (const f of gelenDosyalar) {
    if (!f || typeof f === 'string' || typeof f.arrayBuffer !== 'function') return json({ ok: false, error: 'invalid_file' }, 400);
    const ad = clean(f.name, 120) || 'fatura';
    const tur = faturaTuru(f.type, ad);
    if (!tur || !f.size) return json({ ok: false, error: 'invalid_file' }, 400);
    toplamBoyut += f.size;
    if (f.size > FATURA_BOYUT || toplamBoyut > FATURA_TOPLAM_EN_FAZLA) return json({ ok: false, error: 'file_too_large' }, 400);
    const bayt = new Uint8Array(await f.arrayBuffer());
    if (!imzaUyar(tur, bayt)) return json({ ok: false, error: 'invalid_file' }, 400);
    faturaBaytlari.push({ ad, tur, bayt });
  }
  if (body.kvkk !== true) {
    return json({ ok: false, error: 'kvkk_required' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(body.eposta, 254))) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }

  const utm = {};
  if (body.utm && typeof body.utm === 'object') {
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      const v = clean(body.utm[k], 200);
      if (v) utm[k] = v;
    }
  }

  const lead = {
    ad: clean(body.ad, 100),
    soyad: clean(body.soyad, 100),
    sirket: clean(body.sirket, 200),
    telefon: clean(body.telefon, 40),
    eposta: clean(body.eposta, 254),
    tuketim: clean(body.tuketim, 40),
    sektor: clean(body.sektor, 60),
    tarife: TARIFELER.includes(clean(body.tarife, 40)) ? clean(body.tarife, 40) : '',
    tuketimKwh: kwhSayi(body.tuketim_kwh),
    odemeTercihi: ODEME_TERCIHLERI.includes(clean(body.odeme_tercihi, 20)) ? clean(body.odeme_tercihi, 20) : '',
    yesil: body.yesil === true,
    faturalar: [],
    mesaj: clean(body.mesaj, 2000),
    kvkk: true,
    lang: body.lang === 'en' ? 'en' : 'tr',
    utm,
    receivedAt: new Date().toISOString(),
    source: 'voltage.com.tr/teklif-formu',
    // Yeni alan (geriye uyumlu ek): talebin geldiği sayfa ya da dış site; geçersiz/eksikse ''
    kaynak: kaynakTemiz(body.kaynak),
  };

  let stored = false;
  let forwarded = false;
  let kvKey = null;

  // 1) KV persistence
  if (env.LEADS) {
    const yazilanEkler = [];
    try {
      const key = `lead:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
      // Önce ekler, sonra talep: talep kaydı görüldüğünde ekleri hazır olsun.
      // Ekler 180 gün sonra kendiliğinden silinir (KVKK saklama süresi); talep kaydının TTL'i yok.
      for (let i = 0; i < faturaBaytlari.length; i++) {
        const f = faturaBaytlari[i];
        const fKey = `fatura:${key}:${i}`;
        await env.LEADS.put(fKey, f.bayt, { metadata: { ad: f.ad, tur: f.tur, boyut: f.bayt.length }, expirationTtl: FATURA_TTL_SN });
        yazilanEkler.push(fKey);
        lead.faturalar.push({ anahtar: fKey, ad: f.ad, tur: f.tur, boyut: f.bayt.length });
      }
      await env.LEADS.put(key, JSON.stringify(lead));
      stored = true;
      kvKey = key;
    } catch (e) {
      console.error('LEADS KV put failed:', e.message);
      // Talep kaydı yazılamadıysa sahipsiz fatura ekleri bırakılmaz
      for (const k of yazilanEkler) {
        try { await env.LEADS.delete(k); } catch (e2) { /* TTL yine de siler */ }
      }
      lead.faturalar = [];
    }
  }

  // 1b) E-posta bildirimi (opsiyonel; yalnızca başarılı KV kaydından sonra).
  // KRİTİK: e-posta hatası lead'i asla düşürmez — KV doğruluk kaynağıdır.
  // waitUntil ile arka planda gönderilir; yanıt beklemez. Loglara PII yazılmaz.
  if (stored && env.RESEND_API_KEY && env.LEAD_NOTIFY_TO && env.MAIL_FROM) {
    const emailPromise = (async () => {
      try {
        await sendResendEmail(env, buildLeadEmail(lead, kvKey));
      } catch (e) {
        console.error('Lead notify email failed:', e.message);
      }
    })();
    if (typeof context.waitUntil === 'function') {
      context.waitUntil(emailPromise);
    } else {
      await emailPromise;
    }
  }

  // 2) Webhook forward (opsiyonel — e-posta/Slack/CRM köprüsü)
  if (env.LEAD_WEBHOOK_URL) {
    try {
      const r = await fetch(env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      forwarded = r.ok;
    } catch (e) {
      console.error('Lead webhook forward failed:', e.message);
    }
  }

  // Dürüstlük kuralı: hiçbir kalıcılık yolu çalışmadıysa başarı iddia etme.
  if (!stored && !forwarded) {
    return json({ ok: false, error: 'no_persistence' }, 503);
  }

  return json({ ok: true });
}
