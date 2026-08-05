/**
 * GET /feed/linkedin — LinkedIn kuyruğu için zaman kapılı RSS 2.0 beslemesi.
 * Cloudflare Pages Function (plain JS, zero dependencies).
 *
 * Drip-feed deseni: /linkedin-queue.json içindeki gönderiler yalnızca
 * publishAt zamanı GEÇTİKTEN sonra beslemede görünür. Dış köprü
 * (Zapier "RSS by Zapier" veya Buffer) beslemeyi izler ve yeni öğeyi
 * LinkedIn şirket sayfasına otomatik gönderir → sıfır manuel adım.
 *
 * Veri sözleşmesi (linkedin-queue.json, repo kökü, public):
 *   [{ id, publishAt (ISO 8601, +03:00), title, text, link }]
 *
 * Hata modları (sessiz bozulma yok):
 *   - Kuyruk dosyası yok / JSON bozuk → 500 + açık hata metni
 *   - Vadesi gelen öğe yok → geçerli, dürüst BOŞ kanal (200)
 *   - GET dışı metod → 405
 *
 * Yönlendirme: /feed/linkedin (asıl yol). /feed/linkedin.xml → 301 ile
 * buraya gelir (_redirects). Cache: public, max-age=300 (_headers ile uyumlu).
 * Kimlik doğrulama yok — içerik tasarım gereği kamuya açık (yayınlanacak
 * LinkedIn gönderileri, sır içermez).
 */

const CHANNEL_TITLE = 'Voltage Enerji LinkedIn Kuyruğu';
const CHANNEL_LINK = 'https://voltage.com.tr';
const CHANNEL_DESC =
  'Voltage Enerji LinkedIn şirket sayfası için zamanı gelen gönderiler. ' +
  'Öğeler planlanan yayın saatinden sonra görünür.';

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cdata(s) {
  // "]]>" dizisi CDATA'yı kapatır — güvenli parçalama ile kaçır.
  return '<![CDATA[' + String(s).replace(/\]\]>/g, ']]]]><![CDATA[>') + ']]>';
}

function rfc822(date) {
  // RFC 822/1123 (RSS 2.0 pubDate) — UTC gösterimi geçerlidir.
  return date.toUTCString();
}

function rssResponse(xml, status = 200) {
  return new Response(xml, {
    status,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function buildFeed(items, now) {
  const itemsXml = items
    .map(
      (it) => `    <item>
      <title>${escapeXml(it.title)}</title>
      <description>${cdata(it.text)}</description>
      <link>${escapeXml(it.link)}</link>
      <guid isPermaLink="false">${escapeXml(it.id)}</guid>
      <pubDate>${rfc822(new Date(it.publishAt))}</pubDate>
    </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(CHANNEL_TITLE)}</title>
    <link>${escapeXml(CHANNEL_LINK)}</link>
    <description>${escapeXml(CHANNEL_DESC)}</description>
    <language>tr</language>
    <lastBuildDate>${rfc822(now)}</lastBuildDate>
${itemsXml ? itemsXml + '\n' : ''}  </channel>
</rss>
`;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET', 'Cache-Control': 'no-store' },
    });
  }

  let queue;
  try {
    const res = await env.ASSETS.fetch(new URL('/linkedin-queue.json', request.url));
    if (!res.ok) throw new Error('queue fetch status ' + res.status);
    queue = await res.json();
    if (!Array.isArray(queue)) throw new Error('queue is not an array');
  } catch (err) {
    // Yüksek sesle başarısız ol — köprü tarafında görünür olsun (sessiz bozulma yasak).
    return new Response('linkedin-queue.json okunamadi: ' + (err && err.message), {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const now = new Date(Date.now());
  const due = queue
    .filter((it) => {
      if (!it || typeof it !== 'object') return false;
      const t = Date.parse(it.publishAt);
      return Number.isFinite(t) && t <= now.getTime() && it.id && it.title != null && it.text != null && it.link;
    })
    // En yeni en üstte (RSS geleneği); köprüler guid ile tekilleştirir.
    .sort((a, b) => Date.parse(b.publishAt) - Date.parse(a.publishAt));

  return rssResponse(buildFeed(due, now));
}
