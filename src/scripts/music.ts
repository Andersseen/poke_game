/**
 * MusicEngine — procedural chiptune background music via Web Audio API.
 *
 * Two looping tracks: a calm "menu" theme and an upbeat "game" theme.
 * No audio assets needed; everything is synthesized on the fly.
 */

type TrackName = "menu" | "game";

interface Note {
  /** Frequency in Hz. 0 = rest. */
  f: number;
  /** Duration in steps. */
  d: number;
}

const N = (f: number, d: number = 1): Note => ({ f, d });

/* Note frequencies (Hz) */
const C3 = 130.81,
  E3 = 164.81,
  G3 = 196.0,
  A3 = 220.0,
  C4 = 261.63,
  D4 = 293.66,
  E4 = 329.63,
  F4 = 349.23,
  G4 = 392.0,
  A4 = 440.0,
  B4 = 493.88,
  C5 = 523.25,
  D5 = 587.33,
  E5 = 659.25,
  G5 = 783.99;

/** Calm, dreamy menu theme — slow pentatonic arpeggio. */
const MENU_LEAD: Note[] = [
  N(C4, 2), N(E4, 2), N(G4, 2), N(E4, 2),
  N(A4, 2), N(G4, 2), N(E4, 2), N(D4, 2),
  N(C4, 2), N(E4, 2), N(G4, 2), N(A4, 2),
  N(G4, 4), N(E4, 2), N(C4, 2),
];
const MENU_BASS: Note[] = [
  N(C3, 4), N(G3, 4), N(A3, 4), N(G3, 4),
  N(C3, 4), N(G3, 4), N(A3, 4), N(E3, 4),
];

/** Upbeat game theme — driving bass + catchy lead. */
const GAME_LEAD: Note[] = [
  N(C5), N(C5), N(G4), N(A4), N(C5), N(0), N(E5), N(D5),
  N(C5), N(C5), N(G4), N(A4), N(G4), N(0), N(E4), N(D4),
  N(C5), N(C5), N(G4), N(A4), N(C5), N(E5), N(D5), N(C5),
  N(D5), N(D5), N(A4), N(B4), N(G4), N(0), N(G4), N(0),
];
const GAME_BASS: Note[] = [
  N(C3), N(C3), N(G3), N(G3), N(A3), N(A3), N(G3), N(G3),
  N(C3), N(C3), N(G3), N(G3), N(A3), N(A3), N(E3), N(E3),
  N(F4 / 2), N(F4 / 2), N(C3), N(C3), N(D4 / 2), N(D4 / 2), N(G3), N(G3),
  N(F4 / 2), N(F4 / 2), N(C3), N(C3), N(G3), N(G3), N(G3), N(G3),
];

interface Track {
  bpm: number;
  lead: Note[];
  bass: Note[];
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  leadGain: number;
  bassGain: number;
}

const TRACKS: Record<TrackName, Track> = {
  menu: {
    bpm: 92,
    lead: MENU_LEAD,
    bass: MENU_BASS,
    leadWave: "triangle",
    bassWave: "sine",
    leadGain: 0.16,
    bassGain: 0.1,
  },
  game: {
    bpm: 152,
    lead: GAME_LEAD,
    bass: GAME_BASS,
    leadWave: "square",
    bassWave: "sawtooth",
    leadGain: 0.07,
    bassGain: 0.05,
  },
};

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private current: TrackName | null = null;
  private stepTimer: number | null = null;
  private muted: boolean = false;
  private nextStepTime: number = 0;
  private stepIndex: number = 0;

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

  play(track: TrackName) {
    this.ensureContext();
    if (this.current === track) return;
    this.stop();

    this.current = track;
    this.stepIndex = 0;
    this.nextStepTime = this.ctx!.currentTime + 0.1;

    const stepDuration = 60 / TRACKS[track].bpm / 2; // eighth-note steps
    this.stepTimer = window.setInterval(() => this.scheduler(stepDuration), 40);
  }

  stop() {
    if (this.stepTimer !== null) {
      clearInterval(this.stepTimer);
      this.stepTimer = null;
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
    return this.muted;
  }

  /** Simple lookahead scheduler: schedule all steps due within 150 ms. */
  private scheduler(stepDuration: number) {
    if (!this.ctx || !this.master || !this.current) return;
    const track = TRACKS[this.current];

    while (this.nextStepTime < this.ctx.currentTime + 0.15) {
      this.scheduleStep(track, this.stepIndex, this.nextStepTime, stepDuration);
      this.nextStepTime += stepDuration;
      this.stepIndex++;
    }
  }

  private scheduleStep(
    track: Track,
    step: number,
    time: number,
    stepDuration: number,
  ) {
    const leadNote = this.noteAt(track.lead, step);
    const bassNote = this.noteAt(track.bass, step);

    if (leadNote && leadNote.f > 0) {
      this.tone(leadNote.f, time, stepDuration * 0.9, track.leadWave, track.leadGain);
    }
    if (bassNote && bassNote.f > 0) {
      this.tone(bassNote.f, time, stepDuration * 0.95, track.bassWave, track.bassGain);
    }
  }

  /** Maps a global step index onto a note list whose entries have durations. */
  private noteAt(notes: Note[], step: number): Note | null {
    const total = notes.reduce((sum, n) => sum + n.d, 0);
    let pos = step % total;
    for (const note of notes) {
      if (pos < note.d) return note;
      pos -= note.d;
    }
    return null;
  }

  private tone(
    freq: number,
    time: number,
    duration: number,
    wave: OscillatorType,
    volume: number,
  ) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = wave;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }
}
