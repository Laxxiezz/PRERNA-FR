/**
 * Sound Manager & Audio Engine for ImSorry / Prerna
 *
 * Features:
 * - Direct MP3 playback from /assets/* with audio pooling (zero-latency replay).
 * - Web Audio API procedural synthesizer fallback: if an MP3 is missing or not yet added,
 *   a beautiful synthesized chime/pop/whoosh plays instead — NO errors, NO broken state!
 * - Global mute & volume control with localStorage persistence ("perru-sound-pref").
 * - Browser Autoplay policy compliance (auto-unlock on first user gesture).
 */

import { useState, useEffect } from "react";

// Catalog of supported SFX with their target assets and fallback synths
export const SFX_CATALOG = {
  click: {
    src: "/assets/click.mp3",
    volume: 0.75,
    fallback: "click",
    desc: "Heart tap / small button click",
  },
  blast: {
    src: "/assets/final.mp3",
    volume: 0.9,
    fallback: "blast",
    desc: "Big pinwheel explosion / celebration throw",
  },
  final: {
    src: "/assets/final.mp3",
    volume: 0.9,
    fallback: "blast",
    desc: "Final celebration fanfare",
  },
  tap: {
    src: "/assets/tap.mp3",
    volume: 0.6,
    fallback: "tap",
    desc: "Soft gentle tap / UI select",
  },
  sparkle: {
    src: "/assets/sparkle.mp3",
    volume: 0.7,
    fallback: "sparkle",
    desc: "Magic stardust & emoji bursts",
  },
  magic: {
    src: "/assets/magic.mp3",
    volume: 0.75,
    fallback: "magic",
    desc: "Lumos wand / magical reveal chime",
  },
  whoosh: {
    src: "/assets/whoosh.mp3",
    volume: 0.55,
    fallback: "whoosh",
    desc: "Page transition & card swoosh",
  },
  pop: {
    src: "/assets/pop.mp3",
    volume: 0.65,
    fallback: "pop",
    desc: "Bubble pop / milestone discovery",
  },
  chatSend: {
    src: "/assets/chat-send.mp3",
    volume: 0.7,
    fallback: "chatSend",
    desc: "Owl Post message sent chime",
  },
  chatReceive: {
    src: "/assets/chat-receive.mp3",
    volume: 0.75,
    fallback: "chatReceive",
    desc: "Incoming letter notification chime",
  },
  scratch: {
    src: "/assets/scratch.mp3",
    volume: 0.45,
    fallback: "scratch",
    desc: "Scratch card metallic foil scratch",
  },
  unlock: {
    src: "/assets/unlock.mp3",
    volume: 0.8,
    fallback: "unlock",
    desc: "Scratch card revealed / secret unlocked",
  },
  lumos: {
    src: "/assets/lumos.mp3",
    volume: 0.65,
    fallback: "lumos",
    desc: "Lumos spotlight wand hum",
  },
  heartbeat: {
    src: "/assets/heartbeat.mp3",
    volume: 0.7,
    fallback: "heartbeat",
    desc: "Pulsing heart rhythm",
  },
  paper: {
    src: "/assets/paper.mp3",
    volume: 0.55,
    fallback: "paper",
    desc: "Letter scroll / envelope rustle",
  },
};

const STORAGE_KEY = "perru-sound-pref";

