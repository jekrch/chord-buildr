import * as Tone from "tone"
import { SYNTH_TYPES, SynthKey } from "../utils/synthTypes"
import { STEREO_WIDTH, type MacroRange, type StereoSide } from "./mix"

/**
 * how each instrument sounds, and how far the sound controls move it.
 * every range is [min, default, max]: a control at 0 gives the default,
 * and at either end gives the min or the max, so each voice keeps its own
 * character and no setting can push it somewhere broken
 */

export interface Envelope {
  attack: number
  decay: number
  release: number
}

/**
 * a playable instrument, synth or sampler, behind one shape. its output
 * isn't connected to anything; the engine connects it to the bus
 */
export interface Voice {
  // what the bus listens to: the instrument, or its last effect
  output: Tone.ToneAudioNode
  // the instrument's own level, for its trim and the eq's compensation
  volume: Tone.Param<"decibels">
  setEnvelope(envelope: Envelope): void
  // side is where the note sits in the stereo field (see noteSides)
  play(note: string, duration: number, time: number, velocity: number, side: StereoSide): void
  /**
   * starts a note that sounds until release is called for it, for a
   * loop, which decides when its notes end as it goes. a note is
   * released before it's struck again, so only one of each sounds
   */
  attack(note: string, time: number, velocity: number, side: StereoSide): void
  release(note: string, time: number, side: StereoSide): void
  // releases every sounding note, now or at the given context time
  releaseAll(time?: number): void
  dispose(): void
}

export interface VoiceDef {
  create(): Voice | Promise<Voice>
  // evens out the voices' loudness, so switching doesn't jump in level
  trimDb: number
  // how strongly the pitch balance applies (see noteLevelsDb)
  tiltScale: number
  // seconds, moved by the attack control
  attack: MacroRange
  // seconds, moved by the length control. samplers have no decay
  decay: MacroRange
  release: MacroRange
  // seconds a note is held before it's released, moved by the length control
  hold: MacroRange
  // the bus lowpass in Hz, moved by the tone control
  tone: MacroRange
}

// a synth voice's decay when the sampler shape has none
const NO_DECAY: MacroRange = [0, 0, 0]

// a synth voice's lanes, left to right, by the side they're panned to
const SIDES: readonly StereoSide[] = [-1, 0, 1]

/**
 * wraps a PolySynth, with the effects (if any) it runs through, as a
 * Voice. it's built three times over, one lane panned to each side, since
 * a PolySynth can't pan its notes apart; each note plays on its side's
 * lane. setEnvelope is passed in so each synth's set() keeps its own types
 */
function polyVoice<V extends Tone.Synth | Tone.FMSynth | Tone.MonoSynth>(
  build: () => { synth: Tone.PolySynth<V>; effects?: Tone.ToneAudioNode[] },
  setEnvelope: (synth: Tone.PolySynth<V>, envelope: Envelope) => void
): Voice {
  // an equal-power panner plays a mono note 3 dB down each side at the
  // center; this brings it back to the level it had unpanned
  const makeup = new Tone.Gain(Math.SQRT2)
  const output = new Tone.Volume(0)
  makeup.connect(output)

  const lanes = SIDES.map((side) => {
    const { synth, effects = [] } = build()
    const panner = new Tone.Panner(side * STEREO_WIDTH)
    synth.chain(...effects, panner, makeup)
    return { synth, effects, panner }
  })

  return {
    output,
    volume: output.volume,
    setEnvelope: (envelope) => {
      lanes.forEach(({ synth }) => setEnvelope(synth, envelope))
    },
    play: (note, duration, time, velocity, side) => {
      // SIDES runs -1, 0, 1, so a side's lane is at side + 1
      lanes[side + 1]?.synth.triggerAttackRelease(note, duration, time, velocity)
    },
    attack: (note, time, velocity, side) => {
      lanes[side + 1]?.synth.triggerAttack(note, time, velocity)
    },
    release: (note, time, side) => {
      lanes[side + 1]?.synth.triggerRelease(note, time)
    },
    releaseAll: (time) => {
      lanes.forEach(({ synth }) => synth.releaseAll(time))
    },
    dispose: () => {
      lanes.forEach(({ synth, effects, panner }) => {
        synth.dispose()
        effects.forEach((effect) => effect.dispose())
        panner.dispose()
      })
      makeup.dispose()
      output.dispose()
    }
  }
}

