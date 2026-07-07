/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Circle, Coins, Trophy, X } from 'lucide-react';
import { SaveData, DailyChallenge } from '../types';
import audio from '../lib/audio';

interface ChallengesProps {
  onClose: () => void;
  saveData: SaveData;
}

export default function Challenges({ onClose, saveData }: ChallengesProps) {
  const { challenges, lastUpdated } = saveData.dailyChallenges;

  return (
    <div id="challenges-overlay" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between overflow-hidden font-sans text-white select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-emerald-950/40 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl md:text-2xl font-black tracking-wider uppercase text-emerald-400">Daily Challenges</h1>
        </div>
        <button
          onClick={() => {
            audio.playClick();
            onClose();
          }}
          className="p-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-slate-300 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-none max-w-2xl mx-auto w-full">
        <div className="text-center mb-6">
          <p className="text-xs text-slate-400 tracking-wider uppercase">Resetting Daily at UTC Midnight</p>
          <div className="flex items-center justify-center gap-2 mt-1.5 text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-full inline-block">
            📅 Active Date: {lastUpdated}
          </div>
        </div>

        {/* Challenge Cards Stack */}
        <div className="space-y-4">
          {challenges.map((challenge, idx) => {
            const progressPct = Math.min(100, Math.floor((challenge.current / challenge.target) * 100));
            const isCompleted = challenge.completed;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.2 }}
                className={`p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden bg-slate-900/50 ${
                  isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 items-start">
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5.5 h-5.5 text-emerald-400 stroke-[2.5]" />
                      ) : (
                        <Circle className="w-5.5 h-5.5 text-slate-600 stroke-[2]" />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-black text-sm md:text-base text-slate-100 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                        {challenge.description}
                      </h3>
                      <p className="text-[11px] font-mono font-bold text-slate-400 mt-0.5">
                        Progress: <span className="text-slate-200">{challenge.current}</span> / <span className="text-slate-200">{challenge.target}</span>
                      </p>
                    </div>
                  </div>

                  {/* Coin Badge Reward */}
                  <div className="flex items-center gap-1 bg-black/40 border border-yellow-500/20 px-2.5 py-1 rounded-full shrink-0">
                    <Coins className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="font-mono text-xs font-black text-yellow-300">+{challenge.reward}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800/50 h-2.5 rounded-full overflow-hidden border border-white/5 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`h-full rounded-full ${
                      isCompleted
                        ? 'bg-gradient-to-right bg-emerald-500'
                        : 'bg-gradient-to-right bg-blue-500'
                    }`}
                    style={{
                      backgroundImage: isCompleted
                        ? 'linear-gradient(to right, #10b981, #059669)'
                        : 'linear-gradient(to right, #3b82f6, #2563eb)'
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Global Stats Summary */}
        <div className="mt-8 p-5 bg-slate-900/30 border border-white/5 rounded-2xl">
          <h2 className="text-xs font-black tracking-widest uppercase text-slate-400 mb-4 flex items-center gap-1.5 justify-center">
            <Trophy className="w-4 h-4 text-yellow-500" /> Your Slicing Stats
          </h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-black/20 rounded-xl">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Slices</span>
              <span className="font-mono text-lg font-black text-emerald-400">{saveData.stats.totalFruitsSliced}</span>
            </div>
            <div className="p-3 bg-black/20 rounded-xl">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Max Combo</span>
              <span className="font-mono text-lg font-black text-yellow-400">{saveData.stats.maxCombo}x</span>
            </div>
            <div className="p-3 bg-black/20 rounded-xl">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Bombs Hit</span>
              <span className="font-mono text-lg font-black text-red-400">{saveData.stats.totalBombsHit}</span>
            </div>
            <div className="p-3 bg-black/20 rounded-xl">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Games Played</span>
              <span className="font-mono text-lg font-black text-slate-300">{saveData.stats.totalGamesPlayed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Done Button */}
      <div className="px-6 py-5 bg-black/60 border-t border-white/10 flex items-center justify-center shrink-0">
        <button
          onClick={() => {
            audio.playClick();
            onClose();
          }}
          className="w-full max-w-sm py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm md:text-base rounded-full uppercase tracking-widest shadow-xl active:scale-95 transition-all text-center"
        >
          Close Challenges
        </button>
      </div>
    </div>
  );
}
