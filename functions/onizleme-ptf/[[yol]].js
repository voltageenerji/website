// GEÇİCİ — yalnız önizleme dağıtımı içindir; dalın ucunda ve main'de bulunmaz.
// epias-proxy CORS yalnız https://voltage.com.tr kökenine izin verdiği için önizleme
// sayfası gerçek EPİAŞ verisini bu aynı-köken aktarıcı üzerinden okur. Veri değiştirilmez.
const PROXY = 'https://epias-proxy.emirhantan-ku.workers.dev';
export async function onRequestGet({ params }) {
  const yol = [].concat(params.yol || []).join('/');
  if (yol !== 'ptf/today' && yol !== 'ptf/stats') return new Response('yok', { status: 404 });
  const r = await fetch(PROXY + '/' + yol, { cf: { cacheTtl: 120, cacheEverything: true } });
  return new Response(r.body, {
    status: r.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}
