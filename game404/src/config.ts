// Tüm ayar sabitleri tek yerde — kod içinde "magic number" bırakmamak için.
export const CFG = {
  // Koridor geometrisi (birim: metre hissi veren soyut ünite)
  laneX: [-2.4, 0, 2.4] as const,
  cableY: 12,
  towerSpacing: 60,
  spanCount: 14, // koridor uzunluğu = spanCount * towerSpacing

  // Hareket
  baseSpeed: 24,
  maxSpeed: 34, // zorlukla birlikte taban hızın ulaşacağı üst sınır
  boostBonus: 14, // boost aktifken eklenen hız
  speedRampPer100m: 0.35, // her 100 m'de taban hıza eklenen
  gravity: -36,
  jumpVel: 13,
  laneLerp: 11,

  // Enerji ekonomisi
  packetEnergy: 8, // paket başına enerji çubuğu dolumu
  packetMWh: 12, // skor: paket başına "iletilen MWh"
  boostDrainPerSec: 26,
  boostMinEnergy: 15,
  overchargeAt: 100,
  overchargeSec: 5,
  destroyBonusMWh: 20,

  // Akış
  easterEggAtSec: 60,
  powerUpSec: 2.6,

  // Görüntü
  dprCap: 2,
  dprCapMobile: 1.5,
  fov: 62,
  fovBoost: 70,
} as const;

export type LaneIndex = 0 | 1 | 2;
