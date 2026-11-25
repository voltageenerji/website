/**
 * Önizleme adresleri arama dizinine girmez.
 *
 * Üretim alan adı yalnız voltage.com.tr ve www.voltage.com.tr'dir. Başka her host
 * (*.pages.dev dal ve sürüm önizlemeleri, yerel wrangler, çözümlenemeyen adres) önizleme
 * sayılır: yanıta "X-Robots-Tag: noindex, nofollow" eklenir ve HTML'deki robots meta etiketi
 * "noindex, nofollow" olur. Canonical değişmez (her zaman https://voltage.com.tr/… gösterir).
 *
 * _headers'taki pages.dev kuralları Pages Function yanıtlarına UYGULANMAZ; bu yüzden
 * Function'lar (sayfa ve /veri, GET ve HEAD) başlığı burada kendileri ekler.
 *
 * Bu dosya Pages Function DEĞİLDİR (onRequest* dışa aktarmaz, rota üretmez).
 */
export const URETIM_HOSTLARI = Object.freeze(['voltage.com.tr', 'www.voltage.com.tr']);
export const ONIZLEME_ROBOTS = 'noindex, nofollow';

/** İstek üretim alan adına mı? Çözümlenemeyen adres önizleme sayılır (kapalı başarısızlık). */
export function uretimMi(istek) {
  try {
    return URETIM_HOSTLARI.includes(new URL(istek.url).hostname.toLowerCase());
  } catch (e) {
    return false;
  }
}

const ROBOTS_META = /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i;

/** HTML'de robots meta etiketini önizleme değerine çeker; yoksa <head> başına ekler. */
export function robotsMetaOnizleme(html) {
  const etiket = `<meta name="robots" content="${ONIZLEME_ROBOTS}">`;
  if (ROBOTS_META.test(html)) return html.replace(ROBOTS_META, () => etiket);
  return html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n${etiket}`);
}

/**
 * Yanıtı önizleme için işaretler (üretim hostunda yanıt AYNEN döner). Fırlatmaz: işaretleme
 * başarısız olursa yanıt yine başlıkla kopyalanmaya çalışılır, o da olmazsa aynen döner.
 */
export async function onizlemeKoru(istek, yanit) {
  if (!yanit || uretimMi(istek)) return yanit;
  try {
    const h = new Headers(yanit.headers);
    h.set('X-Robots-Tag', ONIZLEME_ROBOTS);
    const html = /^text\/html/i.test(h.get('Content-Type') || '') && yanit.body;
    if (!html) return new Response(yanit.body, { status: yanit.status, statusText: yanit.statusText, headers: h });
    h.delete('content-length'); h.delete('etag'); h.delete('content-encoding');
    return new Response(robotsMetaOnizleme(await yanit.text()), { status: yanit.status, statusText: yanit.statusText, headers: h });
  } catch (e) {
    return yanit;
  }
}
