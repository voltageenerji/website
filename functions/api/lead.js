/**
 * POST /api/lead — Teklif (lead) formu backend'i.
 * Cloudflare Pages Function (plain JS, zero dependencies).
 *
 * Persistence (en az biri zorunlu — yoksa 503 döner, frontend asla sahte
 * "başarılı" göstermez):
 *   - KV binding `LEADS`  → key: lead:<timestamp>:<random>
 *   - env `LEAD_WEBHOOK_URL` → lead JSON'u POST ile iletilir
 *
 * Bildirim (opsiyonel): RESEND_API_KEY + LEAD_NOTIFY_TO + MAIL_FROM üçü de
 * tanımlıysa her başarılı KV kaydından sonra Resend üzerinden e-posta gönderilir.
 * E-posta hatası lead'i ASLA düşürmez — KV doğruluk kaynağıdır (source of truth).
 *
 * Kurulum: bkz. DEPLOY.md "Pages Functions" ve "Lead bildirimleri ve raporlar".
 */

const REQUIRED_FIELDS = ['ad', 'soyad', 'sirket', 'telefon', 'eposta', 'tuketim', 'sektor'];
const MAX_LEN = 1000;

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
    ['Not', lead.mesaj || '—'],
    ['Dil', lead.lang === 'en' ? 'İngilizce' : 'Türkçe'],
    ['Kaynak/UTM', utmStr],
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

  let body;
  try {
    body = await request.json();
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
  for (const f of REQUIRED_FIELDS) {
    if (!clean(body[f])) return json({ ok: false, error: 'missing_field', field: f }, 400);
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
    mesaj: clean(body.mesaj, 2000),
    kvkk: true,
    lang: body.lang === 'en' ? 'en' : 'tr',
    utm,
    receivedAt: new Date().toISOString(),
    source: 'voltage.com.tr/teklif-formu',
  };

  let stored = false;
  let forwarded = false;
  let kvKey = null;

  // 1) KV persistence
  if (env.LEADS) {
    try {
      const key = `lead:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
      await env.LEADS.put(key, JSON.stringify(lead));
      stored = true;
      kvKey = key;
    } catch (e) {
      console.error('LEADS KV put failed:', e.message);
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
