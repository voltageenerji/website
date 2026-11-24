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
