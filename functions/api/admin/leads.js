/**
 * GET /api/admin/leads — panelin veri ucu. Oturum ZORUNLU.
 *
 * Sorgu:
 *   ?limit=<1..200>   sayfa boyutu (varsayılan 100)
 *   ?before=<ms>      keyset sayfalama: bu zaman damgasından ESKİ kayıtlar
 *
 * Yanıt: { ok, total, records[], nextBefore, truncated }
 *   records: en yeniden eskiye. Kişisel veri İÇERİR — yalnızca doğrulanmış
 *   oturuma döner, asla cache'lenmez, asla indekslenmez.
 *
 * Neden keyset sayfalama: KV anahtarları `lead:<epoch_ms>:<rastgele>` biçiminde;
 * 13 haneli ms damgası tüm gerçekçi tarihlerde sabit uzunlukta olduğu için
 * sözlük sırası = zaman sırası. Anahtar listesi ucuzdur (değerler çekilmez),
 * yalnızca gösterilecek sayfanın değerleri okunur.
 */

import { requireSession } from '../../../lib/admin-auth.js';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;
const MAX_KEYS_SCANNED = 20000; // güvenlik freni: sınırsız listeleme yapma

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const session = await requireSession(context);
  if (!session) return json({ ok: false, error: 'unauthorized' }, 401);

  const kv = env.LEADS;
  if (!kv) return json({ ok: false, error: 'no_persistence' }, 503);

  const url = new URL(request.url);
  // DİKKAT: Number(null) === 0 ve 0 "finite"tir. Parametre yokken varsayılana
  // düşmek için pozitiflik şart — aksi hâlde limit 1'e çöker (test yakaladı).
  const limitRaw = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(MAX_LIMIT, Math.floor(limitRaw)) : DEFAULT_LIMIT;
  const beforeRaw = Number(url.searchParams.get('before'));
  const before = Number.isFinite(beforeRaw) && beforeRaw > 0 ? beforeRaw : Infinity;

  // 1) Anahtarları topla (değer okumadan)
  const keys = [];
  let cursor;
  let truncated = false;
  do {
    const page = await kv.list({ prefix: 'lead:', cursor });
    for (const k of page.keys) {
      const ts = Number(k.name.split(':')[1]);
      if (Number.isFinite(ts)) keys.push({ name: k.name, ts });
    }
    cursor = page.list_complete ? undefined : page.cursor;
    if (keys.length >= MAX_KEYS_SCANNED) { truncated = true; break; }
  } while (cursor);

  const total = keys.length;
  keys.sort((a, b) => b.ts - a.ts); // en yeni önce

  // 2) Sayfayı seç ve YALNIZCA o sayfanın değerlerini oku
  const pageKeys = keys.filter((k) => k.ts < before).slice(0, limit);
  const records = [];
  for (const k of pageKeys) {
    try {
      const raw = await kv.get(k.name);
      if (!raw) continue;
      const lead = JSON.parse(raw);
      records.push({
        id: k.name,
        ts: k.ts,
        ad: lead.ad || '',
        soyad: lead.soyad || '',
        sirket: lead.sirket || '',
        telefon: lead.telefon || '',
        eposta: lead.eposta || '',
        tuketim: lead.tuketim || '',
        sektor: lead.sektor || '',
        mesaj: lead.mesaj || '',
        lang: lead.lang || 'tr',
        utm: lead.utm || {},
        receivedAt: lead.receivedAt || null,
      });
    } catch (e) {
      // Bozuk tek kayıt tüm sayfayı düşürmesin; sayım yine doğru kalır.
      console.error('lead parse failed for one record');
    }
  }

  const last = pageKeys.length ? pageKeys[pageKeys.length - 1].ts : null;
  const hasMore = last !== null && keys.some((k) => k.ts < last);

  return json({
    ok: true,
    total,
    truncated,
    count: records.length,
    nextBefore: hasMore ? last : null,
    records,
  });
}
