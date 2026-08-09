/**
 * /api/score — Transmission Dash (404 oyunu) lider tablosu.
 * Cloudflare Pages Function (plain JS, zero dependencies).
 *
 *   GET    → { ok, board: [{n,m,d,t}...] }  (ilk 20; n=isim, m=MWh, d=metre, t=zaman)
 *   POST   → { name, mwh, dist } kaydeder; { ok, board, you } döner
 *   DELETE → tabloyu sıfırlar (Authorization: Bearer REPORT_TOKEN zorunlu)
 *
 * Tasarım: hesap/oturum YOK. Tüm tablo tek KV anahtarında tutulur (lb:board,
 * en iyi 50). Aynı isim tekrar kayıt olursa yalnız daha yüksek skor kalır.
 * KV bağlaması: SCORES varsa o, yoksa LEADS ('lb:' öneki lead anahtarlarıyla
 * çakışmaz; lead raporu 'lead:' önekiyle listeler).
 *
 * Dürüstlük kuralı: kalıcılık yoksa sahte başarı dönülmez (503).
 * Skor istemciden gelir — bu bir oyun, bankacılık değil; makul sınır ve
 * akla yatkınlık denetimleri var, gerisi gerekirse sıfırlanır.
 */

const KEY = 'lb:board';
const MAX_STORED = 50;
const MAX_RETURNED = 20;
const NAME_MIN = 2;
const NAME_MAX = 24;
const MWH_MIN = 12; // bir paket bile toplamadan tabloya girilmez
const MWH_MAX = 50000;
const DIST_MAX = 2000000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function kvOf(env) {
  return env.SCORES || env.LEADS || null;
}

/** Same-origin denetimi — lead.js ile aynı yaklaşım. */
function crossOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try {
    return new URL(origin).host !== new URL(request.url).host;
  } catch (e) {
    return true;
  }
}

function timingSafeEqual(a, b) {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

/**
 * Tabloyu okur. DÖNÜŞ SÖZLEŞMESİ (QA D1): null = okuma/parse HATASI —
 * çağıran 503 dönmeli ve ASLA üzerine yazmamalı (yoksa geçici bir KV
 * hatası 49 kaydı tek kayıtla ezerdi). [] yalnız "anahtar hiç yok" durumudur.
 */
async function readBoard(kv) {
  let raw;
  try {
    raw = await kv.get(KEY);
  } catch (e) {
    console.error('lb read failed:', e.message);
    return null;
  }
  if (raw === null || raw === undefined) return [];
  try {
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.entries)) return data.entries;
  } catch (e) {
    console.error('lb parse failed:', e.message);
  }
  return null; // bozuk kayıt — onarım yolu DELETE (reset), sessiz silme değil
}