class SoundManager {
  constructor() {
    this.audioPool = new Map(); // key -> HTMLAudioElement[]
    this.audioContext = null;
    this.isMuted = false;
    this.volume = 0.8;
    this.unlocked = false;
    this.listeners = new Set();
    this.failedSrcs = new Set();
    this.lastPlayedTs = new Map();

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.isMuted = Boolean(parsed.muted);
          if (typeof parsed.volume === "number") this.volume = parsed.volume;
        }
      } catch {}

      // Browser autoplay policy: unlock on first interaction
      const unlockAudio = () => {
        this.initAudioContext();
        window.removeEventListener("pointerdown", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };
      window.addEventListener("pointerdown", unlockAudio, { passive: true });
      window.addEventListener("keydown", unlockAudio, { passive: true });

      // Preload known existing assets
      this.preload("click");
      this.preload("blast");
    }
  }

  initAudioContext() {
    if (this.unlocked && this.audioContext) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === "suspended") {
          this.audioContext.resume().catch(() => {});
        }
        this.unlocked = true;
      }
    } catch (e) {
      // AudioContext unavailable
    }
  }

  preload(name) {
    if (typeof window === "undefined") return;
    const config = SFX_CATALOG[name];
    if (!config || this.failedSrcs.has(config.src)) return;

    if (!this.audioPool.has(name)) {
      const aud = new Audio(config.src);
      aud.preload = "auto";
      aud.volume = config.volume * this.volume;
      aud.onerror = () => {
        this.failedSrcs.add(config.src);
      };
      this.audioPool.set(name, [aud]);
    }
  }

  /**
   * Play any registered SFX by name.
   * If the MP3 is missing, smoothly triggers the procedural Web Audio synth fallback!
   */
  play(name, options = {}) {
    if (this.isMuted || typeof window === "undefined") return;
    this.initAudioContext();

    const config = SFX_CATALOG[name];
    if (!config) return;

    // Rate-limiting throttle for rapid repetitive sounds (like scratching)
    if (options.throttle) {
      const now = Date.now();
      const last = this.lastPlayedTs.get(name) || 0;
      if (now - last < options.throttle) return;
      this.lastPlayedTs.set(name, now);
    }

    const vol = (options.volume ?? config.volume) * this.volume;

    // 1) Attempt playing real audio file if available
    if (!this.failedSrcs.has(config.src)) {
      try {
        let pool = this.audioPool.get(name);
        if (!pool) {
          const a = new Audio(config.src);
          a.preload = "auto";
          a.onerror = () => {
            this.failedSrcs.add(config.src);
            // Fall back to synth immediately
            this.synthesize(config.fallback, vol);
          };
          pool = [a];
          this.audioPool.set(name, pool);
        }

        // Find available audio or create a clone
        let audio = pool.find((a) => a.paused || a.ended);
        if (!audio && pool.length < 3) {
          audio = pool[0].cloneNode();
          pool.push(audio);
        } else if (!audio) {
          audio = pool[0];
        }

        audio.volume = vol;
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.catch === "function") {
          p.catch((err) => {
            // Autoplay blocked or file 404
            if (err?.name === "NotSupportedError" || err?.message?.includes("404")) {
              this.failedSrcs.add(config.src);
            }
            this.synthesize(config.fallback, vol);
          });
        }
        return;
      } catch {
        this.failedSrcs.add(config.src);
      }
    }

    // 2) Fallback: Procedural Web Audio Synthesis (always works with zero dependencies)
    this.synthesize(config.fallback, vol);
  }

  /**
   * Procedural Audio Synthesizer:
   * Generates organic, magical audio tones via Web Audio API oscillators and filters.
   */
  synthesize(type, vol = 0.5) {
    if (this.isMuted) return;
    this.initAudioContext();
    const ctx = this.audioContext;
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      switch (type) {
        case "click":
        case "tap": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(420, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
          gain.gain.setValueAtTime(vol * 0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case "sparkle": {
          const freqs = [784, 987.77, 1174.66, 1567.98];
          freqs.forEach((f, i) => {
            const t = now + i * 0.04;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(vol * 0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.28);
          });
          break;
        }

        case "magic":
        case "lumos": {
          const freqs = [523.25, 659.25, 783.99, 1046.5];
          freqs.forEach((f, i) => {
            const t = now + i * 0.07;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 1.05, t + 0.5);
            gain.gain.setValueAtTime(vol * 0.14, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.6);
          });
          break;
        }

        case "chatSend": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
          gain.gain.setValueAtTime(vol * 0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }

        case "chatReceive": {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = "sine";
          osc2.type = "sine";
          osc1.frequency.setValueAtTime(659.25, now);
          osc2.frequency.setValueAtTime(880, now + 0.09);
          gain.gain.setValueAtTime(vol * 0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.2);
          osc2.start(now + 0.09);
          osc2.stop(now + 0.4);
          break;
        }

        case "pop": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(580, now);
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
          gain.gain.setValueAtTime(vol * 0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }

        case "scratch": {
          // Soft noise burst for scratching foil
          const bufferSize = ctx.sampleRate * 0.04;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(1400, now);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(vol * 0.09, now);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          noise.start(now);
          break;
        }

        case "unlock": {
          const chord = [392.0, 493.88, 587.33, 783.99]; // G Major
          chord.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(vol * 0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + i * 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 1.4);
          });
          break;
        }

        case "blast": {
          // Low boom + sweeping burst
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);
          gain.gain.setValueAtTime(vol * 0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.0);
          break;
        }

        default:
          break;
      }
    } catch {}
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.save();
    this.notify();
    return this.isMuted;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    this.save();
    this.notify();
  }

  save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ muted: this.isMuted, volume: this.volume })
      );
    } catch {}
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => {
      try {
        cb({ isMuted: this.isMuted, volume: this.volume });
      } catch {}
    });
  }
}

// Global Singleton Instance
export const soundManager = new SoundManager();

/**
 * Convenient React hook to read mute state and trigger sounds anywhere
 */
export function useSound() {
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [volume, setVolumeState] = useState(soundManager.volume);

  useEffect(() => {
    return soundManager.subscribe(({ isMuted, volume }) => {
      setIsMuted(isMuted);
      setVolumeState(volume);
    });
  }, []);

  return {
    isMuted,
    volume,
    play: (name, opts) => soundManager.play(name, opts),
    toggleMute: () => soundManager.toggleMute(),
    setVolume: (v) => soundManager.setVolume(v),
  };
}

export default soundManager;

