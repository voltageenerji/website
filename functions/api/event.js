/**
 * POST /api/event — birinci taraf, çerezsiz funnel olayları.
 * Cloudflare Pages Function (plain JS, zero dependencies).
 *
 * KVKK-minimal: çerez yok, fingerprint yok, PII yok — yalnızca olay adı,
 * dil ve UTM gibi kampanya parametreleri sayılır.
 *
 * KV binding `EVENTS` bağlı değilse 204 ile sessizce düşer:
 * analitik bozulabilir, kullanıcı deneyimi asla bozulmaz.
 */

const ALLOWED_EVENTS = [
  'page_view',
  'sim_input',
  'sim_result_cta',
  'form_start',
  'form_submit_ok',
  'form_submit_err',
  'tel_click',
  'mail_click',
  'mobile_menu_open',
];

const MAX_PROPS_BYTES = 1024;
const RETENTION_SECONDS = 60 * 60 * 24 * 180; // 180 gün

function noContent() {
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Same-origin only
  const origin = request.headers.get('Origin');
  if (origin) {
    let originHost = null;
    try { originHost = new URL(origin).host; } catch (e) { /* malformed */ }
    if (originHost !== new URL(request.url).host) {
      return new Response(null, { status: 403 });
    }
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return noContent();
  }
  if (!body || typeof body !== 'object' || !ALLOWED_EVENTS.includes(body.event)) {
    return noContent();
  }
  if (!env.EVENTS) {
    return noContent(); // binding yok → analitik sessizce devre dışı
  }

  // Props: yalnızca küçük, primitif değerler; boyut sınırı uygula.
  let props = {};
  if (body.props && typeof body.props === 'object') {
    for (const [k, v] of Object.entries(body.props)) {
      if (typeof v === 'string') props[k] = v.slice(0, 200);
      else if (typeof v === 'number' || typeof v === 'boolean') props[k] = v;
      else if (v && typeof v === 'object' && k === 'utm') {
        const utm = {};
        for (const [uk, uv] of Object.entries(v)) {
          if (typeof uv === 'string') utm[uk.slice(0, 40)] = uv.slice(0, 200);
        }
        props.utm = utm;
      }
    }
  }
  let serialized = JSON.stringify(props);
  if (serialized.length > MAX_PROPS_BYTES) {
    props = {};
    serialized = '{}';
  }

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const key = `evt:${date}:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
  const record = { event: body.event, props, ts: now.toISOString() };

  try {
    await env.EVENTS.put(key, JSON.stringify(record), { expirationTtl: RETENTION_SECONDS });
  } catch (e) {
    console.error('EVENTS KV put failed:', e.message);
  }

  return noContent();
}
