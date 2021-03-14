import * as Tone from "tone"
import { getPianoById } from "../components/context/AppContext"

var synth = null

function getSynth() {
  if (synth !== null) {
    return synth
  }
  synth = new Tone.PolySynth().toDestination()
  Tone.setContext(new Tone.Context({ latencyHint: "playback" }))
  return synth
}

export function playPiano(dispatch, state, pianoId) {
  var pianoComponent = getPianoById(state, pianoId)

  var synth = getSynth()

  console.log("test")
  synth.toDestination()
  var selectedNotes = getSelectedNotes(pianoComponent.piano)

  // dispatch({
  //   type: "UPDATE_PIANO",
  //   id: pianoComponent.id,
  //   payload: pianoComponent.piano
  // })

  synth.releaseAll()
  // synth.set({ volume: 0.5 })

  synth.triggerAttackRelease(selectedNotes, "1.1", "+0.03", "0.9")

  //clearPianoKeyPlaying(dispatch, pianoComponent)
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
