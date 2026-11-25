#!/usr/bin/env node
/**
 * CI ve gerçek tarayıcı (Safari/WebDriver, iOS Simülatörü) denetimleri için sabit portlu test sunucusu.
 * Sayfa GERÇEK fonksiyon modülleriyle, SAHTE proxy'yle sunulur (dengesizlik-test-sunucu.mjs).
 * !!! Fiyatlar UYDURMA TEST VERİSİDİR; bu sunucu yalnız 127.0.0.1'i dinler.
 *
 *   PORT=8787 node docs/qa/dengesizlik-ci-sunucu.mjs
 *
 * HTML yanıtlarına <head> başında küçük bir QA betiği eklenir (sitenin CSP'si 'unsafe-inline'
 * izin verir; betik sayfanın kendi betiğinden ÖNCE çalışır):
 *   - window.__qaHata: yakalanan JS hataları, işlenmeyen promise retleri, CSP ihlalleri
 *   - yüklemeden 4 sn sonra POST /__qa/rapor: satır sayısı, yatay taşma, hata sayısı, görünüm
 *     genişliği, kullanıcı ajanı (WebDriver'sız Mobile Safari'den DOM kanıtı)
 *   - ?qa=hesap: hesaplayıcının iki modunu sayfanın kendi formlarıyla çalıştırır ve sonucu raporlar
 * GET /__qa/raporlar → toplanan raporlar (JSON). Sayfanın kendisi değişmez.
 */
import http from 'node:http';
import { sunucuBaslat } from './dengesizlik-test-sunucu.mjs';
import { sahteGun } from './dengesizlik-test-verisi.mjs';

const PORT = Number(process.env.PORT) || 8787;
const OZEL = { ptf: 450, smf: 60, pozitif: -106, negatif: 463.5, yon: 'fazla', yonHam: 'Enerji Fazlası' };
const S = await sunucuBaslat({ gun: (g) => sahteGun(g, g === '2026-11-24' ? 11 : 24).map((o, i) => (i === 4 ? { ...o, ...OZEL } : o)) });
const raporlar = [];

const QA_BETIK = `<script>(function(){var h=window.__qaHata=[];
addEventListener('error',function(e){h.push('hata:'+String(e.message||e.type).slice(0,120))});
addEventListener('unhandledrejection',function(){h.push('promise')});
document.addEventListener('securitypolicyviolation',function(e){h.push('csp:'+e.violatedDirective)});
function metin(id){var e=document.getElementById(id);return e?e.textContent.replace(/\\s+/g,' ').trim():null}
function rapor(ek){var d=document.documentElement,r={yol:location.pathname+location.search,ua:navigator.userAgent,w:innerWidth,h:innerHeight,dpr:devicePixelRatio,
satir:document.querySelectorAll('#dTablo tr[data-bas]').length,tasma:d.scrollWidth>d.clientWidth,ozet:(metin('dOzet')||'').slice(0,40),mod:metin('dMod'),
kapKayar:(function(k){return k?k.scrollWidth>k.clientWidth:null})(document.getElementById('dTabloSar')),hata:h.slice(0,10),
olcu:['dBicim','sYon','hDonem','hMiktar','dTarih'].map(function(id){var e=document.getElementById(id);if(!e)return id+':-';var b=e.getBoundingClientRect();return id+':'+Math.round(b.height)+'px/'+parseFloat(getComputedStyle(e).fontSize)+'px'}).join(' ')};
for(var k in ek)r[k]=ek[k];try{fetch('/__qa/rapor',{method:'POST',body:JSON.stringify(r)})}catch(e){}}
addEventListener('load',function(){setTimeout(function(){
 if(/[?&]qa=hesap/.test(location.search)){var ek={};try{
  document.getElementById('hMiktar').value='5';document.querySelector('#hGun button[type=submit]').click();ek.gunTutar=metin('gTutar');ek.gunFiyat=metin('gFiyat');
  document.getElementById('hModSenaryo').click();document.getElementById('sPtf').value='2800';document.getElementById('sSmf').value='3400';document.getElementById('sMiktar').value='10';
  document.querySelector('#hSenaryo button[type=submit]').click();ek.senNeg=metin('sNegFiyat');ek.senPoz=metin('sPozFiyat');ek.senTutar=metin('sNegTutar');
  document.getElementById('hesaplayici').scrollIntoView();}catch(e){h.push('qa:'+e.message)}rapor(ek);}
 else rapor({});
},4000)});})();</script>`;

const on = http.createServer(async (req, res) => {
  try {
    if (req.url === '/__qa/rapor' && req.method === 'POST') {
      let g = ''; for await (const p of req) g += p;
      try { raporlar.push(JSON.parse(g)); } catch (e) { raporlar.push({ bozuk: true }); }
      res.writeHead(204); return res.end();
    }
    if (req.url === '/__qa/raporlar') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(raporlar)); }
    const r = await fetch(S.url + req.url, { method: req.method, headers: req.headers.accept ? { Accept: req.headers.accept } : {} });
    const h = {}; r.headers.forEach((v, k) => { if (k !== 'content-length' && k !== 'content-encoding') h[k] = v; });
    let govde = Buffer.from(await r.arrayBuffer());
    if ((h['content-type'] || '').startsWith('text/html')) govde = Buffer.from(govde.toString('utf8').replace('<head>', () => '<head>' + QA_BETIK));
    res.writeHead(r.status, h); res.end(req.method === 'HEAD' ? undefined : govde);
  } catch (e) { res.writeHead(500); res.end('qa sunucu hatasi'); }
});
on.listen(PORT, '127.0.0.1', () => console.log(`hazir http://127.0.0.1:${PORT}`));
