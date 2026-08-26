/**
 * Yönetim paneli kimlik doğrulama çekirdeği.
 *
 * TASARIM KARARLARI (panel GERÇEK kişisel veri gösterir — isim, telefon,
 * e-posta; bu yüzden güvenlik burada pazarlık konusu değildir):
 *
 *  - Parola repoda TUTULMAZ. Cloudflare ortam değişkeni `ADMIN_PASS_HASH`
 *    içinde PBKDF2-SHA256 özeti olarak durur: `pbkdf2$<iter>$<saltB64>$<hashB64>`.
 *    Özeti üretmek için: `node tools/admin-hash.mjs` (parola hiçbir yere gitmez).
 *  - Oturum çerezi HMAC ile imzalanır (`ADMIN_SESSION_SECRET`). Sunucu tarafında
 *    oturum deposu yoktur; çerez kendi kendini doğrular ve süresi dolar.
 *  - Çerez: HttpOnly + Secure + SameSite=Strict + Path=/ → JS okuyamaz,
 *    siteler arası istekle gönderilmez.
 *  - Tüm karşılaştırmalar sabit zamanlıdır (uzunluk/ön ek sızıntısı yok).
 *  - Kaba kuvvet: IP başına deneme sayacı KV'de tutulur. IP HAM olarak
 *    saklanmaz — SHA-256 özeti ve kısa TTL ile (KVKK: veri minimizasyonu).
 *
 * Bu dosya gizli bilgi İÇERMEZ; güvenlik anahtarların gizliliğine dayanır.
 */

const COOKIE_NAME = 'vsess';
const SESSION_TTL_SEC = 8 * 60 * 60; // bir mesai günü
const PBKDF2_ITERATIONS = 210000;
const RL_MAX_ATTEMPTS = 8;
const RL_WINDOW_SEC = 900; // 15 dk

const enc = new TextEncoder();

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

function b64urlFromBytes(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bytesFromB64(b64) {
  const norm = b64.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(norm);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Sabit zamanlı bayt karşılaştırması. */
function timingSafeEqualBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Sabit zamanlı metin karşılaştırması (uzunluk farkını da gizler). */
export async function timingSafeEqual(a, b) {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(String(a))),
    crypto.subtle.digest('SHA-256', enc.encode(String(b))),
  ]);
  return timingSafeEqualBytes(new Uint8Array(ha), new Uint8Array(hb));
}

export async function sha256Hex(s) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(String(s)));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Parola
// ---------------------------------------------------------------------------

/** `pbkdf2$<iter>$<saltB64>$<hashB64>` üretir. Testler ve tools/ tarafından da kullanılır. */
export async function hashPassword(password, saltBytes, iterations = PBKDF2_ITERATIONS) {
  const salt = saltBytes || crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256,
  );
  return `pbkdf2$${iterations}$${b64urlFromBytes(salt)}$${b64urlFromBytes(new Uint8Array(bits))}`;
}

/** Saklanan özete karşı parolayı doğrular. Biçim bozuksa sessizce false. */
export async function verifyPassword(password, stored) {
  try {
    const parts = String(stored || '').split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations < 1000 || iterations > 5000000) return false;
    const salt = bytesFromB64(parts[2]);
    const expected = bytesFromB64(parts[3]);
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, expected.length * 8,
    );
    return timingSafeEqualBytes(new Uint8Array(bits), expected);
  } catch (e) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Oturum çerezi
// ---------------------------------------------------------------------------

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return new Uint8Array(sig);
}

/** `v1.<expSec>.<sigB64url>` — sunucu tarafı oturum deposu yok. */
export async function createSession(secret, nowMs = Date.now(), ttlSec = SESSION_TTL_SEC) {
  const exp = Math.floor(nowMs / 1000) + ttlSec;
  const payload = `v1.${exp}`;
  const sig = await hmac(secret, payload);
  return { token: `${payload}.${b64urlFromBytes(sig)}`, exp };
}

/** Geçerliyse { exp } döner, aksi hâlde null. */
export async function verifySession(secret, token, nowMs = Date.now()) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3 || parts[0] !== 'v1') return null;
    const exp = Number(parts[1]);
    if (!Number.isInteger(exp)) return null;
    const expected = await hmac(secret, `v1.${parts[1]}`);
    if (!timingSafeEqualBytes(bytesFromB64(parts[2]), expected)) return null;
    // İmza doğrulandıktan SONRA süre kontrolü: geçersiz imzalı bir token
    // "süresi dolmuş" gibi ayırt edilemesin.
    if (exp * 1000 <= nowMs) return null;
    return { exp };
  } catch (e) {
    return null;
  }
}

export function sessionCookie(token, maxAgeSec = SESSION_TTL_SEC) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSec}`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export function readCookie(request) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE_NAME) return v.join('=');
  }
  return null;
}

/** İstekteki oturumu doğrular; env eksikse veya oturum yoksa null. */
export async function requireSession(context) {
  const secret = context.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  return verifySession(secret, readCookie(context.request));
}

// ---------------------------------------------------------------------------
// Kaba kuvvet sınırlayıcı
// ---------------------------------------------------------------------------

/** IP ham saklanmaz: özet + kısa TTL (KVKK veri minimizasyonu). */
export async function rateLimitKey(request) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  return `admin:rl:${(await sha256Hex(ip)).slice(0, 32)}`;
}

/** { blocked, remaining } döner. KV yoksa engellemez (panel erişilemez olmasın). */
export async function checkRateLimit(kv, key, nowMs = Date.now()) {
  if (!kv) return { blocked: false, remaining: RL_MAX_ATTEMPTS };
  try {
    const raw = await kv.get(key);
    const rec = raw ? JSON.parse(raw) : null;
    if (!rec || nowMs - rec.first > RL_WINDOW_SEC * 1000) return { blocked: false, remaining: RL_MAX_ATTEMPTS };
    return { blocked: rec.n >= RL_MAX_ATTEMPTS, remaining: Math.max(0, RL_MAX_ATTEMPTS - rec.n) };
  } catch (e) {
    return { blocked: false, remaining: RL_MAX_ATTEMPTS };
  }
}

export async function recordFailure(kv, key, nowMs = Date.now()) {
  if (!kv) return;
  try {
    const raw = await kv.get(key);
    const rec = raw ? JSON.parse(raw) : null;
    const fresh = !rec || nowMs - rec.first > RL_WINDOW_SEC * 1000;
    const next = fresh ? { n: 1, first: nowMs } : { n: rec.n + 1, first: rec.first };
    await kv.put(key, JSON.stringify(next), { expirationTtl: RL_WINDOW_SEC });
  } catch (e) { /* sayaç yazılamazsa giriş yine de reddedilmiştir */ }
}

export async function clearFailures(kv, key) {
  if (!kv) return;
  try { await kv.delete(key); } catch (e) { /* önemsiz */ }
}

export const ADMIN_CONST = { COOKIE_NAME, SESSION_TTL_SEC, RL_MAX_ATTEMPTS, RL_WINDOW_SEC, PBKDF2_ITERATIONS };
