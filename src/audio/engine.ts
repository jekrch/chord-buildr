import * as Tone from "tone"
import { getSynth, SynthReturn } from "./synthLibrary"
import { SYNTH_TYPES, SynthKey } from "../utils/synthTypes"
import { DEFAULT_EQ, EQSettings, hasFlatEq } from "../utils/settings"

/**
 * the only module that imports Tone. the player loads it with import() on
 * the first user gesture or the first play, so Tone stays out of the main
 * bundle and no AudioContext is created before the page is interacted with
 */

// maximum allowed volume in decibels to prevent audio clipping
const MAX_SYNTH_VOLUME = 5
const MAX_SAMPLER_VOLUME = 4

const DECIBEL_MODIFIER = 2

export interface PlayRequest {
  // a SYNTH_TYPES key
  instrument: SynthKey
  eq: EQSettings
  // note names, such as "C#4"
  notes: string[]
  // 0-100
  volume: number
  // seconds from now
  delay: number
  duration: string
  velocity: number
  // play the notes one after another, as a guitar strum
  strum: boolean
}

interface ToneSampler {
  sampler: Tone.Sampler
  decibelModifier?: number
  eq?: Tone.EQ3
  eqSettings?: EQSettings
}

interface ToneSynth {
  synth: Tone.PolySynth
  eq: Tone.EQ3
  eqSettings: EQSettings
  decibelModifier?: number
}

// loaded samplers and synths, by instrument
const samplers: Record<string, ToneSampler> = {}
const synths: Record<string, ToneSynth> = {}

/**
 * starts the audio context. browsers only allow that after a user
 * gesture, so it's called from one, and again before each play
 */
export function resumeAudio(): Promise<void> {
  if (Tone.getContext().state === "running") return Promise.resolve()
  return Tone.start()
}

/**
 * plays the notes on the instrument, either strummed or together. the
 * volume depends on the instrument, whether it's a synth or a sampler,
 * the pitch (for synths), and the user's volume and eq
 */
export async function playNotes(request: PlayRequest): Promise<void> {
  const { instrument, eq, notes, volume, delay, duration, velocity, strum } = request

  const toneSampler = await getInstrumentSampler(instrument, eq)
  const toneSynth = toneSampler ? undefined : getToneSynth(instrument, eq)

  resumeAudio().catch((error) => console.warn('failed to resume audio:', error))

  if (toneSampler) {
    initSampler(toneSampler, volume, toneSampler.decibelModifier)

    if (strum) {
      playSamplerNotesStrum(notes, velocity, delay, toneSampler.sampler, duration)
    } else {
      playSamplerNotes(notes, toneSampler.sampler, duration, delay, velocity)
    }
  } else if (toneSynth) {
    const synthVolume = initSynth(toneSynth, volume)

    if (strum) {
      playSynthNotesStrum(notes, velocity, synthVolume, toneSynth.synth, duration, delay)
    } else {
      playSynthNotes(notes, synthVolume, toneSynth.synth, duration, delay, velocity)
    }
  }
}

// get decibel value based on note numbers and user volume
function getDecibel(userVolume: number, selectedNoteNumbers: number[]): number {
  const userVolumeModifier = getUserVolumeModifier(userVolume)
  const highestNoteNumber = Math.max(...selectedNoteNumbers)
  const calculatedVolume = DECIBEL_MODIFIER - highestNoteNumber / 2.5 + userVolumeModifier

  return Math.min(calculatedVolume, MAX_SYNTH_VOLUME)
}

/**
 * convert user volume (0-100) to a modifier ranging between -20 to MAX_VOLUME
 * with 90 as the 0 point
 */
function getUserVolumeModifier(userVolume: number | null): number {
  if (userVolume == null) {
    userVolume = 0
  }

  if (userVolume >= 90) {
    const volIncrease = userVolume - 90
    // limit the maximum volume increase
    return Math.min(volIncrease * 0.4, MAX_SYNTH_VOLUME)
  }

  const volDecrease = 90 - userVolume
  return 0 - 20 * (volDecrease / 90)
}

/**
 * get or create the sampler for an instrument, or undefined if the
 * instrument is a synth
 */
async function getInstrumentSampler(
  type: SynthKey,
  eqSettings: EQSettings = DEFAULT_EQ
): Promise<ToneSampler | undefined> {

  if (samplers[type]) {
    samplers[type].eqSettings = eqSettings
    return samplers[type]
  }

  const instrument = SYNTH_TYPES[type]
  if (!instrument?.getSampler) {
    return undefined
  }

  try {
    const SamplerModule = await instrument.getSampler()

    const sampler = await new Promise<Tone.Sampler>(resolve => {
      const sampler = new SamplerModule.default({
        onload: () => resolve(sampler)
      })
    })

    samplers[type] = {
      sampler,
      eq: createEQ(),
      eqSettings,
      decibelModifier: Math.min(
        (instrument.decibelModifier || 0) + getVolumeCompensation(eqSettings),
        MAX_SAMPLER_VOLUME
      )
    }

    return samplers[type]
  } catch (error) {
    console.error('failed to load instrument sampler:', error)
    return undefined
  }
}

/**
 * get the volume compensation for the eq settings
 */
function getVolumeCompensation(eqSettings?: Partial<EQSettings>): number {
  if (!eqSettings) return 0

  // negative to compensate for the boost
  return -calculateEQVolumeBoost(eqSettings)
}

/**
 * calculate the volume boost from the eq settings
 */
