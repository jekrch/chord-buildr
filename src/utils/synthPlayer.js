import * as Tone from "tone"
import { getPianoById } from "../components/context/AppContext"

const synth = getSynth()

function getSynth() {
  return new Tone.PolySynth().toDestination()
}

export function playPiano(dispatch, state, pianoId) {
  var pianoComponent = getPianoById(state, pianoId)

  getSynth()

  var selectedNotes = getSelectedNotes(pianoComponent.piano)

  dispatch({
    type: "UPDATE_PIANO",
    id: pianoComponent.id,
    payload: pianoComponent.piano
  })

  synth.releaseAll()
  synth.set({ volume: 5 })
  synth.triggerAttackRelease(selectedNotes, "1.1", "+0.003", "0.1")

  clearPianoKeyPlaying(dispatch, pianoComponent)
}

function getSelectedNotes(piano) {
  var selectedNotes = []

  for (let octaveIndex = 0; octaveIndex < piano.length; octaveIndex++) {
    var pianoOctave = piano[octaveIndex]

    for (let j = 0; j < pianoOctave.length; j++) {
      var noteKey = pianoOctave[j]

      if (noteKey.selected) {
        var note = `${noteKey.note.toUpperCase()}${octaveIndex + 3}`
        selectedNotes.push(note)
        noteKey.isPlaying = true
      }
    }
  }

  return selectedNotes
}

function clearPianoKeyPlaying(dispatch, pianoComponent) {
  setTimeout(function () {
    var piano = pianoComponent.piano
    for (let i = 0; i < piano.length; i++) {
      var pianoOctave = piano[i]

      for (let z = 0; z < pianoOctave.length; z++) {
        var key = pianoOctave[z]
        key.isPlaying = false
      }
    }

    dispatch({
      type: "UPDATE_PIANO",
      id: pianoComponent.id,
      payload: pianoComponent.piano
    })
  }, 1000)
}