function cleanName(v) {
  return String(v ?? '')
    .replace(/[\x00-\x1F\x7F<>&"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX);
}

// ---------------------------------------------------------------------------
// İsim sansürü — küfür/hakaret içeren adlar tabloya giremez.
// İki katman (yanlış pozitifleri sınırlamak için):
//  - SUB: boşluk/noktalama atılmış metinde ALT DİZGİ olarak aranan net kökler
//  - TOKEN: yalnız TAM KELİME olarak aranan kısa/riskli kelimeler
//    ("sik" alt dizgi olsaydı "Klasik" de yanardı)
// Leetspeak ve Türkçe karakterler önce katlanır (0→o, 1→i, ş→s ...).
// Liste mükemmel olamaz — kaçanı DELETE (reset) temizler.
// ---------------------------------------------------------------------------

const BANNED_SUB = [
  'orospu', 'oruspu', 'amcik', 'amcuk', 'yarrak', 'yarak', 'siktir', 'sikerim',
  'sikeyim', 'sikis', 'sikik', 'sikim', 'pezeven', 'kahpe', 'kaltak', 'ibne',
  'ipne', 'yavsak', 'pust', 'gotveren', 'serefsiz', 'gerizekal', 'ananisik',
  'fuck', 'fck', 'bitch', 'cunt', 'nigg', 'whore', 'slut', 'asshole', 'porno',
  'wanker', 'shit', 'penis',
];
const BANNED_TOKEN = [
  'sik', 'am', 'amk', 'amq', 'aq', 'mk', 'oc', 'pic', 'got', 'salak', 'aptal',
  'mal', 'gerizekali', 'dick', 'cock', 'piss', 'anal', 'gay', 'hoe',
];

const FOLD = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '$': 's', '@': 'a', 'ç': 'c', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ı': 'i', 'â': 'a', 'î': 'i', 'û': 'u' };

function foldName(s) {
  return s.toLocaleLowerCase('tr').replace(/[013457$@çşğüöıâîû]/g, (c) => FOLD[c] ?? c);
}

function isBannedName(name) {
  const folded = foldName(name);
  const tokens = folded.split(/[^a-z]+/).filter(Boolean);
  const compact = folded.replace(/[^a-z]/g, '');
  const collapsed = compact.replace(/(.)\1+/g, '$1'); // "orrrospu" → "orospu"
  if (BANNED_SUB.some((r) => compact.includes(r) || collapsed.includes(r))) return true;
  if (tokens.some((tok) => BANNED_TOKEN.includes(tok))) return true;
  return false;
}

export async function onRequestGet(context) {
  const kv = kvOf(context.env);
  if (!kv) return json({ ok: false, error: 'no_persistence' }, 503);
  const entries = await readBoard(kv);
  if (entries === null) return json({ ok: false, error: 'no_persistence' }, 503);
  return json({ ok: true, board: entries.slice(0, MAX_RETURNED) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (crossOrigin(request)) return json({ ok: false, error: 'forbidden' }, 403);
  const kv = kvOf(env);
  if (!kv) return json({ ok: false, error: 'no_persistence' }, 503);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'invalid_payload' }, 400);

  const name = cleanName(body.name);
  if (name.length < NAME_MIN) return json({ ok: false, error: 'invalid_name' }, 400);
  if (isBannedName(name)) return json({ ok: false, error: 'blocked_name' }, 400);

  const mwh = Number(body.mwh);
  const dist = Number(body.dist);
  // Akla yatkınlık: MWh yalnız 12'lik paket + 20'lik bonus kombinasyonlarından
  // oluşur → her geçerli skor 4'ün katıdır. Kaba hileyi eler, gerisi resetlenir.
  if (!Number.isInteger(mwh) || mwh < MWH_MIN || mwh > MWH_MAX || mwh % 4 !== 0) {
    return json({ ok: false, error: 'invalid_score' }, 400);
  }
  if (!Number.isFinite(dist) || dist < 0 || dist > DIST_MAX) {
    return json({ ok: false, error: 'invalid_score' }, 400);
  }

  let entries = await readBoard(kv);
  if (entries === null) return json({ ok: false, error: 'no_persistence' }, 503);

  // Aynı isim: yalnız en iyi skor tutulur
  const lower = name.toLocaleLowerCase('tr');
  const existing = entries.findIndex((e) => String(e.n).toLocaleLowerCase('tr') === lower);
  if (existing >= 0) {
    if (entries[existing].m >= mwh) {
      const youKept = existing < MAX_RETURNED ? existing : -1;
      return json({ ok: true, board: entries.slice(0, MAX_RETURNED), you: youKept, kept: true });
    }
    entries.splice(existing, 1);
  }

  entries.push({ n: name, m: mwh, d: Math.round(dist), t: Date.now() });
  entries.sort((a, b) => (b.m - a.m) || (b.d - a.d) || (a.t - b.t));
  entries = entries.slice(0, MAX_STORED);

  try {
    await kv.put(KEY, JSON.stringify({ v: 1, entries }));
  } catch (e) {
    console.error('lb write failed:', e.message);
    return json({ ok: false, error: 'no_persistence' }, 503);
  }

  // you: dönen 20'lik dilimdeki satır; oyuncu 21-50 bandındaysa -1 (QA N1)
  const idx = entries.findIndex((e) => String(e.n).toLocaleLowerCase('tr') === lower);
  return json({ ok: true, board: entries.slice(0, MAX_RETURNED), you: idx < MAX_RETURNED ? idx : -1 });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  // Kimlik doğrulama ÖNCE — yapılandırma teşhisi yetkisiz kullanıcıya sızmaz.
  if (!env.REPORT_TOKEN) return json({ ok: false, error: 'not_configured' }, 503);
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !timingSafeEqual(token, env.REPORT_TOKEN)) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  const kv = kvOf(env);
  if (!kv) return json({ ok: false, error: 'no_persistence' }, 503);
  try {
    await kv.put(KEY, JSON.stringify({ v: 1, entries: [] }));
  } catch (e) {
    return json({ ok: false, error: 'no_persistence' }, 503);
  }
  return json({ ok: true, reset: true });
}
