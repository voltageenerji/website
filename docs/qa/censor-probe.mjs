// QA adversarial probe of isBannedName via the public POST contract.
import { onRequestPost } from '/home/user/website/functions/api/score.js';
const kv = new Map();
const env = { LEADS: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); } } };
const post = async (name) => {
  const r = await onRequestPost({ env, request: new Request('https://voltage.com.tr/api/score', { method: 'POST', headers: { Origin: 'https://voltage.com.tr', 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mwh: 240, dist: 100 }) }) });
  const j = await r.json();
  return j.error === 'blocked_name' ? 'BLOCKED' : j.ok ? 'allowed' : `other:${j.error}`;
};
const bypass = ['amk1', 'Amk7', 's1kt1r', 'siqtir', 'оrospu', 'orоspu Reis', 'ANANI SIK', 'anani s.i.k', 'am' , 'A.M.K.', 'sik8', 'g0t herif', 'Got Herif', 'oç'];
const falsePos = ['Klasik İsmail', 'Işık Yılmaz', 'Sami Kaya', 'Amca Bey', 'Gotham Fan', 'Ocak Ustası', 'Şık Deniz', 'Mallorca', 'Analiz Uzmanı', 'Gaye Malik', 'Pist Kralı', 'Cockpit Crew', 'Amine', 'Salih Amir'];
console.log('--- bypass candidates (want BLOCKED, "allowed" = filter miss) ---');
for (const n of bypass) console.log(`${JSON.stringify(n)} -> ${await post(n)}`);
console.log('--- innocent names (want allowed, BLOCKED = false positive) ---');
for (const n of falsePos) console.log(`${JSON.stringify(n)} -> ${await post(n)}`);
