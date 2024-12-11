import * as Tone from "tone"
import { getSynth, SYNTH_TYPES, SynthReturn } from "./synthLibrary"
import { AppState, getPianoById } from "../components/context/AppContext"
import { isMobile } from "react-device-detect"
import { ChordPiano, NoteKey } from "./chordPianoHandler"
// @ts-ignore
import GuitarElectricMp3 from 'tonejs-instrument-guitar-electric-mp3';
import { ChordPosition, findChordPositions } from "./tabFinder"
import guitar from '@tombatossals/chords-db/lib/guitar.json';

let baseDecibel = 2

export function playPianoChord(
  dispatch: React.Dispatch<any>, 
  state: AppState, 
  pianoComponent: ChordPiano
): void {

  const selectedNotes = getSelectedNotes(pianoComponent.piano!)

  if (!isMobile) {

    let newPianoComponent = {...pianoComponent, isPlaying: true} as ChordPiano;

    dispatch({
      type: "UPDATE_PIANO",
      id: pianoComponent.id,
      payload: newPianoComponent
    })
  }

  const selectedNoteNumbers: number[] = getSelectedNoteNumbers(pianoComponent.piano!)
  const volume = getDecibel(state.volume, selectedNoteNumbers);
  const synth: SynthReturn = getSynth(state.synth as any)

  playNotes(synth, volume, selectedNotes)

  if (!isMobile) {
    clearPianoKeyPlaying(dispatch, pianoComponent)
  }
}

