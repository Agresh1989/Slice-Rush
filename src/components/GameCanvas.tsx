/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Home, Award, Heart, Timer, Coins, Trophy } from 'lucide-react';
import { GameMode, SaveData, SpawnedObject, BladePoint, Particle, ScorePopup, FruitType, FruitConfig } from '../types';
import { BLADES, BACKGROUNDS, JUICES, saveSaveData, updateStatsAndChallenges } from '../lib/storage';
import audio from '../lib/audio';

interface GameCanvasProps {
  mode: GameMode;
  saveData: SaveData;
  onGameOver: (score: number, coinsEarned: number, maxCombo: number) => void;
  onBackToMenu: () => void;
  onUpdateSaveData: (data: SaveData) => void;
}

const FRUIT_CONFIGS: Record<FruitType, FruitConfig> = {
  watermelon: { type: 'watermelon', name: 'Watermelon', points: 10, radius: 45, color: '#166534', innerColor: '#ef4444' },
  orange: { type: 'orange', name: 'Orange', points: 10, radius: 35, color: '#f97316', innerColor: '#ffedd5' },
  apple: { type: 'apple', name: 'Apple', points: 10, radius: 32, color: '#dc2626', innerColor: '#fef08a' },
  pineapple: { type: 'pineapple', name: 'Pineapple', points: 15, radius: 42, color: '#eab308', innerColor: '#fef08a', isRare: true },
  strawberry: { type: 'strawberry', name: 'Strawberry', points: 10, radius: 26, color: '#e11d48', innerColor: '#ffe4e6' },
  kiwi: { type: 'kiwi', name: 'Kiwi', points: 15, radius: 28, color: '#78350f', innerColor: '#86efac', isRare: true },
  dragonfruit: { type: 'dragonfruit', name: 'Dragon Fruit', points: 25, radius: 38, color: '#db2777', innerColor: '#f8fafc', isRare: true },
  mango: { type: 'mango', name: 'Mango', points: 15, radius: 36, color: '#eab308', innerColor: '#f97316' },
  coconut: { type: 'coconut', name: 'Coconut', points: 15, radius: 35, color: '#451a03', innerColor: '#ffffff', isRare: true },
  banana: { type: 'banana', name: 'Banana', points: 10, radius: 30, color: '#facc15', innerColor: '#fef08a' },
  // Special objects
  golden: { type: 'golden', name: 'Golden Star', points: 100, radius: 30, color: '#fbbf24', innerColor: '#ffffff', isSpecial: true },
  ice: { type: 'ice', name: 'Ice Crystal', points: 15, radius: 30, color: '#38bdf8', innerColor: '#e0f2fe', isSpecial: true },
  combo: { type: 'combo', name: 'Double Combo', points: 15, radius: 30, color: '#c084fc', innerColor: '#faf5ff', isSpecial: true },
  time: { type: 'time', name: 'Time Clock', points: 10, radius: 30, color: '#22c55e', innerColor: '#f0fdf4', isSpecial: true },
  bomb: { type: 'bomb', name: 'Danger Bomb', points: 0, radius: 32, color: '#1e1b4b', innerColor: '#ef4444', isBomb: true },
};

