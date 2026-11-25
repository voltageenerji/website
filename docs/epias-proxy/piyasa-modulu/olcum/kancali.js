// workerd ölçümü: KANCALI örnek host (ornek-host.js'in varsayılan dışa aktarımı, iki kanca satırıyla).
// YALNIZ YEREL ÖLÇÜM: EPİAŞ adresleri yerel sahte sunucuya (env.SAHTE_EPIAS_URL) yönlendirilir; modül
// koduna dokunulmaz (modül fetch'i çağrı anında globalThis.fetch üzerinden yapar).
import host from '../ornek-host.js';

const asilFetch = globalThis.fetch;
let hedef = null;
const EPIAS = ['https://giris.epias.com.tr/', 'https://seffaflik.epias.com.tr/'];
globalThis.fetch = (url, init) => {
  const u = typeof url === 'string' ? url : url && url.url;
  const kok = EPIAS.find((k) => typeof u === 'string' && u.startsWith(k));
  if (kok) {
    if (!hedef) return Promise.reject(new Error('sahte EPİAŞ adresi yok'));
    return asilFetch(hedef + '/' + u.slice(kok.length), init);
  }
  return asilFetch(url, init);
};

export default {
  fetch(request, env, ctx) { hedef = env.SAHTE_EPIAS_URL || null; return host.fetch(request, env, ctx); },
  scheduled(controller, env, ctx) { hedef = env.SAHTE_EPIAS_URL || null; return host.scheduled(controller, env, ctx); },
};
