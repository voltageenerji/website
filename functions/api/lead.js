/**
 * POST /api/lead — Teklif (lead) formu backend'i.
 * Cloudflare Pages Function (plain JS, zero dependencies).
 *
 * Persistence (en az biri zorunlu — yoksa 503 döner, frontend asla sahte
 * "başarılı" göstermez):
 *   - KV binding `LEADS`  → key: lead:<timestamp>:<random>
 *   - env `LEAD_WEBHOOK_URL` → lead JSON'u POST ile iletilir
 *
 * Kurulum: bkz. DEPLOY.md "Pages Functions" bölümü.
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
    // Simülatör state'i (CTA ile geldiyse) — fiyat/teklif ön bağlamı
    sim_mwh: clean(body.sim_mwh, 20),
    sim_price: clean(body.sim_price, 20),
    sim_model: clean(body.sim_model, 20),
    receivedAt: new Date().toISOString(),
    source: 'voltage.com.tr/teklif-formu',
  };

  let stored = false;
  let forwarded = false;

  // 1) KV persistence
  if (env.LEADS) {
    try {
      const key = `lead:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
      await env.LEADS.put(key, JSON.stringify(lead));
      stored = true;
    } catch (e) {
      console.error('LEADS KV put failed:', e.message);
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
