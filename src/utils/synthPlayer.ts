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

interface ToneSampler {
  sampler: Tone.Sampler
  decibelModifier?: number
}

// cache for loaded samplers and their configurations
const samplers: {
  [key: string]: ToneSampler
} = {}

interface AudioOptions {
  synth?: SynthReturn
  sampler?: Tone.Sampler
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
async function getInstrumentSampler(type: SynthKey): Promise<ToneSampler | undefined> {
  if (samplers[type]) {
    return samplers[type]
  }

  const instrument = SYNTH_TYPES[type]
  if (!instrument || !('getSampler' in instrument)) {
    return undefined
  }

  try {
    if (!instrument.getSampler) return;

    const SamplerModule = await instrument.getSampler()
    
    let sampler = await new Promise<Tone.Sampler>(resolve => {
      let sampler = new SamplerModule.default({
        onload: () => resolve(sampler)
      }) as Tone.Sampler
    })

    samplers[type] = {
      sampler,
      decibelModifier: Math.min(instrument.decibelModifier || 0, MAX_SYNTH_VOLUME)
    }
    
    return samplers[type]
  } catch (error) {
    console.error('failed to load instrument sampler:', error)
    return undefined
  }
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
  let { synth, sampler, notes, volume, delay, duration, velocity, useStrum, decibelModifier } = options

  const baseDelay = delay ? Number(delay.replace('+', '')) : 0

  if (Tone.getContext().state !== 'running') {
    Tone.getContext().resume()
  }

  if (sampler) {

    initSampler(sampler, volume, decibelModifier)

    if (useStrum) {
      playSamplerNotesStrum(
        notes, 
        velocity,
        baseDelay, 
        sampler, 
        duration
      )
    } else {
      playSamplerNotes(
        notes, 
        sampler, 
        duration, 
        baseDelay, 
        velocity
      );
    }
  } else if (synth) {

    volume = initSynth(synth, volume)

    if (useStrum) {
      playSynthNotesStrum(
        notes, 
        velocity, 
        volume, 
        synth, 
        duration, 
        baseDelay
      )
    } else {
      // get midi numbers for all notes
      playSynthNotes(
        notes, 
        volume, 
        synth, 
        duration, 
        baseDelay, 
        velocity
      );
    }
  }
}

function initSynth(synth: SynthReturn, volume: number | undefined) {
  if (synth.decibelModifier) {
    // if we're strumming with a synth we should shave 10 off of the vol
    // to compensate for louder effect
    volume = volume! + synth.decibelModifier - 10
  }

  synth.synth.toDestination()
  synth.synth.releaseAll()

  return volume
}

function initSampler(
  sampler: Tone.Sampler, 
  volume: number | undefined, 
  decibelModifier: number | undefined
) {
  sampler.toDestination()
  sampler.releaseAll()

  if (volume !== undefined && decibelModifier !== undefined) {
    let calculatedVolume = decibelModifier + getUserVolumeModifier(volume)

    sampler.volume.value = Math.min(calculatedVolume, MAX_SAMPLER_VOLUME)
    //console.log(calculatedVolume)
    //console.log(sampler.volume.value)
  }
}

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

function playSynthNotesStrum(
  notes: string[], 
  velocity: number | undefined, 
  volume: number | undefined, 
  synth: SynthReturn,
   duration: string | undefined, 
   baseDelay: number
  ) {
  const strumDuration = 0.20
  const delayPerNote = strumDuration / notes.length
  const noteVelocity = velocity || 0.7

  notes.forEach((note, index) => {
    const noteNumber = getNoteNumber(note)
    const noteDecibel = getDecibel(volume || 0, [noteNumber])
    //console.log(noteDecibel);
    synth.synth.volume.value = noteDecibel

    synth.synth.triggerAttackRelease(
      note,
      duration || "1.1",
      Tone.now() + baseDelay + (index * delayPerNote),
      noteVelocity
    )
  })
}

function playSynthNotes(
  notes: string[], 
  volume: number | undefined, 
  synth: SynthReturn, 
  duration: string | undefined, 
  baseDelay: number, 
  velocity: number | undefined
) {
  const noteNumbers = notes.map(getNoteNumber)
  const noteDecibel = getDecibel(volume || 0, noteNumbers)
  //console.log(noteDecibel)
  synth.synth.volume.value = noteDecibel

  synth.synth.triggerAttackRelease(
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
    
    const samplerConfig = await getInstrumentSampler(instrumentType)
    let synthConfig = !samplerConfig ? getSynth(instrumentType as any) : undefined;
    
    await playNotes({
      sampler: samplerConfig?.sampler,
      decibelModifier: samplerConfig?.decibelModifier ?? synthConfig?.decibelModifier,
      synth: synthConfig,
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
