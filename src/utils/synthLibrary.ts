import * as Tone from "tone";

export interface SynthReturn {
  synth: Tone.PolySynth;
  decibelModifier: number;
}

// the options a PolySynth accepts, so presets are checked against Tone's types
type InstrumentSettings = Parameters<Tone.PolySynth["set"]>[0];

let synth: Tone.PolySynth | null = null;
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

// function getSwellSynth(): Tone.PolySynth {
//   const synth = new Tone.PolySynth().toDestination();
//   //@ts-ignore
//   synth.voice = Tone.AMSynth;
//   // synth.set({})
//   return synth;
// }

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
  synth.set(instr);
  return synth;
}

function getPluckSynth(): Tone.PolySynth {
  const synth = new Tone.PolySynth().toDestination();
  // the voice is a plain Synth, so only the oscillator and envelope apply.
  // FM settings (harmonicity, modulation, ...) would need
  // new Tone.PolySynth(Tone.FMSynth), which would change the sound
  const instr: InstrumentSettings = {
    oscillator: {
      type: "sine2"
    },
    envelope: {
      attack: 0.001,
      decay: 2,
      sustain: 0.1,
      release: 2
    }
  };
  synth.set(instr);
  return synth;
}

// function getGuitSynth(): Tone.PolySynth {
//   const synth = new Tone.PolySynth().toDestination();
//   const instr: InstrumentSettings = {
//     "harmonicity": 5,
//     "modulationIndex": 10,
//     "oscillator": {
//       "type": "sine"
//     },
//     "envelope": {
//       "attack": 0.001,
//       "decay": 2,
//       "sustain": 0.1,
//       "release": 2
//     },
//     "modulation": {
//       "type": "square"
//     },
//     "modulationEnvelope": {
//       "attack": 0.002,
//       "decay": 0.2,
//       "sustain": 0,
//       "release": 0.2
//     }
//   };
//   synth.set(instr as any);
//   return synth;
// }

/**
 * Returns a synth as specified by user volume and voice
 * selections, along with the base decibel value (to be
 * modified as determined by the chord)
 */
export function getSynth(synthType: string): SynthReturn {

  switch (synthType) {
    case "w":
      decibelModifier = -10;
      synth = getWaveSynth();
      break;
    // case "s":
    //   decibelModifier = 10;
    //   synth = getSwellSynth();
    //   break;
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

  return { synth, decibelModifier: decibelModifier };
}

// the table lives apart from Tone so the url codec can read it
export { SYNTH_TYPES } from "./synthTypes";
export type { SamplerModule, SynthKey, SynthType } from "./synthTypes";
