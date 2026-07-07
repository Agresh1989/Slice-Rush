/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'classic' | 'timeAttack' | 'endless';

export type BladeStyle = 'default' | 'fire' | 'rainbow' | 'shadow' | 'cosmic';
export type BackgroundTheme = 'tropical' | 'neon' | 'zen';
export type JuiceStyle = 'standard' | 'neon' | 'confetti';
export type SoundPack = 'standard' | 'laser' | 'retro';

export type FruitType =
  | 'watermelon'
  | 'orange'
  | 'apple'
  | 'pineapple'
  | 'strawberry'
  | 'kiwi'
  | 'dragonfruit'
  | 'mango'
  | 'coconut'
  | 'banana'
  // Special objects
  | 'golden'
  | 'ice'
  | 'combo'
  | 'time'
  | 'bomb';

export interface FruitConfig {
  type: FruitType;
  name: string;
  points: number;
  radius: number;
  color: string; // Base outer color
  innerColor: string; // Slice interior color
  isRare?: boolean;
  isSpecial?: boolean;
  isBomb?: boolean;
}

export interface SoundPackConfig {
  id: SoundPack;
  name: string;
  price: number;
  description: string;
}

export interface BladeConfig {
  id: BladeStyle;
  name: string;
  price: number;
  color: string;
  trailColor: string;
  glowColor: string;
  description: string;
}

export interface BackgroundConfig {
  id: BackgroundTheme;
  name: string;
  price: number;
  primaryBg: string;
  accentBg: string;
  description: string;
}

export interface JuiceConfig {
  id: JuiceStyle;
  name: string;
  price: number;
  description: string;
}

export interface SaveData {
  coins: number;
  highScores: {
    classic: number;
    timeAttack: number;
    endless: number;
  };
  unlockedBlades: BladeStyle[];
  activeBlade: BladeStyle;
  unlockedBackgrounds: BackgroundTheme[];
  activeBackground: BackgroundTheme;
  unlockedJuices: JuiceStyle[];
  activeJuice: JuiceStyle;
  unlockedSoundPacks: SoundPack[];
  activeSoundPack: SoundPack;
  settings: {
    musicVolume: number;
    sfxVolume: number;
    vibration: boolean;
  };
  dailyChallenges: {
    lastUpdated: string; // ISO date string
    challenges: DailyChallenge[];
  };
  stats: {
    totalFruitsSliced: number;
    totalBombsHit: number;
    totalGamesPlayed: number;
    maxCombo: number;
  };
}

export interface DailyChallenge {
  id: string;
  description: string;
  type: 'slice_total' | 'combo_max' | 'score_classic' | 'slice_rare' | 'no_bombs';
  target: number;
  current: number;
  completed: boolean;
  reward: number;
}

// 2D Canvas Physics Engine Objects
export interface Vector2D {
  x: number;
  y: number;
}

export interface SpawnedObject {
  id: string;
  type: FruitType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vRot: number; // Angular velocity
  sliced: boolean;
  sliceAngle: number; // Angle at which the fruit was sliced
  sliceProgress: number; // For splitting animation (0 to 1)
  halfLeftX: number; // Left half offset X
  halfLeftY: number; // Left half offset Y
  halfRightX: number; // Right half offset X
  halfRightY: number; // Right half offset Y
  halfVxLeft: number;
  halfVyLeft: number;
  halfVxRight: number;
  halfVyRight: number;
  isSpecial: boolean;
  isBomb: boolean;
  points: number;
  color: string;
  innerColor: string;
  scale: number;
  spawnTime: number;
  opacity: number;
}

export interface BladePoint {
  x: number;
  y: number;
  time: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  life: number; // Remaining lifetime in frames or ms
  maxLife: number;
  rotation: number;
  vRot: number;
  gravity: number;
  type: 'juice' | 'spark' | 'smoke' | 'star' | 'bubble';
}

export interface ScorePopup {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  vy: number;
}
