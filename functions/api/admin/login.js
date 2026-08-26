/**
 * POST /api/admin/login — panel girişi.
 * Gövde: { user, pass } → başarılıysa imzalı oturum çerezi.
 *
 * Gerekli ortam değişkenleri (Cloudflare Pages):
 *   ADMIN_USER            — kullanıcı adı (düz metin)
 *   ADMIN_PASS_HASH       — `node tools/admin-hash.mjs` çıktısı (PBKDF2)
 *   ADMIN_SESSION_SECRET  — uzun rastgele dize (oturum imzası)
 *
 * DELETE /api/admin/login → çıkış (çerezi siler).
 *
 * Güvenlik notları:
 *  - Kullanıcı adı yanlış / parola yanlış / kullanıcı yok — hepsi AYNI yanıtı
 *    döner (401 invalid_credentials). Hangi alanın yanlış olduğu sızmaz.
 *  - Kullanıcı adı yanlış olsa bile parola doğrulaması yine çalıştırılır:
 *    aksi hâlde yanıt süresi kullanıcı adının varlığını ele verirdi.
 *  - IP başına 15 dakikada 8 deneme; aşılırsa 429.
 */

import {
  verifyPassword, timingSafeEqual, createSession, sessionCookie, clearCookie,
  rateLimitKey, checkRateLimit, recordFailure, clearFailures,
} from '../../../lib/admin-auth.js';

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      ...extraHeaders,
    },
  });
}

function sameOriginOnly(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // tarayıcı dışı istemci; CSRF vektörü değil
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch (e) {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!sameOriginOnly(request)) return json({ ok: false, error: 'forbidden' }, 403);

  // Yapılandırma eksikse panel kapalıdır — yarı çalışan bir kapı bırakmayız.
  if (!env.ADMIN_USER || !env.ADMIN_PASS_HASH || !env.ADMIN_SESSION_SECRET) {
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  const kv = env.LEADS || null;
  const rlKey = await rateLimitKey(request);
  const rl = await checkRateLimit(kv, rlKey);
  if (rl.blocked) {
    // Sayaç okunamıyorsa bu bir kilit DEĞİL, altyapı arızasıdır: operatöre
    // "15 dakika bekleyin" demek, beklemekle düzelmeyecek bir durum için
    // saatler kaybettirirdi (QA N9).
    return rl.reason === 'unavailable'
      ? json({ ok: false, error: 'rate_limit_unavailable' }, 503)
      : json({ ok: false, error: 'too_many_attempts' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  const user = typeof body?.user === 'string' ? body.user.trim() : '';
  const pass = typeof body?.pass === 'string' ? body.pass : '';
  if (!user || !pass) return json({ ok: false, error: 'invalid_credentials' }, 401);

  // İKİ doğrulama da HER ZAMAN çalışır: erken çıkış, yanıt süresinden
  // kullanıcı adının doğru olup olmadığını ele verirdi.
  const [userOk, passOk] = await Promise.all([
    timingSafeEqual(user, String(env.ADMIN_USER).trim()),
    verifyPassword(pass, env.ADMIN_PASS_HASH),
  ]);

  if (!userOk || !passOk) {
    await recordFailure(kv, rlKey);
    return json({ ok: false, error: 'invalid_credentials' }, 401);
  }

  await clearFailures(kv, rlKey);
  const { token, exp } = await createSession(env.ADMIN_SESSION_SECRET);
  return json({ ok: true, exp }, 200, { 'Set-Cookie': sessionCookie(token) });
}

export async function onRequestDelete() {
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });
}
