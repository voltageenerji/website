/**
 * GET /api/report — lead özet raporu (haftalık/aylık/3-6 aylık/yıllık), e-posta ile gönderilir.
 * Cloudflare Pages Function (plain JS, zero dependencies).
 *
 * Koruma: `Authorization: Bearer <REPORT_TOKEN>` zorunlu (env.REPORT_TOKEN ile
 * sabit-zamanlı karşılaştırma). Token yanlış/eksik → 401.
 *
 * Ön koşullar (yoksa 503 — rapor e-postayla var olur, sessiz başarı yok):
 *   - KV binding `LEADS`
 *   - env `REPORT_TOKEN`
 *   - env `RESEND_API_KEY` + `LEAD_NOTIFY_TO` + `MAIL_FROM`
 *
 * Sorgu: ?period=weekly|monthly|quarterly|semiannual|yearly (varsayılan weekly).
 *
 * Pencere mantığı (Europe/Istanbul — Türkiye 2016'dan beri kalıcı UTC+3,
 * DST yok; bu yüzden sabit +3 saat ofsetle hesaplamak güvenlidir):
 *   - weekly : son 7 TAM gün → [bugün 00:00 İst − 7 gün, bugün 00:00 İst)
 *              Pazartesi sabahı çalıştığında geçen Pzt–Paz aralığını verir.
 *   - monthly: bir ÖNCEKİ takvim ayı → [geçen ayın 1'i 00:00 İst,
 *              bu ayın 1'i 00:00 İst). Ayın 1'inde çalıştırılmak üzere tasarlandı.
 *
 * KV anahtarları `lead:<epoch_ms>:<random>` biçimindedir: pencere filtresi
 * anahtardaki timestamp'ten yapılır, yalnızca pencere içindeki kayıtlar
 * fetch edilir (tüm store okunmaz). Rapor tablosu 500 kayıtla sınırlıdır;
 * aşılırsa `truncated: true` (toplam sayaç yine doğrudur).
 *
 * Yanıt JSON'u YALNIZCA sayımlar içerir — hiçbir tekil müşteri verisi (şirket
 * adı dahil) döndürülmez. Uç, genel-okunur bir CI günlüğüne yansıyabilir; tekil
 * ayrıntı yalnızca hedef alıcıya giden e-postadadır.
 *
 * Kurulum: bkz. DEPLOY.md "Lead bildirimleri ve raporlar".
 */

const IST_OFFSET_MS = 3 * 60 * 60 * 1000; // Europe/Istanbul = kalıcı UTC+3

/** Desteklenen dönemler ve e-posta konusundaki Türkçe adları. */
export const PERIODS = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  quarterly: '3 Aylık',
  semiannual: '6 Aylık',
  yearly: 'Yıllık',
};
const MAX_REPORT_LEADS = 500;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/**
 * Sabit-zamanlıya yakın karşılaştırma: iki değerin SHA-256 özeti alınır ve
 * özetler tam uzunlukta XOR ile karşılaştırılır. Uzunluk/ön ek sızıntısı olmaz.
 */
async function tokenEquals(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

/** Rapor penceresi [from, to) epoch-ms olarak + insan-okur etiket. */
export function computeWindow(period, nowMs) {
  // İstanbul "duvar saati" — UTC getter'ları İstanbul yerel değerlerini verir.
  const ist = new Date(nowMs + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const d = ist.getUTCDate();
  const todayMidnightMs = Date.UTC(y, m, d) - IST_OFFSET_MS; // bugün 00:00 İst (epoch)

  const dayFmt = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric',
  });
  /** [from, to) aralığını "01.01.2026 – 31.03.2026" biçiminde etiketler. */
  const spanLabel = (from, to) => `${dayFmt.format(new Date(from))} – ${dayFmt.format(new Date(to - 24 * 60 * 60 * 1000))}`;

  if (period === 'monthly') {
    // Önceki takvim ayı: [geçen ayın 1'i, bu ayın 1'i) İstanbul saatiyle.
    const from = Date.UTC(y, m - 1, 1) - IST_OFFSET_MS;
    const to = Date.UTC(y, m, 1) - IST_OFFSET_MS;
    const label = new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul', month: 'long', year: 'numeric',
    }).format(new Date(from));
    return { from, to, label };
  }

  // Çeyrek / yarıyıl: tamamlanmış TAKVİM dönemleri. Ayın 1'inde çalıştırılır;
  // örn. 1 Nisan'da koşan quarterly = Ocak–Mart. Böylece dönemler çakışmaz
  // ve her ay yeniden aynı veriyi raporlamayız.
  if (period === 'quarterly' || period === 'semiannual') {
    const span = period === 'quarterly' ? 3 : 6;
    const endMonth = Math.floor(m / span) * span; // içinde bulunulan dönemin ilk ayı
    const from = Date.UTC(y, endMonth - span, 1) - IST_OFFSET_MS;
    const to = Date.UTC(y, endMonth, 1) - IST_OFFSET_MS;
    return { from, to, label: spanLabel(from, to) };
  }

  if (period === 'yearly') {
    // Önceki takvim yılı: [1 Ocak (y-1), 1 Ocak y)
    const from = Date.UTC(y - 1, 0, 1) - IST_OFFSET_MS;
    const to = Date.UTC(y, 0, 1) - IST_OFFSET_MS;
    return { from, to, label: String(y - 1) };
  }

  // weekly: son 7 tam gün: [bugün 00:00 − 7g, bugün 00:00)
  const from = todayMidnightMs - 7 * 24 * 60 * 60 * 1000;
  const to = todayMidnightMs;
  const fmt = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric',
  });
  // to eksklusif → görünen bitiş, pencerenin son günü (to − 1 gün).
  const label = `${fmt.format(new Date(from))} – ${fmt.format(new Date(to - 24 * 60 * 60 * 1000))}`;
  return { from, to, label };
}

