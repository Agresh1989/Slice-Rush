/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundPack } from '../types';

class AudioManager {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private currentPack: SoundPack = 'standard';
  private musicVolumeNode: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private sfxVol: number = 0.8;
  private musicVol: number = 0.5;

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  private getContext(): AudioContext | null {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => console.log('AudioContext resume failed:', e));
    }
    return this.ctx;
  }

  setSoundPack(pack: SoundPack) {
    this.currentPack = pack;
  }

  setSFXVolume(vol: number) {
    this.sfxVol = vol;
  }

  setMusicVolume(vol: number) {
    this.musicVol = vol;
    if (this.musicVolumeNode) {
      this.musicVolumeNode.gain.setValueAtTime(vol * 0.15, this.ctx?.currentTime || 0); // Keep ambient synth soft
    }
  }

  playClick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.sfxVol * 0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    if (this.currentPack === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    } else if (this.currentPack === 'retro') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(300, now + 0.04);
      osc.frequency.setValueAtTime(600, now + 0.08);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
    }

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playLaunch() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.sfxVol * 0.4, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.15);

    if (this.currentPack === 'laser') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);
    } else if (this.currentPack === 'retro') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.1);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
    }

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playSwipe() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.15;

    // Generate quick noise buffer for wind/whoosh sound
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    
    if (this.currentPack === 'laser') {
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + duration);
    } else if (this.currentPack === 'retro') {
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(200, now + duration);
    } else {
      filter.frequency.setValueAtTime(1500, now);
      filter.frequency.exponentialRampToValueAtTime(600, now + duration);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.sfxVol * 0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + duration);
  }

  playSlice() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Low wet organic squish
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(this.sfxVol * 0.5, now + 0.01);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    if (this.currentPack === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
    } else if (this.currentPack === 'retro') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    }

    osc.start(now);
    osc.stop(now + 0.2);

    // High splash noise crisp
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(2000, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(this.sfxVol * 0.25, now + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.08);
  }

  playCombo(count: number) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = 261.63; // C4
    const notes = [1, 1.25, 1.5, 1.68, 1.875, 2.0]; // Major scales

    // Play count note alerts
    const maxNotes = Math.min(count, 6);
    for (let i = 0; i < maxNotes; i++) {
      const freq = baseFreq * (notes[i % notes.length] || 1) * (1 + Math.floor(i / notes.length));
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const delay = i * 0.06;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.sfxVol * 0.35, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

      if (this.currentPack === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * 1.5, now + delay);
        osc.frequency.exponentialRampToValueAtTime(freq, now + delay + 0.15);
      } else if (this.currentPack === 'retro') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + delay);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
      }

      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    }
  }

  playBomb() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub rumble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 1.2);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.sfxVol * 1.0, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.start(now);
    osc.stop(now + 1.3);

    // Noise explosion decay
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.6);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(this.sfxVol * 0.8, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.8);

    // Spark/Crackle effect
    if (this.currentPack === 'retro') {
      const retroOsc = ctx.createOscillator();
      const retroGain = ctx.createGain();
      retroOsc.type = 'square';
      retroOsc.frequency.setValueAtTime(300, now);
      retroOsc.frequency.setValueAtTime(100, now + 0.1);
      retroOsc.frequency.setValueAtTime(50, now + 0.2);
      
      retroGain.gain.setValueAtTime(this.sfxVol * 0.6, now);
      retroGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      retroOsc.connect(retroGain);
      retroGain.connect(ctx.destination);
      retroOsc.start(now);
      retroOsc.stop(now + 0.35);
    }
  }

  playPowerUp() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [330, 440, 554, 659, 880]; // A major arpeggio
    
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const delay = idx * 0.08;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.sfxVol * 0.3, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

      osc.type = this.currentPack === 'retro' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.5);
    });
  }

  playGameOver() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [392, 349, 311, 261]; // descending minor/sad chord G4 -> F4 -> Eb4 -> C4

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const delay = idx * 0.15;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.sfxVol * 0.4, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);

      osc.type = this.currentPack === 'retro' ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      osc.start(now + delay);
      osc.stop(now + delay + 0.6);
    });
  }

  startMusic() {
    if (this.isMusicPlaying) return;
    
    const ctx = this.getContext();
    if (!ctx) return;

    this.isMusicPlaying = true;
    this.musicVolumeNode = ctx.createGain();
    this.musicVolumeNode.gain.setValueAtTime(this.musicVol * 0.15, ctx.currentTime);
    this.musicVolumeNode.connect(ctx.destination);

    // Simple procedural retro-calm melody loop
    let step = 0;
    const baseFreqs = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00]; // Pentatonic soft scale (G3, A3, C4, D4, E4, G4)
    const chords = [
      [196.00, 261.63, 329.63], // C major
      [220.00, 261.63, 349.23], // F major
      [196.00, 293.66, 392.00], // G major
      [220.00, 261.63, 329.63], // A minor
    ];

    this.musicInterval = setInterval(() => {
      const ctxActive = this.getContext();
      if (!ctxActive || !this.isMusicPlaying || !this.musicVolumeNode) return;

      const now = ctxActive.currentTime;
      
      // Play a soft rhythmic bass/chord on beat 0, 4, 8, 12
      const chordIndex = Math.floor(step / 4) % chords.length;
      if (step % 4 === 0) {
        const chord = chords[chordIndex] || chords[0];
        chord.forEach((freq) => {
          const osc = ctxActive.createOscillator();
          const gain = ctxActive.createGain();
          
          osc.connect(gain);
          gain.connect(this.musicVolumeNode!);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq * 0.5, now); // low pitch
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
          
          osc.start(now);
          osc.stop(now + 1.0);
        });
      }

      // Play soft arpeggiated high melody note on step
      if (Math.random() > 0.3) {
        const oscMelody = ctxActive.createOscillator();
        const gainMelody = ctxActive.createGain();
        
        oscMelody.connect(gainMelody);
        gainMelody.connect(this.musicVolumeNode!);

        oscMelody.type = 'sine';
        
        // Select pentatonic note in matching chord key
        const noteIndex = (step * 2 + Math.floor(Math.random() * 3)) % baseFreqs.length;
        const noteFreq = baseFreqs[noteIndex] || 261.63;
        
        oscMelody.frequency.setValueAtTime(noteFreq * 2, now); // high octave

        gainMelody.gain.setValueAtTime(0, now);
        gainMelody.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainMelody.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        oscMelody.start(now);
        oscMelody.stop(now + 0.45);
      }

      step = (step + 1) % 16;
    }, 300); // 100 BPM approx
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicVolumeNode) {
      this.musicVolumeNode.disconnect();
      this.musicVolumeNode = null;
    }
  }
}

export const audio = new AudioManager();
export default audio;
