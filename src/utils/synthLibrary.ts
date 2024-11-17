import * as Tone from "tone";
import { isMobile } from "react-device-detect";

interface SynthState {
  synth: keyof typeof synthTypes;
}

interface SynthReturn {
  synth: Tone.PolySynth;
  baseDecibel: number;
}

interface InstrumentSettings {
  oscillator?: {
    type: string;
    partials?: number[];
    spread?: number;
    count?: number;
  };
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  harmonicity?: number;
  modulationIndex?: number;
  modulation?: {
    type: string;
  };
  modulationEnvelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

let synth: Tone.PolySynth | null = null;
let synthType: keyof typeof synthTypes | null = null;
let baseDecibel = 2;

function getPlumberSynth(): Tone.PolySynth {
  const synth = new Tone.PolySynth().toDestination();
  return synth;
}

function getWaveSynth(): Tone.PolySynth {
  const synth = new Tone.PolySynth().toDestination();
  const filter = new Tone.Vibrato(5, 0.1).toDestination();
  synth.connect(filter);
  return synth;
}

function getSwellSynth(): Tone.PolySynth {
  const synth = new Tone.PolySynth().toDestination();
  // synth.voice = Tone.AMSynth;
  // synth.set({})
  return synth;
}

function getOrganSynth(): Tone.PolySynth {
  const synth = new Tone.PolySynth().toDestination();
  const instr: InstrumentSettings = {
    oscillator: {
      type: "fatcustom",
      partials: [0.7, 1, 0, 0.3, 0.1],
      spread: 10,
      count: 3
    },
    envelope: {
      attack: 0.001,
      decay: 1.6,
      sustain: 0.5,
      release: 1.6
    }
  };
  synth.set(instr as any);
  return synth;
}

function getPluckSynth(): Tone.PolySynth {
  const synth = new Tone.PolySynth().toDestination();
  const instr: InstrumentSettings = {
    harmonicity: 8,
    modulationIndex: 6,
    oscillator: {
      type: "sine2"
    },
    envelope: {
      attack: 0.001,
      decay: 2,
      sustain: 0.1,
      release: 2
    },
    modulation: {
      type: "square2"
    },
    modulationEnvelope: {
      attack: 0.002,
      decay: 0.2,
      sustain: 0,
      release: 0.2
    }
  };
  synth.set(instr as any);
  return synth;
}

/**
 * Returns a synth as specified by user volume and voice
 * selections, along with the base decibel value (to be
 * modified as determined by the chord)
 */
export function getSynth(state: SynthState): SynthReturn {
  if (synth !== null && synthType === state.synth) {
    return { synth, baseDecibel };
  }

  synthType = state.synth;

  if (synth !== null) {
    synth.dispose();
  }

  switch (synthType) {
    case "w":
      baseDecibel = -1;
      synth = getWaveSynth();
      break;
    case "s":
      baseDecibel = 16;
      synth = getSwellSynth();
      break;
    case "o":
      baseDecibel = -3;
      synth = getOrganSynth();
      break;
    case "pl":
      baseDecibel = -8;
      synth = getPluckSynth();
      break;
    case "p":
    default:
      baseDecibel = 2;
      synth = getPlumberSynth();
      break;
  }

  if (isMobile) {
    Tone.context.latencyHint = "balanced";
    //synth.set({ latencyHint: "balanced" });
  }

  return { synth, baseDecibel };
}

export const synthTypes: Record<string, string> = {
  "p": "plumber",
  "w": "wave",
  "s": "swell",
  "o": "organ",
  "pl": "pluck"
};