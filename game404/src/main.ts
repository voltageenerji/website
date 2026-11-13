import { Game } from './game';
import { t } from './i18n';

// Önyükleme ("progressive enhancement"): oyun ancak koşullar sağlanınca açılır,
// aksi halde sayfadaki statik yedek (linkler) görünür kalır.
//  - WebGL2 yok (Three r163+ yalnız WebGL2 ile çalışır) → statik yedek.
//  - Hareket azaltma açık → oyun kendiliğinden açılmaz; yedekte açıkça
//    etiketli "Oyunu başlat" düğmesi çıkar, oyun yalnız dokunuştan sonra açılır.
//  - Motor kurulamaz ya da WebGL bağlamı kaybolursa → yedek + yeniden dene düğmesi.
// ?tani=1 → nedenini gösteren küçük bir teşhis satırı. Hiçbir veri gönderilmez.

type StartMode = 'reduced' | 'lost' | 'error';

interface Diag {
  reduced: boolean;
  gl2: boolean;
  gl1: boolean;
  boot: 'pending' | 'waiting' | 'ok' | 'error' | 'lost' | 'nogl';
  err: string;
}

const taniOn = (() => {
  try { return new URLSearchParams(location.search).get('tani') === '1'; } catch { return false; }
})();

const diag: Diag = { reduced: false, gl2: false, gl1: false, boot: 'pending', err: '' };
let game: Game | null = null;

/** Yoklama bağlamı açılır ve hemen bırakılır (iOS eşzamanlı bağlam sınırı). */
function probe(kind: 'webgl2' | 'webgl'): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext(kind) as WebGLRenderingContext | null;
    if (!gl) return false;
    try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* yut */ }
    return true;
  } catch {
    return false;
  }
}

function errText(err: unknown): string {
  return String((err as Error)?.message || err).replace(/\s+/g, ' ').slice(0, 120);
}

function renderDiag(): void {
  if (!taniOn) return;
  const box = document.getElementById('gDiag');
  if (!box) return;
  const L = t('diag');
  const yn = (v: boolean): string => (v ? L.yes : L.no);
  const hv = (v: boolean): string => (v ? L.has : L.none);
  let engine: string;
  const info = game?.engineInfo;
  if (diag.boot === 'ok' && info) engine = `${L.ok}, ${info.bloom ? L.bloomOn : L.bloomOff}${info.bloomOffReason ? ` (${info.bloomOffReason})` : ''}`;
  else if (diag.boot === 'waiting') engine = L.waiting;
  else if (diag.boot === 'lost') engine = `${L.lost}${diag.err ? ` (${diag.err})` : ''}`;
  else if (diag.boot === 'error') engine = `${L.error}: ${diag.err}`;
  else if (diag.boot === 'nogl') engine = `${L.notStarted} (WebGL2 ${L.none})`;
  else engine = L.notStarted;
  const devDpr = window.devicePixelRatio || 1;
  const dpr = info ? `${+info.dpr.toFixed(2)} (${L.device} ${devDpr})` : `– (${L.device} ${devDpr})`;
  const os = (navigator.userAgent.match(/(iPhone OS|CPU OS|Android|Mac OS X|Windows NT) [\d._]+/) || [''])[0];
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  box.textContent = [
    L.title,
    `${L.reduced}: ${yn(diag.reduced)}`,
    `WebGL2: ${hv(diag.gl2)}`,
    `WebGL1: ${hv(diag.gl1)}`,
    `${L.engine}: ${engine}`,
    `${L.dpr}: ${dpr}`,
    `${L.viewport}: ${window.innerWidth}×${window.innerHeight}`,
    `${L.touch}: ${yn(coarse)}`,
    os,
  ].filter(Boolean).join(' · ');
  box.hidden = false;
}

function showStart(mode: StartMode): void {
  const box = document.getElementById('gStartBox');
  const btn = document.getElementById('gStartBtn');
  const note = document.getElementById('gStartNote');
  if (!box || !btn || !note) return;
  btn.textContent = mode === 'reduced' ? t('startGame') : t('restartGame');
  note.textContent = mode === 'reduced' ? t('startNoteReduced') : mode === 'lost' ? t('startNoteLost') : t('startNoteError');
  btn.onclick = (): void => {
    if (mode === 'reduced') {
      box.hidden = true;
      start();
    } else {
      // Kaybolan bağlam yeniden kullanılamaz; temiz sayfa en güvenli yol.
      location.reload();
    }
  };
  box.hidden = false;
}

function onFatal(reason: string): void {
  document.body.classList.remove('g-on');
  diag.boot = 'lost';
  diag.err = reason.slice(0, 120);
  if (reason !== 'webglcontextlost') console.error('[g404] engine stopped, falling back to static page:', reason);
  showStart('lost');
  renderDiag();
}

function start(): void {
  let fatal = false;
  try {
    const canvas = document.getElementById('gCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    game = new Game(canvas, (reason) => { fatal = true; onFatal(reason); });
    // QA / teşhis kancası
    (window as unknown as { __g404?: unknown }).__g404 = game;
    if (fatal) return;
    diag.boot = 'ok';
    document.body.classList.add('g-on');
  } catch (err) {
    // Motor kurulamadı → sayfa statik 404 olarak yaşamaya devam eder.
    console.error('[g404] engine boot failed, falling back to static page:', err);
    document.body.classList.remove('g-on');
    diag.boot = 'error';
    diag.err = errText(err);
    showStart('error');
  }
  renderDiag();
}

function boot(): void {
  diag.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  diag.gl2 = probe('webgl2');
  diag.gl1 = probe('webgl');
  if (taniOn) {
    window.addEventListener('resize', renderDiag);
    window.setInterval(renderDiag, 2000); // kalite kademesi / DPR değişimi
  }
  if (!diag.gl2) {
    diag.boot = 'nogl'; // yedek içerik zaten görünür; yeniden denemek işe yaramaz
  } else if (diag.reduced) {
    diag.boot = 'waiting';
    showStart('reduced');
  } else {
    start();
    return;
  }
  renderDiag();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
