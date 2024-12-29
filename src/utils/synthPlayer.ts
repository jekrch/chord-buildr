import * as Tone from "tone"
import { getSynth, SYNTH_TYPES, SynthKey, SynthReturn } from './synthLibrary'
import { AppState, getPianoById } from "../components/context/AppContext"
import { isMobile } from "react-device-detect"
import { ChordPiano, NoteKey } from "./chordPianoHandler"
import { ChordPosition, findChordPositions, getInstrumentByFormat, Instrument, isGuitar } from "./guitarUtil"

// maximum allowed volume in decibels to prevent audio clipping
const MAX_SYNTH_VOLUME = 5
const MAX_SAMPLER_VOLUME = 4;

let decibelModifier = 2

// cache for loaded samplers and their configurations
const samplers: {
  [key: string]: ToneSampler
} = {}

const synths: {
  [key: string]: ToneSynth
} = {}

export interface EQSettings {
  low: number    // frequency range: 20-250 Hz
  mid: number    // frequency range: 250-2000 Hz
  high: number   // frequency range: 2000-20000 Hz
}

interface ToneSampler {
  sampler: Tone.Sampler
  decibelModifier?: number
  eq?: Tone.EQ3,
  eqSettings?: EQSettings
}

interface ToneSynth {
  synth: Tone.PolySynth
  eq: Tone.EQ3
  eqSettings: EQSettings
  decibelModifier?: number
}

// default eq settings in decibels
export const DEFAULT_EQ: EQSettings = {
  low: 0,
  mid: 0,
  high: 0
}

interface AudioOptions {
  toneSynth?: ToneSynth
  toneSampler?: ToneSampler,
  eq?: Tone.EQ3;
  decibelModifier?: number
  notes: string[]
  volume?: number
  delay?: string
  duration?: string
  velocity?: number
  useStrum?: boolean
}

function getSelectedNotes(piano: NoteKey[][]): string[] {
  const selectedNotes: string[] = []

  for (let octaveIndex = 0; octaveIndex < piano.length; octaveIndex++) {
    const pianoOctave = piano[octaveIndex]

    for (let j = 0; j < pianoOctave.length; j++) {
      const noteKey = pianoOctave[j]
      if (noteKey.selected) {
        const note = `${noteKey.note.toUpperCase()}${octaveIndex + 3}`
        selectedNotes.push(note)

        if (!isMobile) {
          noteKey.isStopping = null
          noteKey.isPlaying = true
        }
      }
    }
  }

  return selectedNotes
}

function clearPianoKeyPlaying(dispatch: React.Dispatch<any>, pianoComponent: ChordPiano): void {
  setTimeout(() => {
    const piano = pianoComponent.piano
    if (!piano) return

    for (let i = 0; i < piano.length; i++) {
      const pianoOctave = piano[i]

      for (let z = 0; z < pianoOctave.length; z++) {
        const key = pianoOctave[z]
        if (key.isPlaying) {
          key.isPlaying = false
          key.isStopping = true
        }
      }
    }

    pianoComponent.isPlaying = false
    
    dispatch({
      type: "UPDATE_PIANO",
      id: pianoComponent.id,
      payload: pianoComponent
    })
  }, 1500)
}

// get decibel value based on note numbers and user volume
function getDecibel(userVolume: number, selectedNoteNumbers: number[]): number {
  const userVolumeModifier = getUserVolumeModifier(userVolume)
  const highestNoteNumber = Math.max(...selectedNoteNumbers)
  const calculatedVolume = decibelModifier - highestNoteNumber / 2.5 + userVolumeModifier
  
  // limit the volume to MAX_VOLUME
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
  let modifier = 0

  if (userVolume >= 90) {
    const volIncrease = userVolume - 90
    // limit the maximum volume increase
    modifier = Math.min(modifier + volIncrease * 0.4, MAX_SYNTH_VOLUME)
  } else {
    const volDecrease = 90 - userVolume
    modifier = 0 - 20 * (volDecrease / 90)
  }

  return modifier
}

/**
 * get or create sampler instance with decibelModifier configuration
 * 
 * @param type 
 * @returns 
 */