function playNotes(synthReturn: SynthReturn, volume: number, selectedNotes: string[]) {
  const synth = synthReturn.synth
  baseDecibel = synthReturn.baseDecibel

  if (Tone.getContext().state !== 'running') {
    Tone.getContext().resume()
  }

  synth.toDestination()
  synth.releaseAll()

  synth.volume.value = volume
  //console.log("vol: " + synth.volume.value)
  synth.triggerAttackRelease(
    selectedNotes,
    "1.1",
    isMobile ? "+0.15" : "+0.03", // allow more latency on mobile
    0.7
  )
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

/***
 * The decibel should be inversely proportional to the highest note
 */
function getDecibel(userVolume: number, selectedNoteNumbers: number[]): number {
  const userVolumeModifier = getUserVolumeModifier(userVolume)
  const highestNoteNumber = Math.max(...selectedNoteNumbers)

  return baseDecibel - highestNoteNumber / 2.5 + userVolumeModifier
}

function getSelectedNoteNumbers(piano: NoteKey[][]) {
  const selectedNoteNumbers: number[] = []

  for (let octaveIndex = 0; octaveIndex < piano.length; octaveIndex++) {
    const pianoOctave = piano[octaveIndex]

    for (let j = 0; j < pianoOctave.length; j++) {
      const noteKey = pianoOctave[j]

      if (noteKey.selected) {
        const absoluteNoteNumber = noteKey.noteNumber + noteKey.octave * 12
        selectedNoteNumbers.push(absoluteNoteNumber)
      }
    }
  }
  return selectedNoteNumbers
}

function clearPianoKeyPlaying(dispatch: React.Dispatch<any>, pianoComponent: ChordPiano): void {
  setTimeout(() => {
    const piano = pianoComponent.piano
    if (!piano) return;
  
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

    pianoComponent.isPlaying = false;
    
    dispatch({
      type: "UPDATE_PIANO",
      id: pianoComponent.id,
      payload: pianoComponent
    })
  }, 1500)
}

/**
 * Take the userVolume range (0-100) and convert it
 * to a modifier ranging between -20 to 4 with 90 as
 * the 0 point
 */
function getUserVolumeModifier(userVolume: number | null): number {
  // use 0 if null is passed
  if (userVolume == null) {
    userVolume = 0
  }
  let modifier = 0

  // if the user vol is 90, the modifier should be 0
  // otherwise approach 4
  if (userVolume >= 90) {
    const volIncrease = userVolume - 90
    modifier = modifier + volIncrease * 0.4
  } else {
    // below 90 the modifier should approach -20
    const volDecrease = 90 - userVolume
    modifier = 0 - 20 * (volDecrease / 90)
  }

  //console.log("user modifier " + modifier)
  return modifier
}




//////////////////////



type InstrumentKey = keyof typeof SYNTH_TYPES

// cache for loaded samplers
const samplers: {
  [key: string]: Tone.Sampler
} = {}

// get or create sampler instance
async function getInstrumentSampler(type: InstrumentKey): Promise<Tone.Sampler> {
  // return cached sampler if available
  if (samplers[type]) {
    return samplers[type]
  }

  const instrument = SYNTH_TYPES[type]
  if (!instrument || !('getSampler' in instrument)) {
    throw new Error(`no sampler available for instrument type: ${type}`)
  }

  // dynamically import and initialize the sampler
  const SamplerModule = await instrument.getSampler()
  
  // create and cache the sampler
  const sampler = await new Promise<Tone.Sampler>(resolve => {
    const sampler = new SamplerModule.default({
      onload: () => resolve(sampler)
    }) as Tone.Sampler
  })

  samplers[type] = sampler
  return sampler
}

export function playChord(
  dispatch: React.Dispatch<any>, 
  state: AppState, 
  pianoId: number
): void {
  let chordPiano = getPianoById(state, pianoId)

  if (!chordPiano) return

  if (state.format === "g") {
    // default to electric guitar if not specified
    const guitarType = state.synth === 'ac' ? 'ac' : 'el' as InstrumentKey
    
    playGuitarChord(
      dispatch, 
      chordPiano,
      undefined,
      guitarType
    )
  } else {
    playPianoChord(
      dispatch, 
      state,
      chordPiano
    )
  }
}

/*
  Play chord using midi note numbers and the specified sampler
*/
export async function playMidiNotesGuitar(
  dispatch: React.Dispatch<any>,
  chordPiano: ChordPiano,
  midiNotes: number[], 
  instrumentType: InstrumentKey,
  noteAdd: number = 0
) {
  if (true || !isMobile) {
    let newChordPiano = {...chordPiano, isPlaying: true} as ChordPiano
    
    dispatch({
      type: "UPDATE_PIANO",
      id: newChordPiano.id,
      payload: newChordPiano
    })
  }

  try {
    // get or load the appropriate sampler
    const sampler = await getInstrumentSampler(instrumentType)

    midiNotes = midiNotes.map(note => note + noteAdd)

    if (Tone.getContext().state !== 'running') {
      Tone.getContext().resume()
    }

    sampler.toDestination()
    sampler.releaseAll()

    const noteNames = midiNotes.map(midi => 
      Tone.Frequency(midi, "midi").toNote()
    )
    
    const strumDuration = 0.20
    const delayPerNote = strumDuration / noteNames.length

    // velocity decrease on ascending notes for softer sound
    const baseVelocity = 0.6
    const velocityDecrease = 0.05

    noteNames.forEach((noteName, index) => {
      const now = Tone.now()
      const startTime = now + (isMobile ? 0.15 : 0.03) + (index * delayPerNote)
      
      sampler.triggerAttackRelease(
        noteName,
        "1.0",    // duration     
        startTime,
        baseVelocity - (index * velocityDecrease)  // softer velocity curve
      )
    })
  } catch (error) {
    console.error('failed to load or play instrument sampler:', error)
  }

  if (true || !isMobile) {
    setTimeout(() => {
      let newChordPiano = {...chordPiano, isPlaying: false} as ChordPiano

      dispatch({
        type: "UPDATE_PIANO",
        id: newChordPiano.id,
        payload: newChordPiano
      })
    }, 1000)
  }
}

/**
 * Play the provided chordPiano's selected chord using the guitar 
 * sampler, taking the selected position from selectedChord.position. 
 * 
 * The available tabPositions for the chord can either be provided 
 * or recalculated if not. 
 * 
 * @param dispatch 
 * @param chordPiano 
 * @param tabPositions 
 */
export function playGuitarChord(
  dispatch: React.Dispatch<any>,
  chordPiano: ChordPiano,
  tabPositions?: ChordPosition[],
  instrumentType: InstrumentKey = 'el'
) {
  if (!tabPositions) {
    tabPositions = findChordPositions(
      chordPiano.selectedChord,
      guitar.chords
    )
  }
  
  playMidiNotesGuitar(
    dispatch,
    chordPiano,
    tabPositions[chordPiano.selectedChord.position ?? 0].midi,
    instrumentType
  )
}