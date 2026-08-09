import { lang, t } from './i18n';

// HUD tamamen DOM'dur (404.html içinde yazılıdır) — WebGL üstüne DOM bindirmek
// hem erişilebilir hem ucuzdur. Bu modül yalnızca bağlama/güncelleme yapar.
function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const n = document.getElementById(id);
  if (!n) throw new Error(`#${id} missing`);
  return n as T;
}

const nf = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const nfInt = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: 0 });

export interface OverStats {
  distanceM: number;
  mwh: number;
  eff: number;
  rank: string;
  newAchievements: string[];
}

export interface LbEntry {
  n: string;
  m: number;
  d: number;
}

export class Hud {
  private dist = el('gDist');
  private mwh = el('gMwh');
  private eff = el('gEff');
  private energyFill = el('gEnergyFill');
  private ocLabel = el('gOcLabel');
  private intro = el('gIntro');
  private introPct = el('gGridPct');
  private press = el('gPress');
  private hud = el('gHud');
  private over = el('gOver');
  private pauseOv = el('gPauseOv');
  private toastEl = el('gToast');
  private egg = el('gEgg');
  private flashEl = el('gFlash');
  private toastTimer = 0;

  constructor(
    isTouch: boolean,
    handlers: { onPause: () => void; onResume: () => void; onSound: (on: boolean) => boolean; onAgain: () => void; onLbSubmit: (name: string) => void },
  ) {
    // Metinleri dile göre doldur
    el('gLost').textContent = t('lost');
    el('gLostSub').textContent = t('lostSub');
    el('gGridLabel').textContent = t('gridStatus');
    this.press.textContent = isTouch ? t('pressMobile') : t('pressDesktop');
    el('gControls').textContent = isTouch ? t('controlsMobile') : t('controlsDesktop');
    el('gDistLabel').textContent = t('hudDistance');
    el('gMwhLabel').textContent = t('hudEnergy');
    el('gEffLabel').textContent = t('hudEff');
    this.ocLabel.textContent = t('overcharge');
    el('gOverTitle').textContent = t('overTitle');
    el('gOverSub').textContent = t('overSub');
    el('gStatDLabel').textContent = t('statDistance');
    el('gStatELabel').textContent = t('statEnergy');
    el('gStatEffLabel').textContent = t('statEff');
    el('gStatRankLabel').textContent = t('statRank');
    el('gAgain').textContent = t('playAgain');
    el('gHome').textContent = t('goHome');
    el('gEgg').textContent = t('eggLine');
    el('gPausedLabel').textContent = t('paused');
    el('gResume').textContent = t('resume');

    const pauseBtn = el<HTMLButtonElement>('gPause');
    pauseBtn.title = t('pause');
    pauseBtn.addEventListener('click', handlers.onPause);
    el<HTMLButtonElement>('gResume').addEventListener('click', handlers.onResume);
    el<HTMLButtonElement>('gAgain').addEventListener('click', handlers.onAgain);
    const soundBtn = el<HTMLButtonElement>('gSound');
    soundBtn.title = t('sound');
    soundBtn.addEventListener('click', () => {
      const on = handlers.onSound(soundBtn.getAttribute('data-on') !== 'true');
      soundBtn.setAttribute('data-on', String(on));
    });

    // Lider tablosu
    el('gLbTitle').textContent = t('lbTitle');
    const nameInput = el<HTMLInputElement>('gLbName');
    nameInput.placeholder = t('lbName');
    el('gLbSubmit').textContent = t('lbSubmit');
    el<HTMLFormElement>('gLbForm').addEventListener('submit', (e) => {
      e.preventDefault();
      // Sunucunun sildiği karakterler burada da elenir — "kaydettim ama
      // sunucu reddetti" sürprizi yaşanmaz (QA N4)
      const name = nameInput.value.replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim();
      if (name.length >= 2) handlers.onLbSubmit(name);
    });
  }

  // ---- Lider tablosu ----

  lbPrefill(name: string): void {
    el<HTMLInputElement>('gLbName').value = name;
  }

