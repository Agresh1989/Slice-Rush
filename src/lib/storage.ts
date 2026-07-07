/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SaveData,
  BladeConfig,
  BackgroundConfig,
  JuiceConfig,
  SoundPackConfig,
  DailyChallenge,
} from '../types';

export const BLADES: BladeConfig[] = [
  {
    id: 'default',
    name: 'Aqua Cut',
    price: 0,
    color: '#38bdf8',
    trailColor: 'rgba(56, 189, 248, 0.6)',
    glowColor: 'rgba(56, 189, 248, 0.8)',
    description: 'The standard issue blade. Slick, cyan, and dependable.',
  },
  {
    id: 'fire',
    name: 'Flame Slash',
    price: 200,
    color: '#f97316',
    trailColor: 'rgba(249, 115, 22, 0.6)',
    glowColor: 'rgba(239, 68, 68, 0.9)',
    description: 'Slices fruits with high-temp ignition. Emits fire embers!',
  },
  {
    id: 'rainbow',
    name: 'Prism Streak',
    price: 400,
    color: '#ec4899',
    trailColor: 'rgba(236, 72, 153, 0.5)',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    description: 'A magical rainbow trail that leaves beautiful star sparks.',
  },
  {
    id: 'shadow',
    name: 'Void Carver',
    price: 600,
    color: '#a855f7',
    trailColor: 'rgba(168, 85, 247, 0.4)',
    glowColor: 'rgba(0, 0, 0, 0.95)',
    description: 'Channels shadow energy. Spews dark purple smoke particles.',
  },
  {
    id: 'cosmic',
    name: 'Solar Eclipse',
    price: 800,
    color: '#facc15',
    trailColor: 'rgba(250, 204, 21, 0.7)',
    glowColor: 'rgba(255, 255, 255, 0.95)',
    description: 'An cosmic lightning blade emitting crackling golden electric shocks.',
  },
];

export const BACKGROUNDS: BackgroundConfig[] = [
  {
    id: 'tropical',
    name: 'Tropical Cove',
    price: 0,
    primaryBg: '#1e3a1e',
    accentBg: '#14532d',
    description: 'Classic lush jungle setting with rich bamboo textures.',
  },
  {
    id: 'neon',
    name: 'Neon Grid',
    price: 300,
    primaryBg: '#090514',
    accentBg: '#1e1b4b',
    description: 'A cybernetic retro synthwave space with glowing cyan grids.',
  },
  {
    id: 'zen',
    name: 'Zen Dojo',
    price: 500,
    primaryBg: '#2d1b18',
    accentBg: '#3b1c18',
    description: 'A serene training temple with warm pink cherry blossoms.',
  },
];

export const JUICES: JuiceConfig[] = [
  {
    id: 'standard',
    name: 'Natural Nectar',
    price: 0,
    description: 'Classic refreshing splash customized to the fruit\'s own internal juice colors.',
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    price: 150,
    description: 'Juice drops glow under intense fluorescent light with custom outlines.',
  },
  {
    id: 'confetti',
    name: 'Party Confetti',
    price: 300,
    description: 'Instead of juice, fruits burst into custom-shaped flying birthday confetti!',
  },
];

export const SOUND_PACKS: SoundPackConfig[] = [
  {
    id: 'standard',
    name: 'Classic Synth',
    price: 0,
    description: 'Satisfying real-time synthesized slices and pops.',
  },
  {
    id: 'laser',
    name: 'Laser Sci-Fi',
    price: 250,
    description: 'Futuristic laser beam slashes and digital portal explosions.',
  },
  {
    id: 'retro',
    name: '8-Bit Chiptune',
    price: 250,
    description: 'Vintage pixelated arcade sound chips with short noise sweeps.',
  },
];

const DEFAULT_CHALLENGES = (): DailyChallenge[] => [
  {
    id: 'c1',
    description: 'Slice 100 total fruits today',
    type: 'slice_total',
    target: 100,
    current: 0,
    completed: false,
    reward: 150,
  },
  {
    id: 'c2',
    description: 'Achieve a 5x or higher combo',
    type: 'combo_max',
    target: 5,
    current: 0,
    completed: false,
    reward: 200,
  },
  {
    id: 'c3',
    description: 'Score 1,500 points in Classic Mode',
    type: 'score_classic',
    target: 1500,
    current: 0,
    completed: false,
    reward: 250,
  },
  {
    id: 'c4',
    description: 'Slice 15 rare or special fruits',
    type: 'slice_rare',
    target: 15,
    current: 0,
    completed: false,
    reward: 200,
  },
  {
    id: 'c5',
    description: 'Complete a Classic or Time Attack game without hitting any bomb',
    type: 'no_bombs',
    target: 1, // 1 for true
    current: 0,
    completed: false,
    reward: 300,
  },
];

