// !!! UYDURMA TEST VERİSİ — gerçek piyasa değeri DEĞİLDİR.
// Yalnızca docs/qa/test-dengesizlik*.mjs testleri içe aktarır; sayfada, veri
// ucunda ya da herhangi bir yayında KULLANILMAZ. (/docs/* dışarıya servis edilmez.)

/** UYDURMA test günü üretici: n = yayımlanmış dönem sayısı (kalanında SMF/fiyat boş). */
export function sahteGun(ymd, n = 24, adimDk = 60) {
  const out = [];
  const adet = 1440 / adimDk;
  for (let i = 0; i < adet; i++) {
    const dk = i * adimDk, hh = String(Math.floor(dk / 60)).padStart(2, '0'), mm = String(dk % 60).padStart(2, '0');
    const yayim = i < n;
    const ptf = 2000 + i * 10;
    const yon = ['Enerji Açığı', 'Enerji Fazlası', 'Dengede'][i % 3];
    const smf = yon === 'Enerji Açığı' ? ptf + 300 : yon === 'Enerji Fazlası' ? ptf - 400 : ptf;
    const k = { 'Enerji Açığı': 0.06, 'Enerji Fazlası': 0.03, Dengede: 0.03 }[yon];
    const l = { 'Enerji Açığı': 0.03, 'Enerji Fazlası': 0.06, Dengede: 0.03 }[yon];
    out.push({
      date: `${ymd}T${hh}:${mm}:00+03:00`, time: `${hh}:${mm}`, ptf,
      smf: yayim ? smf : null,
      positiveImbalance: yayim ? Math.round(Math.min(ptf, smf) * (1 - l) * 100) / 100 : null,
      negativeImbalance: yayim ? Math.round(Math.max(ptf, smf) * (1 + k) * 100) / 100 : null,
      systemStatus: yayim ? yon : '',
    });
  }
  return out;
}

/** Testlerin sabit "şimdi"si: 24.11.2026 14:30 (Europe/Istanbul). */
export const SABIT_AN = Date.UTC(2026, 10, 24, 11, 30, 0);

/** Sahte kimlik: gerçek hiçbir hesaba ait değildir. */
export const SAHTE_ENV = Object.freeze({ EPIAS_USERNAME: 'test-kullanici@ornek.invalid', EPIAS_PASSWORD: 'test-parola-degeri' });

const gunEkle = (ymd, n) => { const [y, m, d] = ymd.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };

/**
 * Sahte EPİAŞ (giris + rapor). Ağ yok; her istek kaydedilir.
 * ayar: girisDurum, girisGovde, girisAsili, raporDurum, raporGovde, raporAsili, govdeAsili,
 *       raporFirlat, zarf ('items'|'body.content'|'body.items'|'content'|'dizi'|'body'),
 *       gun(ymd) → kalemler, biletGecersiz (bu bilet 401 alır)
 */
export function sahteEpias(ayar = {}) {
  const e = {
    ayar: { girisDurum: 201, raporDurum: 200, zarf: 'items', gun: (g) => sahteGun(g), ...ayar },
    sayac: { giris: 0, rapor: 0 },
    istekler: [],
    an: SABIT_AN,
    sonBilet: null,
    simdi: () => e.an,
    ilerlet: (ms) => { e.an += ms; },
  };
  const asili = () => new Promise(() => {});
  e.fetch = async (url, init = {}) => {
    const u = String(url);
    const headers = {};
    for (const [k, v] of Object.entries(init.headers || {})) headers[k.toLowerCase()] = v;
    e.istekler.push({ url: u, method: init.method, headers, body: init.body });
    const a = e.ayar;
    if (u.startsWith('https://giris.epias.com.tr/cas/v1/tickets')) {
      e.sayac.giris++;
      if (a.girisAsili) return asili();
      if (a.girisDurum !== 201) return new Response('giris reddedildi', { status: a.girisDurum });
      e.sonBilet = `TGT-${1000 + e.sayac.giris}-sahteBiletDegeri-cas01`;
      return new Response(a.girisGovde !== undefined ? a.girisGovde : e.sonBilet, { status: 201 });
    }
    if (u.startsWith('https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf')) {
      e.sayac.rapor++;
      if (a.raporAsili) return asili();
      if (a.raporFirlat) throw new TypeError('ag hatasi');
      if (a.biletGecersiz && headers.tgt === a.biletGecersiz) return new Response('yetkisiz', { status: 401 });
      if (a.raporDurum !== 200) return new Response('{"hata":"sunucu"}', { status: a.raporDurum });
      if (a.govdeAsili) return { ok: true, status: 200, json: asili, text: asili, headers: new Headers() };
      if (a.raporGovde !== undefined) return new Response(a.raporGovde, { status: 200 });
      const g = JSON.parse(init.body);
      const bas = g.startDate.slice(0, 10), bit = g.endDate.slice(0, 10);
      let liste = [];
      for (let d = bas; d <= bit; d = gunEkle(d, 1)) liste = liste.concat(a.gun(d));
      const zarflar = {
        items: { items: liste, page: null }, 'body.content': { resultCode: '0', body: { content: liste } }, 'body.items': { body: { items: liste } },
        content: { content: liste }, dizi: liste, body: { body: liste },
      };
      return new Response(JSON.stringify(zarflar[a.zarf]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error('beklenmeyen adres: ' + u);
  };
  return e;
}

/** Sahte Workers Cache API (caches.default). */
export function sahteCache() {
  const depo = new Map();
  return {
    depo,
    match: async (anahtar) => (depo.has(String(anahtar)) ? new Response(depo.get(String(anahtar))) : undefined),
    put: async (anahtar, yanit) => { depo.set(String(anahtar), await yanit.text()); },
  };
}

/** Sahte KV ad alanı (env.PIYASA). */
export function sahteKv() {
  const kv = { depo: new Map(), ttl: new Map(), yazim: 0 };
  kv.get = async (anahtar, tur) => { const v = kv.depo.get(anahtar); return v === undefined ? null : tur === 'json' ? JSON.parse(v) : v; };
  kv.put = async (anahtar, deger, sec) => { kv.yazim++; kv.depo.set(anahtar, deger); kv.ttl.set(anahtar, sec && sec.expirationTtl); };
  return kv;
}