  lbFormShow(show: boolean): void {
    el('gLbForm').hidden = !show;
  }

  lbBusy(on: boolean): void {
    el<HTMLButtonElement>('gLbSubmit').disabled = on;
    if (on) el('gLbMsg').hidden = true;
  }

  lbError(text?: string): void {
    const m = el('gLbMsg');
    m.textContent = text ?? t('lbErr');
    m.hidden = false;
  }

  /** Sunucudan gelen tabloyu çizer. youIdx: oyuncunun satırı (yoksa -1). */
  lbRender(entries: LbEntry[], youIdx: number): void {
    el('gLb').hidden = false;
    const list = el('gLbList');
    list.innerHTML = '';
    el('gLbEmpty').hidden = entries.length > 0;
    if (entries.length === 0) el('gLbEmpty').textContent = t('lbEmpty');
    entries.forEach((entry, i) => {
      const li = document.createElement('li');
      li.className = i === youIdx ? 'me' : '';
      const rank = document.createElement('span');
      rank.className = 'r';
      rank.textContent = String(i + 1);
      const name = document.createElement('span');
      name.className = 'n';
      name.textContent = entry.n; // textContent → injection imkânsız
      const score = document.createElement('span');
      score.className = 's';
      score.textContent = `${nfInt.format(entry.m)} MWh`;
      li.append(rank, name, score);
      list.appendChild(li);
    });
  }

  lbHide(): void {
    el('gLb').hidden = true;
  }

  setSoundState(on: boolean): void {
    el('gSound').setAttribute('data-on', String(on));
  }

  setStats(distanceM: number, mwh: number, eff: number): void {
    this.dist.textContent = `${nf.format(distanceM / 1000)} km`;
    this.mwh.textContent = `${nfInt.format(mwh)} MWh`;
    this.eff.textContent = `%${nfInt.format(eff)}`;
  }

  setEnergy(frac: number, overcharge: boolean): void {
    this.energyFill.style.transform = `scaleX(${Math.min(1, Math.max(0, frac))})`;
    this.energyFill.classList.toggle('oc', overcharge);
    this.ocLabel.classList.toggle('show', overcharge);
  }

  setGridPct(p: number): void {
    this.introPct.textContent = `%${Math.round(p * 100)}`;
  }

  showRestoring(): void {
    this.press.textContent = t('restoring');
    this.intro.classList.add('powering');
  }

  hideIntro(): void {
    this.intro.classList.add('gone');
    this.hud.classList.add('show');
  }

  showOver(s: OverStats): void {
    el('gStatD').textContent = `${nf.format(s.distanceM / 1000)} km`;
    el('gStatE').textContent = `${nfInt.format(s.mwh)} MWh`;
    el('gStatEff').textContent = `%${nfInt.format(s.eff)}`;
    el('gRank').textContent = s.rank;
    const list = el('gAchList');
    list.innerHTML = '';
    for (const a of s.newAchievements) {
      const li = document.createElement('div');
      li.className = 'ach';
      li.textContent = `★ ${t('newAch')}: ${a}`;
      list.appendChild(li);
    }
    this.over.classList.add('show');
    this.hud.classList.remove('show');
  }

  hideOver(): void {
    this.over.classList.remove('show');
    this.hud.classList.add('show');
  }

  setPaused(on: boolean): void {
    this.pauseOv.classList.toggle('show', on);
  }

  toast(text: string): void {
    this.toastEl.textContent = `★ ${t('newAch')}: ${text}`;
    this.toastEl.classList.add('show');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), 3200);
  }

  showEgg(on: boolean): void {
    this.egg.classList.toggle('show', on);
  }

  flash(strength: number): void {
    this.flashEl.style.opacity = String(strength);
    this.flashEl.classList.remove('fading');
    void this.flashEl.offsetWidth; // reflow → geçişi yeniden tetikle
    this.flashEl.classList.add('fading');
    this.flashEl.style.opacity = '0';
  }
}