function calculateEQVolumeBoost(eqSettings: Partial<EQSettings>): number {
  // each band contributes to overall volume, but with different weights
  const lowWeight = 2.8
  const midWeight = 3.0
  const highWeight = 2.9

  // only consider positive values as boosting volume
  const lowBoost = Math.max(0, (eqSettings.low ?? 0)) * lowWeight
  const midBoost = Math.max(0, (eqSettings.mid ?? 0)) * midWeight
  const highBoost = Math.max(0, (eqSettings.high ?? 0)) * highWeight

  // sum the weighted boosts and apply a scaling factor
  // 0.3 factor determined through testing to provide natural sound
  return (lowBoost + midBoost + highBoost) * 0.3
}

// convert note name to midi number
function getNoteNumber(note: string): number {
  return Tone.Frequency(note).toMidi() - 72
}

/**
 * route the synth through its eq (if any) and return the volume to play at
 */
function initSynth(toneSynth: ToneSynth, volume: number): number {

  if (!hasFlatEq(toneSynth.eqSettings)) {
    applyEQSettings(toneSynth.eq, toneSynth.eqSettings)
    toneSynth.synth.chain(toneSynth.eq, Tone.Destination)
  }
  toneSynth.synth.toDestination()

  if (toneSynth.decibelModifier) {
    // synths sound louder than samplers, so take 10 off
    volume = volume + toneSynth.decibelModifier - 10
  }

  toneSynth.synth.releaseAll()

  return volume
}

/**
 * route the sampler through its eq (if any) and set its volume
 */
function initSampler(
  toneSampler: ToneSampler,
  volume: number,
  decibelModifier: number | undefined
) {
  const { sampler, eq, eqSettings } = toneSampler

  sampler.disconnect()

  if (eq && eqSettings && !hasFlatEq(eqSettings)) {
    applyEQSettings(eq, eqSettings)
    sampler.chain(eq, Tone.Destination)
  } else {
    // bypass the eq completely when it's flat
    sampler.toDestination()
  }

  sampler.releaseAll()

  if (decibelModifier !== undefined) {
    const calculatedVolume = decibelModifier + getUserVolumeModifier(volume)
    sampler.volume.value = Math.min(calculatedVolume, MAX_SAMPLER_VOLUME)
  }
}

function playSamplerNotes(
  notes: string[],
  sampler: Tone.Sampler,
  duration: string,
  baseDelay: number,
  velocity: number
) {
  const now = Tone.now()
  notes.forEach(note => {
    sampler.triggerAttackRelease(note, duration, now + baseDelay, velocity)
  })
}

function playSamplerNotesStrum(
  notes: string[],
  velocity: number,
  baseDelay: number,
  sampler: Tone.Sampler,
  duration: string
) {
  const strumDuration = 0.20
  const delayPerNote = strumDuration / notes.length

  notes.forEach((note, index) => {
    const startTime = Tone.now() + baseDelay + (index * delayPerNote)
    sampler.triggerAttackRelease(note, duration, startTime, velocity)
  })
}

function playSynthNotesStrum(
  notes: string[],
  velocity: number,
  volume: number,
  synth: Tone.PolySynth,
  duration: string,
  baseDelay: number
) {
  const strumDuration = 0.20
  const delayPerNote = strumDuration / notes.length

  // release any existing voices before starting a new strum
  synth.releaseAll()

  notes.forEach((note, index) => {
    synth.volume.value = getDecibel(volume, [getNoteNumber(note)])

    synth.triggerAttackRelease(
      note,
      duration,
      Tone.now() + baseDelay + (index * delayPerNote),
      velocity
    )
  })
}

function playSynthNotes(
  notes: string[],
  volume: number,
  synth: Tone.PolySynth,
  duration: string,
  baseDelay: number,
  velocity: number
) {
  synth.volume.value = getDecibel(volume, notes.map(getNoteNumber))

  // release all voices before playing new ones
  synth.releaseAll()

  synth.triggerAttackRelease(notes, duration, Tone.now() + baseDelay, velocity)
}

/**
 * get the synth for an instrument, creating it (and disposing of the
 * others) if it doesn't exist yet
 */
function getToneSynth(
  instrumentType: string,
  eqSettings: EQSettings = DEFAULT_EQ
): ToneSynth {

  const existing = synths[instrumentType]
  if (existing && !existing.synth.disposed) {
    existing.synth.releaseAll()
    existing.eqSettings = eqSettings
    return existing
  }

  cleanupSynths()

  const synthReturn: SynthReturn = getSynth(instrumentType)

  const toneSynth: ToneSynth = {
    synth: synthReturn.synth,
    eq: createEQ(),
    eqSettings,
    decibelModifier: Math.min(
      (synthReturn.decibelModifier || 0) + getVolumeCompensation(eqSettings),
      MAX_SAMPLER_VOLUME
    )
  }
  synths[instrumentType] = toneSynth

  toneSynth.synth.releaseAll()

  return toneSynth
}

/**
 * dispose of all synths and eqs, so switching instruments doesn't leak
 * audio nodes
 */
function cleanupSynths() {
  Object.keys(synths).forEach(key => {
    try {
      synths[key].eq.dispose()
      synths[key].synth.dispose()
      delete synths[key]
    } catch (error) {
      console.warn(`Error cleaning up synth ${key}:`, error)
    }
  })
}

function createEQ(): Tone.EQ3 {
  const eq = new Tone.EQ3()
  eq.low.value = DEFAULT_EQ.low
  eq.mid.value = DEFAULT_EQ.mid
  eq.high.value = DEFAULT_EQ.high
  return eq
}

function applyEQSettings(eq: Tone.EQ3, settings: Partial<EQSettings>) {
  if (settings.low !== undefined) eq.low.value = settings.low
  if (settings.mid !== undefined) eq.mid.value = settings.mid
  if (settings.high !== undefined) eq.high.value = settings.high
}