const STORAGE_KEY = 'slice_rush_save_v1';

export function getInitialSaveData(): SaveData {
  const todayStr = new Date().toISOString().split('T')[0];
  return {
    coins: 0,
    highScores: {
      classic: 0,
      timeAttack: 0,
      endless: 0,
    },
    unlockedBlades: ['default'],
    activeBlade: 'default',
    unlockedBackgrounds: ['tropical'],
    activeBackground: 'tropical',
    unlockedJuices: ['standard'],
    activeJuice: 'standard',
    unlockedSoundPacks: ['standard'],
    activeSoundPack: 'standard',
    settings: {
      musicVolume: 0.5,
      sfxVolume: 0.8,
      vibration: true,
    },
    dailyChallenges: {
      lastUpdated: todayStr,
      challenges: DEFAULT_CHALLENGES(),
    },
    stats: {
      totalFruitsSliced: 0,
      totalBombsHit: 0,
      totalGamesPlayed: 0,
      maxCombo: 0,
    },
  };
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSaveData();
      saveSaveData(initial);
      return initial;
    }

    const data = JSON.parse(raw) as SaveData;
    
    // Ensure all required fields exist (handling schema migrations if any)
    const initial = getInitialSaveData();
    const merged: SaveData = {
      ...initial,
      ...data,
      highScores: { ...initial.highScores, ...data.highScores },
      settings: { ...initial.settings, ...data.settings },
      stats: { ...initial.stats, ...data.stats },
      dailyChallenges: data.dailyChallenges || initial.dailyChallenges,
    };

    // Refresh daily challenges if date changed
    const todayStr = new Date().toISOString().split('T')[0];
    if (merged.dailyChallenges.lastUpdated !== todayStr) {
      merged.dailyChallenges = {
        lastUpdated: todayStr,
        challenges: DEFAULT_CHALLENGES(),
      };
      saveSaveData(merged);
    }

    return merged;
  } catch (e) {
    console.error('Error loading save data:', e);
    return getInitialSaveData();
  }
}

export function saveSaveData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving save data:', e);
  }
}

/**
 * Updates game statistics and progresses daily challenges
 */
export function updateStatsAndChallenges(
  slicedThisGame: number,
  bombsHitThisGame: number,
  comboThisGame: number,
  scoreThisGame: number,
  mode: string,
  rareFruitsSlicedThisGame: number
): SaveData {
  const data = loadSaveData();
  
  // 1. Update stats
  data.stats.totalFruitsSliced += slicedThisGame;
  data.stats.totalBombsHit += bombsHitThisGame;
  data.stats.totalGamesPlayed += 1;
  data.stats.maxCombo = Math.max(data.stats.maxCombo, comboThisGame);

  // 2. High Score check
  if (mode === 'classic') {
    data.highScores.classic = Math.max(data.highScores.classic, scoreThisGame);
  } else if (mode === 'timeAttack') {
    data.highScores.timeAttack = Math.max(data.highScores.timeAttack, scoreThisGame);
  } else if (mode === 'endless') {
    data.highScores.endless = Math.max(data.highScores.endless, scoreThisGame);
  }

  // 3. Update challenges
  data.dailyChallenges.challenges = data.dailyChallenges.challenges.map((challenge) => {
    if (challenge.completed) return challenge;

    let newCurrent = challenge.current;

    switch (challenge.type) {
      case 'slice_total':
        newCurrent = Math.min(challenge.target, challenge.current + slicedThisGame);
        break;
      case 'combo_max':
        newCurrent = Math.max(challenge.current, comboThisGame);
        break;
      case 'score_classic':
        if (mode === 'classic') {
          newCurrent = Math.max(challenge.current, scoreThisGame);
        }
        break;
      case 'slice_rare':
        newCurrent = Math.min(challenge.target, challenge.current + rareFruitsSlicedThisGame);
        break;
      case 'no_bombs':
        if (bombsHitThisGame === 0 && (mode === 'classic' || mode === 'timeAttack')) {
          newCurrent = 1;
        }
        break;
    }

    const completed = newCurrent >= challenge.target;
    // Auto-credit reward coins upon immediate completion
    if (completed && !challenge.completed) {
      data.coins += challenge.reward;
    }

    return {
      ...challenge,
      current: newCurrent,
      completed,
    };
  });

  saveSaveData(data);
  return data;
}

/**
 * Claim challenge reward manually (if not auto-credited)
 */
export function claimChallengeReward(challengeId: string): SaveData {
  const data = loadSaveData();
  const challenge = data.dailyChallenges.challenges.find((c) => c.id === challengeId);
  if (challenge && challenge.completed) {
    // Already credited, but double check if wanted
  }
  return data;
}
