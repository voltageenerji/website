#!/usr/bin/env node
/**
 * Panel parolası için PBKDF2 özeti üretir.
 *
 *   node tools/admin-hash.mjs
 *
 * Parolayı sorar (ekrana yazılmaz), Cloudflare'a girilecek TEK satırı basar.
 * Parola hiçbir yere gönderilmez, hiçbir dosyaya yazılmaz — yalnızca özet
 * üretilir. Özeti `ADMIN_PASS_HASH` ortam değişkenine yapıştırın.
 *
 * Ayrıca `ADMIN_SESSION_SECRET` için rastgele bir değer üretir.
 */
import { createInterface } from 'node:readline';
import { hashPassword } from '../lib/admin-auth.js';

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Yazarken karakterleri gizle
    const onData = () => { rl.output.write('\x1B[2K\x1B[200D' + question); };
    rl.output.write(question);
    process.stdin.on('data', onData);
    rl.question('', (answer) => {
      process.stdin.removeListener('data', onData);
      rl.output.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

const pass = (await ask('Panel parolası: ')).trim();
if (pass.length < 12) {
  console.error('\nHATA: parola en az 12 karakter olmalı. Panel gerçek müşteri verisi gösteriyor.');
  process.exit(1);
}
const again = (await ask('Parolayı tekrar girin: ')).trim();
if (pass !== again) {
  console.error('\nHATA: parolalar eşleşmedi.');
  process.exit(1);
}

const hash = await hashPassword(pass);
const secret = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');

console.log('\nCloudflare Pages → Settings → Environment variables → Production\n');
console.log('ADMIN_USER            = (seçtiğiniz kullanıcı adı, örn. emirhan)');
console.log(`ADMIN_PASS_HASH       = ${hash}`);
console.log(`ADMIN_SESSION_SECRET  = ${secret}`);
console.log('\nADMIN_PASS_HASH ve ADMIN_SESSION_SECRET "Encrypt" seçeneğiyle kaydedilmeli.');
console.log('Parolanın kendisi hiçbir yerde saklanmadı — kaybederseniz bu aracı tekrar çalıştırın.\n');