async function getInstrumentSampler(
  type: SynthKey, 
  eqSettings: EQSettings = DEFAULT_EQ
): Promise<ToneSampler | undefined> {

  if (samplers[type]) {
    if (samplers[type].eqSettings !== eqSettings) {
      samplers[type].eqSettings = eqSettings
    }
    return samplers[type]
  }

  const instrument = SYNTH_TYPES[type]
  if (!instrument || !('getSampler' in instrument)) {
    return undefined
  }

  try {
    if (!instrument.getSampler) return

    const SamplerModule = await instrument.getSampler()
    
    let sampler = await new Promise<Tone.Sampler>(resolve => {
      let sampler = new SamplerModule.default({
        onload: () => resolve(sampler)
      }) as Tone.Sampler
    })

    // create eq for the sampler
    const eq: Tone.EQ3 = createEQ()

    samplers[type] = {
      sampler,
      eq,
      eqSettings: eqSettings,
      decibelModifier: Math.min(
          (instrument.decibelModifier || 0) + getVolumeCompensation(eqSettings), 
          MAX_SAMPLER_VOLUME
      )
    } as ToneSampler;
    
    return samplers[type]
  } catch (error) {
    console.error('failed to load instrument sampler:', error)
    return undefined
  }
}

/*
  * Get the volume compensation for the EQ settings
  * 
  * @param eqSettings 
  * @returns 
  */
function getVolumeCompensation(eqSettings?: Partial<EQSettings>): number {
  if (!eqSettings) return 0
  
  const eqBoost = calculateEQVolumeBoost(eqSettings)
  // negative value to compensate for the boost
  return -eqBoost
}

/**
 * Calculate the volume boost based on the EQ settings
 * 
 * @param eqSettings 
 * @returns 
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
 * Play the provided notes using either the synth or sampler as provided and either strummed 
 * or concurrently. Delay is used to improve performance on mobile and volume is determined 
 * by several factors: synth vs sampler, synth pitch, user volume setting, voice modifier from 
 * SYNTH_TYPES
 * 
 * @param options 
 */
async function playNotes(options: AudioOptions) {
  let { toneSynth, toneSampler, notes, volume, delay, duration, velocity, useStrum } = options

  let decibelModifier = toneSampler?.decibelModifier ?? toneSynth?.decibelModifier;

  const baseDelay = delay ? Number(delay.replace('+', '')) : 0

  if (Tone.getContext().state !== 'running') {
    Tone.getContext().resume()
  }

  if (toneSampler) {

    initSampler(toneSampler, volume, decibelModifier)

    if (useStrum) {
      playSamplerNotesStrum(
        notes, 
        velocity,
        baseDelay, 
        toneSampler.sampler, 
        duration
      )
    } else {
      playSamplerNotes(
        notes, 
        toneSampler.sampler, 
        duration, 
        baseDelay, 
        velocity
      );
    }
  } else if (toneSynth) {

    volume = initSynth(toneSynth, volume)

    if (useStrum) {
      playSynthNotesStrum(
        notes, 
        velocity, 
        volume, 
        toneSynth.synth, 
        duration, 
        baseDelay
      )
    } else {
      // get midi numbers for all notes
      playSynthNotes(
        notes, 
        volume, 
        toneSynth.synth, 
        duration, 
        baseDelay, 
        velocity
      );
    }
  }
}

/**
 * Initialize the synth with the provided volume and eq settings
 * 
 * @param toneSynth 
 * @param volume 
 * @returns 
 */
function initSynth(toneSynth: ToneSynth, volume: number | undefined) {

  //toneSynth.synth.disconnect()

  // apply eq settings if there are any
  if (
    !hasFlatEq(toneSynth.eqSettings)
  ) {

    applyEQSettings(toneSynth.eq, toneSynth.eqSettings)
    toneSynth.synth.chain(toneSynth.eq, Tone.Destination)
    toneSynth.synth.toDestination()

  } else {
    toneSynth.synth.toDestination()
  }

  if (toneSynth.decibelModifier) {
    // if we're strumming with a synth we should shave 10 off of the vol
    // to compensate for louder effect
    volume = volume! + toneSynth.decibelModifier - 10
  }

  toneSynth.synth.releaseAll()

  return volume
}

/**
 * Determine if the eq settings are all zero
 * 
 * @param toneSynth 
 * @returns 
 */
export function hasFlatEq(eqSettings: EQSettings) {
  return eqSettings.low === 0 && 
         eqSettings.mid === 0 && 
         eqSettings.high === 0
}

/**
 * Determine if the EQ settings are not equal
 * 
 * @param eq 
 * @param eqSettings 
 * @returns 
 */
export function notEqual(eq: EQSettings, eqSettings: EQSettings): boolean {
  return eq.low !== eqSettings.low || 
         eq.mid !== eqSettings.mid || 
         eq.high !== eqSettings.high;
}

/**
 * Initialize the sampler with the provided volume and eq settings
 * 
 * @param toneSampler 
 * @param volume 
 * @param decibelModifier 
 */
