import * as Tone from "tone"
import { getSynth, SYNTH_TYPES, SynthReturn } from './synthLibrary';
import { AppState, getPianoById } from "../components/context/AppContext"
import { isMobile } from "react-device-detect"
import { ChordPiano, NoteKey } from "./chordPianoHandler"
// @ts-ignore
import GuitarElectricMp3 from 'tonejs-instrument-guitar-electric-mp3';
import { ChordPosition, findChordPositions } from "./tabFinder"
import guitar from '@tombatossals/chords-db/lib/guitar.json';

let baseDecibel = 2

interface ToneSampler {
  sampler: Tone.Sampler, 
  baseDecibel?: number
}

// cache for loaded samplers and their configurations
const samplers: {
  [key: string]: ToneSampler
} = {}

interface AudioOptions {
  synth?: SynthReturn
  sampler?: Tone.Sampler
  baseDecibel?: number
  notes: string[]
  volume?: number
  delay?: string
  duration?: string
  velocity?: number
  useStrum?: boolean
}

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

  playNotes({
    synth,
    notes: selectedNotes,
    volume,
    // @ts-ignore
    delay: isMobile ? "+0.15" : "+0.03",
    duration: "1.1",
    velocity: 0.7
  })

  if (!isMobile) {
    clearPianoKeyPlaying(dispatch, pianoComponent)
  }
}