/**
 * `lead:` önekli tüm anahtarları listeler (cursor ile sayfalama), anahtara
 * gömülü ms-timestamp'i parse edip [from, to) penceresine düşenleri döndürür.
 * Kayıt fetch edilmez — yalnızca anahtar adları.
 */
async function listWindowKeys(kv, from, to) {
  const inWindow = [];
  let cursor;
  do {
    const page = await kv.list({ prefix: 'lead:', cursor });
    for (const k of page.keys) {
      const ts = Number(k.name.split(':')[1]);
      if (Number.isFinite(ts) && ts >= from && ts < to) inWindow.push({ name: k.name, ts });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  inWindow.sort((a, b) => a.ts - b.ts);
  return inWindow;
}

function countBy(records, getter) {
  const out = {};
  for (const r of records) {
    const k = getter(r) || '—';
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function istShort(ms) {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ms));
}

function breakdownTableHtml(title, counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return '';
  const rows = entries.map(([k, n]) => `
      <tr>
        <td style="padding:6px 14px 6px 0;color:#0A0E1A;font-size:13px;border-bottom:1px solid #EDEAE0;">${escapeHtml(k)}</td>
        <td style="padding:6px 0;color:#0A0E1A;font-size:13px;text-align:right;border-bottom:1px solid #EDEAE0;">${n}</td>
      </tr>`).join('');
  return `
    <h2 style="margin:24px 0 8px;font-size:14px;font-weight:600;color:#4A5264;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(title)}</h2>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${rows}
    </table>`;
}

function breakdownText(title, counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return '';
  return `\n${title}\n${entries.map(([k, n]) => `  ${k}: ${n}`).join('\n')}\n`;
}

/** Rapor e-postası: konu + HTML + düz metin. Sıfır lead de geçerli rapordur. */
function buildReportEmail(period, windowLabel, agg, records) {
  const subject = `Voltage Lead Raporu — ${PERIODS[period] || PERIODS.weekly} ${windowLabel}`;

  if (agg.total === 0) {
    const emptyHtml = `<!doctype html>
<div style="background:#F5F3EC;padding:32px 16px;font-family:Georgia,serif;">
  <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #EDEAE0;border-top:3px solid #C9A961;padding:28px 32px;">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#826829;font-family:Consolas,monospace;margin-bottom:6px;">Voltage Enerji · Lead Raporu</div>
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:400;color:#0A0E1A;">${escapeHtml(subject.replace('Voltage Lead Raporu — ', ''))}</h1>
    <p style="color:#4A5264;font-size:14px;">Bu dönemde talep gelmedi.</p>
    <div style="margin-top:20px;font-family:Consolas,monospace;font-size:11px;color:#4A5264;">dönem: ${escapeHtml(windowLabel)} · toplam: 0</div>
  </div>
</div>`;
    const emptyText = `${subject}\n\nBu dönemde talep gelmedi.\nDönem: ${windowLabel} · Toplam: 0\n`;
    return { subject, html: emptyHtml, text: emptyText };
  }

  const leadRows = records.map((r) => `
      <tr>
        <td style="padding:6px 10px 6px 0;font-size:12px;color:#4A5264;white-space:nowrap;border-bottom:1px solid #EDEAE0;">${escapeHtml(istShort(r._ts))}</td>
        <td style="padding:6px 10px 6px 0;font-size:12px;color:#0A0E1A;border-bottom:1px solid #EDEAE0;">${escapeHtml(r.sirket || '—')}</td>
        <td style="padding:6px 10px 6px 0;font-size:12px;color:#0A0E1A;border-bottom:1px solid #EDEAE0;">${escapeHtml(`${r.ad || ''} ${r.soyad || ''}`.trim() || '—')}</td>
        <td style="padding:6px 10px 6px 0;font-size:12px;color:#0A0E1A;border-bottom:1px solid #EDEAE0;">${escapeHtml(r.tuketim || '—')}</td>
        <td style="padding:6px 10px 6px 0;font-size:12px;color:#0A0E1A;border-bottom:1px solid #EDEAE0;">${escapeHtml(r.sektor || '—')}</td>
        <td style="padding:6px 0;font-size:12px;color:#0A0E1A;border-bottom:1px solid #EDEAE0;">${escapeHtml(r.eposta || '—')}</td>
      </tr>`).join('');

  const truncNote = agg.truncated
    ? `<p style="color:#A68A44;font-size:12px;">Not: tablo ilk ${MAX_REPORT_LEADS} kayıtla sınırlandı (toplam ${agg.total}).</p>`
    : '';

  const html = `<!doctype html>
<div style="background:#F5F3EC;padding:32px 16px;font-family:Georgia,serif;">
  <div style="max-width:720px;margin:0 auto;background:#FFFFFF;border:1px solid #EDEAE0;border-top:3px solid #C9A961;padding:28px 32px;">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#826829;font-family:Consolas,monospace;margin-bottom:6px;">Voltage Enerji · Lead Raporu</div>
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:400;color:#0A0E1A;">${escapeHtml(subject.replace('Voltage Lead Raporu — ', ''))}</h1>
    <p style="margin:0 0 8px;color:#4A5264;font-size:14px;">Toplam <strong style="color:#826829;">${agg.total}</strong> teklif talebi.</p>
    ${breakdownTableHtml('Tüketim bandı', agg.byTuketim)}
    ${breakdownTableHtml('Sektör', agg.bySektor)}
    ${breakdownTableHtml('Dil', agg.byLang)}
    ${breakdownTableHtml('UTM kaynağı', agg.byUtmSource)}
    <h2 style="margin:24px 0 8px;font-size:14px;font-weight:600;color:#4A5264;text-transform:uppercase;letter-spacing:0.08em;">Talepler</h2>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      <tr>
        <th style="text-align:left;padding:6px 10px 6px 0;font-size:11px;color:#4A5264;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #C9A961;">Tarih</th>
        <th style="text-align:left;padding:6px 10px 6px 0;font-size:11px;color:#4A5264;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #C9A961;">Şirket</th>
        <th style="text-align:left;padding:6px 10px 6px 0;font-size:11px;color:#4A5264;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #C9A961;">Ad Soyad</th>
        <th style="text-align:left;padding:6px 10px 6px 0;font-size:11px;color:#4A5264;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #C9A961;">Tüketim</th>
        <th style="text-align:left;padding:6px 10px 6px 0;font-size:11px;color:#4A5264;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #C9A961;">Sektör</th>
        <th style="text-align:left;padding:6px 0;font-size:11px;color:#4A5264;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #C9A961;">E-posta</th>
      </tr>${leadRows}
    </table>
    ${truncNote}
    <div style="margin-top:20px;font-family:Consolas,monospace;font-size:11px;color:#4A5264;">dönem: ${escapeHtml(windowLabel)} · toplam: ${agg.total}${agg.truncated ? ' · TRUNCATED' : ''}</div>
  </div>
</div>`;

  const text = [
    subject,
    '',
    `Toplam: ${agg.total} teklif talebi`,
    breakdownText('Tüketim bandı', agg.byTuketim),
    breakdownText('Sektör', agg.bySektor),
    breakdownText('Dil', agg.byLang),
    breakdownText('UTM kaynağı', agg.byUtmSource),
    'Talepler:',
    ...records.map((r) => `  ${istShort(r._ts)} | ${r.sirket || '—'} | ${`${r.ad || ''} ${r.soyad || ''}`.trim() || '—'} | ${r.tuketim || '—'} | ${r.sektor || '—'} | ${r.eposta || '—'}`),
    agg.truncated ? `(tablo ${MAX_REPORT_LEADS} kayıtla sınırlı; toplam ${agg.total})` : '',
  ].join('\n');

  return { subject, html, text };
}

/** Resend REST API ile gönderim. LEAD_NOTIFY_TO virgülle çoklu alıcı destekler. */
async function sendResendEmail(env, { subject, html, text }) {
  const to = env.LEAD_NOTIFY_TO.split(',').map((s) => s.trim()).filter(Boolean);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.MAIL_FROM, to, subject, html, text }),
    signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
  });
  if (!r.ok) {
    throw new Error(`resend_http_${r.status}`);
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  // Auth önce — kimliksiz çağrı konfigürasyon durumu öğrenemez (QA D1).
  // REPORT_TOKEN yoksa ayrıntısız 503; ayrıntılı teşhis yalnızca kimlik sonrası.
  if (!env.REPORT_TOKEN) return json({ ok: false, error: 'not_configured' }, 503);
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !(await tokenEquals(token, env.REPORT_TOKEN))) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  // Ön koşullar — eksikse dürüst 503 (sessiz başarı yok).
  if (!env.LEADS) return json({ ok: false, error: 'leads_kv_unbound' }, 503);
  if (!env.RESEND_API_KEY || !env.LEAD_NOTIFY_TO || !env.MAIL_FROM) {
    return json({ ok: false, error: 'resend_env_missing', detail: 'RESEND_API_KEY + LEAD_NOTIFY_TO + MAIL_FROM gerekli — rapor e-postayla gönderilmek için var.' }, 503);
  }

  const url = new URL(request.url);
  const requested = url.searchParams.get('period') || 'weekly';
  // hasOwnProperty: 'constructor', '__proto__' gibi prototip zinciri adları
  // allowlist'i geçmesin (QA N4).
  const period = Object.prototype.hasOwnProperty.call(PERIODS, requested) ? requested : 'weekly';
  const { from, to, label } = computeWindow(period, Date.now());

  // Anahtar listesi (pencere filtresi anahtar timestamp'inden — kayıt fetch yok).
  let keys;
  try {
    keys = await listWindowKeys(env.LEADS, from, to);
  } catch (e) {
    console.error('Report KV list failed:', e.message);
    return json({ ok: false, error: 'kv_list_failed' }, 502);
  }

  const total = keys.length;
  const truncated = total > MAX_REPORT_LEADS;
  const fetchKeys = keys.slice(0, MAX_REPORT_LEADS);

  // Yalnızca pencere içindeki kayıtları çek (50'lik partiler).
  const records = [];
  try {
    for (let i = 0; i < fetchKeys.length; i += 50) {
      const batch = fetchKeys.slice(i, i + 50);
      const vals = await Promise.all(batch.map((k) => env.LEADS.get(k.name, 'json')));
      for (let j = 0; j < batch.length; j++) {
        if (vals[j]) records.push({ ...vals[j], _ts: batch[j].ts, _key: batch[j].name });
      }
    }
  } catch (e) {
    console.error('Report KV get failed:', e.message);
    return json({ ok: false, error: 'kv_get_failed' }, 502);
  }

  const agg = {
    total,
    truncated,
    byTuketim: countBy(records, (r) => r.tuketim),
    bySektor: countBy(records, (r) => r.sektor),
    byLang: countBy(records, (r) => r.lang),
    byUtmSource: countBy(records, (r) => r.utm && r.utm.utm_source),
  };

  // Rapor e-postası — sıfır lead de gönderilir ("Bu dönemde talep gelmedi").
  try {
    await sendResendEmail(env, buildReportEmail(period, label, agg, records));
  } catch (e) {
    console.error('Report email failed:', e.message);
    return json({ ok: false, error: 'email_send_failed' }, 502);
  }

  // Çağırana YALNIZCA sayımlar döner — hiçbir tekil müşteri verisi (şirket adı
  // dahil) HTTP yanıtında YER ALMAZ. Bu uç bir CI iş akışıyla çağrılıyor ve
  // yanıt gövdesi genel-okunur bir günlüğe düşebilir (QA B2). Ayrıntı yalnızca
  // hedef alıcıya giden e-postada bulunur.
  return json({
    ok: true,
    period,
    window: { from: new Date(from).toISOString(), to: new Date(to).toISOString(), label },
    total,
    truncated,
    byTuketim: agg.byTuketim,
    bySektor: agg.bySektor,
    byLang: agg.byLang,
    byUtmSource: agg.byUtmSource,
    emailed: true,
  });
}