function initSampler(
  toneSampler: ToneSampler,
  volume: number | undefined,
  decibelModifier: number | undefined
) {
  let sampler = toneSampler.sampler;
  let eq = toneSampler.eq;
  let eqSettings = toneSampler.eqSettings;

  sampler.disconnect();

  // only use eq if we have thems
  if (
      eq &&
      eqSettings && 
      !hasFlatEq(eqSettings)
  ) {
    applyEQSettings(eq, eqSettings)
    sampler.chain(eq, Tone.Destination)
  } else {
    // bypass eq completely if all settings are zero or undefined
    sampler.toDestination()
  }
  
  sampler.releaseAll()

  if (volume !== undefined && decibelModifier !== undefined) {
    let calculatedVolume = decibelModifier + getUserVolumeModifier(volume)
    sampler.volume.value = Math.min(calculatedVolume, MAX_SAMPLER_VOLUME)
  }
}

/**
 * Play the provided notes strummed using the provided sampler
 * 
 * @param notes 
 * @param sampler 
 * @param duration 
 * @param baseDelay 
 * @param velocity 
 */
function playSamplerNotes(
  notes: string[], 
  sampler: Tone.Sampler, 
  duration: string | undefined, 
  baseDelay: number, 
  velocity: number | undefined
) {
  const now = Tone.now()
  notes.forEach(note => {
    sampler.triggerAttackRelease(
      note,
      duration || "1.0",
      now + baseDelay,
      velocity || 0.7
    )
  })
}

/**
 * Play the provided notes strummed using the provided sampler
 * 
 * @param notes 
 * @param velocity 
 * @param baseDelay 
 * @param sampler 
 * @param duration 
 */
function playSamplerNotesStrum(
  notes: string[], 
  velocity: number | undefined, 
  baseDelay: number, 
  sampler: Tone.Sampler, 
  duration: string | undefined
) {
  const strumDuration = 0.20
  const delayPerNote = strumDuration / notes.length
  const noteVelocity = velocity || 0.6

  notes.forEach((note, index) => {
    const now = Tone.now()
    const startTime = now + baseDelay + (index * delayPerNote)

    sampler.triggerAttackRelease(
      note,
      duration || "1.0",
      startTime,
      noteVelocity
    )
  })
}

/**
 * Play the provided notes strummed using the provided synth
 * 
 * @param notes 
 * @param velocity 
 * @param volume 
 * @param synth 
 * @param duration 
 * @param baseDelay 
 */
function playSynthNotesStrum(
  notes: string[], 
  velocity: number | undefined, 
  volume: number | undefined, 
  synth: Tone.PolySynth,
  duration: string | undefined, 
  baseDelay: number
) {
  const strumDuration = 0.20
  const delayPerNote = strumDuration / notes.length
  const noteVelocity = velocity || 0.7
  
  // Release any existing voices before starting new strum
  synth.releaseAll()

  notes.forEach((note, index) => {
    const noteNumber = getNoteNumber(note)
    const noteDecibel = getDecibel(volume || 0, [noteNumber])
    synth.volume.value = noteDecibel

    synth.triggerAttackRelease(
      note,
      duration || "1.1",
      Tone.now() + baseDelay + (index * delayPerNote),
      noteVelocity
    )
  })

}

/**
 * Play the provided notes using the provided synth
 * 
 * @param notes 
 * @param volume 
 * @param synth 
 * @param duration 
 * @param baseDelay 
 * @param velocity 
 */
function playSynthNotes(
  notes: string[], 
  volume: number | undefined, 
  synth: Tone.PolySynth, 
  duration: string | undefined, 
  baseDelay: number, 
  velocity: number | undefined
) {
  const noteNumbers = notes.map(getNoteNumber)
  const noteDecibel = getDecibel(volume || 0, noteNumbers)
  synth.volume.value = noteDecibel

  // Release all voices before playing new ones
  synth.releaseAll()

  // Convert duration string to seconds for precise timing
  //const durationInSeconds = Tone.Time(duration || "1.1").toSeconds()
  
  // Play the new notes
  synth.triggerAttackRelease(
    notes,
    duration || "1.1",
    Tone.now() + baseDelay,
    velocity || 0.7
  )
}

/**
 * Play the chord for the provided chordPianoId
 * @param dispatch 
 * @param state 
 * @param pianoId 
 * @param overrideOptions 
 * @returns 
 */
export async function playChordById(
  dispatch: React.Dispatch<any>, 
  state: AppState, 
  pianoId?: number,
  tabPositions?:  ChordPosition[]
) {
  let chordPiano: ChordPiano | null = getPianoById(state, pianoId!);

  if (!chordPiano) return;

  return playChord(
    dispatch,
    state,
    chordPiano,
    tabPositions,
  );
}

