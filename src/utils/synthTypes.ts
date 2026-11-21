import type * as Tone from "tone"

/**
 * the instruments a progression can be played with, keyed by the code
 * saved in the url. kept apart from the audio engine so reading that
 * code doesn't load Tone. the samplers' dynamic imports only run when
 * played. how each one sounds is in audio/voices
 */

// what a sampler's dynamic import resolves to: a tonejs-instrument-*-mp3
// package, or a module of our own shaped like one
export interface SamplerModule {
  default: new (options?: Partial<Tone.SamplerOptions>) => Tone.Sampler;
}

export interface SynthType {
  name: string;
  // one line on how it sounds, shown under its name
  blurb: string;
  type: "synth" | "sampler";
  getSampler?: () => Promise<SamplerModule>;
}

// in the order they're listed in the settings
export const SYNTH_TYPES: Record<string, SynthType> = {
  "p": { name: "plumber", blurb: "clean and round, the classic", type: "synth" },
  "sf": { name: "soft", blurb: "a gentle near-sine, the mellowest", type: "synth" },
  "k": { name: "keys", blurb: "electric piano with a soft bell attack", type: "synth" },
  "w": { name: "wave", blurb: "plumber with a slow wobble", type: "synth" },
  "o": { name: "organ", blurb: "full and steady", type: "synth" },
  "pl": { name: "pluck", blurb: "short and bright, fades fast", type: "synth" },
  "pd": { name: "pad", blurb: "warm detuned saws that swell", type: "synth" },
  "b": { name: "bell", blurb: "glassy chimes, good for arpeggios", type: "synth" },
  "pi": {
    name: "piano",
    blurb: "sampled grand piano",
    getSampler: () => import("../audio/pianoSampler"),
    type: "sampler"
  },
  "el": {
    name: "electric guitar",
    blurb: "sampled clean electric",
    getSampler: () => import("tonejs-instrument-guitar-electric-mp3"),
    type: "sampler"
  },
  "ac": {
    name: "acoustic guitar",
    blurb: "sampled nylon string",
    getSampler: () => import("tonejs-instrument-guitar-nylon-mp3"),
    type: "sampler"
  },
  "h": {
    name: "harp",
    blurb: "sampled concert harp",
    getSampler: () => import("tonejs-instrument-harp-mp3"),
    type: "sampler"
  }
} as const

export type SynthKey = keyof typeof SYNTH_TYPES
