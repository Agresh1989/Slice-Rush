/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Scissors, Calendar, Settings, HelpCircle, Volume2, Music as MusicIcon, RefreshCw, Smartphone, VolumeX, ShieldAlert, Check } from 'lucide-react';
import { GameMode, SaveData } from '../types';
import audio from '../lib/audio';
import { saveSaveData, getInitialSaveData } from '../lib/storage';

interface MainMenuProps {
  saveData: SaveData;
  onStartGame: (mode: GameMode) => void;
  onOpenShop: () => void;
  onOpenChallenges: () => void;
  onUpdateSaveData: (data: SaveData) => void;
}

export default function MainMenu({
  saveData,
  onStartGame,
  onOpenShop,
  onOpenChallenges,
  onUpdateSaveData,
}: MainMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Settings state synced on change
  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    const updated = {
      ...saveData,
      settings: { ...saveData.settings, musicVolume: vol },
    };
    onUpdateSaveData(updated);
    saveSaveData(updated);
    audio.setMusicVolume(vol);
  };

  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    const updated = {
      ...saveData,
      settings: { ...saveData.settings, sfxVolume: vol },
    };
    onUpdateSaveData(updated);
    saveSaveData(updated);
    audio.setSFXVolume(vol);
  };

  const toggleVibration = () => {
    audio.playClick();
    const updated = {
      ...saveData,
      settings: { ...saveData.settings, vibration: !saveData.settings.vibration },
    };
    onUpdateSaveData(updated);
    saveSaveData(updated);
    if (updated.settings.vibration && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleResetData = () => {
    audio.playBomb();
    const fresh = getInitialSaveData();
    onUpdateSaveData(fresh);
    saveSaveData(fresh);
    setResetConfirm(false);
    setShowSettings(false);
  };

  const launchMode = (mode: GameMode) => {
    audio.playClick();
    onStartGame(mode);
  };

  // Check how many challenges completed
  const completedCount = saveData.dailyChallenges.challenges.filter((c) => c.completed).length;

  return (
    <div id="main-menu" className="w-full min-h-screen flex flex-col justify-between p-6 text-white overflow-y-auto scrollbar-none font-sans relative select-none">
      
      {/* Dynamic Background Mesh based on theme */}
      <div className="absolute inset-0 z-0 bg-radial-gradient from-emerald-900/60 via-slate-950/95 to-slate-950 pointer-events-none" />

      {/* Decorative Bamboo Grid Leaves */}
      <div className="absolute top-0 inset-x-0 h-40 bg-linear-to-b from-emerald-500/10 to-transparent pointer-events-none z-0" />

      {/* Header Info */}
      <div className="w-full flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-1.5 bg-black/40 border border-yellow-500/20 px-4 py-1.5 rounded-full backdrop-blur-xs">
          <span className="text-[11px] font-black uppercase text-yellow-500 tracking-wider">DOJO COINS</span>
          <span className="font-mono text-sm font-black text-yellow-300 ml-1">🪙 {saveData.coins}</span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3">
          <button
            id="challenges-btn"
            onClick={() => {
              audio.playClick();
              onOpenChallenges();
            }}
            className="p-2.5 rounded-full bg-slate-900/60 border border-white/10 text-emerald-400 hover:text-emerald-300 hover:scale-105 active:scale-95 transition-all relative"
            title="Daily Challenges"
          >
            <Calendar className="w-5.5 h-5.5" />
            {completedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950">
                {completedCount}
              </span>
            )}
          </button>

          <button
            id="shop-btn"
            onClick={() => {
              audio.playClick();
              onOpenShop();
            }}
            className="p-2.5 rounded-full bg-slate-900/60 border border-white/10 text-yellow-400 hover:text-yellow-300 hover:scale-105 active:scale-95 transition-all"
            title="Shop Dojo"
          >
            <Scissors className="w-5.5 h-5.5" />
          </button>

          <button
            id="settings-btn"
            onClick={() => {
              audio.playClick();
              setShowSettings(true);
            }}
            className="p-2.5 rounded-full bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:scale-105 active:scale-95 transition-all"
            title="Settings"
          >
            <Settings className="w-5.5 h-5.5" />
          </button>
        </div>
      </div>

      {/* Hero Brand Title */}
      <div className="text-center my-auto py-8 z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 80 }}
          className="relative inline-block"
        >
          {/* Neon backglow */}
          <div className="absolute -inset-2 bg-emerald-500/15 rounded-full filter blur-xl animate-pulse" />

          <h2 className="text-emerald-400 text-xs md:text-sm font-black tracking-widest uppercase mb-1">
            🎋 ORIGINAL SLICING ARCADE 🎋
          </h2>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-emerald-300 to-yellow-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] leading-none uppercase select-none">
            Slice Rush
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="h-[2px] w-8 bg-emerald-500/40 rounded" />
            <h3 className="text-sm md:text-lg font-black tracking-widest text-slate-300 uppercase italic">
              Fruit Frenzy
            </h3>
            <span className="h-[2px] w-8 bg-emerald-500/40 rounded" />
          </div>
        </motion.div>
      </div>

      {/* Main Game Modes Section */}
      <div className="w-full max-w-lg mx-auto space-y-4 z-10 pb-6">
        <h3 className="text-[10px] font-black tracking-widest text-slate-400 text-center uppercase mb-1">
          CHOOSE YOUR DOJO CHALLENGE
        </h3>

        {/* Classic Mode Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => launchMode('classic')}
          id="mode-classic"
          className="w-full p-4 rounded-3xl bg-slate-900/55 border border-emerald-500/20 text-left flex items-center justify-between gap-4 transition-all hover:bg-slate-900/80 hover:border-emerald-500/40"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse inline-block" />
              <h4 className="font-black text-lg md:text-xl uppercase text-slate-100 tracking-wide">Classic</h4>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              3 Lives. Slay the launched fruits. Avoid dangerous bombs. Difficulty builds continuously!
            </p>
          </div>
          <div className="text-right shrink-0 bg-emerald-500/10 py-1.5 px-3.5 rounded-2xl border border-emerald-500/10 font-mono">
            <span className="block text-[8px] font-black text-emerald-400 tracking-wider uppercase">HIGH</span>
            <span className="text-sm font-black text-emerald-200">{saveData.highScores.classic} pts</span>
          </div>
        </motion.button>

        {/* Time Attack Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => launchMode('timeAttack')}
          id="mode-time-attack"
          className="w-full p-4 rounded-3xl bg-slate-900/55 border border-orange-500/20 text-left flex items-center justify-between gap-4 transition-all hover:bg-slate-900/80 hover:border-orange-500/40"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
              <h4 className="font-black text-lg md:text-xl uppercase text-slate-100 tracking-wide">Time Attack</h4>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              60s Timer. Slicing bombs drains timer. Grab neon blue time clocks for +5s bonuses!
            </p>
          </div>
          <div className="text-right shrink-0 bg-orange-500/10 py-1.5 px-3.5 rounded-2xl border border-orange-500/10 font-mono">
            <span className="block text-[8px] font-black text-orange-400 tracking-wider uppercase">HIGH</span>
            <span className="text-sm font-black text-orange-200">{saveData.highScores.timeAttack} pts</span>
          </div>
        </motion.button>

        {/* Endless Mode Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => launchMode('endless')}
          id="mode-endless"
          className="w-full p-4 rounded-3xl bg-slate-900/55 border border-purple-500/20 text-left flex items-center justify-between gap-4 transition-all hover:bg-slate-900/80 hover:border-purple-500/40"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-purple-500 animate-pulse inline-block" />
              <h4 className="font-black text-lg md:text-xl uppercase text-slate-100 tracking-wide">Endless Dojo</h4>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              No Lives constraint. Pure endurance training. Launch frequency and speeds scale infinitely!
            </p>
          </div>
          <div className="text-right shrink-0 bg-purple-500/10 py-1.5 px-3.5 rounded-2xl border border-purple-500/10 font-mono">
            <span className="block text-[8px] font-black text-purple-400 tracking-wider uppercase">HIGH</span>
            <span className="text-sm font-black text-purple-200">{saveData.highScores.endless} pts</span>
          </div>
        </motion.button>
      </div>

      {/* Help / Tutorial button footer */}
      <div className="w-full flex justify-center pb-2 z-10 shrink-0">
        <button
          onClick={() => {
            audio.playClick();
            setShowTutorial(true);
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer bg-slate-900/20 py-2 px-4 rounded-full border border-white/5 hover:border-white/10 shadow-sm"
        >
          <HelpCircle className="w-4 h-4 text-emerald-400" /> Learn Slicing Technique
        </button>
      </div>

      {/* --- OVERLAYS --- */}

      {/* 1. Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            id="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-black text-lg uppercase tracking-wide text-slate-100">Settings</h3>
                </div>
                <button
                  onClick={() => {
                    audio.playClick();
                    setShowSettings(false);
                  }}
                  className="px-3 py-1 text-xs font-black uppercase text-slate-400 hover:text-white bg-white/5 rounded-full"
                >
                  Done
                </button>
              </div>

              {/* Volume sliders */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                    <span className="flex items-center gap-1.5"><MusicIcon className="w-4 h-4 text-emerald-400" /> Ambient Music</span>
                    <span className="font-mono">{Math.round(saveData.settings.musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={saveData.settings.musicVolume}
                    onChange={handleMusicVolumeChange}
                    className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                    <span className="flex items-center gap-1.5"><Volume2 className="w-4 h-4 text-emerald-400" /> Slicing Sound FX</span>
                    <span className="font-mono">{Math.round(saveData.settings.sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={saveData.settings.sfxVolume}
                    onChange={handleSfxVolumeChange}
                    className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Vibration toggle */}
                <div className="flex items-center justify-between py-3 border-y border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" /> Swipe Vibration
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Tactile slice rumble feedback</span>
                  </div>
                  <button
                    onClick={toggleVibration}
                    className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                      saveData.settings.vibration ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <motion.div
                      layout
                      className="w-5 h-5 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
              </div>

              {/* Reset Section */}
              <div className="mt-8 pt-4 border-t border-white/5">
                {resetConfirm ? (
                  <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-2xl flex flex-col gap-2">
                    <p className="text-[11px] text-red-300 font-bold leading-relaxed flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4 shrink-0" /> Wipe all achievements & high scores? This is irreversible.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleResetData}
                        className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-xs font-black uppercase text-white rounded-full"
                      >
                        Reset All
                      </button>
                      <button
                        onClick={() => {
                          audio.playClick();
                          setResetConfirm(false);
                        }}
                        className="flex-1 py-1.5 bg-slate-800 text-xs font-black uppercase text-slate-300 rounded-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      audio.playClick();
                      setResetConfirm(true);
                    }}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/15 text-xs font-black uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Wipe High Scores & Coins
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            id="tutorial-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Scissors className="w-8 h-8 text-emerald-400 rotate-45" />
              </div>

              <h3 className="font-black text-lg uppercase tracking-wide text-slate-100 mb-2">How to Play</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Drag your mouse or swipe your finger across launched fruits to slice them in half! Slicing multiple fruits in a single swipe yields a <span className="text-yellow-400 font-bold">Combo Multiplier</span>.
              </p>

              {/* Swipe gesture animation */}
              <div className="w-full h-24 bg-black/30 rounded-2xl relative border border-white/5 overflow-hidden flex items-center justify-center mb-6">
                <div className="absolute inset-y-0 left-12 flex flex-col justify-center gap-1.5 opacity-65 scale-75">
                  <div className="w-10 h-10 rounded-full bg-red-500 shadow-inner" />
                </div>
                <div className="absolute inset-y-0 right-12 flex flex-col justify-center gap-1.5 opacity-65 scale-75">
                  <div className="w-10 h-10 rounded-full bg-orange-500 shadow-inner" />
                </div>

                {/* Drawing a loop */}
                <motion.div
                  className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_12px_cyan] absolute"
                  animate={{
                    x: [-80, 80, -80],
                    y: [15, -15, 15],
                    opacity: [0, 1, 1, 0, 0],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                
                {/* Finger Indicator */}
                <motion.div
                  className="text-white text-xl absolute pointer-events-none"
                  animate={{
                    x: [-85, 75, -85],
                    y: [25, -5, 25],
                    opacity: [0, 1, 1, 0, 0],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  👆
                </motion.div>
                <span className="absolute bottom-2 text-[9px] font-mono font-bold uppercase text-slate-500">Swipe to cut</span>
              </div>

              {/* Specials guide */}
              <div className="grid grid-cols-2 gap-2 text-left text-[10px] text-slate-400 mb-6 font-mono">
                <div className="p-2 bg-black/20 rounded-xl border border-white/5">
                  <span className="text-yellow-400 font-bold">⭐ Golden Fruit</span>: +100 Points!
                </div>
                <div className="p-2 bg-black/20 rounded-xl border border-white/5">
                  <span className="text-cyan-400 font-bold">❄️ Ice Fruit</span>: Slows down time!
                </div>
                <div className="p-2 bg-black/20 rounded-xl border border-white/5">
                  <span className="text-fuchsia-400 font-bold">🌈 Combo Fruit</span>: Points Doubled!
                </div>
                <div className="p-2 bg-black/20 rounded-xl border border-white/5">
                  <span className="text-red-500 font-bold">💥 Dangerous Bomb</span>: Game Over penalty!
                </div>
              </div>

              <button
                onClick={() => {
                  audio.playClick();
                  setShowTutorial(false);
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm rounded-full uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Let's Slice!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