function getSelectedNotes(piano: NoteKey[][]): string[] {
  const selectedNotes: string[] = []

  for (let octiveIndex = 0; octiveIndex < piano.length; octiveIndex++) {
    const pianoOctave = piano[octiveIndex]

    for (let j = 0; j < pianoOctave.length; j++) {
      const noteKey = pianoOctave[j]
      if (noteKey.selected) {
        const note = `${noteKey.note.toUpperCase()}${octiveIndex + 3}`
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

  return modifier
}

/*
  Play chord using midi note numbers and the specified sampler
*/
export async function playMidiNotesGuitar(
  dispatch: React.Dispatch<any>,
  chordPiano: ChordPiano,
  midiNotes: number[], 
  instrumentType: InstrumentKey,
  noteAdd: number = 0,
  volume: number
) {
  if (!isMobile) {
    let newChordPiano = {...chordPiano, isPlaying: true} as ChordPiano
    
    dispatch({
      type: "UPDATE_PIANO",
      id: newChordPiano.id,
      payload: newChordPiano
    })
  }

  try {
    let toneSampler: ToneSampler | undefined = await getInstrumentSampler(instrumentType)
    const notes = midiNotes
      .map(note => note + noteAdd)
      .map(midi => Tone.Frequency(midi, "midi").toNote())

    if (toneSampler) {
      // use sampler if available
      //
      await playNotes({
        synth: undefined,
        sampler: toneSampler.sampler,
        notes,
        duration: "1.0",
        useStrum: true,
        // @ts-ignore
        delay: isMobile ? "+0.15" : "+0.03",
        volume: volume,
        baseDecibel: toneSampler.baseDecibel
      })
    } else {
      // fall back to synth
      const synth = getSynth(instrumentType as any)
 
      await playNotes({
        synth,
        notes,
        duration: "1.0",
        useStrum: true,
        // @ts-ignore
        delay: isMobile ? "+0.15" : "+0.03",
        volume: volume
      })
    }
  } catch (error) {
    console.error('failed to play notes:', error)
  }

  if (!isMobile) {
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
  instrumentType: InstrumentKey,
  volume: number,
  tabPositions?: ChordPosition[]
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
    instrumentType,
    0,
    volume
  )
}


///////////////////

// unified playback function that handles both synth and sampler with optional strumming
async function playNotes(options: AudioOptions) {
  let { synth, sampler, notes, volume, delay, duration, velocity, useStrum, baseDecibel } = options

  const baseDelay = delay ? Number(delay.replace('+', '')) : 0

  //volume = getDecibel(volume!, notes.map(Number));

  if (Tone.getContext().state !== 'running') {
    Tone.getContext().resume()
  }

  if (sampler) {
    sampler.toDestination()
    sampler.releaseAll()
    
    // apply volume to sampler using baseDecibel if provided
    if (volume !== undefined && baseDecibel !== undefined) {
      sampler.volume.value = baseDecibel + getUserVolumeModifier(volume)
    }
    
    console.log(sampler.volume.value);
    console.log(baseDecibel)
    console.log(volume);

    if (useStrum) {
      const strumDuration = 0.20
      const delayPerNote = strumDuration / notes.length
      // use consistent velocity for all strummed notes
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
    } else {
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
  } else if (synth) {
    if (synth.baseDecibel) {
      baseDecibel = synth.baseDecibel
    }
    
    synth.synth.toDestination()
    synth.synth.releaseAll()
 
    if (volume !== undefined) {
      synth.synth.volume.value = getUserVolumeModifier(volume)
    }

    if (useStrum) {
      const strumDuration = 0.20
      const delayPerNote = strumDuration / notes.length
      const noteVelocity = velocity || 0.7
      
      notes.forEach((note, index) => {
        synth.synth.triggerAttackRelease(
          note,
          duration || "1.1",
          Tone.now() + baseDelay + (index * delayPerNote),
          noteVelocity
        )
      })
    } else {
      synth.synth.triggerAttackRelease(
        notes,
        duration || "1.1",
        Tone.now() + baseDelay,
        velocity || 0.7
      )
    }
  }
}

type InstrumentKey = keyof typeof SYNTH_TYPES

// get or create sampler instance with baseDecibel configuration
async function getInstrumentSampler(type: InstrumentKey): Promise<ToneSampler | undefined> {
  if (samplers[type]) {
    return samplers[type]
  }

  const instrument = SYNTH_TYPES[type]
  if (!instrument || !('getSampler' in instrument)) {
    return undefined
  }

  try {
    const SamplerModule = await instrument.getSampler()
    
    let sampler = await new Promise<Tone.Sampler>(resolve => {
      let sampler = new SamplerModule.default({
        onload: () => resolve(sampler)
      }) as Tone.Sampler
    })

    // store sampler with baseDecibel from instrument config
    samplers[type] = {
      sampler,
      baseDecibel: instrument.baseDecibel
    }
    
    return samplers[type]
  } catch (error) {
    console.error('failed to load instrument sampler:', error)
    return undefined
  }
}

// unified play function that handles both piano and guitar chord formats
export async function playChord(
  dispatch: React.Dispatch<any>, 
  state: AppState, 
  pianoId: number
): Promise<void> {
  const chordPiano = getPianoById(state, pianoId)
  if (!chordPiano) return

  if (!isMobile) {
    dispatch({
      type: "UPDATE_PIANO",
      id: chordPiano.id,
      payload: { ...chordPiano, isPlaying: true }
    })
  }

  try {
    const useStrum = state.format === "g"
    const instrumentType = state.synth as InstrumentKey

    let notes: string[]
    if (useStrum) {
      const tabPositions = findChordPositions(
        chordPiano.selectedChord,
        guitar.chords
      )
      notes = tabPositions[chordPiano.selectedChord.position ?? 0].midi
        .map(midi => Tone.Frequency(midi, "midi").toNote())
    } else {
      notes = getSelectedNotes(chordPiano.piano!)
    }
    
    // TODO: bring back the getDecibel not specific volume adjustment
    // if (state.format === 'g') {
    //   volume -= 2;
    // } else{
    //   volume = getDecibel(volume!, getSelectedNoteNumbers(chordPiano.piano!))
    // }
    
    //let volume = getDecibel(volume!, getSelectedNoteNumbers(chordPiano.piano!))
    const samplerConfig = await getInstrumentSampler(instrumentType)

    await playNotes({
      sampler: samplerConfig?.sampler,
      baseDecibel: samplerConfig?.baseDecibel,
      synth: !samplerConfig ? getSynth(instrumentType as any) : undefined,
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
