// Tüm sesler WebAudio ile sentezlenir — sıfır ses dosyası, sıfır ek yük.
// Trafo uğultusu, rüzgâr, kıvılcım ve gök gürültüsü basit osilatör/gürültü
// zincirleriyle üretilir. Kullanıcı jesti olmadan AudioContext açılmaz.
const SOUND_KEY = 'voltage-404-sound';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private humGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private boostGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  enabled: boolean;

  constructor() {
    let saved: string | null = null;
    try { saved = localStorage.getItem(SOUND_KEY); } catch { /* private mode */ }
    this.enabled = saved !== 'off';
  }

  /** İlk kullanıcı jestinde çağrılır. */
  ensure(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 1 : 0;
    this.master.connect(this.ctx.destination);

    // Beyaz gürültü tamponu (rüzgâr / gök gürültüsü / kıvılcım tabanı)
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch { /* ignore */ }
    if (this.master && this.ctx) this.master.gain.linearRampToValueAtTime(on ? 1 : 0, this.ctx.currentTime + 0.2);
  }

  /** Sürekli ortam katmanı: trafo uğultusu (50 Hz + harmonik) + rüzgâr. */
  startAmbient(windLevel: number): void {
    if (!this.ctx || !this.master || this.humGain) return;
    const c = this.ctx;
    this.humGain = c.createGain();
    this.humGain.gain.value = 0;
    this.humGain.connect(this.master);
    for (const [freq, g] of [[50, 0.5], [100, 0.35], [150, 0.12]] as const) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const og = c.createGain();
      og.gain.value = g * 0.06;
      o.connect(og).connect(this.humGain);
      o.start();
    }
    this.humGain.gain.linearRampToValueAtTime(1, c.currentTime + 2.5);

    if (this.noiseBuf) {
      const src = c.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 300 + windLevel * 500;
      this.windGain = c.createGain();
      this.windGain.gain.value = 0;
      src.connect(f).connect(this.windGain).connect(this.master);
      src.start();
      this.windGain.gain.linearRampToValueAtTime(0.03 + windLevel * 0.07, c.currentTime + 3);
    }
  }

  private blip(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
    if (!this.ctx || !this.master || !this.enabled) return;
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(c.currentTime + dur + 0.05);
  }

  private noiseBurst(dur: number, filterFreq: number, vol: number): void {
    if (!this.ctx || !this.master || !this.noiseBuf || !this.enabled) return;
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(filterFreq, c.currentTime);
    f.frequency.exponentialRampToValueAtTime(60, c.currentTime + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start();
    src.stop(c.currentTime + dur + 0.05);
  }

  powerUp(): void { this.blip(60, 2.2, 'sawtooth', 0.12, 220); this.noiseBurst(1.6, 1200, 0.05); }
  jump(): void { this.blip(340, 0.22, 'sine', 0.1, 520); }
  land(): void { this.blip(180, 0.12, 'triangle', 0.07, 120); }
  collect(step: number): void { this.blip(660 + step * 60, 0.16, 'sine', 0.09, 990 + step * 60); }
  crash(): void { this.noiseBurst(0.7, 2500, 0.25); this.blip(220, 0.5, 'sawtooth', 0.12, 40); }
  thunder(): void { this.noiseBurst(2.4, 400, 0.22); }
  spark(): void { this.noiseBurst(0.08, 6000, 0.05); }
  overcharge(): void {
    this.blip(220, 1.2, 'sawtooth', 0.1, 440);
    this.blip(277, 1.2, 'sawtooth', 0.08, 554);
    this.blip(330, 1.2, 'sawtooth', 0.08, 660);
  }
  achievement(): void { this.blip(523, 0.3, 'sine', 0.09, 784); this.blip(784, 0.5, 'sine', 0.07, 1046); }

  setBoost(on: boolean): void {
    if (!this.ctx || !this.master) return;
    const c = this.ctx;
    if (on && !this.boostGain && this.noiseBuf && this.enabled) {
      const src = c.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 900;
      this.boostGain = c.createGain();
      this.boostGain.gain.setValueAtTime(0, c.currentTime);
      this.boostGain.gain.linearRampToValueAtTime(0.06, c.currentTime + 0.3);
      src.connect(f).connect(this.boostGain).connect(this.master);
      src.start();
      const bg = this.boostGain;
      window.setTimeout(() => { try { src.stop(); } catch { /* already */ } }, 12000);
      (bg as GainNode & { _src?: AudioBufferSourceNode })._src = src;
    } else if (!on && this.boostGain) {
      const bg = this.boostGain as GainNode & { _src?: AudioBufferSourceNode };
      bg.gain.linearRampToValueAtTime(0, c.currentTime + 0.25);
      window.setTimeout(() => { try { bg._src?.stop(); } catch { /* already */ } }, 400);
      this.boostGain = null;
    }
  }

  suspend(): void { if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend(); }
  resume(): void { if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume(); }
}