/**
 * Play the chord for the provided chordPiano
 * 
 * @param dispatch 
 * @param state 
 * @param chordPiano 
 * @param overrideOptions 
 */
export async function playChord(
  dispatch: React.Dispatch<any>, 
  state: AppState, 
  chordPiano: ChordPiano,
  tabPositions?:  ChordPosition[]
): Promise<void> {

  if (!isMobile) {
    dispatch({
      type: "UPDATE_PIANO",
      id: chordPiano.id,
      payload: { ...chordPiano, isPlaying: true }
    })
  }

  try {
    const useStrum = isGuitar(state.format)
    const instrumentType = state.synth as SynthKey
    
    let notes: string[]

    // console.log(useStrum);
    // console.log(chordPiano.selectedChord);

    if (useStrum && chordPiano.selectedChord) {

      const instrument: Instrument = getInstrumentByFormat(state.format);

      // if the tabPositions weren't provided, fetch them now
      if (!tabPositions) {
        tabPositions = findChordPositions(
          chordPiano.selectedChord,
          instrument.chords,
          state.format
        )
      }

      // get the selected position
      notes = tabPositions[chordPiano.selectedChord.position ?? 0].midi
        .map((midi) => {
          return Tone.Frequency(midi, "midi").toNote()
        })

    } else {
      notes = getSelectedNotes(chordPiano.piano!)
    }
    
    const toneSampler = await getInstrumentSampler(instrumentType, state.eq)

    let toneSynth = !toneSampler ? getToneSynth(instrumentType, state.eq) : undefined;
    
    await playNotes({
      toneSampler: toneSampler,
      toneSynth: toneSynth,
      notes,
      volume: state.volume,
      delay: isMobile ? "+0.15" : "+0.03",
      duration: useStrum ? "1.0" : "1.1",
      velocity: 0.7,
      useStrum,
    })
  } catch (error) {
    console.error('failed to play chord:', error)
  }

  if (!isMobile) {
    clearPianoKeyPlaying(dispatch, chordPiano)

    setTimeout(() => {
      dispatch({
        type: "UPDATE_PIANO",
        id: chordPiano.id,
        payload: { ...chordPiano, isPlaying: false }
      })
    }, 1000)
  }
}

/**
 * Fetch the sampler for the provided instrument type
 * 
 * @param instrumentType 
 * @param eqSettings 
 * @returns 
 */
function getToneSynth(
  instrumentType: string, 
  eqSettings: EQSettings = DEFAULT_EQ
) {
  
  // If the synth exists and is not disposed, reuse it
  if (synths[instrumentType] && !synths[instrumentType].synth.disposed) {
    synths[instrumentType].synth.releaseAll()
    if (synths[instrumentType].eqSettings !== eqSettings) {
      synths[instrumentType].eqSettings = eqSettings
    }
    return synths[instrumentType];
  } else {
    cleanupSynths();
  }

  // Only create a new synth if we don't have one or if it was disposed
  let synthReturn: SynthReturn = getSynth(instrumentType as any);
  
  synths[instrumentType] = {
    synth: synthReturn.synth,
    eq: createEQ(),
    eqSettings,
          decibelModifier: Math.min(
          (synthReturn.decibelModifier || 0) + getVolumeCompensation(eqSettings), 
          MAX_SAMPLER_VOLUME
      )
  } as ToneSynth;

  synths[instrumentType].synth.releaseAll();

  return synths[instrumentType];
}

/**
 * Dispose of all synths and eq instances. This is necessary to prevent memory leaks
 * and to ensure that the audio context is properly cleaned up.
 */
function cleanupSynths() {
  Object.keys(synths).forEach(key => {
    try {
      if (synths[key]) {
        synths[key].eq.dispose();
        synths[key].synth.dispose();
        delete synths[key];
      }
    } catch (error) {
      console.warn(`Error cleaning up synth ${key}:`, error);
    }
  });
}

/**
 * create a new eq3 instance with default settings
 */
function createEQ(): Tone.EQ3 {
  const eq = new Tone.EQ3()
  eq.low.value = DEFAULT_EQ.low
  eq.mid.value = DEFAULT_EQ.mid
  eq.high.value = DEFAULT_EQ.high
  return eq
}

/**
 * apply eq settings to the provided eq instance
 */
function applyEQSettings(eq: Tone.EQ3, settings: Partial<EQSettings>) {
  if (settings.low !== undefined) eq.low.value = settings.low
  if (settings.mid !== undefined) eq.mid.value = settings.mid
  if (settings.high !== undefined) eq.high.value = settings.high
}