// plumber: a triangle wave, as it's always been, with a slightly softer
// edge on the attack. the bus lowpass takes the edge off high notes
function plumber(): Voice {
  return polyVoice(
    () => ({ synth: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.012, decay: 0.1, sustain: 0.3, release: 1 }
    }) }),
    (synth, envelope) => synth.set({ envelope })
  )
}

// the fundamental with a touch of the 2nd and 3rd harmonics
function soft(): Voice {
  return polyVoice(
    () => ({ synth: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "custom", partials: [1, 0.15, 0.04] },
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 1.2 }
    }) }),
    (synth, envelope) => synth.set({ envelope })
  )
}

// two-operator fm at 1:1. the modulation dies away fast, so each note
// starts with a soft bell and settles into a round tone
function keys(): Voice {
  return polyVoice(
    () => ({ synth: new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1,
      modulationIndex: 3,
      oscillator: { type: "sine" },
      modulation: { type: "sine" },
      envelope: { attack: 0.006, decay: 1.6, sustain: 0.15, release: 1 },
      modulationEnvelope: { attack: 0.002, decay: 0.35, sustain: 0.1, release: 0.8 }
    }) }),
    (synth, envelope) => synth.set({ envelope })
  )
}

// plumber through a slow vibrato, half wet: the wobble beats against the
// dry signal, as the old version did by sending both out at full level
function wave(): Voice {
  return polyVoice(
    () => ({
      synth: new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.012, decay: 0.1, sustain: 0.3, release: 1 }
      }),
      effects: [new Tone.Vibrato({ frequency: 5, depth: 0.1, wet: 0.5 })]
    }),
    (synth, envelope) => synth.set({ envelope })
  )
}

function organ(): Voice {
  return polyVoice(
    () => ({ synth: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatcustom", partials: [0.7, 1, 0, 0.3, 0.1], spread: 10, count: 3 },
      envelope: { attack: 0.008, decay: 1.6, sustain: 0.5, release: 1.6 }
    }) }),
    (synth, envelope) => synth.set({ envelope })
  )
}

function pluck(): Voice {
  return polyVoice(
    () => ({ synth: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine2" },
      envelope: { attack: 0.002, decay: 2, sustain: 0.1, release: 2 }
    }) }),
    (synth, envelope) => synth.set({ envelope })
  )
}

// three detuned saws per note through a lowpass that opens slowly
function pad(): Voice {
  return polyVoice(
    () => ({ synth: new Tone.PolySynth(Tone.MonoSynth, {
      oscillator: { type: "fatsawtooth", count: 3, spread: 18 },
      filter: { type: "lowpass", rolloff: -12, Q: 0.7 },
      filterEnvelope: { attack: 0.4, decay: 1, sustain: 0.6, release: 2, baseFrequency: 300, octaves: 2.5 },
      envelope: { attack: 0.35, decay: 0.5, sustain: 0.8, release: 1.8 }
    }) }),
    (synth, envelope) => synth.set({ envelope })
  )
}

// fm at an inharmonic 1:3.5, decaying to nothing: a struck metal bar
function bell(): Voice {
  return polyVoice(
    () => ({ synth: new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.5,
      modulationIndex: 5,
      oscillator: { type: "sine" },
      modulation: { type: "sine" },
      envelope: { attack: 0.002, decay: 2.2, sustain: 0, release: 1.4 },
      modulationEnvelope: { attack: 0.001, decay: 1.6, sustain: 0, release: 1.2 }
    }) }),
    (synth, envelope) => synth.set({ envelope })
  )
}

/**
 * loads an instrument's samples and wraps them as a Voice. samplers have
 * no decay, so only the attack and release are shaped. their notes all
 * play in the center: panning them apart would take a sampler, and a
 * decoded copy of every sample, per side
 */
