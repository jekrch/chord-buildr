import * as Tone from "tone"
import { getPianoById } from "../components/context/AppContext"

const sampler = getSampler()

function getSampler() {
  var sampler = new Tone.Sampler({
    urls: {
      C2: "C2.mp3",
      "D#2": "Ds2.mp3",
      "F#2": "Fs2.mp3",
      C3: "C3.mp3",
      A2: "A2.mp3",
      "D#3": "Ds3.mp3",
      "F#3": "Fs3.mp3",
      A3: "A3.mp3",
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
      C5: "C5.mp3",
      "D#5": "Ds5.mp3",
      "F#5": "Fs5.mp3",
      A5: "A5.mp3"
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/"
  }).toDestination()

  sampler = new Tone.PolySynth().toDestination()

  return sampler
}

export function playPiano(state, pianoId) {
  var pianoComponent = getPianoById(state, pianoId)
  var synth

  if (!state.synth) synth = state.synth
  else {
    synth = getSampler()
    state.synth = synth
  }
  synth = getSampler()

  playPianoWithSynth(synth, pianoComponent)
}

export function playPianoWithSynth(synth, pianoComponent) {
  console.log("playing piano: " + pianoComponent)

  var selectedNotes = getSelectedNotes(pianoComponent.piano)

  sampler.releaseAll()
  sampler.triggerAttackRelease(selectedNotes, "1.1", "+0.003", "0.1")
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
