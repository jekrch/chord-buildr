import * as Tone from "tone"
import { getPianoById } from "../components/context/AppContext"

const synth = new Tone.PolySynth().toDestination()

export function playPiano(state, pianoId) {
  var pianoComponent = getPianoById(state, pianoId)

  console.log("playing piano: " + pianoComponent)

  var selectedNotes = getSelectedNotes(pianoComponent.piano)

  synth.releaseAll()
  synth.triggerAttackRelease(selectedNotes, "1.1", "+0.003", "0.1")
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
      }
    }
  }

  return selectedNotes
}
