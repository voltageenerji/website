// Site ile aynı dil tercihi anahtarı kullanılır ('voltage-lang').
export type Lang = 'tr' | 'en';

export const lang: Lang = (() => {
  try {
    return localStorage.getItem('voltage-lang') === 'en' ? 'en' : 'tr';
  } catch {
    return 'tr';
  }
})();

const STR = {
  tr: {
    lost: 'İLETİM BAĞLANTISI KESİLDİ',
    lostSub: 'Şebeke bağlantısı geçici olarak kesintiye uğradı.',
    gridStatus: 'ŞEBEKE DURUMU',
    pressDesktop: 'Gücü geri getirmek için BOŞLUK (SPACE) tuşuna basın',
    pressMobile: 'Gücü geri getirmek için dokunun',
    restoring: 'GÜÇ GERİ GELİYOR',
    hudDistance: 'MESAFE',
    hudEnergy: 'İLETİLEN ENERJİ',
    hudEff: 'VERİM',
    pause: 'Duraklat',
    resume: 'Devam Et',
    paused: 'DURAKLATILDI',
    sound: 'Ses',
    overcharge: 'AŞIRI YÜK MODU',
    overTitle: 'ŞEBEKE YENİDEN AYAKTA',
    overSub: 'İletim görevi tamamlandı. Rapor:',
    statDistance: 'Kat edilen mesafe',
    statEnergy: 'İletilen enerji',
    statEff: 'İletim verimi',
    statRank: 'Rütbe',
    playAgain: 'Tekrar Oyna',
    goHome: 'Ana Sayfaya Dön',
    eggLine: 'Her bağlantı bir geleceği besler.',
    newAch: 'BAŞARIM AÇILDI',
    controlsDesktop: 'SPACE zıpla · SHIFT güçlendir · ←/→ hat değiştir · ESC duraklat',
    controlsMobile: 'Dokun: zıpla · Basılı tut: güçlendir · Kaydır: hat değiştir',
    lbTitle: 'LİDER TABLOSU',
    lbName: 'Adınız',
    lbSubmit: 'Listeye Gir',
    lbErr: 'Kayıt şu an alınamadı — tekrar deneyin.',
    lbBlocked: 'Bu ad kullanılamaz — başka bir ad deneyin.',
    lbEmpty: 'Henüz kayıt yok — ilk siz girin.',
    ranks: ['Şalt Sahası Operatörü', 'Şebeke Mühendisi', 'İletim Uzmanı', 'Yük Tevzi Operatörü', 'Şebeke Muhafızı', 'Voltage Efsanesi'],
    achievements: ['İlk İletim', 'Şebeke Dengeleyici', 'Yük Dengeleyici', 'Enerji Tüccarı', 'Voltage Efsanesi'],
  },
  en: {
    lost: 'TRANSMISSION LOST',
    lostSub: 'Grid connection has been temporarily interrupted.',
    gridStatus: 'GRID STATUS',
    pressDesktop: 'Press SPACE to restore power',
    pressMobile: 'Tap to restore power',
    restoring: 'RESTORING POWER',
    hudDistance: 'DISTANCE',
    hudEnergy: 'ENERGY DELIVERED',
    hudEff: 'EFFICIENCY',
    pause: 'Pause',
    resume: 'Resume',
    paused: 'PAUSED',
    sound: 'Sound',
    overcharge: 'OVERCHARGE',
    overTitle: 'GRID RESTORED',
    overSub: 'Transmission run complete. Report:',
    statDistance: 'Distance travelled',
    statEnergy: 'Energy delivered',
    statEff: 'Transmission efficiency',
    statRank: 'Rank',
    playAgain: 'Play Again',
    goHome: 'Return Home',
    eggLine: 'Every connection powers a future.',
    newAch: 'ACHIEVEMENT UNLOCKED',
    controlsDesktop: 'SPACE jump · SHIFT boost · ←/→ switch line · ESC pause',
    controlsMobile: 'Tap: jump · Hold: boost · Swipe: switch line',
    lbTitle: 'LEADERBOARD',
    lbName: 'Your name',
    lbSubmit: 'Join the Board',
    lbErr: 'Could not save right now — try again.',
    lbBlocked: 'That name cannot be used — try another.',
    lbEmpty: 'No entries yet — be the first.',
    ranks: ['Substation Operator', 'Grid Engineer', 'Transmission Specialist', 'Power Dispatcher', 'Grid Guardian', 'Voltage Legend'],
    achievements: ['First Transmission', 'Grid Stabilizer', 'Load Balancer', 'Power Trader', 'Voltage Legend'],
  },
} as const;

type Key = keyof typeof STR.tr;
export function t<K extends Key>(k: K): (typeof STR.tr)[K] {
  return (STR[lang] as typeof STR.tr)[k];
}