export default function GameCanvas({
  mode,
  saveData,
  onGameOver,
  onBackToMenu,
  onUpdateSaveData,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game UI States
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [activeCombo, setActiveCombo] = useState(0);

  // Active power-up states
  const [iceActive, setIceActive] = useState(false);
  const [comboActive, setComboActive] = useState(false);

  // Gameplay Engine References (Ref avoids triggering re-renders at 60 FPS)
  const engineRef = useRef({
    score: 0,
    lives: 3,
    timeLeft: 60,
    isPaused: false,
    activeCombo: 0,
    comboMultiplier: 1,
    comboTimer: 0,
    comboResetTime: 350, // ms of delay without slicing to evaluate combo
    slicedInCurrentSwipe: [] as string[], // IDs sliced in continuous drag
    lastSwipeTime: 0,
    objects: [] as SpawnedObject[],
    particles: [] as Particle[],
    popups: [] as ScorePopup[],
    bladePoints: [] as BladePoint[],
    isMouseDown: false,
    shakeIntensity: 0,
    iceTimer: 0,
    comboBuffTimer: 0,
    spawnerTimer: 0,
    lastFrameTime: 0,
    totalSliced: 0,
    totalBombsHit: 0,
    maxComboThisGame: 0,
    rareFruitsSliced: 0,
    timeSpent: 0,
    difficultyScale: 1.0,
    // Pointer and Sword Cursor variables
    pointerX: 180,
    pointerY: 320,
    swordAngle: -Math.PI / 4,
    isPointerInside: false,
    // Spawn configs
    spawnInterval: 1800, // ms
    width: 360,
    height: 640,
  });

  const activeBladeConfig = BLADES.find((b) => b.id === saveData.activeBlade) || BLADES[0];
  const activeBgConfig = BACKGROUNDS.find((b) => b.id === saveData.activeBackground) || BACKGROUNDS[0];

  // Initialize Canvas dimensions on mount/resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const canvas = canvasRef.current;
      canvas.width = rect.width;
      canvas.height = rect.height;
      engineRef.current.width = rect.width;
      engineRef.current.height = rect.height;
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Initialize Mode Parameters
  useEffect(() => {
    const eng = engineRef.current;
    eng.score = 0;
    eng.isPaused = false;
    eng.objects = [];
    eng.particles = [];
    eng.popups = [];
    eng.bladePoints = [];
    eng.totalSliced = 0;
    eng.totalBombsHit = 0;
    eng.maxComboThisGame = 0;
    eng.rareFruitsSliced = 0;
    eng.difficultyScale = 1.0;
    eng.iceTimer = 0;
    eng.comboBuffTimer = 0;
    eng.timeSpent = 0;

    if (mode === 'classic') {
      eng.lives = 3;
      setLives(3);
    } else if (mode === 'timeAttack') {
      eng.timeLeft = 60;
      setTimeLeft(60);
    } else if (mode === 'endless') {
      eng.lives = 9999; // Arbitrary high value
    }

    setScore(0);
    setIceActive(false);
    setComboActive(false);

    // Audio resume
    audio.playLaunch();
  }, [mode]);

  // Main game animation loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const eng = engineRef.current;
    eng.lastFrameTime = performance.now();

    const loop = (timestamp: number) => {
      const dt = timestamp - eng.lastFrameTime;
      eng.lastFrameTime = timestamp;

      if (!eng.isPaused) {
        updateGame(dt);
      }
      renderGame(ctx);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Sync Pause values between react state & physics loop
  useEffect(() => {
    engineRef.current.isPaused = isPaused;
  }, [isPaused]);

  // Handle Pause on Tab Switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Spawns random fruit groups or waves
  const spawnGroup = () => {
    const eng = engineRef.current;
    // Number of items based on difficulty and mode
    const count = Math.floor(Math.random() * (2 + Math.floor(eng.difficultyScale))) + 1;

    // Decide items to spawn
    const fruitsList: FruitType[] = ['watermelon', 'orange', 'apple', 'strawberry', 'banana', 'mango'];
    const rareList: FruitType[] = ['pineapple', 'kiwi', 'dragonfruit', 'coconut'];
    const specialList: FruitType[] = ['golden', 'ice', 'combo'];

    if (mode === 'timeAttack') {
      specialList.push('time');
    }

    for (let i = 0; i < count; i++) {
      let type: FruitType = 'watermelon';
      const rand = Math.random();

      // Spawn percentages
      if (rand < 0.12 && mode !== 'endless') {
        // Bomb spawn probability (increases over time)
        const bombChance = 0.15 + (eng.difficultyScale - 1) * 0.1;
        if (Math.random() < bombChance) {
          type = 'bomb';
        } else {
          type = fruitsList[Math.floor(Math.random() * fruitsList.length)] || 'watermelon';
        }
      } else if (rand < 0.22 && mode === 'endless') {
        // Higher bombs in endless
        type = 'bomb';
      } else if (rand < 0.35) {
        // Special/Powerup
        type = specialList[Math.floor(Math.random() * specialList.length)] || 'golden';
      } else if (rand < 0.55) {
        // Rare
        type = rareList[Math.floor(Math.random() * rareList.length)] || 'pineapple';
      } else {
        // Standard
        type = fruitsList[Math.floor(Math.random() * fruitsList.length)] || 'watermelon';
      }

      // Physics launch vectors
      const radius = FRUIT_CONFIGS[type]?.radius || 30;
      const x = radius + Math.random() * (eng.width - radius * 2);
      const y = eng.height + radius + 10;

      // Vx drift to direct fruit towards center of viewport
      const targetX = eng.width / 2 + (Math.random() * 100 - 50);
      const dy = eng.height * 0.7 + Math.random() * (eng.height * 0.15); // launcher peak height
      
      // Basic parabolic motion parameters
      const gravity = 0.00035; // px/ms^2
      // Time to peak: t = sqrt(2 * dy / g)
      const t = Math.sqrt((2 * dy) / gravity);
      const vy = -gravity * t; // launch upwards
      const vx = (targetX - x) / t; // lateral drift

      // Add rotation
      const vRot = (Math.random() * 0.15 - 0.075) * 0.05; // rad per ms

      eng.objects.push({
        id: Math.random().toString(),
        type,
        x,
        y,
        vx,
        vy,
        radius,
        rotation: Math.random() * Math.PI * 2,
        vRot,
        sliced: false,
        sliceAngle: 0,
        sliceProgress: 0,
        halfLeftX: 0,
        halfLeftY: 0,
        halfRightX: 0,
        halfRightY: 0,
        halfVxLeft: 0,
        halfVyLeft: 0,
        halfVxRight: 0,
        halfVyRight: 0,
        isSpecial: FRUIT_CONFIGS[type]?.isSpecial || false,
        isBomb: FRUIT_CONFIGS[type]?.isBomb || false,
        points: FRUIT_CONFIGS[type]?.points || 10,
        color: FRUIT_CONFIGS[type]?.color || '#fff',
        innerColor: FRUIT_CONFIGS[type]?.innerColor || '#eee',
        scale: 1,
        spawnTime: performance.now(),
        opacity: 1,
      });
    }

    audio.playLaunch();
  };

  // Slices fruit, spawns half pieces, triggers scoring, juice splashes, powerups
  const performSlice = (obj: SpawnedObject, sliceAngle: number) => {
    const eng = engineRef.current;
    obj.sliced = true;
    obj.sliceAngle = sliceAngle;

    // Track statistics
    eng.totalSliced++;
    if (FRUIT_CONFIGS[obj.type]?.isRare) {
      eng.rareFruitsSliced++;
    }

    // Splitting vectors perpendicular to the slice angle
    const speed = 0.15; // Splitting impulse
    const pushAngleL = sliceAngle + Math.PI / 2;
    const pushAngleR = sliceAngle - Math.PI / 2;

    obj.halfVxLeft = Math.cos(pushAngleL) * speed + obj.vx * 0.3;
    obj.halfVyLeft = Math.sin(pushAngleL) * speed + obj.vy * 0.3;
    obj.halfVxRight = Math.cos(pushAngleR) * speed + obj.vx * 0.3;
    obj.halfVyRight = Math.sin(pushAngleR) * speed + obj.vy * 0.3;

    // Trigger audio effects
    audio.playSlice();

    // Trigger Screen Vibration on successful slice
    if (saveData.settings.vibration && navigator.vibrate) {
      navigator.vibrate(15);
    }

    // Special item logic
    if (obj.isBomb) {
      eng.totalBombsHit++;
      audio.playBomb();
      eng.shakeIntensity = 20; // Extreme camera shake

      // Spawn black smoke particle burst
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.3 + 0.1;
        eng.particles.push({
          id: Math.random().toString(),
          x: obj.x,
          y: obj.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 15 + 10,
          color: i % 2 === 0 ? '#3730a3' : '#1e1b4b',
          opacity: 0.8,
          life: 0,
          maxLife: 40 + Math.random() * 30,
          rotation: Math.random() * Math.PI,
          vRot: Math.random() * 0.02 - 0.01,
          gravity: -0.00005, // Smoke drifts up
          type: 'smoke',
        });
      }

      // Bomb rules per mode
      if (mode === 'classic') {
        eng.lives = 0;
        setLives(0);
        handleEndGame();
        return;
      } else if (mode === 'timeAttack') {
        // Lose score and time
        eng.score = Math.max(0, eng.score - 100);
        eng.timeLeft = Math.max(0, eng.timeLeft - 10);
        setScore(eng.score);
        setTimeLeft(eng.timeLeft);

        eng.popups.push({
          id: Math.random().toString(),
          text: '-100 PTS / -10s 💥',
          x: obj.x,
          y: obj.y,
          color: '#ef4444',
          size: 18,
          opacity: 1,
          life: 0,
          maxLife: 1000,
          vy: -0.08,
        });
      } else if (mode === 'endless') {
        // Minus points only
        eng.score = Math.max(0, eng.score - 150);
        setScore(eng.score);

        eng.popups.push({
          id: Math.random().toString(),
          text: '-150 PTS 💥',
          x: obj.x,
          y: obj.y,
          color: '#ef4444',
          size: 18,
          opacity: 1,
          life: 0,
          maxLife: 1000,
          vy: -0.08,
        });
      }
    } else {
      // Normal/Rare/Special Slices
      let scoreGain = obj.points;

      // Handle custom buff triggers
      if (obj.type === 'golden') {
        audio.playPowerUp();
        // Golden sparkling star shower
        for (let i = 0; i < 25; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 0.35 + 0.15;
          eng.particles.push({
            id: Math.random().toString(),
            x: obj.x,
            y: obj.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 4 + 2,
            color: '#fbbf24',
            opacity: 1,
            life: 0,
            maxLife: 40 + Math.random() * 20,
            rotation: Math.random() * Math.PI,
            vRot: 0.05,
            gravity: 0.0001,
            type: 'star',
          });
        }
      } else if (obj.type === 'ice') {
        audio.playPowerUp();
        eng.iceTimer = 5000; // 5 seconds freeze time
        setIceActive(true);
        // Frosted bubble spray
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 0.2 + 0.05;
          eng.particles.push({
            id: Math.random().toString(),
            x: obj.x,
            y: obj.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 6 + 3,
            color: '#e0f2fe',
            opacity: 0.9,
            life: 0,
            maxLife: 40,
            rotation: 0,
            vRot: 0,
            gravity: -0.00005,
            type: 'bubble',
          });
        }
      } else if (obj.type === 'combo') {
        audio.playPowerUp();
        eng.comboBuffTimer = 8000; // 8 seconds double score buff
        setComboActive(true);
      } else if (obj.type === 'time') {
        audio.playPowerUp();
        eng.timeLeft += 5;
        setTimeLeft(eng.timeLeft);

        eng.popups.push({
          id: Math.random().toString(),
          text: '+5 SECONDS ⏱️',
          x: obj.x,
          y: obj.y,
          color: '#22c55e',
          size: 16,
          opacity: 1,
          life: 0,
          maxLife: 1000,
          vy: -0.08,
        });
      }

      // Apply double combo multiplier
      if (eng.comboBuffTimer > 0) {
        scoreGain *= 2;
      }

      // Track combo list
      eng.slicedInCurrentSwipe.push(obj.id);
      eng.lastSwipeTime = performance.now();

      // Spawn custom juice splash particle burst
      const isConfetti = saveData.activeJuice === 'confetti';
      const isNeon = saveData.activeJuice === 'neon';
      const particleCount = isConfetti ? 30 : 15;

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.35 + 0.1;
        const radius = isConfetti ? Math.random() * 4 + 3 : Math.random() * 6 + 2;
        
        let color = obj.innerColor;
        if (isConfetti) {
          // Rainbow confetti colors
          const palette = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#ec4899', '#a855f7'];
          color = palette[Math.floor(Math.random() * palette.length)] || '#fff';
        } else if (isNeon) {
          color = obj.color; // vivid outer fluorescent glow
        }

        eng.particles.push({
          id: Math.random().toString(),
          x: obj.x,
          y: obj.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius,
          color,
          opacity: 1,
          life: 0,
          maxLife: 30 + Math.random() * 20,
          rotation: Math.random() * Math.PI,
          vRot: Math.random() * 0.1 - 0.05,
          gravity: 0.0003, // gravity pull on splash
          type: isConfetti ? 'star' : 'juice',
        });
      }

      // Instant score gain added
      eng.score += scoreGain;
      setScore(eng.score);

      // Create floating point popups
      eng.popups.push({
        id: Math.random().toString(),
        text: `+${scoreGain}`,
        x: obj.x,
        y: obj.y,
        color: obj.type === 'golden' ? '#fbbf24' : '#fff',
        size: obj.type === 'golden' ? 22 : 14,
        opacity: 1,
        life: 0,
        maxLife: 800,
        vy: -0.05,
      });
    }
  };

  // Evaluates drag combos when user pauses or delay expires
  const checkComboEvaluation = () => {
    const eng = engineRef.current;
    if (eng.slicedInCurrentSwipe.length >= 2) {
      const count = eng.slicedInCurrentSwipe.length;
      const comboBonus = count * 10;
      eng.score += comboBonus;
      setScore(eng.score);

      eng.maxComboThisGame = Math.max(eng.maxComboThisGame, count);

      // Flash combo text at center screen
      audio.playCombo(count);
      setActiveCombo(count);
      setTimeout(() => setActiveCombo(0), 1200);

      // Push Combo score popup
      eng.popups.push({
        id: Math.random().toString(),
        text: `${count}x COMBO! +${comboBonus} PTS`,
        x: eng.width / 2,
        y: eng.height * 0.4,
        color: '#fbbf24',
        size: 24,
        opacity: 1,
        life: 0,
        maxLife: 1200,
        vy: -0.02,
      });
    }
    eng.slicedInCurrentSwipe = [];
  };

  // Slices intersection test using mathematically flawless segment-to-circle collision checks
  const checkSliceCollisions = (p1: BladePoint, p2: BladePoint) => {
    const eng = engineRef.current;
    
    // Slice angle of the swipe vector
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const sliceAngle = Math.atan2(dy, dx);

    eng.objects.forEach((obj) => {
      if (obj.sliced) return;

      // Circle-segment collision detection algorithm
      const cx = obj.x;
      const cy = obj.y;
      const r = obj.radius;

      const abX = dx;
      const abY = dy;
      const acX = cx - p1.x;
      const acY = cy - p1.y;

      const abLenSq = abX * abX + abY * abY;
      if (abLenSq === 0) return;

      // Projection ratio clamped between [0, 1]
      let t = (acX * abX + acY * abY) / abLenSq;
      t = Math.max(0, Math.min(1, t));

      const projX = p1.x + t * abX;
      const projY = p1.y + t * abY;

      const distSq = (cx - projX) * (cx - projX) + (cy - projY) * (cy - projY);

      if (distSq <= r * r) {
        performSlice(obj, sliceAngle);
      }
    });
  };

  // Main calculations step
  const updateGame = (dt: number) => {
    const eng = engineRef.current;
    
    // Scale dt to avoid ultra spikes or frame drops
    const clampedDt = Math.min(dt, 50);

    // Track survival time spent
    eng.timeSpent += clampedDt;

    // Difficulty increases as time scales
    eng.difficultyScale = 1.0 + eng.timeSpent / 45000; // 45 seconds to reach 2.0 scale

    // Decay buff timers
    if (eng.iceTimer > 0) {
      eng.iceTimer -= clampedDt;
      if (eng.iceTimer <= 0) setIceActive(false);
    }
    if (eng.comboBuffTimer > 0) {
      eng.comboBuffTimer -= clampedDt;
      if (eng.comboBuffTimer <= 0) setComboActive(false);
    }

    // Decay Camera shake intensity
    if (eng.shakeIntensity > 0) {
      eng.shakeIntensity -= clampedDt * 0.05;
      if (eng.shakeIntensity < 0) eng.shakeIntensity = 0;
    }

    // Evaluate combos after swipe stops
    if (eng.slicedInCurrentSwipe.length > 0 && performance.now() - eng.lastSwipeTime > eng.comboResetTime) {
      checkComboEvaluation();
    }

    // Update Blade trail life cycle
    const nowTime = performance.now();
    eng.bladePoints = eng.bladePoints.filter((pt) => nowTime - pt.time < 180); // 180ms trail duration

    // Settle sword angle towards ready resting stance (-Math.PI / 4) when not swiping actively
    const targetRestAngle = -Math.PI / 4;
    let diffRest = targetRestAngle - eng.swordAngle;
    diffRest = Math.atan2(Math.sin(diffRest), Math.cos(diffRest));
    eng.swordAngle += diffRest * 0.03; // tiny gentle pull factor per frame

    // Gravity calculation based on time warp (Ice Fruit slows speed)
    const activeGravity = eng.iceTimer > 0 ? 0.00012 : 0.00035;
    const timeFactor = eng.iceTimer > 0 ? 0.4 : 1.0;

    // Launch spawner timer
    eng.spawnerTimer += clampedDt;
    const currentInterval = Math.max(800, eng.spawnInterval - (eng.difficultyScale - 1) * 350);
    if (eng.spawnerTimer >= currentInterval) {
      eng.spawnerTimer = 0;
      spawnGroup();
    }

    // Time Attack rules countdown
    if (mode === 'timeAttack') {
      eng.timeLeft -= clampedDt / 1000;
      setTimeLeft(Math.max(0, Math.ceil(eng.timeLeft)));
      if (eng.timeLeft <= 0) {
        handleEndGame();
        return;
      }
    }

    // Update Spawned Fruits Positions
    eng.objects = eng.objects.filter((obj) => {
      // Sliced halves separate and fly away with gravity
      if (obj.sliced) {
        obj.sliceProgress += clampedDt * 0.003;
        
        obj.halfLeftX += obj.halfVxLeft * clampedDt * timeFactor;
        obj.halfLeftY += obj.halfVyLeft * clampedDt * timeFactor;
        obj.halfRightX += obj.halfVxRight * clampedDt * timeFactor;
        obj.halfRightY += obj.halfVyRight * clampedDt * timeFactor;

        obj.halfVyLeft += activeGravity * clampedDt * timeFactor;
        obj.halfVyRight += activeGravity * clampedDt * timeFactor;

        obj.opacity = Math.max(0, 1 - obj.sliceProgress);
        return obj.opacity > 0;
      }

      // Intact fruits drift along launch curve
      obj.x += obj.vx * clampedDt * timeFactor;
      obj.y += obj.vy * clampedDt * timeFactor;
      obj.vy += activeGravity * clampedDt * timeFactor;
      obj.rotation += obj.vRot * clampedDt * timeFactor;

      // Off-screen checks
      const fellOffBottom = obj.y > eng.height + obj.radius + 15 && obj.vy > 0;
      if (fellOffBottom) {
        if (!obj.isBomb) {
          // Missing normal fruits deducts heart in Classic mode
          if (mode === 'classic') {
            eng.lives--;
            setLives(Math.max(0, eng.lives));
            // Vibration buzz
            if (saveData.settings.vibration && navigator.vibrate) {
              navigator.vibrate([100, 50, 100]);
            }

            if (eng.lives <= 0) {
              handleEndGame();
              return false;
            }
          }
        }
        return false; // Remove off screen item
      }
      return true;
    });

    // Update Particles
    eng.particles = eng.particles.filter((p) => {
      p.life += clampedDt;
      p.x += p.vx * clampedDt;
      p.y += p.vy * clampedDt;
      p.vy += p.gravity * clampedDt;
      p.rotation += p.vRot * clampedDt;
      p.opacity = Math.max(0, 1 - p.life / p.maxLife);
      return p.life < p.maxLife;
    });

    // Update Score Popups
    eng.popups = eng.popups.filter((p) => {
      p.life += clampedDt;
      p.y += p.vy * clampedDt;
      p.opacity = Math.max(0, 1 - p.life / p.maxLife);
      return p.life < p.maxLife;
    });
  };

  // Render everything to 2D Canvas context
  const renderGame = (ctx: CanvasRenderingContext2D) => {
    const eng = engineRef.current;
    ctx.clearRect(0, 0, eng.width, eng.height);

    ctx.save();

    // Camera Screen Shake Translation
    if (eng.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * eng.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * eng.shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Background custom styling / details if needed (mostly covered by parent CSS, but can add Dojo sand lines etc.)
    if (activeBgConfig.id === 'zen') {
      // Draw Zen ripples
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.05)';
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 6; i++) {
        ctx.beginPath();
        ctx.arc(eng.width / 2, eng.height / 2, i * 65, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (activeBgConfig.id === 'neon') {
      // Draw neon grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < eng.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, eng.height);
        ctx.stroke();
      }
      for (let y = 0; y < eng.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(eng.width, y);
        ctx.stroke();
      }
    }

    // 2. Draw Particles
    eng.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.type === 'star') {
        // Draw 5 pointed star
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * p.radius, -Math.sin(((18 + i * 72) * Math.PI) / 180) * p.radius);
          ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (p.radius * 0.4), -Math.sin(((54 + i * 72) * Math.PI) / 180) * (p.radius * 0.4));
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Splashes, bubbles, smoke are circles
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Shiny glow on juice
        if (saveData.activeJuice === 'neon') {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      ctx.restore();
    });

    // 3. Draw Fruits and Bombs
    eng.objects.forEach((obj) => {
      drawFruit(ctx, obj);
    });

    // 4. Draw Blade Swiping Trail
    if (eng.bladePoints.length >= 2) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw custom trailing blade styles
      if (activeBladeConfig.id === 'fire') {
        ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#f97316';
      } else if (activeBladeConfig.id === 'rainbow') {
        // Dynamic rainbow cycle gradient
        const grad = ctx.createLinearGradient(
          eng.bladePoints[0]?.x || 0,
          eng.bladePoints[0]?.y || 0,
          eng.bladePoints[eng.bladePoints.length - 1]?.x || 0,
          eng.bladePoints[eng.bladePoints.length - 1]?.y || 0
        );
        grad.addColorStop(0, '#f43f5e');
        grad.addColorStop(0.3, '#eab308');
        grad.addColorStop(0.6, '#10b981');
        grad.addColorStop(1, '#3b82f6');
        ctx.strokeStyle = grad;
        ctx.shadowColor = 'rgba(236, 72, 153, 0.5)';
        ctx.shadowBlur = 8;
      } else if (activeBladeConfig.id === 'shadow') {
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#7c3aed';
      } else if (activeBladeConfig.id === 'cosmic') {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#ffffff';
      } else {
        // default
        ctx.shadowColor = activeBladeConfig.glowColor;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#ffffff';
      }

      // Draw tapered width path
      for (let i = 1; i < eng.bladePoints.length; i++) {
        const pA = eng.bladePoints[i - 1]!;
        const pB = eng.bladePoints[i]!;

        // Proportional width gets smaller near the tail
        const ratio = i / eng.bladePoints.length;
        ctx.lineWidth = ratio * 7;

        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }

      // Inner white high contrast core line
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(eng.bladePoints[0]!.x, eng.bladePoints[0]!.y);
      for (let i = 1; i < eng.bladePoints.length; i++) {
        ctx.lineTo(eng.bladePoints[i]!.x, eng.bladePoints[i]!.y);
      }
      ctx.stroke();

      ctx.restore();
    }

    // 5. Draw Float Score Popups
    eng.popups.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.font = `black italic ${p.size}px font-sans`;
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    });

    // 6. Draw Sword cursor (representing the arrow) in foreground
    if (eng.isPointerInside && !isPaused) {
      drawSword(ctx, eng.pointerX, eng.pointerY, eng.swordAngle, activeBladeConfig.id);
    }

    ctx.restore(); // restore from camera translation
  };

  const drawSword = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, bladeId: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2); // Rotate so sword points in direction of motion

    // Draw shadow of the sword first for 3D depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    if (bladeId === 'fire') {
      // Blazing Broadsword
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;

      // Draw jagged fire blade shape
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-4.5, 0);
      ctx.lineTo(-4, -15);
      ctx.lineTo(-6, -22); // jag
      ctx.lineTo(-3.5, -30);
      ctx.lineTo(-5, -38); // jag
      ctx.lineTo(0, -48);  // tip
      ctx.lineTo(5, -38);   // jag
      ctx.lineTo(3.5, -30);
      ctx.lineTo(6, -22);  // jag
      ctx.lineTo(4, -15);
      ctx.lineTo(4.5, 0);
      ctx.closePath();
      ctx.fill();

      // Inner hot yellow core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(-1.5, -15);
      ctx.lineTo(-2.5, -22);
      ctx.lineTo(-1.5, -30);
      ctx.lineTo(-2, -38);
      ctx.lineTo(0, -44);
      ctx.lineTo(2, -38);
      ctx.lineTo(1.5, -30);
      ctx.lineTo(2.5, -22);
      ctx.lineTo(1.5, -15);
      ctx.lineTo(2, 0);
      ctx.closePath();
      ctx.fill();

      // 2. Crossguard (Winged/V-shaped)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fbbf24'; // Golden
      ctx.beginPath();
      ctx.moveTo(-14, -4);
      ctx.lineTo(0, 2);
      ctx.lineTo(14, -4);
      ctx.lineTo(11, 4);
      ctx.lineTo(0, 7);
      ctx.lineTo(-11, 4);
      ctx.closePath();
      ctx.fill();

      // Gem in guard
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Handle / Grip
      ctx.fillStyle = '#7c2d12'; // Reddish wood
      ctx.fillRect(-2, 7, 4, 13);
      // Grip lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let h = 9; h <= 18; h += 3) {
        ctx.beginPath();
        ctx.moveTo(-2, h);
        ctx.lineTo(2, h);
        ctx.stroke();
      }

      // Pommel
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 21, 3.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (bladeId === 'rainbow') {
      // Prism Rapier / Saber
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 10;

      // 1. Blade with rainbow linear gradient
      const grad = ctx.createLinearGradient(0, 0, 0, -48);
      grad.addColorStop(0, '#3b82f6'); // blue
      grad.addColorStop(0.3, '#10b981'); // green
      grad.addColorStop(0.6, '#eab308'); // yellow
      grad.addColorStop(0.8, '#f43f5e'); // rose
      grad.addColorStop(1, '#ffffff'); // white shine tip

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(-1.5, -40);
      ctx.lineTo(0, -50); // sharp needle tip
      ctx.lineTo(1.5, -40);
      ctx.lineTo(2, 0);
      ctx.closePath();
      ctx.fill();

      // White core sparkle line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -46);
      ctx.stroke();

      // 2. Guard (Swirling Basket Hilt)
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 2, 7, Math.PI, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(-7, 2, 2.5, 0, Math.PI * 2);
      ctx.arc(7, 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Handle / Grip
      ctx.fillStyle = '#f8fafc'; // Silver/white wrapping
      ctx.fillRect(-1.5, 2, 3, 12);
      ctx.strokeStyle = '#a21caf';
      ctx.lineWidth = 0.8;
      for (let h = 4; h <= 12; h += 3) {
        ctx.beginPath();
        ctx.moveTo(-1.5, h);
        ctx.lineTo(1.5, h);
        ctx.stroke();
      }

      // Pommel pink crystal
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(0, 15, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (bladeId === 'shadow') {
      // Void Carver (Scythe-Sword)
      ctx.shadowColor = '#7c3aed';
      ctx.shadowBlur = 14;

      // 1. Blade (Dark Void with Indigo Center and Purple outline)
      ctx.fillStyle = '#1e1b4b'; // Deep indigo
      ctx.beginPath();
      ctx.moveTo(-3.5, 0);
      ctx.lineTo(-3, -15);
      ctx.lineTo(-5, -25); // Serrated left spike
      ctx.lineTo(-2.5, -28);
      ctx.lineTo(-4.5, -38); // Serrated left spike
      ctx.lineTo(0, -48); // tip
      ctx.lineTo(2.5, -30);
      ctx.lineTo(3.5, 0);
      ctx.closePath();
      ctx.fill();

      // Purple neon outline glow edge
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 2. Crossguard (Horny/Spiked)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#111827'; // Dark gray
      ctx.beginPath();
      ctx.moveTo(-11, -2);
      ctx.lineTo(-4, 2);
      ctx.lineTo(0, -1);
      ctx.lineTo(4, 2);
      ctx.lineTo(11, -2);
      ctx.lineTo(7, 4);
      ctx.lineTo(0, 5);
      ctx.lineTo(-7, 4);
      ctx.closePath();
      ctx.fill();

      // 3. Handle
      ctx.fillStyle = '#312e81'; // Purple/indigo wrapped
      ctx.fillRect(-1.8, 5, 3.6, 12);

      // Pommel purple skull/gem
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(0, 18, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (bladeId === 'cosmic') {
      // Solar Eclipse (Lightning Golden Saber)
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;

      // 1. Blade (Brilliant yellow-hot lighting blade)
      ctx.fillStyle = '#fef08a'; // Hot yellow
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-2, -42);
      ctx.lineTo(0, -49);
      ctx.lineTo(2, -42);
      ctx.lineTo(3, 0);
      ctx.closePath();
      ctx.fill();

      // Brilliant outer white shine core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-1, 0);
      ctx.lineTo(-0.8, -35);
      ctx.lineTo(0, -44);
      ctx.lineTo(0.8, -35);
      ctx.lineTo(1, 0);
      ctx.closePath();
      ctx.fill();

      // 2. Crossguard (Solar Disk with spikes)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fbbf24'; // Radiant gold
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Crossguard center star shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(0, -2);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-2, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(2, 0);
      ctx.closePath();
      ctx.fill();

      // 3. Handle / Grip
      ctx.fillStyle = '#f8fafc'; // Royal White wrapped
      ctx.fillRect(-1.8, 4, 3.6, 11);
      ctx.strokeStyle = '#fbbf24'; // Golden wrap lines
      ctx.lineWidth = 0.8;
      for (let h = 6; h <= 13; h += 3.5) {
        ctx.beginPath();
        ctx.moveTo(-1.8, h);
        ctx.lineTo(1.8, h);
        ctx.stroke();
      }

      // Golden orb pommel
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(0, 16, 2.8, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Default: Aqua Cut (Sleek light cyan energy Katana)
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;

      // 1. Blade
      ctx.fillStyle = '#e0f2fe'; // ultra light cyan
      ctx.beginPath();
      ctx.moveTo(-2.5, 0);
      ctx.lineTo(-1.8, -38);
      ctx.lineTo(0, -45); // curved tip
      ctx.lineTo(1.8, -38);
      ctx.lineTo(2.5, 0);
      ctx.closePath();
      ctx.fill();

      // Drawing a sleek katana spine curve or blade shine
      ctx.fillStyle = '#38bdf8'; // Cyan
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-0.5, -35);
      ctx.lineTo(0, -43);
      ctx.lineTo(1.5, -38);
      ctx.lineTo(2, 0);
      ctx.closePath();
      ctx.fill();

      // White inner shine line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-0.5, -2);
      ctx.lineTo(-0.5, -40);
      ctx.stroke();

      // 2. Guard (Classic circular tsuba)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0284c7'; // Deep ocean blue
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      // gold rim
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 3. Handle / Grip
      ctx.fillStyle = '#0f172a'; // Navy/Black grip
      ctx.fillRect(-1.6, 5, 3.2, 11);
      // wrapping diamond effects or simple lines
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 0.8;
      for (let h = 7; h <= 14; h += 3) {
        ctx.beginPath();
        ctx.moveTo(-1.6, h);
        ctx.lineTo(1.6, h);
        ctx.stroke();
      }

      // Pommel cap
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-1.8, 16, 3.6, 2.5);
    }

    ctx.restore();
  };

  // Dedicated custom procedural 2D fruit drawing function (Cartoon Gloss style)
  const drawFruit = (ctx: CanvasRenderingContext2D, obj: SpawnedObject) => {
    ctx.save();
    ctx.globalAlpha = obj.opacity;

    const r = obj.radius;
    const isSliced = obj.sliced;

    if (!isSliced) {
      // Render intact standard fruit
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rotation);
      ctx.scale(obj.scale, obj.scale);

      renderFruitDetails(ctx, obj.type, r);
    } else {
      // Render two sliced split rotating halves separation
      const splitOffset = obj.sliceProgress * 45; // split distance grows over time

      // Half A (Left half relative to slice vector angle)
      ctx.save();
      ctx.translate(obj.x + obj.halfLeftX, obj.y + obj.halfLeftY);
      ctx.rotate(obj.rotation + obj.sliceProgress * 1.5); // extra split rot
      ctx.scale(obj.scale, obj.scale);

      // Clip half sphere drawing
      ctx.beginPath();
      ctx.arc(0, 0, r + 5, obj.sliceAngle, obj.sliceAngle + Math.PI);
      ctx.clip();

      renderFruitDetails(ctx, obj.type, r);
      ctx.restore();

      // Half B (Right half relative to slice vector angle)
      ctx.save();
      ctx.translate(obj.x + obj.halfRightX, obj.y + obj.halfRightY);
      ctx.rotate(obj.rotation - obj.sliceProgress * 1.5);
      ctx.scale(obj.scale, obj.scale);

      ctx.beginPath();
      ctx.arc(0, 0, r + 5, obj.sliceAngle + Math.PI, obj.sliceAngle);
      ctx.clip();

      renderFruitDetails(ctx, obj.type, r);
      ctx.restore();
    }

    ctx.restore();
  };

  // Renders beautiful, multi-layered comic cartoon fruits procedurally on canvas
  const renderFruitDetails = (ctx: CanvasRenderingContext2D, type: FruitType, r: number) => {
    ctx.save();

    if (type === 'bomb') {
      // Charcoal metal circle
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#555566');
      grad.addColorStop(0.6, '#181825');
      grad.addColorStop(1, '#0c0a1f');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Draw metallic outline
      ctx.strokeStyle = '#312e81';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw burning rope wick
      ctx.save();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r * 0.5, -r * 0.8, r * 0.4, Math.PI, Math.PI * 1.8);
      ctx.stroke();
      ctx.restore();

      // Skull or crossbones threat warning icon center
      ctx.fillStyle = '#ef4444';
      ctx.font = 'black 22px font-sans';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠️', 0, 1);

    } else if (type === 'watermelon') {
      // Outer skin rind
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Striped dark details
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 4;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, r - 2, (i * 30 * Math.PI) / 180, ((i * 30 + 15) * Math.PI) / 180);
        ctx.stroke();
      }

      // Middle white rind ring
      ctx.fillStyle = '#f0fdf4';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
      ctx.fill();

      // Red inner flesh
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.76, 0, Math.PI * 2);
      ctx.fill();

      // Black seed dots
      ctx.fillStyle = '#0f172a';
      const seedR = r * 0.4;
      for (let a = 0; a < 360; a += 72) {
        const rad = (a * Math.PI) / 180;
        ctx.beginPath();
        ctx.arc(Math.cos(rad) * seedR, Math.sin(rad) * seedR, 2, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (type === 'orange') {
      // Orange outer skin
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Thin white ring boundary
      ctx.fillStyle = '#fffdfa';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Slices segments
      ctx.fillStyle = '#f97316';
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r * 0.82, (i * 45 + 5) * Math.PI / 180, (i * 45 + 40) * Math.PI / 180);
        ctx.closePath();
        ctx.fill();
      }

      // Core center
      ctx.fillStyle = '#fffdfa';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'apple') {
      // Outer red skin
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(0.8, '#dc2626');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Stem & green leaf at top
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, -r - 4, 3, 6);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(3, -r - 3, 5, 2.5, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Cream inner flesh core (only visible when split)
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      ctx.fill();

      // Brown apple seeds
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(-3, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(3, 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'pineapple') {
      // Golden yellow checkered oval body
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(0, 2, r * 0.85, r * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();

      // Leaf crown crown at the top
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.moveTo(-12, -r * 0.9);
      ctx.quadraticCurveTo(-15, -r * 1.6, -18, -r * 1.5);
      ctx.quadraticCurveTo(-8, -r * 1.2, 0, -r * 0.95);
      ctx.quadraticCurveTo(8, -r * 1.2, 18, -r * 1.5);
      ctx.quadraticCurveTo(15, -r * 1.6, 12, -r * 0.9);
      ctx.closePath();
      ctx.fill();

      // Spiky cross lines
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // left diagonals
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(-r * 0.7, r * i * 0.5);
        ctx.lineTo(r * 0.7, -r * i * 0.5);
      }
      // right diagonals
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(-r * 0.7, -r * i * 0.5);
        ctx.lineTo(r * 0.7, r * i * 0.5);
      }
      ctx.stroke();

    } else if (type === 'strawberry') {
      // Strawberry tapered body
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(-r, -r * 0.2);
      ctx.bezierCurveTo(-r, r * 0.5, -r * 0.4, r * 1.1, 0, r * 1.1);
      ctx.bezierCurveTo(r * 0.4, r * 1.1, r, r * 0.5, r, -r * 0.2);
      ctx.bezierCurveTo(r, -r * 0.8, -r, -r * 0.8, -r, -r * 0.2);
      ctx.closePath();
      ctx.fill();

      // Green crown
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.5);
      ctx.lineTo(0, -r * 0.3);
      ctx.lineTo(r * 0.8, -r * 0.5);
      ctx.lineTo(r * 0.4, -r * 0.8);
      ctx.lineTo(0, -r * 0.6);
      ctx.lineTo(-r * 0.4, -r * 0.8);
      ctx.closePath();
      ctx.fill();

      // Yellow seeds speckles
      ctx.fillStyle = '#fef08a';
      for (let y = -r * 0.2; y < r * 0.8; y += 10) {
        const span = Math.sqrt(Math.max(0, (r * r) - (y * y))) * 0.6;
        for (let x = -span; x <= span; x += 12) {
          ctx.fillRect(x + (Math.sin(y) * 2), y, 1.5, 2.5);
        }
      }

    } else if (type === 'kiwi') {
      // Brown fuzzy outer skin
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Light green flesh
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
      ctx.fill();

      // White core
      ctx.fillStyle = '#f0fdf4';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.32, r * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ring of small black kiwi seed circles
      ctx.fillStyle = '#1e293b';
      const seedR = r * 0.48;
      for (let a = 0; a < 360; a += 30) {
        const rad = (a * Math.PI) / 180;
        ctx.beginPath();
        ctx.arc(Math.cos(rad) * seedR, Math.sin(rad) * seedR, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (type === 'dragonfruit') {
      // Vibrant hot pink scales shape
      ctx.fillStyle = '#db2777';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Leafy scales
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(-r * 0.9, 0, 6, 12, Math.PI / 4, 0, Math.PI * 2);
      ctx.ellipse(r * 0.9, 0, 6, 12, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // White inner core
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
      ctx.fill();

      // Speckled black poppy seed dots
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radDist = Math.random() * (r * 0.65);
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * radDist, Math.sin(angle) * radDist, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (type === 'mango') {
      // Kidneys-shaped smooth yellow mango
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.85, r * 1.1, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Red mango flush side
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(-r * 0.25, -r * 0.25, r * 0.5, r * 0.7, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Small green leaf
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(3, -r * 0.95, 6, 3, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'coconut') {
      // Dark brown woody boundary
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Pure white rich coconut water circle
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Clear center
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'banana') {
      // Curved yellow crescent banana body
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.1, Math.PI * 0.1, Math.PI * 0.9);
      ctx.arc(0, 5, r * 1.0, Math.PI * 0.9, Math.PI * 0.1, true);
      ctx.closePath();
      ctx.fill();

      // Brown tips
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-r * 0.8, r * 0.5, 4, 4);
      ctx.fillRect(r * 0.8, r * 0.5, 4, 4);

    } else if (type === 'golden') {
      // Sparkling radiant star sphere
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#fef08a');
      grad.addColorStop(0.7, '#f59e0b');
      grad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // White star outline overlay
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * (r * 0.85), -Math.sin(((18 + i * 72) * Math.PI) / 180) * (r * 0.85));
        ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (r * 0.38), -Math.sin(((54 + i * 72) * Math.PI) / 180) * (r * 0.38));
      }
      ctx.closePath();
      ctx.stroke();

    } else if (type === 'ice') {
      // Translucent cyan sharp ice block
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#e0f2fe');
      grad.addColorStop(0.8, '#38bdf8');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.5);
      ctx.lineTo(r * 0.2, -r * 0.9);
      ctx.lineTo(r * 0.9, -r * 0.1);
      ctx.lineTo(r * 0.5, r * 0.8);
      ctx.lineTo(-r * 0.6, r * 0.7);
      ctx.closePath();
      ctx.fill();

      // Ice glints
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw shiny snowflake lines inside
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, 0);
      ctx.lineTo(r * 0.4, 0);
      ctx.moveTo(0, -r * 0.4);
      ctx.lineTo(0, r * 0.4);
      ctx.stroke();

    } else if (type === 'combo') {
      // Glowing vibrant rainbow sphere
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#c084fc');
      grad.addColorStop(0.7, '#ec4899');
      grad.addColorStop(1, '#3b82f6');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Flashing rings
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'black 16px font-mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2X', 0, 1);

    } else if (type === 'time') {
      // Clock visual timer
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#22c55e');
      grad.addColorStop(1, '#15803d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Outer rings and timer ticks
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw small clock hands
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r * 0.6); // minute hand
      ctx.moveTo(0, 0);
      ctx.lineTo(r * 0.4, 0); // hour hand
      ctx.stroke();
    }

    ctx.restore();
  };

  // Handles drag/swipe tracks capture
  const handleInteractionStart = (clientX: number, clientY: number) => {
    if (isPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const eng = engineRef.current;
    eng.isMouseDown = true;
    eng.slicedInCurrentSwipe = [];
    eng.bladePoints = [{ x, y, time: performance.now() }];

    // Update pointer position & activate sword cursor
    eng.pointerX = x;
    eng.pointerY = y;
    eng.isPointerInside = true;

    audio.playSwipe();
  };

  const handleInteractionMove = (clientX: number, clientY: number) => {
    const eng = engineRef.current;
    if (isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Track sword coordinates & set pointer inside canvas
    const prevX = eng.pointerX;
    const prevY = eng.pointerY;
    eng.pointerX = x;
    eng.pointerY = y;
    eng.isPointerInside = true;

    // Calculate angle of movement for sword rotation
    const dx = x - prevX;
    const dy = y - prevY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 2) {
      const targetAngle = Math.atan2(dy, dx);
      // Smooth interpolation of angle wrapping around correctly
      let diff = targetAngle - eng.swordAngle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      eng.swordAngle += diff * 0.45;
    }

    if (!eng.isMouseDown) return;

    const now = performance.now();
    const lastPoint = eng.bladePoints[eng.bladePoints.length - 1];

    if (lastPoint) {
      // Calculate distance between points for swipe
      const sDx = x - lastPoint.x;
      const sDy = y - lastPoint.y;
      const sDist = Math.sqrt(sDx * sDx + sDy * sDy);

      // Avoid registering static hover points
      if (sDist > 3) {
        const newPoint = { x, y, time: now };
        
        // Swiping sound loops occasionally on continuous drag
        if (eng.bladePoints.length % 5 === 0) {
          audio.playSwipe();
        }

        // Detect intersections on line segment
        checkSliceCollisions(lastPoint, newPoint);
        eng.bladePoints.push(newPoint);
      }
    }
  };

  const handleInteractionEnd = () => {
    const eng = engineRef.current;
    eng.isMouseDown = false;
    // Evaluate if drag combos exist
    checkComboEvaluation();
  };

  // Touch listener handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      handleInteractionStart(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      handleInteractionMove(touch.clientX, touch.clientY);
    }
  };

  // Mouse listener handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleInteractionStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleInteractionMove(e.clientX, e.clientY);
  };

  // Ends current gameplay, calculates final coin yield, saves scores and triggers rewards
  const handleEndGame = () => {
    const eng = engineRef.current;
    eng.isPaused = true;

    // Coins are awarded proportionally based on total score (1 coin per 10 points)
    const coinsEarned = Math.floor(eng.score / 10) + eng.maxComboThisGame * 2;
    
    // Save high score, update coins, progress daily challenges
    const updated = updateStatsAndChallenges(
      eng.totalSliced,
      eng.totalBombsHit,
      eng.maxComboThisGame,
      eng.score,
      mode,
      eng.rareFruitsSliced
    );

    // Reward coins addition
    updated.coins += coinsEarned;
    saveSaveData(updated);
    onUpdateSaveData(updated);

    audio.playGameOver();
    onGameOver(eng.score, coinsEarned, eng.maxComboThisGame);
  };

  const togglePause = () => {
    audio.playClick();
    setIsPaused(!isPaused);
  };

  return (
    <div
      ref={containerRef}
      id="gameplay-container"
      className="w-full h-full flex flex-col justify-between overflow-hidden relative select-none cursor-none text-white font-sans"
      style={{
        background: `radial-gradient(circle at center, ${activeBgConfig.accentBg} 20%, ${activeBgConfig.primaryBg} 100%)`,
      }}
    >
      
      {/* 1. Ice Freeze Border Glow layer */}
      <AnimatePresence>
        {iceActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 border-4 border-cyan-400 shadow-[inset_0_0_50px_rgba(34,211,238,0.45)] pointer-events-none z-20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* 2. Double Combo Border Flashing layer */}
      <AnimatePresence>
        {comboActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 border-4 border-fuchsia-500 shadow-[inset_0_0_50px_rgba(236,72,153,0.35)] pointer-events-none z-20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* --- HUD HEADER ROW --- */}
      <div className="flex justify-between items-center px-4 py-3 bg-black/30 backdrop-blur-xs border-b border-white/5 relative z-30 shrink-0">
        
        {/* Lives Counter (Classic Mode) */}
        {mode === 'classic' ? (
          <div className="flex gap-1 items-center bg-black/40 py-1.5 px-3 rounded-full border border-red-500/10">
            {[1, 2, 3].map((heart) => (
              <Heart
                key={heart}
                className={`w-5 h-5 transition-all ${
                  lives >= heart ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-700 opacity-40'
                }`}
              />
            ))}
          </div>
        ) : mode === 'timeAttack' ? (
          /* Timer Clock (Time Attack Mode) */
          <div className="flex items-center gap-1.5 bg-black/40 py-1.5 px-3.5 rounded-full border border-emerald-500/15 font-mono">
            <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'text-red-500 animate-ping' : 'text-emerald-400'}`} />
            <span className={`text-base font-black ${timeLeft <= 10 ? 'text-red-400 font-black' : 'text-slate-100'}`}>
              {timeLeft}s
            </span>
          </div>
        ) : (
          /* Endless Mode Icon badge */
          <div className="flex items-center gap-1.5 bg-black/40 py-1.5 px-3.5 rounded-full border border-purple-500/15">
            <Trophy className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-xs font-black uppercase text-purple-200 tracking-wider font-sans">Endless</span>
          </div>
        )}

        {/* Real-time score indicator */}
        <div className="text-center font-mono bg-black/50 py-1 px-4 rounded-2xl border border-white/5">
          <span className="text-[9px] block text-slate-500 font-bold uppercase tracking-widest leading-none">Score</span>
          <span className="text-lg md:text-xl font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-tight">
            {score}
          </span>
        </div>

        {/* Buttons: Pause */}
        <button
          onClick={togglePause}
          className="p-2 bg-slate-900/60 hover:bg-slate-900/90 active:scale-95 transition-all rounded-full border border-white/10"
        >
          <Pause className="w-4 h-4 text-slate-100" />
        </button>
      </div>

      {/* --- MAIN GAMEPLAY INTERACTIVE STAGE CANVAS --- */}
      <div className="flex-1 w-full relative overflow-hidden bg-transparent">
        
        {/* Floating Active Combo Notification */}
        <AnimatePresence>
          {activeCombo >= 2 && (
            <motion.div
              initial={{ scale: 0, y: 100, rotate: -15 }}
              animate={{ scale: [1.2, 1.0], y: 0, rotate: -5 }}
              exit={{ scale: 0, opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 8 }}
              className="absolute inset-x-0 top-1/4 flex flex-col items-center justify-center pointer-events-none z-20"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black px-6 py-2.5 rounded-full uppercase tracking-tighter text-xl italic shadow-2xl shadow-yellow-500/30 border-2 border-white">
                🔥 {activeCombo}x Fruit Slice Combo!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ice / Freeze filter notification banner */}
        <AnimatePresence>
          {iceActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-4 flex justify-center pointer-events-none z-20 text-[10px] font-mono font-black tracking-widest text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 py-1 px-4 rounded-full max-w-[160px] mx-auto uppercase"
            >
              ❄️ Time Slowed ❄️
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double Combo multiplier notification banner */}
        <AnimatePresence>
          {comboActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-12 flex justify-center pointer-events-none z-20 text-[10px] font-mono font-black tracking-widest text-fuchsia-300 bg-fuchsia-950/40 border border-fuchsia-500/20 py-1 px-4 rounded-full max-w-[160px] mx-auto uppercase"
            >
              🌈 2x Points Active 🌈
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actual HTML5 Game Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleInteractionEnd}
          onMouseEnter={() => { engineRef.current.isPointerInside = true; }}
          onMouseLeave={() => {
            engineRef.current.isPointerInside = false;
            handleInteractionEnd();
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => {
            engineRef.current.isPointerInside = false;
            handleInteractionEnd();
          }}
          className="absolute inset-0 block bg-transparent"
        />
      </div>

      {/* --- IN-GAME PAUSE SCREEN --- */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            id="pause-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-40"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-xs bg-slate-900 border border-white/10 rounded-3xl p-6 text-center space-y-6 shadow-2xl"
            >
              <div>
                <h3 className="text-2xl font-black uppercase text-emerald-400 tracking-wide">Dojo Paused</h3>
                <p className="text-xs text-slate-400 mt-1">Ready to resume slicing?</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setIsPaused(false)}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase rounded-full tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-black text-black" /> Resume Dojo
                </button>

                <button
                  onClick={() => {
                    audio.playClick();
                    onBackToMenu();
                  }}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-black text-sm uppercase rounded-full tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Home className="w-4 h-4" /> Exit to Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
