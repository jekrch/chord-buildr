import * as Tone from "tone"
import { getSynth } from "./synthLibrary"
import { AppState, getPianoById } from "../components/context/AppContext"
import { isMobile } from "react-device-detect"
import { ChordPiano, NoteKey } from "./chordPianoHandler"

let baseDecibel = 2

export function playPiano(dispatch: React.Dispatch<any>, state: AppState, pianoId: number): void {
  const pianoComponent = getPianoById(state, pianoId)

  if (!pianoComponent) return;

  const synthResult = getSynth(state)
  const synth = synthResult.synth
  baseDecibel = synthResult.baseDecibel

  if (Tone.context.state !== 'running') {
    Tone.context.resume()
  }

  synth.toDestination()
  const selectedNotes = getSelectedNotes(pianoComponent.piano!)

  if (!isMobile) {
    dispatch({
      type: "UPDATE_PIANO",
      id: pianoComponent.id,
      payload: pianoComponent.piano
    })
  }

  synth.releaseAll()

  synth.volume.value = getDecibel(state.volume, pianoComponent.piano!)
  //console.log("vol: " + synth.volume.value)

  synth.triggerAttackRelease(
    selectedNotes,
    "1.1",
    isMobile ? "+0.15" : "+0.03", // allow more latency on mobile
    0.7
  )

  if (!isMobile) {
    clearPianoKeyPlaying(dispatch, pianoComponent)
  }
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
function getDecibel(userVolume: number, piano: NoteKey[][]): number {
  const userVolumeModifier = getUserVolumeModifier(userVolume)
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
  const highestNoteNumber = Math.max(...selectedNoteNumbers)

  return baseDecibel - highestNoteNumber / 2.5 + userVolumeModifier
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

    dispatch({
      type: "UPDATE_PIANO",
      id: pianoComponent.id,
      payload: pianoComponent.piano
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