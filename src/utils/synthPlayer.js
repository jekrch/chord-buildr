import * as Tone from "tone"
import { getPianoById } from "../components/context/AppContext"
import { isMobile } from "react-device-detect"

var synth = null

function getSynth() {
  if (synth !== null) {
    return synth
  }
  synth = new Tone.PolySynth().toDestination()
  if (isMobile) synth.set({ latencyHint: "balanced" })
  //synth.setContext(new Tone.Context({ latencyHint: "playback" }))
  return synth
}

export function playPiano(dispatch, state, pianoId) {
  var pianoComponent = getPianoById(state, pianoId)

  var synth = getSynth()

  console.log("test")
  synth.toDestination()
  var selectedNotes = getSelectedNotes(pianoComponent.piano)

  if (!isMobile) {
    dispatch({
      type: "UPDATE_PIANO",
      id: pianoComponent.id,
      payload: pianoComponent.piano
    })
  }

  synth.releaseAll()
  // synth.set({ volume: 0.5 })

  synth.triggerAttackRelease(
    selectedNotes,
    "1.1",
    isMobile ? "+0.15" : "+0.03", // allow more latency on mobile
    "0.9"
  )

  if (!isMobile) clearPianoKeyPlaying(dispatch, pianoComponent)
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

        if (!isMobile) {
          noteKey.isStopping = null
          noteKey.isPlaying = true
        }
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
