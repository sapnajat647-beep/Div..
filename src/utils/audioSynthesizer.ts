/**
 * Procedural Web Audio Engine for StudySpace
 * Generates ambient focus soundscapes (Rain, Forest, Cafe, 40Hz Binaural)
 * and meditation/focus completion chime without any external audio files.
 */

import { AmbientSoundType } from '../types';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = 'none';
  private gainNode: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private volume: number = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.volume * 0.4, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentSound(): AmbientSoundType {
    return this.currentType;
  }

  public stop() {
    this.activeNodes.forEach(node => {
      if (typeof node === 'number') {
        window.clearInterval(node);
      } else {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          node.disconnect();
        } catch {
          // ignore cleanup errors
        }
      }
    });
    this.activeNodes = [];

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {
        // ignore
      }
      this.gainNode = null;
    }
    this.currentType = 'none';
  }

  public playSound(type: AmbientSoundType) {
    if (type === this.currentType) return;
    this.stop();
    if (type === 'none') return;

    this.initContext();
    if (!this.ctx) return;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);
    this.gainNode = masterGain;
    this.currentType = type;

    switch (type) {
      case 'rain':
        this.playRain(masterGain);
        break;
      case 'forest':
        this.playForest(masterGain);
        break;
      case 'cafe':
        this.playCafe(masterGain);
        break;
      case 'binaural':
        this.playBinaural(masterGain);
        break;
    }
  }

  // Generates smooth continuous noise buffer
  private createNoiseBuffer(durationSec: number = 3): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * durationSec;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Gentle Rain: Filtered Pink/Brown noise with subtle modulation
  private playRain(destination: AudioNode) {
    if (!this.ctx) return;
    const buffer = this.createNoiseBuffer(5);
    if (!buffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Low pass filter for warm raindrops
    const lowPass = this.ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.setValueAtTime(800, this.ctx.currentTime);

    // High pass to remove sub-bass rumble
    const highPass = this.ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.setValueAtTime(180, this.ctx.currentTime);

    noiseSource.connect(lowPass);
    lowPass.connect(highPass);
    highPass.connect(destination);

    noiseSource.start();
    this.activeNodes.push(noiseSource, lowPass, highPass);
  }

  // Forest Breeze & Leaves: Modulated bandpass noise
  private playForest(destination: AudioNode) {
    if (!this.ctx) return;
    const buffer = this.createNoiseBuffer(5);
    if (!buffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const bandPass = this.ctx.createBiquadFilter();
    bandPass.type = 'bandpass';
    bandPass.frequency.setValueAtTime(450, this.ctx.currentTime);
    bandPass.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // Slow LFO to mimic breathing gusts of wind
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(bandPass.frequency);

    noiseSource.connect(bandPass);
    bandPass.connect(destination);

    noiseSource.start();
    lfo.start();
    this.activeNodes.push(noiseSource, bandPass, lfo, lfoGain);
  }

  // Cozy Cafe: Low rumble + warm mid harmonic murmur
  private playCafe(destination: AudioNode) {
    if (!this.ctx) return;
    const buffer = this.createNoiseBuffer(4);
    if (!buffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lowPass = this.ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.setValueAtTime(400, this.ctx.currentTime);

    // Subtle cozy warm resonance
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(120, this.ctx.currentTime);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    noise.connect(lowPass);
    lowPass.connect(destination);
    osc1.connect(oscGain);
    oscGain.connect(destination);

    noise.start();
    osc1.start();
    this.activeNodes.push(noise, lowPass, osc1, oscGain);
  }

  // 40Hz Gamma Focus Binaural Beats: 200Hz left / 240Hz right (or dual stereo binaural)
  private playBinaural(destination: AudioNode) {
    if (!this.ctx) return;
    const carrier = 216; // base frequency in Hz
    const beat = 40;     // Gamma brainwave frequency for hyper-focus

    // Left oscillator
    const oscL = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(carrier, this.ctx.currentTime);

    // Right oscillator
    const oscR = this.ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(carrier + beat, this.ctx.currentTime);

    // Stereo panners if available, else mixed with phase
    let pannerL: StereoPannerNode | null = null;
    let pannerR: StereoPannerNode | null = null;
    if (this.ctx.createStereoPanner) {
      pannerL = this.ctx.createStereoPanner();
      pannerL.pan.setValueAtTime(-0.9, this.ctx.currentTime);
      pannerR = this.ctx.createStereoPanner();
      pannerR.pan.setValueAtTime(0.9, this.ctx.currentTime);
      oscL.connect(pannerL);
      oscR.connect(pannerR);
      pannerL.connect(destination);
      pannerR.connect(destination);
      this.activeNodes.push(pannerL, pannerR);
    } else {
      oscL.connect(destination);
      oscR.connect(destination);
    }

    oscL.start();
    oscR.start();
    this.activeNodes.push(oscL, oscR);
  }

  // Calming Zen singing bowl chime for focus completion
  public playCompletionChime() {
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fundamental = 528; // Solfeggio 528Hz clarity frequency
    const harmonics = [fundamental, fundamental * 1.5, fundamental * 2.05];

    harmonics.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const amp = idx === 0 ? 0.28 : 0.12;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5 + idx * 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 4.5);
    });
  }
}

export const soundSynth = new SoundSynthesizer();
