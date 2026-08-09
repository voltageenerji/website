import { Game } from './game';

// Önyükleme: WebGL yoksa, kullanıcı hareket azaltma istiyorsa ya da motor
// herhangi bir sebeple çökerse → sayfadaki statik yedek (linkler) görünür kalır.
// Oyun ancak her koşul sağlandığında devreye girer ("progressive enhancement").
function webglOk(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function boot(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !webglOk()) return; // yedek içerik zaten görünür
  try {
    const canvas = document.getElementById('gCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const game = new Game(canvas);
    document.body.classList.add('g-on');
    // QA / teşhis kancası
    (window as unknown as { __g404?: unknown }).__g404 = game;
  } catch (err) {
    // Motor kurulamadı → sayfa statik 404 olarak yaşamaya devam eder.
    console.error('[g404] engine boot failed, falling back to static page:', err);
    document.body.classList.remove('g-on');
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
