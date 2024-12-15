import * as Tone from "tone";
import { isMobile } from "react-device-detect";

interface SynthState {
  synth: keyof typeof SYNTH_TYPES;
}

export interface SynthReturn {
  synth: Tone.PolySynth;
  decibelModifier: number;
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
let synthType: string;
let decibelModifier = 2;

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

function getGuitSynth(): Tone.PolySynth {
  const synth = new Tone.PolySynth().toDestination();
  const instr: InstrumentSettings = {
    "harmonicity": 5,
    "modulationIndex": 10,
    "oscillator": {
      "type": "sine"
    },
    "envelope": {
      "attack": 0.001,
      "decay": 2,
      "sustain": 0.1,
      "release": 2
    },
    "modulation": {
      "type": "square"
    },
    "modulationEnvelope": {
      "attack": 0.002,
      "decay": 0.2,
      "sustain": 0,
      "release": 0.2
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
export function getSynth(synthName: string): SynthReturn {

  if (synth !== null && synthType === synthName) {
    return { synth, decibelModifier: decibelModifier };
  }
  synthType = synthName;

  if (synth !== null) {
    synth.dispose();
  }

  switch (synthType) {
    case "w":
      decibelModifier = -10;
      synth = getWaveSynth();
      break;
    case "s":
      decibelModifier = 0;
      synth = getSwellSynth();
      break;
    case "o":
      decibelModifier = -20;
      synth = getOrganSynth();
      break;
    case "pl":
      decibelModifier = -30;
      synth = getPluckSynth();
      break;
    case "p":
    default:
      decibelModifier = -10;
      synth = getPlumberSynth();
      break;
  }

  if (isMobile) {
    //Tone.context.latencyHint = "balanced";
    // @ts-ignore
    synth.set({ latencyHint: "balanced" });
  }

  return { synth, decibelModifier: decibelModifier };
}

export const SYNTH_TYPES = {
  "p": { name: "plumber" },
  "w": { name: "wave" },
  "s": { name: "swell" },
  "o": { name: "organ" },
  "pl": { name: "pluck" },
  "el": { 
    name: "electric",
    // @ts-ignore
    getSampler: () => import('tonejs-instrument-guitar-electric-mp3'),
    decibelModifier: 3
  },
  "ac": { 
    name: "acoustic",
    // @ts-ignore
    getSampler: () => import('tonejs-instrument-guitar-nylon-mp3'),
    decibelModifier: -2
  }
} as const