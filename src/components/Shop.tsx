/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Sparkles, Check, Flame, Star, Compass, Music, Scissors, Palette } from 'lucide-react';
import { SaveData, BladeStyle, BackgroundTheme, JuiceStyle, SoundPack } from '../types';
import { BLADES, BACKGROUNDS, JUICES, SOUND_PACKS, saveSaveData, loadSaveData } from '../lib/storage';
import audio from '../lib/audio';

interface ShopProps {
  onClose: () => void;
  saveData: SaveData;
  onUpdateSaveData: (data: SaveData) => void;
}

type TabType = 'blades' | 'backgrounds' | 'juices' | 'sounds';

export default function Shop({ onClose, saveData, onUpdateSaveData }: ShopProps) {
  const [activeTab, setActiveTab] = useState<TabType>('blades');

  const handlePurchaseBlade = (id: BladeStyle, price: number) => {
    audio.playClick();
    if (saveData.coins < price) return;

    const updated = { ...saveData };
    updated.coins -= price;
    updated.unlockedBlades = [...updated.unlockedBlades, id];
    updated.activeBlade = id;

    saveSaveData(updated);
    onUpdateSaveData(updated);
  };

  const handleEquipBlade = (id: BladeStyle) => {
    audio.playClick();
    const updated = { ...saveData, activeBlade: id };
    saveSaveData(updated);
    onUpdateSaveData(updated);
  };

  const handlePurchaseBg = (id: BackgroundTheme, price: number) => {
    audio.playClick();
    if (saveData.coins < price) return;

    const updated = { ...saveData };
    updated.coins -= price;
    updated.unlockedBackgrounds = [...updated.unlockedBackgrounds, id];
    updated.activeBackground = id;

    saveSaveData(updated);
    onUpdateSaveData(updated);
  };

  const handleEquipBg = (id: BackgroundTheme) => {
    audio.playClick();
    const updated = { ...saveData, activeBackground: id };
    saveSaveData(updated);
    onUpdateSaveData(updated);
  };

  const handlePurchaseJuice = (id: JuiceStyle, price: number) => {
    audio.playClick();
    if (saveData.coins < price) return;

    const updated = { ...saveData };
    updated.coins -= price;
    updated.unlockedJuices = [...updated.unlockedJuices, id];
    updated.activeJuice = id;

    saveSaveData(updated);
    onUpdateSaveData(updated);
  };

  const handleEquipJuice = (id: JuiceStyle) => {
    audio.playClick();
    const updated = { ...saveData, activeJuice: id };
    saveSaveData(updated);
    onUpdateSaveData(updated);
  };

  const handlePurchaseSound = (id: SoundPack, price: number) => {
    audio.playClick();
    if (saveData.coins < price) return;

    const updated = { ...saveData };
    updated.coins -= price;
    updated.unlockedSoundPacks = [...updated.unlockedSoundPacks, id];
    updated.activeSoundPack = id;

    // Apply sound pack update to current audio context
    audio.setSoundPack(id);
    audio.playPowerUp();

    saveSaveData(updated);
    onUpdateSaveData(updated);
  };

  const handleEquipSound = (id: SoundPack) => {
    audio.playClick();
    const updated = { ...saveData, activeSoundPack: id };
    audio.setSoundPack(id);
    audio.playClick();
    saveSaveData(updated);
    onUpdateSaveData(updated);
  };

  const tabs = [
    { id: 'blades', name: 'Blades', icon: Scissors },
    { id: 'backgrounds', name: 'Stages', icon: Compass },
    { id: 'juices', name: 'Splashes', icon: Palette },
    { id: 'sounds', name: 'Audio', icon: Music },
  ];

  return (
    <div id="shop-overlay" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between overflow-hidden font-sans text-white select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-emerald-950/40 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          <h1 className="text-xl md:text-2xl font-black tracking-wider uppercase text-yellow-400">Dojo Shop</h1>
        </div>
        <div className="flex items-center gap-2 bg-black/40 border border-yellow-500/30 px-4 py-1.5 rounded-full shadow-lg">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="font-mono font-black text-yellow-300 text-lg">{saveData.coins}</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex bg-black/30 border-b border-white/10 overflow-x-auto scrollbar-none shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => {
                audio.playClick();
                setActiveTab(tab.id as TabType);
              }}
              className={`flex-1 min-w-[90px] flex flex-col items-center gap-1.5 py-3 text-xs md:text-sm font-bold tracking-wide uppercase transition-all duration-200 border-b-2 relative ${
                isActive ? 'text-yellow-400 border-yellow-500 bg-emerald-500/10' : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-yellow-400' : 'text-slate-400'}`} />
              <span>{tab.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-yellow-400"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Items View */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-none bg-radial-gradient">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto pb-6"
          >
            {activeTab === 'blades' &&
              BLADES.map((blade) => {
                const isUnlocked = saveData.unlockedBlades.includes(blade.id);
                const isActive = saveData.activeBlade === blade.id;
                const canAfford = saveData.coins >= blade.price;

                return (
                  <div
                    key={blade.id}
                    id={`shop-blade-${blade.id}`}
                    className={`flex flex-col justify-between p-4 rounded-2xl border bg-slate-900/40 relative overflow-hidden transition-all duration-200 ${
                      isActive
                        ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                        : isUnlocked
                        ? 'border-emerald-500/30 hover:border-emerald-500/60'
                        : 'border-slate-800/80 grayscale-[30%] opacity-80'
                    }`}
                  >
                    {/* Glowing Accent Ring */}
                    <div
                      className="absolute -right-4 -top-4 w-12 h-12 rounded-full blur-xl opacity-40"
                      style={{ backgroundColor: blade.color }}
                    />

                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-black text-lg text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
                            <span
                              className="w-3 h-3 rounded-full shadow-inner inline-block shrink-0"
                              style={{ backgroundColor: blade.color, boxShadow: `0 0 10px ${blade.glowColor}` }}
                            />
                            {blade.name}
                          </h3>
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{blade.description}</p>
                        </div>
                      </div>

                      {/* Visual Demo Box */}
                      <div className="mt-3 py-2.5 px-3 bg-black/40 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-400 border border-white/5">
                        <span className="text-slate-400">Blade Slash:</span>
                        <div className="h-2 flex-1 relative flex items-center">
                          <div className="absolute inset-y-0 left-0 w-full rounded-full h-1" style={{ background: `linear-gradient(to right, transparent, ${blade.color}, transparent)` }} />
                          <div className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#fff', boxShadow: `0 0 12px ${blade.glowColor}` }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5 shrink-0">
                      <div>
                        {!isUnlocked && (
                          <div className="flex items-center gap-1 text-yellow-400 font-mono font-black text-sm">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span>{blade.price}</span>
                          </div>
                        )}
                        {isUnlocked && <span className="text-emerald-400 text-xs font-black tracking-wide uppercase">Unlocked</span>}
                      </div>

                      {isActive ? (
                        <button className="px-4 py-1.5 bg-yellow-400 text-black text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md shadow-yellow-400/20">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Equipped
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipBlade(blade.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-black rounded-full uppercase tracking-wider text-white transition-all shadow-md shadow-emerald-700/20"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => handlePurchaseBlade(blade.id, blade.price)}
                          className={`px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-wider transition-all shadow-md ${
                            canAfford
                              ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-600/20 active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                          }`}
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {activeTab === 'backgrounds' &&
              BACKGROUNDS.map((bg) => {
                const isUnlocked = saveData.unlockedBackgrounds.includes(bg.id);
                const isActive = saveData.activeBackground === bg.id;
                const canAfford = saveData.coins >= bg.price;

                return (
                  <div
                    key={bg.id}
                    id={`shop-bg-${bg.id}`}
                    className={`flex flex-col justify-between p-4 rounded-2xl border bg-slate-900/40 relative overflow-hidden transition-all duration-200 ${
                      isActive
                        ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                        : isUnlocked
                        ? 'border-emerald-500/30 hover:border-emerald-500/60'
                        : 'border-slate-800/80 grayscale-[30%] opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-black text-lg text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded border border-white/20 inline-block shrink-0"
                              style={{ background: `linear-gradient(135deg, ${bg.primaryBg}, ${bg.accentBg})` }}
                            />
                            {bg.name}
                          </h3>
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{bg.description}</p>
                        </div>
                      </div>

                      {/* Visual Demo */}
                      <div
                        className="mt-3 h-12 rounded-xl border border-white/10 flex items-center justify-center font-mono text-[9px] text-white/55 font-bold relative overflow-hidden"
                        style={{ background: `radial-gradient(circle at center, ${bg.accentBg} 10%, ${bg.primaryBg} 100%)` }}
                      >
                        {bg.id === 'neon' && (
                          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.15) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                        )}
                        {bg.id === 'zen' && (
                          <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center text-rose-300">🌸 Dojo Sands 🌸</div>
                        )}
                        {bg.id === 'tropical' && (
                          <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center text-emerald-300">🎋 Bamboo Grooves 🎋</div>
                        )}
                        <span className="relative z-10 font-black tracking-wider uppercase bg-black/30 py-0.5 px-2 rounded">Preview</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5 shrink-0">
                      <div>
                        {!isUnlocked && (
                          <div className="flex items-center gap-1 text-yellow-400 font-mono font-black text-sm">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span>{bg.price}</span>
                          </div>
                        )}
                        {isUnlocked && <span className="text-emerald-400 text-xs font-black tracking-wide uppercase">Unlocked</span>}
                      </div>

                      {isActive ? (
                        <button className="px-4 py-1.5 bg-yellow-400 text-black text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md shadow-yellow-400/20">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Equipped
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipBg(bg.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-black rounded-full uppercase tracking-wider text-white transition-all shadow-md shadow-emerald-700/20"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => handlePurchaseBg(bg.id, bg.price)}
                          className={`px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-wider transition-all shadow-md ${
                            canAfford
                              ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-600/20 active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                          }`}
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {activeTab === 'juices' &&
              JUICES.map((juice) => {
                const isUnlocked = saveData.unlockedJuices.includes(juice.id);
                const isActive = saveData.activeJuice === juice.id;
                const canAfford = saveData.coins >= juice.price;

                return (
                  <div
                    key={juice.id}
                    id={`shop-juice-${juice.id}`}
                    className={`flex flex-col justify-between p-4 rounded-2xl border bg-slate-900/40 relative overflow-hidden transition-all duration-200 ${
                      isActive
                        ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                        : isUnlocked
                        ? 'border-emerald-500/30 hover:border-emerald-500/60'
                        : 'border-slate-800/80 grayscale-[30%] opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-black text-lg text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                            {juice.name}
                          </h3>
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{juice.description}</p>
                        </div>
                      </div>

                      {/* Demo visualizer */}
                      <div className="mt-3 py-3 px-4 bg-black/40 rounded-xl flex items-center justify-around text-xs font-bold font-mono">
                        {juice.id === 'standard' && (
                          <div className="flex gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping" style={{ animationDelay: '0.1s' }} />
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" style={{ animationDelay: '0.2s' }} />
                          </div>
                        )}
                        {juice.id === 'neon' && (
                          <div className="flex gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white shadow-[0_0_8px_cyan]" />
                            <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 border border-white shadow-[0_0_8px_fuchsia]" />
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 border border-white shadow-[0_0_8px_yellow]" />
                          </div>
                        )}
                        {juice.id === 'confetti' && (
                          <div className="flex gap-2 text-yellow-300">
                            <span>✨</span>
                            <span>🎉</span>
                            <span>⭐</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5 shrink-0">
                      <div>
                        {!isUnlocked && (
                          <div className="flex items-center gap-1 text-yellow-400 font-mono font-black text-sm">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span>{juice.price}</span>
                          </div>
                        )}
                        {isUnlocked && <span className="text-emerald-400 text-xs font-black tracking-wide uppercase">Unlocked</span>}
                      </div>

                      {isActive ? (
                        <button className="px-4 py-1.5 bg-yellow-400 text-black text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md shadow-yellow-400/20">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Equipped
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipJuice(juice.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-black rounded-full uppercase tracking-wider text-white transition-all shadow-md shadow-emerald-700/20"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => handlePurchaseJuice(juice.id, juice.price)}
                          className={`px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-wider transition-all shadow-md ${
                            canAfford
                              ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-600/20 active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                          }`}
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {activeTab === 'sounds' &&
              SOUND_PACKS.map((sound) => {
                const isUnlocked = saveData.unlockedSoundPacks.includes(sound.id);
                const isActive = saveData.activeSoundPack === sound.id;
                const canAfford = saveData.coins >= sound.price;

                return (
                  <div
                    key={sound.id}
                    id={`shop-sound-${sound.id}`}
                    className={`flex flex-col justify-between p-4 rounded-2xl border bg-slate-900/40 relative overflow-hidden transition-all duration-200 ${
                      isActive
                        ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                        : isUnlocked
                        ? 'border-emerald-500/30 hover:border-emerald-500/60'
                        : 'border-slate-800/80 grayscale-[30%] opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-black text-lg text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                            {sound.name}
                          </h3>
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{sound.description}</p>
                        </div>
                      </div>

                      {/* Try sound button */}
                      <button
                        onClick={() => {
                          const originalPack = saveData.activeSoundPack;
                          audio.setSoundPack(sound.id);
                          audio.playClick();
                          // Restore active pack
                          setTimeout(() => {
                            audio.setSoundPack(originalPack);
                          }, 500);
                        }}
                        className="mt-3 w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-98 rounded-xl border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase flex items-center justify-center gap-1.5"
                      >
                        🔊 Preview Sound
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5 shrink-0">
                      <div>
                        {!isUnlocked && (
                          <div className="flex items-center gap-1 text-yellow-400 font-mono font-black text-sm">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span>{sound.price}</span>
                          </div>
                        )}
                        {isUnlocked && <span className="text-emerald-400 text-xs font-black tracking-wide uppercase">Unlocked</span>}
                      </div>

                      {isActive ? (
                        <button className="px-4 py-1.5 bg-yellow-400 text-black text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md shadow-yellow-400/20">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Equipped
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipSound(sound.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-black rounded-full uppercase tracking-wider text-white transition-all shadow-md shadow-emerald-700/20"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => handlePurchaseSound(sound.id, sound.price)}
                          className={`px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-wider transition-all shadow-md ${
                            canAfford
                              ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-600/20 active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                          }`}
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </motion.div>
        </AnimatePresence>
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
          Exit Store
        </button>
      </div>
    </div>
  );
}
