/**
 * MusicEngine — background music for menu and gameplay.
 *
 * - "game": the game's original soundtrack (public/assets/sounds/level.wav),
 *   looped. It was made to sit next to the existing .wav sound effects,
 *   so it matches their style exactly.
 * - "menu": a soft ambient synth pad (slow sine chords via Web Audio),
 *   kept deliberately neutral so it blends with the effects.
 */

type TrackName = "menu" | "game";

/* Chord frequencies (Hz) for the menu pad: C – Am – F – G */
const C3 = 130.81,
  F3 = 174.61,
  G3 = 196.0,
  A3 = 220.0,
  B3 = 246.94,
  C4 = 261.63,
  D4 = 293.66,
  E4 = 329.63,
  G4 = 392.0;

const MENU_CHORDS: number[][] = [
  [C3, E4, G4], // C
  [A3, C4, E4], // Am
  [F3, A3, C4], // F
  [G3, B3, D4], // G
];

/** Seconds each menu chord rings for (they overlap slightly). */
const CHORD_DURATION = 3.6;
const MENU_GAIN = 0.045;
const GAME_VOLUME = 0.35;

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private current: TrackName | null = null;
  private chordTimer: number | null = null;
  private nextChordTime: number = 0;
  private chordIndex: number = 0;
  private muted: boolean = false;
  private gameAudio: HTMLAudioElement | null = null;

  constructor() {
    this.muted = localStorage.getItem("poke_music_muted") === "1";
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /** Must be called from a user gesture (autoplay policy). */
  private ensureContext() {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  private ensureGameAudio(): HTMLAudioElement | null {
    if (!this.gameAudio) {
      this.gameAudio = document.getElementById(
        "sound__level",
      ) as HTMLAudioElement | null;
      if (this.gameAudio) {
        this.gameAudio.loop = true;
        this.gameAudio.volume = GAME_VOLUME;
        this.gameAudio.muted = this.muted;
      }
    }
    return this.gameAudio;
  }

  play(track: TrackName) {
    this.ensureContext();
    if (this.current === track) {
      // Already on this track: make sure the game loop is actually running.
      if (track === "game") this.startGameAudio(false);
      return;
    }
    this.stop();
    this.current = track;

    if (track === "menu") {
      this.chordIndex = 0;
      this.nextChordTime = this.ctx!.currentTime + 0.1;
      this.chordTimer = window.setInterval(() => this.scheduler(), 200);
    } else {
      this.startGameAudio(true);
    }
  }

  stop() {
    if (this.chordTimer !== null) {
      clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
    const audio = this.gameAudio;
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
    this.current = null;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem("poke_music_muted", this.muted ? "1" : "0");
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : 1,
        this.ctx.currentTime,
        0.05,
      );
    }
    if (this.gameAudio) {
      this.gameAudio.muted = this.muted;
    }
    return this.muted;
  }

  private startGameAudio(restart: boolean) {
    const audio = this.ensureGameAudio();
    if (!audio) return;
    audio.muted = this.muted;
    if (restart) audio.currentTime = 0;
    if (audio.paused) {
      audio.play().catch((e) => console.log("Music play failed", e));
    }
  }

  /** Lookahead scheduler: keep one chord queued ahead of the clock. */
  private scheduler() {
    if (!this.ctx || !this.master || this.current !== "menu") return;

    while (this.nextChordTime < this.ctx.currentTime + 0.5) {
      this.scheduleChord(
        MENU_CHORDS[this.chordIndex % MENU_CHORDS.length],
        this.nextChordTime,
      );
      this.nextChordTime += CHORD_DURATION;
      this.chordIndex++;
    }
  }

  private scheduleChord(freqs: number[], time: number) {
    for (const f of freqs) {
      this.pad(f, time);
    }
  }

  /** A slow-attack, slow-release sine pad note. */
  private pad(freq: number, time: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(MENU_GAIN, time + 0.7);
    gain.gain.setValueAtTime(MENU_GAIN, time + CHORD_DURATION - 0.8);
    gain.gain.linearRampToValueAtTime(0, time + CHORD_DURATION + 0.3);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + CHORD_DURATION + 0.4);
  }
}
