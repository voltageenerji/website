// !!! UYDURMA TEST VERİSİ — gerçek piyasa değeri DEĞİLDİR. Yalnız bu klasördeki testler ve
// ölçüm betikleri kullanır. Kimlik ve belirteç değerleri hiçbir gerçek hesaba ait değildir.

/** Testlerin sabit "şimdi"si: 24.11.2026 14:30 (Europe/Istanbul). */
export const SABIT_AN = Date.UTC(2026, 10, 24, 11, 30, 0);
export const ANAHTAR_1 = 'test-okuma-belirteci-1-ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ANAHTAR_2 = 'test-okuma-belirteci-2-abcdefghijklmnopqrstuvwxyz';
export const SAHTE_ENV = Object.freeze({
  EPIAS_USERNAME: 'test-kullanici@ornek.invalid',
  EPIAS_PASSWORD: 'test-parola-degeri-xyz',
});

const gunEkle = (ymd, n) => { const [y, m, d] = ymd.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
export { gunEkle };

/**
 * UYDURMA gün: n = yayımlanmış dönem sayısı (kalanında SMF/fiyat/yön boş). Hiçbir fiyat 0 değildir
 * (sıfır taraması için). tohum: farklı içerik üretmek için.
 */
export function sahteGun(ymd, n = 1e9, adimDk = 60, tohum = 0) {
  const out = [];
  const adet = 1440 / adimDk;
  for (let i = 0; i < adet; i++) {
    const dk = i * adimDk, hh = String(Math.floor(dk / 60)).padStart(2, '0'), mm = String(dk % 60).padStart(2, '0');
    const yayim = i < n;
    const ptf = 2000 + i * 10 + tohum;
    const yon = ['Enerji Açığı', 'Enerji Fazlası', 'Dengede'][i % 3];
    const smf = yon === 'Enerji Açığı' ? ptf + 300 : yon === 'Enerji Fazlası' ? ptf - 400 : ptf;
    out.push({
      date: `${ymd}T${hh}:${mm}:00+03:00`, time: `${hh}:${mm}`, ptf,
      smf: yayim ? smf : null,
      positiveImbalance: yayim ? Math.round(Math.min(ptf, smf) * 0.97 * 100) / 100 : null,
      negativeImbalance: yayim ? Math.round(Math.max(ptf, smf) * 1.06 * 100) / 100 : null,
      systemStatus: yayim ? yon : '',
    });
  }
  return out;
}

/**
 * Sahte EPİAŞ (giriş + rapor). Ağ yok; her istek kaydedilir.
 * ayar: girisDurum, girisGovde, girisAsili, girisFirlat, raporDurum, raporGovde, raporAsili, raporFirlat,
 *       gecikmeMs, zarf, gun(ymd) → kalemler, biletGecersiz, sayfaBoyu, sayfaHata
 */
export function sahteEpias(ayar = {}) {
  const e = {
    ayar: { girisDurum: 201, raporDurum: 200, zarf: 'items', gun: (g) => sahteGun(g), ...ayar },
    sayac: { giris: 0, rapor: 0 },
    istekler: [],
    an: ayar.an || SABIT_AN,
    sonBilet: null,
    simdi: () => e.an,
    ilerlet: (ms) => { e.an += ms; },
  };
  const asili = () => new Promise(() => {});
  e.fetch = async (url, init = {}) => {
    const u = String(url);
    const headers = {};
    for (const [k, v] of Object.entries(init.headers || {})) headers[k.toLowerCase()] = v;
    e.istekler.push({ url: u, method: init.method, headers, body: init.body, an: e.an });
    const a = e.ayar;
    if (u === 'https://giris.epias.com.tr/cas/v1/tickets') {
      e.sayac.giris++;
      if (a.girisAsili) return asili();
      if (a.girisFirlat) throw new TypeError('ag hatasi');
      if (a.girisDurum !== 201) return new Response('giris reddedildi', { status: a.girisDurum });
      e.sonBilet = `TGT-${1000 + e.sayac.giris}-sahteBiletDegeri-cas01`;
      return new Response(a.girisGovde !== undefined ? a.girisGovde : e.sonBilet, { status: 201 });
    }
    if (u === 'https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf') {
      e.sayac.rapor++;
      if (a.raporAsili) return asili();
      if (a.gecikmeMs) await new Promise((coz) => setTimeout(coz, a.gecikmeMs));
      if (a.raporFirlat) throw new TypeError('ag hatasi');
      if (a.biletGecersiz && headers.tgt === a.biletGecersiz) return new Response('yetkisiz', { status: 401 });
      if (a.raporDurum !== 200) return new Response('{"hata":"sunucu"}', { status: a.raporDurum });
      if (a.raporGovde !== undefined) return new Response(a.raporGovde, { status: 200 });
      const g = JSON.parse(init.body);
      const bas = g.startDate.slice(0, 10), bit = g.endDate.slice(0, 10);
      let liste = [];
      for (let d = bas; d <= bit; d = gunEkle(d, 1)) liste = liste.concat(a.gun(d));
      if (a.sayfaBoyu) {
        const no = (g.page && g.page.number) || 1;
        if (a.sayfaHata && no >= a.sayfaHata) return new Response('{"hata":"sunucu"}', { status: 500 });
        const dilim = liste.slice((no - 1) * a.sayfaBoyu, no * a.sayfaBoyu);
        return new Response(JSON.stringify({ items: dilim, page: { number: no, size: a.sayfaBoyu, sort: null, total: liste.length } }), { status: 200 });
      }
      const zarflar = {
        items: { items: liste, page: null }, 'body.content': { resultCode: '0', body: { content: liste } }, 'body.items': { body: { items: liste } },
        content: { content: liste }, dizi: liste, body: { body: liste },
      };
      return new Response(JSON.stringify(zarflar[a.zarf]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error('beklenmeyen adres');
  };
  return e;
}

/** Sahte Workers Cache API (caches.default) + işlem sayacı. */
export function sahteCache(olcum) {
  const depo = new Map();
  const say = () => { if (olcum) olcum.n++; };
  return {
    depo,
    match: async (k) => { say(); return depo.has(String(k)) ? new Response(depo.get(String(k))) : undefined; },
    put: async (k, r) => { say(); depo.set(String(k), await r.text()); },
    delete: async (k) => { say(); return depo.delete(String(k)); },
  };
}

/** Sahte KV ad alanı. toplu: get(dizi) → Map desteği (Workers KV toplu okuma). */
export function sahteKv(sec = {}) {
  const olcum = sec.olcum;
  const kv = { depo: new Map(), ttl: new Map(), yazim: 0, okuma: 0, topluOkuma: 0, yazilanlar: [], bozuk: false };
  const say = () => { if (olcum) olcum.n++; };
  kv.get = async (anahtar, tur) => {
    say();
    if (kv.bozuk) throw new Error('kv');
    const t = typeof tur === 'string' ? tur : tur && tur.type;
    const coz = (v) => (v === undefined ? null : t === 'json' ? JSON.parse(v) : v);
    if (Array.isArray(anahtar)) {
      if (!sec.toplu) return null; // eski çalışma zamanı: dizi anahtar metne çevrilir, bulunmaz
      kv.topluOkuma++;
      return new Map(anahtar.map((a) => [a, coz(kv.depo.get(a))]));
    }
    kv.okuma++;
    return coz(kv.depo.get(anahtar));
  };
  kv.put = async (anahtar, deger, s) => {
    say();
    if (kv.bozuk) throw new Error('kv');
    kv.yazim++; kv.yazilanlar.push(anahtar); kv.depo.set(anahtar, deger); kv.ttl.set(anahtar, s && s.expirationTtl);
  };
  return kv;
}