async function sampler(key: SynthKey): Promise<Voice> {
  const getSampler = SYNTH_TYPES[key]?.getSampler
  if (!getSampler) throw new Error(`${key} isn't a sampler`)

  const SamplerModule = await getSampler()
  const sampler = await new Promise<Tone.Sampler>((resolve) => {
    const sampler = new SamplerModule.default({
      onload: () => resolve(sampler)
    })
  })

  return {
    output: sampler,
    volume: sampler.volume,
    setEnvelope: ({ attack, release }) => {
      sampler.attack = attack
      sampler.release = release
    },
    play: (note, duration, time, velocity) => {
      sampler.triggerAttackRelease(note, duration, time, velocity)
    },
    // the sampler releases every sounding copy of a note at once, which is
    // why a loop releases a note before striking it again
    attack: (note, time, velocity) => {
      sampler.triggerAttack(note, time, velocity)
    },
    release: (note, time) => {
      sampler.triggerRelease(note, time)
    },
    releaseAll: (time) => {
      sampler.releaseAll(time)
    },
    dispose: () => {
      sampler.dispose()
    }
  }
}

// what the samplers share. their samples already lose weight as they go
// up, so the pitch balance is applied at half strength
const SAMPLER_SHAPE = {
  tiltScale: 0.5,
  attack: [0.001, 0.002, 0.5],
  decay: NO_DECAY,
  release: [0.05, 0.15, 3],
  hold: [0.4, 1.1, 3],
  tone: [2500, 9000, 20000]
} satisfies Omit<VoiceDef, "create" | "trimDb">

// what plumber and the voices built on it share
const PLUMBER_SHAPE = {
  tiltScale: 1,
  attack: [0.003, 0.012, 0.35],
  decay: [0.06, 0.1, 0.6],
  release: [0.25, 1, 4],
  hold: [0.35, 1.1, 2.6],
  tone: [1800, 6000, 20000]
} satisfies Omit<VoiceDef, "create" | "trimDb">

const PLUMBER: VoiceDef = { create: plumber, trimDb: 0, ...PLUMBER_SHAPE }

export const VOICES: Record<SynthKey, VoiceDef> = {
  p: PLUMBER,
  sf: {
    create: soft,
    trimDb: -1,
    tiltScale: 1,
    attack: [0.004, 0.02, 0.4],
    decay: [0.15, 0.4, 1.2],
    release: [0.3, 1.2, 4],
    hold: [0.4, 1.1, 2.6],
    tone: [1500, 5000, 16000]
  },
  k: {
    create: keys,
    trimDb: 0,
    tiltScale: 1,
    attack: [0.002, 0.006, 0.3],
    decay: [0.6, 1.6, 4],
    release: [0.3, 1, 3.5],
    hold: [0.4, 1.2, 3],
    tone: [1500, 5000, 16000]
  },
  w: { create: wave, trimDb: 1, ...PLUMBER_SHAPE },
  o: {
    create: organ,
    trimDb: -3,
    tiltScale: 1,
    attack: [0.003, 0.008, 0.3],
    decay: [0.8, 1.6, 3],
    release: [0.3, 1.6, 4],
    hold: [0.4, 1.1, 2.6],
    tone: [1500, 5000, 16000]
  },
  pl: {
    create: pluck,
    trimDb: -1,
    tiltScale: 1,
    attack: [0.001, 0.002, 0.15],
    decay: [0.6, 2, 4],
    release: [0.4, 2, 4],
    hold: [0.3, 1, 2.4],
    tone: [2000, 7000, 20000]
  },
  pd: {
    create: pad,
    trimDb: -4,
    tiltScale: 1,
    attack: [0.05, 0.35, 1.5],
    decay: [0.3, 0.5, 1.5],
    release: [0.6, 1.8, 5],
    hold: [0.6, 1.4, 3.5],
    tone: [900, 3500, 12000]
  },
  b: {
    create: bell,
    trimDb: -2,
    // bells get piercing up high, so the tilt is steeper
    tiltScale: 1.4,
    attack: [0.001, 0.002, 0.2],
    decay: [0.8, 2.2, 5],
    release: [0.4, 1.4, 4],
    hold: [0.3, 0.8, 2],
    tone: [2000, 7000, 20000]
  },
  pi: { create: () => sampler("pi"), trimDb: 0, ...SAMPLER_SHAPE },
  el: { create: () => sampler("el"), trimDb: 3, ...SAMPLER_SHAPE },
  ac: { create: () => sampler("ac"), trimDb: -2, ...SAMPLER_SHAPE },
  h: { create: () => sampler("h"), trimDb: -2, ...SAMPLER_SHAPE }
}

// the voice for a key, or plumber's for one that isn't known
export function getVoiceDef(key: SynthKey): VoiceDef {
  return VOICES[key] ?? PLUMBER
}
