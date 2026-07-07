/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Home, Award, Sparkles, Coins, Trophy } from 'lucide-react';
import { GameMode, SaveData } from './types';
import { loadSaveData, saveSaveData } from './lib/storage';
import audio from './lib/audio';

import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import Shop from './components/Shop';
import Challenges from './components/Challenges';

type GameState = 'menu' | 'playing' | 'gameover';

export default function App() {
  const [saveData, setSaveData] = useState<SaveData | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [activeOverlay, setActiveOverlay] = useState<'shop' | 'challenges' | null>(null);
  const [gameOverStats, setGameOverStats] = useState({
    score: 0,
    coinsEarned: 0,
    maxCombo: 0,
    isNewHighScore: false,
  });

  // 1. Initial State Load on startup
  useEffect(() => {
    const data = loadSaveData();
    setSaveData(data);
    
    // Sync starting audio pack config
    audio.setSoundPack(data.activeSoundPack);
    audio.setSFXVolume(data.settings.sfxVolume);
    audio.setMusicVolume(data.settings.musicVolume);

    // Prompt user interaction to start ambient music
    const startAudioContext = () => {
      audio.init();
      audio.startMusic();
      window.removeEventListener('click', startAudioContext);
      window.removeEventListener('touchstart', startAudioContext);
    };

    window.addEventListener('click', startAudioContext);
    window.addEventListener('touchstart', startAudioContext);

    return () => {
      window.removeEventListener('click', startAudioContext);
      window.removeEventListener('touchstart', startAudioContext);
    };
  }, []);

  if (!saveData) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center font-sans text-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs uppercase tracking-widest font-black text-emerald-400">Loading Dojo...</p>
      </div>
    );
  }

  const handleStartGame = (mode: GameMode) => {
    setSelectedMode(mode);
    setGameState('playing');
    audio.stopMusic(); // Turn off menu arpeggiator when gameplay starts
  };

  const handleGameOver = (score: number, coinsEarned: number, maxCombo: number) => {
    // Check if score broke the existing high score record
    const prevHigh = saveData.highScores[selectedMode] || 0;
    const isNewHigh = score > prevHigh;

    setGameOverStats({
      score,
      coinsEarned,
      maxCombo,
      isNewHighScore: isNewHigh,
    });
    setGameState('gameover');
    
    // Resume menu background music loop
    audio.startMusic();
  };

  const handleRestart = () => {
    audio.playClick();
    setGameState('playing');
    audio.stopMusic();
  };

  const handleBackToMenu = () => {
    audio.playClick();
    setGameState('menu');
  };

  return (
    <div id="app-viewport" className="w-full min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
      
      {/* 
        Aesthetic Desktop Phone Frame Mockup Container.
        On mobile viewports (< 640px), it scales beautifully to occupy 100% full screen.
        On wider screens (Desktop), it frames the game inside a beautiful, high-end tropical mobile bezel.
      */}
      <div className="w-full h-screen sm:w-[410px] sm:h-[860px] sm:max-h-[92vh] sm:rounded-[42px] sm:border-[10px] sm:border-slate-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col bg-slate-950">
        
        <AnimatePresence mode="wait">
          {/* A. Menu state */}
          {gameState === 'menu' && (
            <motion.div
              key="menu-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col"
            >
              <MainMenu
                saveData={saveData}
                onStartGame={handleStartGame}
                onOpenShop={() => setActiveOverlay('shop')}
                onOpenChallenges={() => setActiveOverlay('challenges')}
                onUpdateSaveData={setSaveData}
              />
            </motion.div>
          )}

          {/* B. Slicing Game state */}
          {gameState === 'playing' && (
            <motion.div
              key="gameplay-screen"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full flex flex-col"
            >
              <GameCanvas
                mode={selectedMode}
                saveData={saveData}
                onGameOver={handleGameOver}
                onBackToMenu={handleBackToMenu}
                onUpdateSaveData={setSaveData}
              />
            </motion.div>
          )}

          {/* C. Game Over Summary state */}
          {gameState === 'gameover' && (
            <motion.div
              key="gameover-screen"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full h-full bg-slate-950/95 flex flex-col justify-between p-6 text-white font-sans text-center relative overflow-y-auto scrollbar-none z-40 select-none"
            >
              {/* Splatters decoration in background */}
              <div className="absolute inset-0 bg-radial-gradient from-red-950/20 via-slate-950 to-slate-950 pointer-events-none z-0" />

              {/* Game Over Title header */}
              <div className="my-auto space-y-6 z-10 py-4 shrink-0">
                <div>
                  <h2 className="text-red-500 text-xs font-black tracking-widest uppercase mb-1">
                    🎋 GAME OVER 🎋
                  </h2>
                  <h1 className="text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
                    Slicing Stopped
                  </h1>
                  <span className="text-xs font-bold text-slate-500 uppercase font-mono">
                    Mode: {selectedMode === 'classic' ? 'Classic Hearts' : selectedMode === 'timeAttack' ? 'Time Attack' : 'Endless Training'}
                  </span>
                </div>

                {/* Score and Stats Panel Card */}
                <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 space-y-4 max-w-xs mx-auto">
                  
                  {/* Score */}
                  <div className="relative inline-block">
                    {gameOverStats.isNewHighScore && (
                      <span className="absolute -top-4 -right-12 bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full rotate-12 flex items-center gap-0.5 animate-bounce">
                        <Sparkles className="w-2.5 h-2.5" /> NEW HIGH!
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Final Score</span>
                    <h3 className="text-4xl font-black font-mono text-yellow-300 tracking-tight leading-none mt-1">
                      {gameOverStats.score}
                    </h3>
                  </div>

                  {/* Coin rewards details */}
                  <div className="flex justify-around items-center border-t border-white/5 pt-4">
                    <div className="text-center font-mono">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Max Combo</span>
                      <span className="block text-sm font-black text-slate-200 mt-0.5">{gameOverStats.maxCombo}x</span>
                    </div>

                    <div className="w-[1px] h-8 bg-white/5" />

                    <div className="text-center font-mono">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Coins Earned</span>
                      <span className="block text-sm font-black text-yellow-400 mt-0.5">🪙 +{gameOverStats.coinsEarned}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons footer */}
              <div className="w-full max-w-xs mx-auto space-y-3.5 z-10 pb-6 shrink-0">
                <button
                  id="gameover-restart-btn"
                  onClick={handleRestart}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-base uppercase rounded-full tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5 stroke-[2.5]" /> Slay Again
                </button>

                <button
                  id="gameover-home-btn"
                  onClick={handleBackToMenu}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-black text-sm uppercase rounded-full tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" /> Dojo Menu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- DYNAMIC SLIDING DOJO STORE OVERLAY --- */}
        <AnimatePresence>
          {activeOverlay === 'shop' && (
            <Shop
              onClose={() => setActiveOverlay(null)}
              saveData={saveData}
              onUpdateSaveData={setSaveData}
            />
          )}
        </AnimatePresence>

        {/* --- DYNAMIC SLIDING CHALLENGES OVERLAY --- */}
        <AnimatePresence>
          {activeOverlay === 'challenges' && (
            <Challenges
              onClose={() => setActiveOverlay(null)}
              saveData={saveData}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
