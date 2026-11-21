import type * as Tone from "tone"

/**
 * the instruments a progression can be played with, keyed by the code
 * saved in the url. kept apart from the audio engine so reading that
 * code doesn't load Tone. the samplers' dynamic imports only run when played
 */

// what a tonejs-instrument-*-mp3 package's dynamic import resolves to
export interface SamplerModule {
  default: new (options?: Partial<Tone.SamplerOptions>) => Tone.Sampler;
}

export interface SynthType {
  name: string;
  type: string;
  getSampler?: () => Promise<SamplerModule>;
  decibelModifier?: number;
}

export const SYNTH_TYPES: Record<string, SynthType> = {
  "p": { name: "plumber", type: "synth" },
  "w": { name: "wave", type: "synth" },
  //"s": { name: "swell", type: "synth" },
  "o": { name: "organ", type: "synth" },
  "pl": { name: "pluck", type: "synth" },
  "el": { 
    name: "electric guitar",
    getSampler: () => import('tonejs-instrument-guitar-electric-mp3'),
    decibelModifier: 3, 
    type: "sampler"
  },
  "ac": { 
    name: "acoustic guitar",
    getSampler: () => import('tonejs-instrument-guitar-nylon-mp3'),
    decibelModifier: -2, 
    type: "sampler"
  },
  "h": { 
    name: "harp",
    getSampler: () => import('tonejs-instrument-harp-mp3'),
    decibelModifier: -2, 
    type: "sampler"
  }
} as const

export type SynthKey = keyof typeof SYNTH_TYPES
